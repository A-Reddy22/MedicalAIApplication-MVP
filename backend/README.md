Run backend server (Express + lowdb):

1) Install deps

npm install

2) Start server

npm run start

API endpoints:
POST /api/profile    -> save profile (JSON body)
GET  /api/profile/:id -> fetch profile
GET  /api/schools     -> returns { count } for loaded school entries
GET  /api/schools/search?q=term -> case-insensitive search over school names
GET  /api/schools/:id -> lookup a school by id (case-insensitive)

Testing:

npm test
# or run only backend tests
npm --prefix backend test
