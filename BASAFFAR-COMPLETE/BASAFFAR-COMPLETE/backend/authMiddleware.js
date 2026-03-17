const jwt    = require('jsonwebtoken');
const crypto = require('crypto');
const fs     = require('fs');
const path   = require('path');

const DB_PATH = path.join(__dirname, 'db.json');
const IS_PROD = process.env.NODE_ENV === 'production';

// ─── Secrets — must be set in production via env vars ─────────────────────────
const JWT_ACCESS_SECRET = (() => {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  if (IS_PROD) { console.error('[FATAL] JWT_SECRET env var required in production'); process.exit(1); }
  return 'dev_access_' + crypto.randomBytes(8).toString('hex');
})();
const JWT_REFRESH_SECRET = (() => {
  if (process.env.JWT_REFRESH_SECRET) return process.env.JWT_REFRESH_SECRET;
  if (IS_PROD) { console.error('[FATAL] JWT_REFRESH_SECRET env var required in production'); process.exit(1); }
  return 'dev_refresh_' + crypto.randomBytes(8).toString('hex');
})();

const ACCESS_EXPIRES    = '15m';
const REFRESH_EXPIRES_MS = 7 * 24 * 60 * 60 * 1000;

// ─── Cookie options ───────────────────────────────────────────────────────────
const COOKIE_BASE = { httpOnly: true, secure: IS_PROD, sameSite: IS_PROD ? 'strict' : 'lax' };
const ACCESS_COOKIE_OPTS  = { ...COOKIE_BASE, path: '/', maxAge: 15 * 60 * 1000 };
const REFRESH_COOKIE_OPTS = { ...COOKIE_BASE, path: '/api/auth', maxAge: REFRESH_EXPIRES_MS };

// ─── DB helpers ───────────────────────────────────────────────────────────────
function readDB() {
  if (!fs.existsSync(DB_PATH)) return {};
  try { return JSON.parse(fs.readFileSync(DB_PATH, 'utf8')); } catch { return {}; }
}
function writeDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// ─── Token helpers ────────────────────────────────────────────────────────────
function signAccessToken(payload) {
  return jwt.sign(payload, JWT_ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES });
}
function signRefreshToken(payload) {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '7d' });
}
function verifyAccessToken(token) {
  return jwt.verify(token, JWT_ACCESS_SECRET);
}
function verifyRefreshToken(token) {
  return jwt.verify(token, JWT_REFRESH_SECRET);
}
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// ─── Middleware: require valid access token cookie ────────────────────────────
function requireAuth(req, res, next) {
  const token = req.cookies?.access_token;
  if (!token) return res.status(401).json({ ok: false, msg: 'غير مصرح، يرجى تسجيل الدخول', code: 'NO_TOKEN' });
  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    return res.status(401).json({ ok: false, msg: 'جلسة منتهية، سجّل دخولك مجدداً', code: 'TOKEN_EXPIRED' });
  }
}

// ─── Middleware factory: require role ─────────────────────────────────────────
function requireRole(...roles) {
  return [
    requireAuth,
    (req, res, next) => {
      if (!roles.includes(req.user.role))
        return res.status(403).json({ ok: false, msg: 'ليس لديك صلاحية للوصول لهذا المورد' });
      next();
    },
  ];
}

// ─── Middleware: check admin cookie for dashboard HTML route ──────────────────
function requireAdminDashboard(req, res, next) {
  const token = req.cookies?.access_token;
  if (!token) return res.redirect('/admin-login');
  try {
    const user = verifyAccessToken(token);
    if (!['admin', 'super_admin'].includes(user.role)) return res.redirect('/admin-login');
    next();
  } catch {
    return res.redirect('/admin-login');
  }
}

// ─── Audit log helper ─────────────────────────────────────────────────────────
function addAuditLog(db, event, userId, details = {}) {
  if (!db.auditLog) db.auditLog = [];
  db.auditLog.unshift({
    id: `${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
    event,
    userId: userId || null,
    ip: details.ip || null,
    userAgent: details.userAgent ? details.userAgent.slice(0, 120) : null,
    extra: Object.fromEntries(Object.entries(details).filter(([k]) => !['ip','userAgent'].includes(k))),
    timestamp: new Date().toISOString(),
  });
  if (db.auditLog.length > 2000) db.auditLog = db.auditLog.slice(0, 2000);
}

module.exports = {
  DB_PATH, IS_PROD, readDB, writeDB,
  JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, ACCESS_EXPIRES, REFRESH_EXPIRES_MS,
  COOKIE_BASE, ACCESS_COOKIE_OPTS, REFRESH_COOKIE_OPTS,
  signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken, hashToken,
  requireAuth, requireRole, requireAdminDashboard,
  addAuditLog,
};
