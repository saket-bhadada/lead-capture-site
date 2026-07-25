# Lead Capture Site

Public landing page with a lead-capture form, plus a session-based admin dashboard (`/admin`) to review and triage submissions.

## Video Walkthrough

> 🎬 _Coming soon — record with [Loom](https://loom.com) and paste the link here._

---

## Stack

- **Client:** React + Vite + Tailwind CSS v4 + React Hook Form + Zod
- **Server:** Node.js + Express + JWT (httpOnly cookie) + bcryptjs
- **Database:** Supabase (PostgreSQL) — `leads`, `admin_users`, `sessions` tables
- **Shared:** One Zod schema imported by both client and server so validation can't drift

## Project Layout

```
client/    React app (Vite)
server/    Express API
shared/    Zod schema + constants used by both
```

---

## Setup

### 1. Install everything

This is an npm workspaces monorepo — one install covers all three packages:

```bash
npm install
```

### 2. Create Supabase tables

Run this SQL in **Supabase Dashboard → SQL Editor**:

```sql
CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  client_id TEXT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  budget_range TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'New'
    CHECK (status IN ('New', 'Contacted', 'Closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE leads ADD COLUMN IF NOT EXISTS client_id TEXT;

CREATE TABLE IF NOT EXISTS admin_users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL DEFAULT '',
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS client_users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  admin_id TEXT NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);
```

### 3. Configure environment variables

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Open `server/.env` and set your Supabase credentials and a `JWT_SECRET`.

### 4. Run both apps together

```bash
npm run dev
```

- Client: http://localhost:5173
- Server: http://localhost:3001
- Admin: http://localhost:5173/admin

### First Admin Credentials

On first startup, if no admin users exist, the server generates a random password and prints it:

```
┌─────────────────────────────────────────────┐
│  First Admin User Created                   │
│  Username: admin                            │
│  Password: abc123def456ghi789 (one-time)    │
│  Change this immediately in /admin          │
└─────────────────────────────────────────────┘
```

Use these credentials to log in at `/admin/login`.

---

## Data Model

### `admin_users` table

| Column | Type | Description |
|---|---|---|
| `id` | UUID (text) | Primary key |
| `username` | text, unique | Login name |
| `email` | text | For future password resets |
| `password_hash` | text | bcryptjs hash (cost factor 10) |
| `created_at` | timestamptz | Auto-set on insert |

### `sessions` table

| Column | Type | Description |
|---|---|---|
| `id` | UUID (text) | Primary key |
| `admin_id` | text (FK → admin_users) | Which admin owns this session |
| `token` | text | The JWT token string |
| `created_at` | timestamptz | When the session was created |
| `expires_at` | timestamptz | 8 hours from login |

When a session expires or the user logs out, the row is deleted. This enables token revocation — if a user logs out on one device, their old tokens are dead everywhere.

### `leads` table

| Column | Type | Description |
|---|---|---|
| `id` | UUID (text) | Primary key |
| `name` | text | Submitter's name |
| `email` | text | Submitter's email |
| `budget_range` | text | Selected budget range |
| `message` | text | Free-text message |
| `status` | text | Enum: `New`, `Contacted`, `Closed` |
| `created_at` | timestamptz | Auto-set on insert |

---

## Authentication

### Login

1. User enters username + password on `/admin/login`
2. Client sends `POST /api/admin/login { username, password }`
3. Server queries `admin_users` table for the username
4. Server uses `bcryptjs.compare()` to verify the password hash
5. If valid:
   - Creates a new row in the `sessions` table
   - Signs a JWT token (`{ admin_id, session_id }`) with an 8-hour expiry
   - Sets the JWT as an httpOnly cookie (no JS access, sent automatically with all requests)
   - Returns `200` with `{ ok: true }`
6. On redirect to `/admin`, the browser automatically attaches the cookie

### Authorization

Every admin route (`GET /api/leads`, `PATCH /api/leads/:id`, etc.) has middleware that:

1. Reads the JWT from the httpOnly cookie
2. Verifies the signature (if it's tampered with, the signature fails)
3. Checks that the session still exists in the `sessions` table (if the user logged out elsewhere, the session row is gone and the token is dead)
4. If both checks pass, `req.user = { admin_id, session_id }` is set and the route proceeds
5. Otherwise, returns 401

### Logout

1. User clicks "Log out" on `/admin`
2. Client sends `POST /api/admin/logout` (includes the httpOnly cookie)
3. Server reads the JWT, extracts the `session_id`, and deletes that row from `sessions`
4. Server clears the cookie (sets `maxAge: 0`)
5. Client redirects to `/admin/login`

### Key Security Notes

- **Token revocation** — sessions are deleted on logout, so logging out on one device kills tokens everywhere
- **httpOnly cookie** — JavaScript can't read the token, so XSS can't steal it
- **SameSite=Lax** — prevents CSRF for state-changing requests from third-party sites
- **Password hashing** — bcryptjs with cost factor 10, salted, so brute-force is expensive
- **No plaintext passwords** — passwords are never stored or logged after initial seed

---

## Deployment

This repository is configured for a **single-service deployment** on Render. The Express server serves both the API and the built React frontend.

### Environment Variables

Set these in your Render dashboard when creating the Web Service:

| Variable | Description |
|---|---|
| `NODE_ENV` | `production` |
| `VITE_API_URL` | leave empty (`""`) for single-service deployment |
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SECRET_KEY` | Supabase service role key |
| `JWT_SECRET` | Render will auto-generate this via `render.yaml` |
| `CLIENT_ORIGIN` | *See note below* |

> **Note on `CLIENT_ORIGIN`:** This controls CORS. It cannot be known before the first deploy because Render assigns the URL. **After the first successful deploy**, go into the Render dashboard, set `CLIENT_ORIGIN` to your actual assigned URL (e.g., `https://lead-capture-site.onrender.com`), and redeploy.

### First Admin Credentials

On server startup, if no admin users exist, the server will:
1. Generate a random 24-character hex password
2. Create an `admin` user with that password (bcrypt hashed)
3. Log the credentials to the console

Check your Render deployment logs for the credentials on first deploy.

### Hosting Options

- **Render** (free tier) — Web Service with GitHub auto-deploy. Simply connect your GitHub repository to Render and use the provided `render.yaml` blueprint.

---

## Production Notes

- Set `NODE_ENV=production` so the auth cookie gets `secure: true`
- Update `CLIENT_ORIGIN` (server) and `VITE_API_URL` (client) to your real deployed URLs
- `npm run build` (from root) builds the client into `client/dist`
- The Express server serves the built React app as static files in production
