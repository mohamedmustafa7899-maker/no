const express  = require('express');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto   = require('crypto');
const fs       = require('fs');
const path     = require('path');
const rateLimit = require('express-rate-limit');

const router = express.Router();
const DB_PATH = path.join(__dirname, 'db.json');

const JWT_SECRET  = process.env.JWT_SECRET  || 'basaffar_jwt_secret_change_in_production_' + Math.random().toString(36);
const JWT_EXPIRES = process.env.JWT_EXPIRES || '7d';
const APP_URL     = process.env.APP_URL     || 'http://localhost:3000';

// ─── Rate limiters ────────────────────────────────────────────────────────────
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { ok: false, msg: 'محاولات كثيرة، حاول بعد 15 دقيقة' },
  standardHeaders: true,
  legacyHeaders: false,
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { ok: false, msg: 'تجاوزت الحد المسموح به لإنشاء الحسابات' },
  standardHeaders: true,
  legacyHeaders: false,
});

const resendLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { ok: false, msg: 'تجاوزت الحد المسموح به لإعادة الإرسال' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── DB helpers (users live in db.json under "users") ────────────────────────
function readDB() {
  if (!fs.existsSync(DB_PATH)) return {};
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}
function writeDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}
function getUsers() {
  const db = readDB();
  if (!db.users) { db.users = []; writeDB(db); }
  return db;
}

// ─── Email transport ──────────────────────────────────────────────────────────
async function getMailer() {
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  // Fall back to ethereal (test inbox — no real emails sent)
  const testAccount = await nodemailer.createTestAccount();
  const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: { user: testAccount.user, pass: testAccount.pass },
  });
  return transporter;
}

async function sendVerificationEmail(toEmail, token, name) {
  try {
    const mailer   = await getMailer();
    const verifyURL = `${APP_URL}/api/auth/verify-email?token=${token}`;
    const info = await mailer.sendMail({
      from: `"DR BASAFFAR Clinic" <no-reply@basaffar.com>`,
      to: toEmail,
      subject: 'تفعيل حسابك في مركز باصفار',
      html: `
        <div dir="rtl" style="font-family:Arial,sans-serif;max-width:500px;margin:auto;background:#f0f6ff;padding:32px;border-radius:16px">
          <h2 style="color:#0A1628;text-align:center">مرحباً ${name} 👋</h2>
          <p style="color:#1E3A6B;font-size:15px">شكراً لتسجيلك في مركز د. باصفار الطبي. يرجى تفعيل حسابك بالنقر على الزر أدناه:</p>
          <div style="text-align:center;margin:28px 0">
            <a href="${verifyURL}" style="background:#2463EB;color:white;padding:14px 36px;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block">
              تفعيل الحساب
            </a>
          </div>
          <p style="color:#6B86AA;font-size:12px;text-align:center">الرابط صالح لمدة 24 ساعة. إذا لم تطلب هذا، يمكنك تجاهل الرسالة.</p>
          <hr style="border:none;border-top:1px solid #DBEAFE;margin:20px 0"/>
          <p style="color:#6B86AA;font-size:11px;text-align:center">DR BASAFFAR Clinic — رعاية طبية متخصصة</p>
        </div>
      `,
    });
    if (process.env.SMTP_HOST) {
      console.log('[MAIL] Verification email sent to', toEmail);
    } else {
      console.log('[MAIL] Preview URL (test mode):', nodemailer.getTestMessageUrl(info));
    }
  } catch (err) {
    console.error('[MAIL] Failed to send verification email:', err.message);
  }
}

