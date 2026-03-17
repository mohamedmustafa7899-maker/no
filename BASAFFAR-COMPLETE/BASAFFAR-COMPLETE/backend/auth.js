const express    = require('express');
const bcrypt     = require('bcryptjs');
const nodemailer = require('nodemailer');
const crypto     = require('crypto');
const { v4: uuidv4 } = require('uuid');
const rateLimit  = require('express-rate-limit');
const {
  IS_PROD, readDB, writeDB,
  REFRESH_EXPIRES_MS, ACCESS_COOKIE_OPTS, REFRESH_COOKIE_OPTS,
  signAccessToken, hashToken,
  requireAuth, requireRole,
  addAuditLog,
} = require('./authMiddleware');

const router  = express.Router();
const APP_URL = process.env.APP_URL || 'http://localhost:3000';

// ─── CAPTCHA store (in-memory, self-cleaning) ─────────────────────────────────
const captchaStore = new Map();
const CAPTCHA_TTL  = 5 * 60 * 1000;
setInterval(() => {
  const now = Date.now();
  for (const [id, c] of captchaStore) if (c.expiresAt < now) captchaStore.delete(id);
}, 60_000);

// ─── Rate limiters ────────────────────────────────────────────────────────────
const mkLimiter = (max, windowMs, msg) => rateLimit({
  windowMs, max,
  message: { ok: false, msg },
  standardHeaders: true, legacyHeaders: false,
  skip: () => !IS_PROD,
});
const loginLimiter    = mkLimiter(30,  15 * 60_000, 'محاولات كثيرة، حاول بعد 15 دقيقة');
const registerLimiter = mkLimiter(10,  60 * 60_000, 'تجاوزت الحد المسموح لإنشاء الحسابات');
const resendLimiter   = mkLimiter(5,   60 * 60_000, 'تجاوزت الحد المسموح لإعادة الإرسال');
const captchaLimiter  = mkLimiter(120, 15 * 60_000, 'طلبات كثيرة جداً');

// ─── Input sanitization helpers ───────────────────────────────────────────────
const sanitize   = (s, maxLen = 255) => typeof s === 'string' ? s.trim().slice(0, maxLen).replace(/[<>"'`]/g, '') : '';
const isEmail    = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

// Saudi phone: 05XXXXXXXX | +9665XXXXXXXX | 9665XXXXXXXX | 009665XXXXXXXX
const SAUDI_PHONE_RE = /^(05\d{8}|(\+966|00966|966)5\d{8})$/;
const isSaudiPhone   = (s) => SAUDI_PHONE_RE.test(s.replace(/[\s\-()]/g, ''));
const normalizePhone = (s) => {
  const d = s.replace(/[\s\-()]/g, '');
  if (/^05\d{8}$/.test(d))         return '+966' + d.slice(1);   // 05XX → +9665XX
  if (/^\+9665\d{8}$/.test(d))     return d;                      // already canonical
  if (/^9665\d{8}$/.test(d))       return '+' + d;                // 9665XX → +9665XX
  if (/^009665\d{8}$/.test(d))     return '+' + d.slice(2);       // 009665XX → +9665XX
  return d;
};
const isPhone = isSaudiPhone; // backward compat alias

const pwError    = (p) => {
  if (!p || p.length < 8) return 'كلمة المرور يجب أن تكون 8 أحرف على الأقل';
  if (!/[A-Za-z]/.test(p)) return 'يجب أن تحتوي على حروف إنجليزية';
  if (!/[0-9]/.test(p))    return 'يجب أن تحتوي على أرقام';
  return null;
};

// ─── Account lockout ──────────────────────────────────────────────────────────
const MAX_FAILS = 5;
const LOCK_MS   = 15 * 60_000;

const isLocked        = (u) => u.lockUntil && Date.now() < u.lockUntil;
const registerFailure = (u) => {
  u.failedAttempts = (u.failedAttempts || 0) + 1;
  if (u.failedAttempts >= MAX_FAILS) { u.lockUntil = Date.now() + LOCK_MS; return true; }
  return false;
};
const clearLock = (u) => { u.failedAttempts = 0; u.lockUntil = null; };

// ─── DB helpers ───────────────────────────────────────────────────────────────
function ensureDB() {
  const db = readDB();
  if (!db.users)    db.users    = [];
  if (!db.sessions) db.sessions = [];
  if (!db.auditLog) db.auditLog = [];
  return db;
}

// ─── Session management ───────────────────────────────────────────────────────
function createSession(db, userId, rawToken, req) {
  const session = {
    id:         uuidv4(),
    userId,
    tokenHash:  hashToken(rawToken),
    userAgent:  (req.headers['user-agent'] || 'unknown').slice(0, 200),
    ip:         req.ip || 'unknown',
    createdAt:  new Date().toISOString(),
    lastUsedAt: new Date().toISOString(),
    expiresAt:  new Date(Date.now() + REFRESH_EXPIRES_MS).toISOString(),
    revoked:    false,
  };
  db.sessions.push(session);
  // Prune: keep only active sessions, cap at 500 total
  db.sessions = db.sessions
    .filter(s => !s.revoked && new Date(s.expiresAt) > new Date())
    .slice(-500);
  return session;
}

function setAuthCookies(res, userId, email, name, role, rawRefresh) {
  const accessToken = signAccessToken({ id: userId, email, name, role });
  res.cookie('access_token',  accessToken,  ACCESS_COOKIE_OPTS);
  res.cookie('refresh_token', rawRefresh,   REFRESH_COOKIE_OPTS);
  return accessToken;
}

// ─── Email helpers ────────────────────────────────────────────────────────────
async function getMailer() {
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  const test = await nodemailer.createTestAccount();
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email', port: 587,
    auth: { user: test.user, pass: test.pass },
  });
}

