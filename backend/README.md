Run backend server (Express + lowdb):

1) Install deps

npm install

2) Start server

npm run start

API endpoints:
POST /api/profile    -> save profile (JSON body)
GET  /api/profile/:id -> fetch profile
GET  /api/profile/user/:userId -> fetch latest profile for a user (plus history)

Profile payload now supports demographics, experiences, and essays in addition to academics so user sessions can persist the full application context.

Authentication
- Set `GOOGLE_CLIENT_ID` in the backend environment to enable Google ID token verification.
- All profile endpoints require a valid `Authorization: Bearer <id_token>` header. Match endpoints require the token when resolving a stored profile ID and will reject requests if the stored profile belongs to a different user.

Costs
- Google Identity Services (the button + ID token issuance) is free; you are not billed per login.
- Verifying Google ID tokens on the backend uses Google public keys and does not incur per-call charges.
- The only potential costs come from your own hosting or if you choose a paid identity product (e.g., Firebase Auth with phone/MFA billing tiers).