async function sendPasswordResetEmail(toEmail, token, name) {
  try {
    const mailer   = await getMailer();
    const resetURL  = `${APP_URL}/api/auth/reset-password-page?token=${token}`;
    const info = await mailer.sendMail({
      from: `"DR BASAFFAR Clinic" <no-reply@basaffar.com>`,
      to: toEmail,
      subject: 'إعادة تعيين كلمة المرور',
      html: `
        <div dir="rtl" style="font-family:Arial,sans-serif;max-width:500px;margin:auto;background:#f0f6ff;padding:32px;border-radius:16px">
          <h2 style="color:#0A1628;text-align:center">إعادة تعيين كلمة المرور</h2>
          <p style="color:#1E3A6B;font-size:15px">مرحباً ${name}، تلقينا طلباً لإعادة تعيين كلمة مرورك. انقر على الزر أدناه:</p>
          <div style="text-align:center;margin:28px 0">
            <a href="${resetURL}" style="background:#2463EB;color:white;padding:14px 36px;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block">
              إعادة تعيين كلمة المرور
            </a>
          </div>
          <p style="color:#6B86AA;font-size:12px;text-align:center">الرابط صالح لمدة ساعة واحدة. إذا لم تطلب هذا، تجاهل الرسالة — حسابك آمن.</p>
          <hr style="border:none;border-top:1px solid #DBEAFE;margin:20px 0"/>
          <p style="color:#6B86AA;font-size:11px;text-align:center">DR BASAFFAR Clinic — رعاية طبية متخصصة</p>
        </div>
      `,
    });
    if (!process.env.SMTP_HOST) {
      console.log('[MAIL] Password reset preview URL:', nodemailer.getTestMessageUrl(info));
    }
  } catch (err) {
    console.error('[MAIL] Failed to send reset email:', err.message);
  }
}

// ─── JWT helpers ─────────────────────────────────────────────────────────────
function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

// ─── Middleware: require valid JWT ────────────────────────────────────────────
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ ok: false, msg: 'غير مصرح' });
  try {
    req.user = verifyToken(token);
    next();
  } catch {
    return res.status(401).json({ ok: false, msg: 'جلسة منتهية، سجّل دخولك مجدداً' });
  }
}

// ─── REGISTER ─────────────────────────────────────────────────────────────────
router.post('/register', registerLimiter, async (req, res) => {
  const { name, email, phone, password, age, idNum, nationality } = req.body;

  if (!name?.trim())     return res.status(400).json({ ok: false, msg: 'يرجى إدخال الاسم' });
  if (!email?.trim())    return res.status(400).json({ ok: false, msg: 'يرجى إدخال البريد الإلكتروني' });
  if (!phone?.trim())    return res.status(400).json({ ok: false, msg: 'يرجى إدخال رقم الهاتف' });
  if (!password)         return res.status(400).json({ ok: false, msg: 'يرجى إدخال كلمة المرور' });
  if (password.length < 8) return res.status(400).json({ ok: false, msg: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' });

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) return res.status(400).json({ ok: false, msg: 'البريد الإلكتروني غير صحيح' });

  const db = getUsers();
  const existing = db.users.find(u => u.email.toLowerCase() === email.trim().toLowerCase() || u.phone === phone.trim());
  if (existing) return res.status(400).json({ ok: false, msg: 'البريد أو رقم الهاتف مسجل مسبقاً' });

  const salt         = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(password, salt);
  const verifyToken  = crypto.randomBytes(32).toString('hex');
  const verifyExpires = Date.now() + 24 * 60 * 60 * 1000;

  const user = {
    id:           (db.users.length ? Math.max(...db.users.map(u => u.id)) + 1 : 1),
    name:         name.trim(),
    email:        email.trim().toLowerCase(),
    phone:        phone.trim(),
    age:          age || null,
    idNum:        idNum || null,
    nationality:  nationality || null,
    passwordHash,
    emailVerified:    false,
    verifyToken,
    verifyExpires,
    resetToken:       null,
    resetExpires:     null,
    createdAt:    new Date().toISOString(),
    bookings:     0,
  };

  db.users.push(user);

  // Mirror to clients list
  if (!db.clients) db.clients = [];
  db.clients.push({
    id:       user.id,
    name:     user.name,
    email:    user.email,
    phone:    user.phone,
    idNum:    user.idNum,
    bookings: 0,
    joinedAt: user.createdAt,
  });

  writeDB(db);

  // Send verification email (non-blocking)
  sendVerificationEmail(user.email, verifyToken, user.name);

  const token = signToken({ id: user.id, email: user.email, name: user.name });
  res.json({ ok: true, token, user: { id: user.id, name: user.name, email: user.email, emailVerified: false }, msg: 'تم إنشاء الحساب! تحقق من بريدك لتفعيل الحساب.' });
});

// ─── LOGIN ─────────────────────────────────────────────────────────────────────
router.post('/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body;

  if (!email?.trim())  return res.status(400).json({ ok: false, msg: 'يرجى إدخال البريد الإلكتروني' });
  if (!password)       return res.status(400).json({ ok: false, msg: 'يرجى إدخال كلمة المرور' });

  const db   = getUsers();
  const user = db.users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());

  if (!user) return res.status(401).json({ ok: false, msg: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(401).json({ ok: false, msg: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });

  const token = signToken({ id: user.id, email: user.email, name: user.name });
  res.json({ ok: true, token, user: { id: user.id, name: user.name, email: user.email, emailVerified: user.emailVerified } });
});

// ─── GET CURRENT USER ──────────────────────────────────────────────────────────
router.get('/me', requireAuth, (req, res) => {
  const db   = getUsers();
  const user = db.users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ ok: false, msg: 'المستخدم غير موجود' });
  res.json({ ok: true, user: { id: user.id, name: user.name, email: user.email, phone: user.phone, emailVerified: user.emailVerified, createdAt: user.createdAt } });
});

