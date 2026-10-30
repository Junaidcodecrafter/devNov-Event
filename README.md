# DevNov — 3-tier event platform
- Presentation tier: `client/` (React + Vite + Framer Motion)
- Application tier: `server/` (Node + Express, JWT auth, REST API)
- Data tier: SQLite file `server/devnov.db` (auto-created and seeded)

## Run
```
npm run install:all
npm run server     # terminal 1 -> http://localhost:4000
npm run client     # terminal 2 -> http://localhost:5173
```
Set `JWT_SECRET` env var for production. To move to Postgres/MySQL, only `server/index.js` queries change.