const emailShell = (body) => `<div dir="rtl" style="font-family:Arial,sans-serif;max-width:500px;margin:auto;background:#f0f6ff;padding:32px;border-radius:16px">${body}<hr style="border:none;border-top:1px solid #DBEAFE;margin:20px 0"/><p style="color:#6B86AA;font-size:11px;text-align:center">DR BASAFFAR Clinic — رعاية طبية متخصصة</p></div>`;
const btnStyle  = 'background:#2463EB;color:white;padding:14px 36px;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block';

async function sendEmail(to, subject, html) {
  try {
    const mailer = await getMailer();
    const info   = await mailer.sendMail({ from: '"DR BASAFFAR Clinic" <no-reply@basaffar.com>', to, subject, html });
    if (!process.env.SMTP_HOST) console.log('[MAIL] Preview:', nodemailer.getTestMessageUrl(info));
  } catch (e) {
    console.error('[MAIL] Failed:', e.message);
  }
}

// ─── CAPTCHA ──────────────────────────────────────────────────────────────────
router.get('/captcha', captchaLimiter, (req, res) => {
  const a = Math.floor(Math.random() * 9) + 1;
  const b = Math.floor(Math.random() * 9) + 1;
  const id = crypto.randomBytes(16).toString('hex');
  captchaStore.set(id, { answer: a + b, expiresAt: Date.now() + CAPTCHA_TTL });
  res.json({ id, question: `كم يساوي ${a} + ${b}؟` });
});

function validateCaptcha(captchaId, captchaAnswer) {
  if (!IS_PROD) return true; // Skip in development
  const stored = captchaStore.get(captchaId);
  if (!stored || stored.expiresAt < Date.now()) return false;
  captchaStore.delete(captchaId); // single-use
  return parseInt(captchaAnswer, 10) === stored.answer;
}

