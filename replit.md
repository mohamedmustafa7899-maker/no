# DR BASAFFAR Clinic Management System

## Overview
A comprehensive medical management system for Dr. Basaffar's clinic. Includes an admin dashboard (web) and a backend REST API, with a React Native mobile app (Expo Snack) for patients.

## Project Structure
```
BASAFFAR-COMPLETE/BASAFFAR-COMPLETE/
├── backend/
│   ├── server.js       # Express API + static file server
│   ├── package.json    # Dependencies: express, cors
│   └── db.json         # Auto-generated JSON database (persistent)
├── dashboard/
│   └── alshakreen-dashboard.html  # Admin dashboard (single-file HTML/JS/CSS)
└── mobile-app/
    └── alshakreen-snack.js        # React Native app (Expo Snack format)
```

## Tech Stack
- **Backend**: Node.js + Express.js (serves both API and dashboard)
- **Database**: JSON file (`db.json`) — auto-created on first run
- **Frontend**: Vanilla JS/HTML/CSS dashboard (Arabic RTL UI)
- **Mobile**: React Native via Expo (separate, not hosted here)

## Running the Application
- **Workflow**: "Start application" — runs `node BASAFFAR-COMPLETE/BASAFFAR-COMPLETE/backend/server.js`
- **Port**: 5000 (both API and dashboard served from the same server)
- **Dashboard**: served at `/`
- **API**: served at `/api/*`

## Key Changes from Original
- Port changed from 3000 → 5000 (Replit webview requirement)
- Dashboard API URL changed from `http://localhost:3000/api` → `/api` (relative, works via proxy)
- Backend now serves the dashboard as static files via `express.static`
- Root route `/` serves `alshakreen-dashboard.html`
- Server binds to `0.0.0.0` (required for Replit proxy)

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
- `POST /api/auth/login` / `POST /api/auth/register` — auth

## Deployment
- Target: autoscale
- Run: `node BASAFFAR-COMPLETE/BASAFFAR-COMPLETE/backend/server.js`
