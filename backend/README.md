Run backend server (Express + lowdb):

1) Install deps

npm install

2) Start server

npm run start

API endpoints:
POST /api/profile    -> save profile (JSON body, requires session)
GET  /api/profile/:id -> fetch profile (requires session)
GET  /api/profile/user/:userId -> fetch latest profile for a user (requires session)

Authentication (Google OAuth + session cookies)
- Configure these backend environment variables:
  - GOOGLE_CLIENT_ID
  - GOOGLE_CLIENT_SECRET
  - GOOGLE_REDIRECT_URI (e.g., http://localhost:4000/api/auth/google/callback)
  - FRONTEND_URL (e.g., http://localhost:5173)
  - SESSION_JWT_SECRET (random strong string)
- OAuth endpoints:
  - GET /api/auth/google/start
  - GET /api/auth/google/callback
  - GET /api/auth/me
  - POST /api/auth/logout
- Dev fallback (only when GOOGLE_* vars are missing AND DEV_AUTH=true or NODE_ENV=development):
  - POST /api/auth/dev-login

Profile payload now supports demographics, experiences, and essays in addition to academics so user sessions can persist the full application context.

Costs
- Google OAuth (Authorization Code flow) is free; you are not billed per login.
- Verifying Google ID tokens on the backend uses Google public keys and does not incur per-call charges.
- The only potential costs come from your own hosting or if you choose a paid identity product (e.g., Firebase Auth with phone/MFA billing tiers).