// ─── REGISTER ─────────────────────────────────────────────────────────────────
router.post('/register', registerLimiter, async (req, res) => {
  const { captchaId, captchaAnswer } = req.body;
  if (!validateCaptcha(captchaId, captchaAnswer))
    return res.status(400).json({ ok: false, msg: 'إجابة التحقق غير صحيحة، حاول مرة أخرى' });

  const name        = sanitize(req.body.name, 100);
  const email       = sanitize(req.body.email, 254).toLowerCase();
  const phoneRaw    = sanitize(req.body.phone, 20);
  const password    = typeof req.body.password === 'string' ? req.body.password : '';
  const age         = sanitize(req.body.age, 3);
  const idNum       = sanitize(req.body.idNum, 20);
  const nationality = sanitize(req.body.nationality, 50);

  if (!name || name.length < 2)
    return res.status(400).json({ ok: false, msg: 'يرجى إدخال اسم صحيح (حرفان على الأقل)' });
  if (!isEmail(email))
    return res.status(400).json({ ok: false, msg: 'يرجى إدخال بريد إلكتروني صحيح' });
  if (!isSaudiPhone(phoneRaw))
    return res.status(400).json({ ok: false, msg: 'يرجى إدخال رقم جوال سعودي صحيح (مثال: 05XXXXXXXX)' });
  const phone = normalizePhone(phoneRaw);
  const pwErr = pwError(password);
  if (pwErr) return res.status(400).json({ ok: false, msg: pwErr });

  const db = ensureDB();
  if (db.users.find(u => u.email === email || u.phone === phone))
    return res.status(409).json({ ok: false, msg: 'البريد أو رقم الهاتف مسجل مسبقاً' });

  const passwordHash = await bcrypt.hash(password, 12);
  const verifyToken  = crypto.randomBytes(32).toString('hex');

  const user = {
    id:           (db.users.length ? Math.max(...db.users.map(u => u.id)) : 0) + 1,
    name, email, phone,
    age:          age || null, idNum: idNum || null, nationality: nationality || null,
    passwordHash,
    role:         'user',
    emailVerified: false, verifyToken, verifyExpires: Date.now() + 24 * 60 * 60_000,
    resetToken:   null, resetExpires: null,
    failedAttempts: 0, lockUntil: null,
    createdAt:    new Date().toISOString(), bookings: 0,
  };
  db.users.push(user);
  if (!db.clients) db.clients = [];
  db.clients.push({ id: user.id, name, email, phone, idNum: idNum || null, age: age || null, nationality: nationality || null, bookings: 0, joinedAt: user.createdAt });

  const rawRefresh = crypto.randomBytes(40).toString('hex');
  createSession(db, user.id, rawRefresh, req);
  addAuditLog(db, 'register', user.id, { ip: req.ip, userAgent: req.headers['user-agent'], email });
  writeDB(db);

  setAuthCookies(res, user.id, email, name, user.role, rawRefresh);

  sendEmail(email, 'تفعيل حسابك في مركز باصفار', emailShell(
    `<h2 style="color:#0A1628;text-align:center">مرحباً ${name} 👋</h2>
     <p style="color:#1E3A6B;font-size:15px">شكراً لتسجيلك. يرجى تفعيل حسابك بالنقر على الزر أدناه:</p>
     <div style="text-align:center;margin:28px 0"><a href="${APP_URL}/api/auth/verify-email?token=${verifyToken}" style="${btnStyle}">تفعيل الحساب</a></div>
     <p style="color:#6B86AA;font-size:12px;text-align:center">الرابط صالح لمدة 24 ساعة.</p>`
  ));

  res.json({ ok: true, user: { id: user.id, name, email, role: user.role, emailVerified: false } });
});