// ─── VERIFY EMAIL ─────────────────────────────────────────────────────────────
router.get('/verify-email', (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).send(htmlPage('رابط غير صحيح', 'الرابط الذي استخدمته غير صحيح.', false));

  const db   = getUsers();
  const user = db.users.find(u => u.verifyToken === token);

  if (!user) return res.status(400).send(htmlPage('رابط غير صحيح', 'الرابط غير صحيح أو تم استخدامه من قبل.', false));
  if (Date.now() > user.verifyExpires) return res.status(400).send(htmlPage('انتهت الصلاحية', 'انتهت صلاحية الرابط. يرجى طلب رابط جديد من التطبيق.', false));

  user.emailVerified  = true;
  user.verifyToken    = null;
  user.verifyExpires  = null;
  writeDB(db);

  res.send(htmlPage('تم التفعيل! ✅', `مرحباً ${user.name}، تم تفعيل بريدك الإلكتروني بنجاح. يمكنك العودة للتطبيق الآن.`, true));
});

// ─── RESEND VERIFICATION EMAIL ───────────────────────────────────────────────
router.post('/resend-verification', resendLimiter, async (req, res) => {
  const { email } = req.body;
  const db   = getUsers();
  const user = db.users.find(u => u.email.toLowerCase() === email?.trim().toLowerCase());

  if (!user)               return res.status(404).json({ ok: false, msg: 'البريد الإلكتروني غير مسجل' });
  if (user.emailVerified)  return res.json({ ok: true, msg: 'بريدك مفعّل بالفعل' });

  user.verifyToken   = crypto.randomBytes(32).toString('hex');
  user.verifyExpires = Date.now() + 24 * 60 * 60 * 1000;
  writeDB(db);

  await sendVerificationEmail(user.email, user.verifyToken, user.name);
  res.json({ ok: true, msg: 'تم إرسال رابط التفعيل إلى بريدك' });
});

// ─── FORGOT PASSWORD ─────────────────────────────────────────────────────────
router.post('/forgot-password', resendLimiter, async (req, res) => {
  const { email } = req.body;
  const db   = getUsers();
  const user = db.users.find(u => u.email.toLowerCase() === email?.trim().toLowerCase());

  // Always return OK to prevent email enumeration
  if (!user) return res.json({ ok: true, msg: 'إذا كان البريد مسجلاً، سيصلك رابط إعادة التعيين' });

  user.resetToken   = crypto.randomBytes(32).toString('hex');
  user.resetExpires = Date.now() + 60 * 60 * 1000;
  writeDB(db);

  await sendPasswordResetEmail(user.email, user.resetToken, user.name);
  res.json({ ok: true, msg: 'إذا كان البريد مسجلاً، سيصلك رابط إعادة التعيين' });
});

