/**
 * Replit Auth integration — CommonJS wrapper for openid-client v6 (ESM)
 *
 * After a successful Replit OAuth callback, the user is upserted in db.json
 * and standard JWT cookies (access_token + refresh_token) are issued via the
 * existing auth middleware, so ALL existing protected routes work unchanged.
 *
 * Routes added:
 *   GET /api/replit-login      — redirect to Replit OAuth
 *   GET /api/replit-callback   — OAuth callback → issue JWT → redirect to app
 *   GET /api/replit-logout     — clear JWT cookies + end Replit session
 */

const session = require('express-session');
const crypto  = require('crypto');
const {
  readDB, writeDB,
  signAccessToken, signRefreshToken,
  ACCESS_COOKIE_OPTS, REFRESH_COOKIE_OPTS,
  hashToken,
  addAuditLog,
} = require('./authMiddleware');

let _config = null;
let _oidc   = null;

// ─── Lazy-load ESM openid-client v6 ──────────────────────────────────────────
async function loadOidc() {
  if (_config) return;
  const oidc = await import('openid-client');
  _oidc = oidc;
  const issuerUrl = process.env.ISSUER_URL || 'https://replit.com/oidc';
  const replId    = process.env.REPL_ID;
  if (!replId) throw new Error('REPL_ID env var is required (set automatically on Replit)');
  _config = await oidc.discovery(new URL(issuerUrl), replId);
}

// ─── Determine the canonical app domain (safe against host-header abuse) ─────
function getAppDomain() {
  if (process.env.REPLIT_DOMAINS) return process.env.REPLIT_DOMAINS;
  if (process.env.APP_URL) {
    try { return new URL(process.env.APP_URL).hostname; } catch {}
  }
  return 'localhost:5000';
}

// ─── Upsert a Replit user in db.json and return the user record ───────────────
function upsertReplitUser(claims) {
  const db    = readDB();
  const users = db.users || [];
  const email = claims.email || `replit_${claims.sub}@replit.local`;

  let user = users.find(u => u.replitId === claims.sub);
  if (!user) {
    user = users.find(u => u.email === email);
  }

  const now = new Date().toISOString();
  if (user) {
    user.replitId        = claims.sub;
    user.firstName       = claims.first_name  || user.firstName  || '';
    user.lastName        = claims.last_name   || user.lastName   || '';
    user.profileImageUrl = claims.profile_image_url || user.profileImageUrl || '';
    user.emailVerified   = true;
    user.updatedAt       = now;
  } else {
    user = {
      id:              `u_${crypto.randomBytes(8).toString('hex')}`,
      replitId:        claims.sub,
      name:            [claims.first_name, claims.last_name].filter(Boolean).join(' ') || email.split('@')[0],
      email,
      firstName:       claims.first_name  || '',
      lastName:        claims.last_name   || '',
      profileImageUrl: claims.profile_image_url || '',
      role:            'user',
      emailVerified:   true,
      failedAttempts:  0,
      createdAt:       now,
      updatedAt:       now,
    };
    users.push(user);
  }

  db.users = users;
  writeDB(db);
  return user;
}

// ─── Issue JWT cookies — identical to regular login ──────────────────────────
function issueJwtCookies(res, user, req) {
  const payload      = { id: user.id, email: user.email, name: user.name, role: user.role };
  const accessToken  = signAccessToken(payload);
  const refreshToken = signRefreshToken({ id: user.id });

  // Store refresh session in db
  const db = readDB();
  if (!db.sessions) db.sessions = [];
  db.sessions.push({
    id:           `s_${crypto.randomBytes(8).toString('hex')}`,
    userId:       user.id,
    tokenHash:    hashToken(refreshToken),
    ip:           req.ip || req.headers['x-forwarded-for'] || 'unknown',
    userAgent:    (req.headers['user-agent'] || '').slice(0, 120),
    createdAt:    new Date().toISOString(),
    expiresAt:    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    revoked:      false,
    via:          'replit_auth',
  });
  addAuditLog(db, 'login', user.id, { ip: req.ip, userAgent: req.headers['user-agent'], via: 'replit_auth' });
  writeDB(db);

  res.cookie('access_token',  accessToken,  ACCESS_COOKIE_OPTS);
  res.cookie('refresh_token', refreshToken, REFRESH_COOKIE_OPTS);
}

