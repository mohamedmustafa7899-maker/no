# DR BASAFFAR Clinic Management System

## Overview
A comprehensive medical management system for Dr. Basaffar's clinic. Includes an admin dashboard (web), a backend REST API, and a mobile app running as a web app via Vite + React Native Web.

## Project Structure
```
BASAFFAR-COMPLETE/BASAFFAR-COMPLETE/
├── backend/
│   ├── server.js       # Express API + dashboard static server (port 3000)
│   ├── package.json    # Dependencies: express, cors
│   └── db.json         # Auto-generated JSON database (persistent)
├── dashboard/
│   └── alshakreen-dashboard.html  # Admin dashboard (single-file HTML/JS/CSS)
└── mobile-app/
    └── alshakreen-snack.js        # Original React Native app (Expo Snack format)

mobile-app/                        # Vite + React Native Web project (port 5000)
├── index.html                     # HTML entry point
├── package.json                   # Dependencies: react, react-dom, react-native-web, vite
├── vite.config.js                 # Vite config with RN-Web alias + API proxy to port 3000
└── src/
    ├── main.jsx                   # Entry point (AppRegistry)
    ├── App.jsx                    # Full mobile app (converted from alshakreen-snack.js)
    └── LinearGradient.jsx         # CSS-based LinearGradient web component
```

## Tech Stack
- **Backend**: Node.js + Express.js (serves API + dashboard)
- **Database**: JSON file (`db.json`) — auto-created on first run
- **Dashboard**: Vanilla JS/HTML/CSS (Arabic RTL UI) served by Express
- **Mobile App (Web)**: React + React Native Web + Vite (renders mobile app in browser)
- **LinearGradient**: Custom CSS gradient component (replaces expo-linear-gradient for web)

## Running the Application
- **"Start Backend"** workflow: `node BASAFFAR-COMPLETE/BASAFFAR-COMPLETE/backend/server.js` (port 3000, console)
- **"Start application"** workflow: Vite dev server in `mobile-app/` (port 5000, webview)
- Vite proxies `/api/*` requests to the backend on port 3000
- Dashboard accessible at `http://localhost:3000/`

## Key Architecture
- Backend on port 3000 serves API + admin dashboard
- Mobile app on port 5000 (Vite) is the user-facing webview
- API calls from mobile app use relative `/api` paths, proxied by Vite to backend
- All `Alert.alert()` calls replaced with `webAlert()` (uses `window.confirm`/`window.alert` on web)
- `useNativeDriver: false` for all animations (required for web)
- `LinearGradient` is a custom component using CSS `linear-gradient`

## Mobile App Screens
- **Home** — banners, departments, offers, doctors
- **Offers** — full offer listing
- **Cart** — shopping cart
- **Booking** — appointment booking form
- **More Menu** — links to all sub-screens below:
  - البيانات الشخصية (Profile)
  - حجوزاتي (MyBookingsScreen) — fetches from `/api/bookings`
  - رصيدي (BalanceScreen) — static balance/loyalty points
  - فواتيري (InvoicesScreen) — fetches confirmed bookings from `/api/bookings`
  - فروعنا (BranchesScreen) — shows branch details
  - خدماتنا (ServicesScreen) — fetches departments from `/api/depts`
  - الإشعارات (NotificationsScreen) — fetches from `/api/notifications`
  - إرشادات الاستخدام (UsageGuideScreen) — FAQ accordion
  - معلومات عنّا (AboutScreen) — fetches from `/api/settings`
  - تواصل معنا (ContactScreen) — fetches from `/api/settings`
  - سياسة الخصوصية (PrivacyScreen) — static privacy policy
- **Login/Register** — auth screens
- **Doctor Detail** — individual doctor info
- **Offer Detail** — individual offer with booking

## Authentication System
- Implemented in `BASAFFAR-COMPLETE/BASAFFAR-COMPLETE/backend/auth.js`
- **JWT tokens** (7-day expiry, signed with `JWT_SECRET` env var)
- **bcrypt** password hashing (salt rounds: 12)
- **Email verification** via nodemailer (Ethereal test mode by default; configure `SMTP_HOST/PORT/USER/PASS` env vars for real SMTP)
- **Forgot/reset password** flow with 1-hour expiry tokens
- **Rate limiting**: login (10/15min), register (5/hour), resend (3/hour)
- **Security headers**: X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy
- **Authenticated `/me` endpoint** to validate tokens on app startup
- Token stored in `localStorage` and sent as `Authorization: Bearer <token>` header

## API Endpoints
- `GET /api/ping` — health check
- `GET/POST/PUT/DELETE /api/depts` — departments
- `GET/POST/PUT/DELETE /api/offers` — medical offers
- `GET/POST/PUT/DELETE /api/doctors` — doctors
- `GET/POST/PUT/DELETE /api/banners` — banners
- `GET/POST/PUT/DELETE /api/branches` — clinic branches
- `GET/POST/PUT/DELETE /api/bookings` — patient bookings
- `GET /api/clients` — registered clients
- `GET/POST /api/notifications` — push notifications
- `GET/PUT /api/settings` — app settings
- `POST /api/auth/register` — register (bcrypt + JWT + email verification)
- `POST /api/auth/login` — login (returns JWT)
- `GET /api/auth/me` — get current user (requires JWT)
- `GET /api/auth/verify-email?token=...` — verify email via link
- `POST /api/auth/resend-verification` — resend verification email
- `POST /api/auth/forgot-password` — send password reset email
- `GET /api/auth/reset-password-page?token=...` — password reset web page
- `POST /api/auth/reset-password` — reset password with token
- `POST /api/auth/change-password` — change password (requires JWT)
