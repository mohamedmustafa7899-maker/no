# DR BASAFFAR Clinic Management System

## Overview
A comprehensive medical management system for Dr. Basaffar's clinic. Includes an admin dashboard (web), a backend REST API, and a mobile app running as a web app via Vite + React Native Web.

## Project Structure
```
BASAFFAR-COMPLETE/BASAFFAR-COMPLETE/
├── backend/
│   ├── server.js          # Express API + dashboard static server (port 3000)
│   ├── auth.js            # Full auth system (login, register, refresh, CAPTCHA, etc.)
│   ├── authMiddleware.js  # Shared JWT utils, cookie opts, requireAuth/requireRole, auditLog
│   ├── package.json       # Dependencies: express, cors, bcryptjs, jsonwebtoken, etc.
│   └── db.json            # Auto-generated JSON database (persistent)
├── dashboard/
│   └── alshakreen-dashboard.html  # Admin dashboard (single-file HTML/JS/CSS)
└── mobile-app/            # (see below)

mobile-app/                        # Vite + React Native Web project (port 5000)
├── index.html                     # HTML entry point
├── package.json                   # Dependencies: react, react-dom, react-native-web, vite
├── vite.config.js                 # Vite config with RN-Web alias + API proxy to port 3000
└── src/
    ├── main.jsx                   # Entry point (AppRegistry)
    ├── App.jsx                    # Full mobile app (all screens + security updates)
    └── LinearGradient.jsx         # CSS-based LinearGradient web component
```

## Tech Stack
- **Backend**: Node.js + Express.js (serves API + dashboard)
- **Database**: JSON file (`db.json`) — auto-created on first run
- **Dashboard**: Vanilla JS/HTML/CSS (Arabic RTL UI) served by Express; admin-only route
- **Mobile App (Web)**: React + React Native Web + Vite (renders mobile app in browser)
- **LinearGradient**: Custom CSS gradient component (replaces expo-linear-gradient for web)

## Running the Application
- **"Start Backend"** workflow: `node BASAFFAR-COMPLETE/BASAFFAR-COMPLETE/backend/server.js` (port 3000)
- **"Start application"** workflow: Vite dev server in `mobile-app/` (port 5000, webview)
- Vite proxies `/api/*` requests to the backend on port 3000
- Dashboard accessible at `http://localhost:3000/` (admin-only; redirects to `/admin-login`)

## Security Architecture (Production-Grade)

### Authentication — Replit Auth (Single Method)
- **File**: `BASAFFAR-COMPLETE/BASAFFAR-COMPLETE/backend/replitAuth.js`
- **Single login method**: Replit OpenID Connect (supports Google, GitHub, Apple, X, email/password)
- Uses PKCE flow (secure OAuth 2.0 with code verifier/challenge)
- Domain resolved from `REPLIT_DOMAINS` env var (safe against host-header injection)
- After callback: upserts user in `db.json` and issues standard JWT cookies — all existing protected routes work unchanged
- Sessions stored in `db.sessions[]` with `via: 'replit_auth'` marker
- Routes: `GET /api/replit-login`, `GET /api/replit-callback`, `GET /api/replit-logout`
- Frontend: single "تسجيل الدخول" button in LoginScreen → redirects to Replit OAuth
- Packages: `openid-client`, `express-session` (installed in root node_modules)

### JWT Cookie Flow (Post-Login)
- **httpOnly cookies** — no localStorage: `access_token` (15min, path `/`) + `refresh_token` (7d, path `/api/auth`)
- **Auto-refresh**: frontend `apiRequest()` detects 401, silently calls `POST /api/auth/refresh`, retries original request
- Cookies: `secure: true` + `sameSite: 'lax'` on Replit/production (HTTPS detected via `REPLIT_DOMAINS`)

### CORS
- ALLOWED_ORIGINS includes `https://${REPLIT_DOMAINS}` automatically + localhost for local dev
- `credentials: true` for cookie-based auth

### Roles & RBAC
- Roles: `user`, `admin`, `super_admin` stored in JWT payload + user record
- `requireAuth` — validates access token cookie
- `requireRole(...roles)` — validates auth + role membership (returns 403 otherwise)
- Admin dashboard (`GET /`) protected by `requireAdminDashboard` (redirects to `/admin-login`)
- All write routes (POST/PUT/DELETE for depts/offers/etc.) require `admin` or `super_admin`