// ─── Main setup function ──────────────────────────────────────────────────────
async function setupReplitAuth(app) {
  await loadOidc();

  // Lightweight session only used for OAuth state/nonce storage during the
  // redirect flow — it is NOT used for ongoing auth (JWT cookies handle that).
  const sessionMiddleware = session({
    secret:            process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
    resave:            false,
    saveUninitialized: false,
    name:              'replit_oauth_sid',
    cookie: {
      httpOnly: true,
      secure:   true, // Replit always uses HTTPS
      sameSite: 'lax',
      maxAge:   10 * 60 * 1000, // 10 min — only needed for the OAuth dance
    },
  });

  // ── Login — redirect to Replit OAuth ────────────────────────────────────────
  app.get('/api/replit-login', sessionMiddleware, async (req, res) => {
    try {
      const domain      = getAppDomain();
      const callbackURL = `https://${domain}/api/replit-callback`;
      const codeVerifier    = _oidc.randomPKCECodeVerifier();
      const codeChallenge   = await _oidc.calculatePKCECodeChallenge(codeVerifier);
      const state           = _oidc.randomState();

      req.session.replitOauth = { codeVerifier, state, callbackURL };

      const params = new URLSearchParams({
        response_type:          'code',
        client_id:              process.env.REPL_ID,
        redirect_uri:           callbackURL,
        scope:                  'openid email profile offline_access',
        state,
        code_challenge:         codeChallenge,
        code_challenge_method:  'S256',
        prompt:                 'login consent',
      });

      const authUrl = new URL(_config.serverMetadata().authorization_endpoint);
      params.forEach((v, k) => authUrl.searchParams.set(k, v));
      res.redirect(authUrl.toString());
    } catch (err) {
      console.error('[ReplitAuth] login error:', err.message);
      res.status(500).send('خطأ في بدء تسجيل الدخول');
    }
  });

  // ── OAuth callback ───────────────────────────────────────────────────────────
  app.get('/api/replit-callback', sessionMiddleware, async (req, res) => {
    try {
      const stored = req.session.replitOauth;
      if (!stored) return res.redirect('/api/replit-login');

      const { codeVerifier, state, callbackURL } = stored;
      delete req.session.replitOauth;

      const currentUrl = new URL(callbackURL);
      Object.entries(req.query).forEach(([k, v]) => currentUrl.searchParams.set(k, v));

      const tokens = await _oidc.authorizationCodeGrant(_config, currentUrl, {
        pkceCodeVerifier: codeVerifier,
        expectedState:    state,
      });

      const claims = tokens.claims();
      const user   = upsertReplitUser(claims);
      issueJwtCookies(res, user, req);

      res.redirect('/?replitAuth=1');
    } catch (err) {
      console.error('[ReplitAuth] callback error:', err.message);
      res.redirect('/api/replit-login');
    }
  });

  // ── Logout ───────────────────────────────────────────────────────────────────
  app.get('/api/replit-logout', (req, res) => {
    res.clearCookie('access_token',  { path: '/' });
    res.clearCookie('refresh_token', { path: '/api/auth' });
    // Redirect to Replit end-session if possible, otherwise just go home
    try {
      const endUrl = _oidc.buildEndSessionUrl(_config, {
        client_id:                process.env.REPL_ID,
        post_logout_redirect_uri: `https://${getAppDomain()}`,
      }).href;
      res.redirect(endUrl);
    } catch {
      res.redirect('/');
    }
  });

  console.log('[ReplitAuth] Routes registered: /api/replit-login  /api/replit-callback  /api/replit-logout');
}

module.exports = { setupReplitAuth };