// ─── LOGIN ─────────────────────────────────────────────────────────────────────
// Note: No CAPTCHA required for login — brute force protection is handled via
// rate limiter (30 req / 15 min) and account lockout after repeated failures.
router.post('/login', loginLimiter, async (req, res) => {
  // Accept identifier = email OR Saudi phone (old `email` field also supported)
  const identifierRaw = sanitize(req.body.identifier || req.body.email || '', 254);
  const password      = typeof req.body.password === 'string' ? req.body.password : '';

  if (!identifierRaw)
    return res.status(400).json({ ok: false, msg: 'يرجى إدخال البريد الإلكتروني أو رقم الجوال' });
  if (!password)
    return res.status(400).json({ ok: false, msg: 'يرجى إدخال كلمة المرور' });

  const db = ensureDB();
  let user;

  if (isSaudiPhone(identifierRaw)) {
    // Login by phone
    const phone = normalizePhone(identifierRaw);
    user = db.users.find(u => u.phone === phone);
  } else if (isEmail(identifierRaw)) {
    // Login by email
    const email = identifierRaw.toLowerCase();
    user = db.users.find(u => u.email === email);
  } else {
    return res.status(400).json({ ok: false, msg: 'يرجى إدخال بريد إلكتروني صحيح أو رقم جوال سعودي (05XXXXXXXX)' });
  }

  if (!user) {
    addAuditLog(db, 'login_failed', null, { ip: req.ip, extra: { identifier: identifierRaw, reason: 'user_not_found' } });
    writeDB(db);
    return res.status(401).json({ ok: false, msg: 'البريد أو رقم الجوال أو كلمة المرور غير صحيحة' });
  }

  if (isLocked(user)) {
    const mins = Math.ceil((user.lockUntil - Date.now()) / 60_000);
    addAuditLog(db, 'login_blocked', user.id, { ip: req.ip });
    writeDB(db);
    return res.status(429).json({ ok: false, msg: `الحساب مقفل مؤقتاً. حاول بعد ${mins} دقيقة` });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    const justLocked = registerFailure(user);
    addAuditLog(db, justLocked ? 'account_locked' : 'login_failed', user.id, {
      ip: req.ip, extra: { attempts: user.failedAttempts },
    });
    writeDB(db);
    if (justLocked)
      return res.status(429).json({ ok: false, msg: 'تم قفل الحساب مؤقتاً لمدة 15 دقيقة بسبب تكرار المحاولات الفاشلة' });
    const left = MAX_FAILS - user.failedAttempts;
    return res.status(401).json({ ok: false, msg: `كلمة المرور غير صحيحة. ${left} محاولة متبقية قبل القفل` });
  }

  clearLock(user);

  // Block unverified email accounts (only enforced when user HAS an email)
  if (user.email && !user.emailVerified) {
    writeDB(db);
    return res.status(403).json({ ok: false, code: 'EMAIL_NOT_VERIFIED', msg: 'يرجى تفعيل بريدك الإلكتروني أولاً. تحقق من بريدك الوارد.' });
  }

  const rawRefresh = crypto.randomBytes(40).toString('hex');
  createSession(db, user.id, rawRefresh, req);
  addAuditLog(db, 'login', user.id, { ip: req.ip, userAgent: req.headers['user-agent'] });
  writeDB(db);

  setAuthCookies(res, user.id, user.email, user.name, user.role, rawRefresh);
  res.json({ ok: true, user: { id: user.id, name: user.name, email: user.email, role: user.role, emailVerified: user.emailVerified } });
});

// ─── REFRESH TOKEN ─────────────────────────────────────────────────────────────
router.post('/refresh', (req, res) => {
  const rawRefresh = req.cookies?.refresh_token;
  if (!rawRefresh) return res.status(401).json({ ok: false, msg: 'لا يوجد جلسة نشطة', code: 'NO_REFRESH' });

  const db      = ensureDB();
  const tokHash = hashToken(rawRefresh);
  const session = db.sessions.find(s => s.tokenHash === tokHash && !s.revoked);

  if (!session || new Date(session.expiresAt) < new Date()) {
    res.clearCookie('refresh_token', { path: '/api/auth' });
    return res.status(401).json({ ok: false, msg: 'جلسة منتهية، سجّل دخولك مجدداً', code: 'SESSION_EXPIRED' });
  }

  const user = db.users.find(u => u.id === session.userId);
  if (!user) return res.status(401).json({ ok: false, msg: 'المستخدم غير موجود' });

  session.lastUsedAt = new Date().toISOString();
  writeDB(db);

  const accessToken = signAccessToken({ id: user.id, email: user.email, name: user.name, role: user.role });
  res.cookie('access_token', accessToken, ACCESS_COOKIE_OPTS);
  res.json({ ok: true });
});

// ─── GET CURRENT USER ──────────────────────────────────────────────────────────
router.get('/me', requireAuth, (req, res) => {
  const db   = ensureDB();
  const user = db.users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ ok: false, msg: 'المستخدم غير موجود' });
  res.json({
    ok: true,
    user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, emailVerified: user.emailVerified, createdAt: user.createdAt, age: user.age || null, idNum: user.idNum || null, nationality: user.nationality || null },
  });
});