### CORS
- `credentials: true` with explicit `ALLOWED_ORIGINS` list (not wildcard)
- Dev origins: localhost:5000, localhost:3000; Production: `APP_URL`, `ADMIN_URL` env vars

### Audit Log
- All auth events logged to `db.auditLog[]` (capped at 2000): register, login, login_failed, account_locked, logout, logout_all, email_verified, password_reset, password_changed
- `GET /api/auth/audit-log` — admin-only, paginated

### Session Management (User-Facing)
- `GET /api/auth/sessions` — list active sessions with IP, user-agent, last used
- `DELETE /api/auth/sessions/:id` — revoke individual session
- `POST /api/auth/logout-all` — revoke all sessions + clear cookies
- ProfileScreen shows session list with "قطع" (disconnect) button per session and "logout all devices" button

### Environment Variables (Production Required)
- `JWT_SECRET` — access token signing key
- `JWT_REFRESH_SECRET` — refresh token signing key
- `APP_URL` — canonical app URL (for email links and CORS)
- `ADMIN_URL` — admin dashboard URL (optional, for CORS)
- `SMTP_HOST/PORT/SECURE/USER/PASS` — email sending (falls back to Ethereal test in dev)

## API Endpoints

### Public
- `GET /api/ping` — health check
- `GET /api/auth/captcha` — math challenge for forms
- `POST /api/auth/login` — login (sets httpOnly cookies)
- `POST /api/auth/register` — register (sets httpOnly cookies)
- `POST /api/auth/refresh` — silent token refresh via refresh cookie
- `GET /api/auth/verify-email?token=...` — verify email via link
- `POST /api/auth/forgot-password` — send password reset email
- `GET /api/auth/reset-password-page?token=...` — password reset web page
- `POST /api/auth/reset-password` — reset password with token
- `POST /api/auth/resend-verification` — resend email verification link
- `GET /api/depts` — departments (public read)
- `GET /api/offers` — offers (public read, `?dept=` filter)
- `GET /api/doctors` — doctors (public read)
- `GET /api/banners` — banners (public read)
- `GET /api/branches` — branches (public read)
- `GET /api/settings` — app settings (public read)

### Authenticated (any logged-in user)
- `GET /api/auth/me` — current user info
- `POST /api/auth/logout` — logout (clears cookies, revokes session)
- `POST /api/auth/logout-all` — logout all devices
- `GET /api/auth/sessions` — list active sessions
- `DELETE /api/auth/sessions/:id` — revoke a session
- `POST /api/auth/change-password` — change password
- `GET /api/bookings` — patient bookings
- `POST /api/bookings` — create booking
- `GET /api/notifications` — notifications
- `GET /api/stats` — clinic stats

### Admin Only (role: admin or super_admin)
- `POST/PUT/DELETE /api/depts` — manage departments
- `POST/PUT/DELETE /api/offers` — manage offers
- `POST/PUT/DELETE /api/doctors` — manage doctors
- `POST/PUT/DELETE /api/banners` — manage banners
- `POST/PUT/DELETE /api/branches` — manage branches
- `PUT/DELETE /api/bookings/:id` — manage bookings
- `GET /api/clients` — client list
- `POST /api/notifications` — send notifications
- `PUT /api/settings` — update settings
- `GET /api/auth/audit-log` — security audit log

## Mobile App Screens
- **Home** — banners, departments, offers, doctors
- **Offers** — full offer listing
- **Cart** — shopping cart
- **Booking** — appointment booking form
- **More Menu** — links to all sub-screens:
  - البيانات الشخصية (ProfileScreen) — user info, password change, active sessions management
  - حجوزاتي (MyBookingsScreen)
  - رصيدي (BalanceScreen) — balance/loyalty points
  - فواتيري (InvoicesScreen)
  - فروعنا (BranchesScreen)
  - خدماتنا (ServicesScreen)
  - الإشعارات (NotificationsScreen)
  - إرشادات الاستخدام (UsageGuideScreen)
  - معلومات عنّا (AboutScreen)
  - تواصل معنا (ContactScreen)
  - سياسة الخصوصية (PrivacyScreen)
- **LoginScreen** — with CAPTCHA math challenge
- **RegisterScreen** — with CAPTCHA math challenge
- **ForgotPasswordScreen** — with CAPTCHA math challenge
- **Doctor Detail / Offer Detail** screens