// ─── RESET PASSWORD PAGE (GET) ────────────────────────────────────────────────
router.get('/reset-password-page', (req, res) => {
  const { token } = req.query;
  res.send(`<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>إعادة تعيين كلمة المرور</title>
<style>*{box-sizing:border-box}body{font-family:Arial,sans-serif;background:#f0f6ff;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0}
.card{background:white;border-radius:20px;padding:36px 28px;max-width:400px;width:100%;box-shadow:0 8px 32px rgba(10,22,40,.1)}
h2{color:#0A1628;text-align:center;margin-bottom:24px}label{display:block;font-size:12px;font-weight:700;color:#1E3A6B;margin-bottom:6px;text-align:right}
input{width:100%;padding:12px;border:1px solid #DBEAFE;border-radius:12px;font-size:14px;color:#0A1628;margin-bottom:16px;outline:none}
button{width:100%;padding:14px;background:#2463EB;color:white;border:none;border-radius:12px;font-size:15px;font-weight:700;cursor:pointer}
.msg{text-align:center;margin-top:16px;font-size:13px;color:#1E3A6B}.err{color:#D03030}.ok{color:#2A8A45}</style></head>
<body><div class="card">
  <h2>🔒 إعادة تعيين كلمة المرور</h2>
  <form id="form">
    <label>كلمة المرور الجديدة</label><input type="password" id="pw" required minlength="8" placeholder="8 أحرف على الأقل"/>
    <label>تأكيد كلمة المرور</label><input type="password" id="pw2" required placeholder="أعد إدخال كلمة المرور"/>
    <button type="submit">حفظ كلمة المرور</button>
  </form>
  <p class="msg" id="msg"></p>
</div>
<script>
document.getElementById('form').addEventListener('submit',async(e)=>{
  e.preventDefault();
  const pw=document.getElementById('pw').value;
  const pw2=document.getElementById('pw2').value;
  const msg=document.getElementById('msg');
  if(pw!==pw2){msg.textContent='كلمتا المرور غير متطابقتين';msg.className='msg err';return;}
  const res=await fetch('/api/auth/reset-password',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:'${token}',password:pw})});
  const data=await res.json();
  msg.textContent=data.msg;
  msg.className='msg '+(data.ok?'ok':'err');
  if(data.ok)document.getElementById('form').style.display='none';
});
</script></body></html>`);
});

// ─── RESET PASSWORD (POST) ────────────────────────────────────────────────────
router.post('/reset-password', (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ ok: false, msg: 'بيانات ناقصة' });
  if (password.length < 8) return res.status(400).json({ ok: false, msg: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' });

  const db   = getUsers();
  const user = db.users.find(u => u.resetToken === token);

  if (!user || Date.now() > user.resetExpires)
    return res.status(400).json({ ok: false, msg: 'الرابط غير صحيح أو انتهت صلاحيته' });

  bcrypt.genSalt(12).then(salt => bcrypt.hash(password, salt)).then(hash => {
    user.passwordHash = hash;
    user.resetToken   = null;
    user.resetExpires = null;
    writeDB(db);
    res.json({ ok: true, msg: 'تم تغيير كلمة المرور بنجاح. يمكنك تسجيل الدخول الآن.' });
  });
});

// ─── CHANGE PASSWORD (authenticated) ─────────────────────────────────────────
router.post('/change-password', requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ ok: false, msg: 'بيانات ناقصة' });
  if (newPassword.length < 8) return res.status(400).json({ ok: false, msg: 'كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل' });

  const db   = getUsers();
  const user = db.users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ ok: false, msg: 'المستخدم غير موجود' });

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) return res.status(401).json({ ok: false, msg: 'كلمة المرور الحالية غير صحيحة' });

  const salt = await bcrypt.genSalt(12);
  user.passwordHash = await bcrypt.hash(newPassword, salt);
  writeDB(db);
  res.json({ ok: true, msg: 'تم تغيير كلمة المرور بنجاح' });
});

// ─── HTML helper for email-verification pages ─────────────────────────────────
function htmlPage(title, body, success) {
  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title>
<style>body{font-family:Arial,sans-serif;background:#f0f6ff;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0}
.card{background:white;border-radius:20px;padding:40px 28px;max-width:420px;width:100%;box-shadow:0 8px 32px rgba(10,22,40,.1);text-align:center}
h2{color:#0A1628;margin-bottom:12px}.icon{font-size:56px;margin-bottom:16px}p{color:#1E3A6B;font-size:14px;line-height:1.7}
a{display:inline-block;margin-top:20px;background:#2463EB;color:white;padding:12px 28px;border-radius:12px;text-decoration:none;font-weight:700}</style></head>
<body><div class="card">
  <div class="icon">${success ? '✅' : '❌'}</div>
  <h2>${title}</h2>
  <p>${body}</p>
  <a href="/">العودة للتطبيق</a>
</div></body></html>`;
}

module.exports = { router, requireAuth };