// ─── LOGOUT ───────────────────────────────────────────────────────────────────
router.post('/logout', requireAuth, (req, res) => {
  const rawRefresh = req.cookies?.refresh_token;
  const db = ensureDB();
  if (rawRefresh) {
    const s = db.sessions.find(s => s.tokenHash === hashToken(rawRefresh));
    if (s) s.revoked = true;
  }
  addAuditLog(db, 'logout', req.user.id, { ip: req.ip });
  writeDB(db);
  res.clearCookie('access_token',  { path: '/' });
  res.clearCookie('refresh_token', { path: '/api/auth' });
  res.json({ ok: true });
});

// ─── LOGOUT FROM ALL DEVICES ──────────────────────────────────────────────────
router.post('/logout-all', requireAuth, (req, res) => {
  const db = ensureDB();
  db.sessions.filter(s => s.userId === req.user.id).forEach(s => { s.revoked = true; });
  addAuditLog(db, 'logout_all', req.user.id, { ip: req.ip });
  writeDB(db);
  res.clearCookie('access_token',  { path: '/' });
  res.clearCookie('refresh_token', { path: '/api/auth' });
  res.json({ ok: true, msg: 'تم تسجيل الخروج من جميع الأجهزة' });
});

// ─── GET SESSIONS ─────────────────────────────────────────────────────────────
router.get('/sessions', requireAuth, (req, res) => {
  const db       = ensureDB();
  const sessions = db.sessions
    .filter(s => s.userId === req.user.id && !s.revoked && new Date(s.expiresAt) > new Date())
    .map(s => ({ id: s.id, userAgent: s.userAgent, ip: s.ip, createdAt: s.createdAt, lastUsedAt: s.lastUsedAt }));
  res.json({ ok: true, sessions });
});

// ─── REVOKE SESSION ───────────────────────────────────────────────────────────
router.delete('/sessions/:id', requireAuth, (req, res) => {
  const db      = ensureDB();
  const session = db.sessions.find(s => s.id === req.params.id && s.userId === req.user.id);
  if (!session) return res.status(404).json({ ok: false, msg: 'الجلسة غير موجودة' });
  session.revoked = true;
  writeDB(db);
  res.json({ ok: true });
});

// ─── VERIFY EMAIL ─────────────────────────────────────────────────────────────
router.get('/verify-email', (req, res) => {
  const token = sanitize(req.query.token, 200);
  if (!token) return res.status(400).send(htmlPage('رابط غير صحيح', 'الرابط الذي استخدمته غير صحيح.', false));

  const db   = ensureDB();
  const user = db.users.find(u => u.verifyToken === token);
  if (!user) return res.status(400).send(htmlPage('رابط غير صحيح', 'الرابط غير صحيح أو تم استخدامه من قبل.', false));
  if (Date.now() > user.verifyExpires) return res.status(400).send(htmlPage('انتهت الصلاحية', 'انتهت صلاحية الرابط. يرجى طلب رابط جديد من التطبيق.', false));

  user.emailVerified = true; user.verifyToken = null; user.verifyExpires = null;
  addAuditLog(db, 'email_verified', user.id, { ip: req.ip });
  writeDB(db);
  res.send(htmlPage('تم التفعيل! ✅', `مرحباً ${user.name}، تم تفعيل بريدك الإلكتروني بنجاح. يمكنك العودة للتطبيق الآن.`, true));
});

// ─── RESEND VERIFICATION ──────────────────────────────────────────────────────
router.post('/resend-verification', resendLimiter, async (req, res) => {
  const email = sanitize(req.body.email, 254).toLowerCase();
  if (!isEmail(email)) return res.status(400).json({ ok: false, msg: 'بريد إلكتروني غير صحيح' });

  const db   = ensureDB();
  const user = db.users.find(u => u.email === email);
  if (!user) return res.status(404).json({ ok: false, msg: 'البريد الإلكتروني غير مسجل' });
  if (user.emailVerified) return res.json({ ok: true, msg: 'بريدك مفعّل بالفعل' });

  user.verifyToken   = crypto.randomBytes(32).toString('hex');
  user.verifyExpires = Date.now() + 24 * 60 * 60_000;
  writeDB(db);

  sendEmail(email, 'تفعيل حسابك في مركز باصفار', emailShell(
    `<h2 style="color:#0A1628;text-align:center">مرحباً ${user.name} 👋</h2>
     <p style="color:#1E3A6B">انقر على الزر أدناه لتفعيل بريدك الإلكتروني:</p>
     <div style="text-align:center;margin:28px 0"><a href="${APP_URL}/api/auth/verify-email?token=${user.verifyToken}" style="${btnStyle}">تفعيل الحساب</a></div>`
  ));
  res.json({ ok: true, msg: 'تم إرسال رابط التفعيل إلى بريدك' });
});

