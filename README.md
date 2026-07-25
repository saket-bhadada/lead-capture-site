# Lead Capture Site

Public landing page with a lead form, plus a password-gated `/admin` dashboard to review and triage
submissions. React (Vite, plain JS) on the frontend, Express (plain JS) on the backend, SQLite for storage.

## Stack
- **Client:** React + Vite + Tailwind CSS v4 + React Hook Form + Zod
- **Server:** Node.js + Express + better-sqlite3 + JWT (httpOnly cookie) for the admin gate
- **Shared:** one Zod schema, imported by both client and server, so validation can't drift between them
- **Database:** SQLite (a single `leads.db` file, created automatically) — this was swapped in for the
  Postgres/Supabase option so the whole thing runs with zero external accounts or setup. See
  "Swapping in Postgres/Supabase" below if you want to move to a hosted DB later.

## Project layout
```
client/    React app (Vite)
server/    Express API
shared/    Zod schema + constants used by both
```

## Setup

**1. Install everything** (this is an npm workspaces monorepo, so one install covers all three packages):
```bash
npm install
```

**2. Configure environment variables:**
```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```
Open `server/.env` and set `ADMIN_PASSWORD` and `JWT_SECRET` to real values (the JWT secret can be
any long random string — `openssl rand -hex 32` works well).

**3. Run both apps together:**
```bash
npm run dev
```
- Client: http://localhost:5173
- Server: http://localhost:3001
- Admin: http://localhost:5173/admin (redirects to `/admin/login` until you sign in with `ADMIN_PASSWORD`)

The SQLite database (`server/leads.db`) and its table are created automatically on first run — no
migration step needed.

## How the pieces fit together
- **Landing page (`/`)** — the form validates client-side with the shared Zod schema via React Hook
  Form. On submit it `POST`s to `/api/leads`, which re-validates the *same* schema server-side before
  inserting. There's also a hidden honeypot field: if it's filled in (a bot filling every field), the
  server pretends to succeed but doesn't insert anything.
- **Admin (`/admin`)** — gated by a single `ADMIN_PASSWORD`. On login, the server signs a JWT and sets
  it as an httpOnly cookie; all `/api/leads` reads/writes and `/api/admin/*` routes check that cookie.
  The dashboard lists leads (search + status filter), and the status dropdown per row calls
  `PATCH /api/leads/:id`, updating optimistically with rollback on failure.

## Swapping in Postgres/Supabase later
Every query lives behind `server/src/db.js`. To move off SQLite, replace the contents of that file with
a Postgres client (e.g. `pg` or the Supabase JS client) exposing the same shape, then update the
`db.prepare(...).run/get/all(...)` calls in `server/src/routes/leads.js` to your new client's query
syntax. Nothing in the routes, middleware, or frontend needs to change beyond that.

## Production notes
- Set `NODE_ENV=production` on the server so the auth cookie gets `secure: true`.
- Update `CLIENT_ORIGIN` (server) and `VITE_API_URL` (client) to your real deployed URLs.
- `npm run build` (from the root) builds the client into `client/dist`, ready to deploy as a static site.
  The Express server deploys as a normal Node process.