// ─── FORGOT PASSWORD ──────────────────────────────────────────────────────────
router.post('/forgot-password', resendLimiter, async (req, res) => {
  const { captchaId, captchaAnswer } = req.body;
  if (!validateCaptcha(captchaId, captchaAnswer))
    return res.status(400).json({ ok: false, msg: 'إجابة التحقق غير صحيحة' });

  const email = sanitize(req.body.email, 254).toLowerCase();
  if (!isEmail(email)) return res.status(400).json({ ok: false, msg: 'بريد إلكتروني غير صحيح' });

  const db   = ensureDB();
  const user = db.users.find(u => u.email === email);
  if (!user) return res.json({ ok: true, msg: 'إذا كان البريد مسجلاً، سيصلك رابط إعادة التعيين' });

  user.resetToken   = crypto.randomBytes(32).toString('hex');
  user.resetExpires = Date.now() + 60 * 60_000;
  addAuditLog(db, 'password_reset_requested', user.id, { ip: req.ip, extra: { email } });
  writeDB(db);

  sendEmail(email, 'إعادة تعيين كلمة المرور', emailShell(
    `<h2 style="color:#0A1628;text-align:center">إعادة تعيين كلمة المرور</h2>
     <p style="color:#1E3A6B;font-size:15px">مرحباً ${user.name}، انقر على الزر أدناه لإعادة تعيين كلمة مرورك:</p>
     <div style="text-align:center;margin:28px 0"><a href="${APP_URL}/api/auth/reset-password-page?token=${user.resetToken}" style="${btnStyle}">إعادة تعيين كلمة المرور</a></div>
     <p style="color:#6B86AA;font-size:12px;text-align:center">الرابط صالح لساعة واحدة فقط. إذا لم تطلب هذا، تجاهل الرسالة — حسابك آمن.</p>`
  ));
  res.json({ ok: true, msg: 'إذا كان البريد مسجلاً، سيصلك رابط إعادة التعيين' });
});

// ─── RESET PASSWORD PAGE ───────────────────────────────────────────────────────
router.get('/reset-password-page', (req, res) => {
  const token = sanitize(req.query.token, 200);
  res.send(`<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>إعادة تعيين كلمة المرور</title><style>*{box-sizing:border-box}body{font-family:Arial,sans-serif;background:#f0f6ff;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0}.card{background:white;border-radius:20px;padding:36px 28px;max-width:400px;width:100%;box-shadow:0 8px 32px rgba(10,22,40,.1)}h2{color:#0A1628;text-align:center;margin-bottom:24px}label{display:block;font-size:12px;font-weight:700;color:#1E3A6B;margin-bottom:6px;text-align:right}input{width:100%;padding:12px;border:1px solid #DBEAFE;border-radius:12px;font-size:14px;color:#0A1628;margin-bottom:16px;outline:none}button{width:100%;padding:14px;background:#2463EB;color:white;border:none;border-radius:12px;font-size:15px;font-weight:700;cursor:pointer}.msg{text-align:center;margin-top:16px;font-size:13px}.err{color:#D03030}.ok{color:#2A8A45}</style></head><body><div class="card"><h2>🔒 إعادة تعيين كلمة المرور</h2><form id="f"><label>كلمة المرور الجديدة</label><input type="password" id="pw" required minlength="8" placeholder="8 أحرف + أرقام"/><label>تأكيد كلمة المرور</label><input type="password" id="pw2" required/><button type="submit">حفظ كلمة المرور</button></form><p class="msg" id="msg"></p></div><script>document.getElementById('f').addEventListener('submit',async(e)=>{e.preventDefault();const pw=document.getElementById('pw').value;const pw2=document.getElementById('pw2').value;const msg=document.getElementById('msg');if(pw!==pw2){msg.textContent='كلمتا المرور غير متطابقتين';msg.className='msg err';return;}const r=await fetch('/api/auth/reset-password',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:'${token}',password:pw})});const d=await r.json();msg.textContent=d.msg;msg.className='msg '+(d.ok?'ok':'err');if(d.ok)document.getElementById('f').style.display='none';});</script></body></html>`);
});

// ─── RESET PASSWORD ────────────────────────────────────────────────────────────
router.post('/reset-password', async (req, res) => {
  const token    = sanitize(req.body.token, 200);
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  if (!token) return res.status(400).json({ ok: false, msg: 'بيانات ناقصة' });
  const pErr = pwError(password);
  if (pErr) return res.status(400).json({ ok: false, msg: pErr });

  const db   = ensureDB();
  const user = db.users.find(u => u.resetToken === token);
  if (!user || Date.now() > user.resetExpires)
    return res.status(400).json({ ok: false, msg: 'الرابط غير صحيح أو انتهت صلاحيته' });

  user.passwordHash = await bcrypt.hash(password, 12);
  user.resetToken = null; user.resetExpires = null;
  clearLock(user);
  db.sessions.filter(s => s.userId === user.id).forEach(s => { s.revoked = true; });
  addAuditLog(db, 'password_reset', user.id, { ip: req.ip });
  writeDB(db);
  res.json({ ok: true, msg: 'تم تغيير كلمة المرور بنجاح. يمكنك تسجيل الدخول الآن.' });
});

// ─── CHANGE PASSWORD ───────────────────────────────────────────────────────────
router.post('/change-password', requireAuth, async (req, res) => {
  const current  = typeof req.body.currentPassword === 'string' ? req.body.currentPassword : '';
  const next     = typeof req.body.newPassword     === 'string' ? req.body.newPassword     : '';
  if (!current) return res.status(400).json({ ok: false, msg: 'يرجى إدخال كلمة المرور الحالية' });
  const pErr = pwError(next);
  if (pErr) return res.status(400).json({ ok: false, msg: pErr });

  const db   = ensureDB();
  const user = db.users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ ok: false, msg: 'المستخدم غير موجود' });

  if (!await bcrypt.compare(current, user.passwordHash))
    return res.status(401).json({ ok: false, msg: 'كلمة المرور الحالية غير صحيحة' });

  user.passwordHash = await bcrypt.hash(next, 12);
  addAuditLog(db, 'password_changed', user.id, { ip: req.ip });
  writeDB(db);
  res.json({ ok: true, msg: 'تم تغيير كلمة المرور بنجاح' });
});

// ─── AUDIT LOG (admin only) ────────────────────────────────────────────────────
router.get('/audit-log', ...requireRole('admin', 'super_admin'), (req, res) => {
  const db    = ensureDB();
  const page  = Math.max(1, parseInt(req.query.page)  || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 50);
  const log   = (db.auditLog || []).slice((page - 1) * limit, page * limit);
  res.json({ ok: true, log, total: (db.auditLog || []).length, page, limit });
});

// ─── HTML page helper ─────────────────────────────────────────────────────────
function htmlPage(title, body, success) {
  return `<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>body{font-family:Arial,sans-serif;background:#f0f6ff;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0}.card{background:white;border-radius:20px;padding:40px 28px;max-width:420px;width:100%;box-shadow:0 8px 32px rgba(10,22,40,.1);text-align:center}h2{color:#0A1628;margin-bottom:12px}.icon{font-size:56px;margin-bottom:16px}p{color:#1E3A6B;font-size:14px;line-height:1.7}a{display:inline-block;margin-top:20px;background:#2463EB;color:white;padding:12px 28px;border-radius:12px;text-decoration:none;font-weight:700}</style></head><body><div class="card"><div class="icon">${success?'✅':'❌'}</div><h2>${title}</h2><p>${body}</p><a href="/">العودة للتطبيق</a></div></body></html>`;
}

module.exports = { router };
