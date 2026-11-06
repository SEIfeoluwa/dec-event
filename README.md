# December Event RSVP

An RSVP site for Pastor Mrs Adebisi's 60th birthday celebration. Guests submit RSVPs from the public page; admins log in to a private dashboard to view totals and edit or delete responses.

The frontend (React, TypeScript, Vite) and the API (Hono, Drizzle, Neon Postgres) live in this repo and deploy together to Vercel, on one domain.

## Quick Start

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a [Neon](https://neon.tech) Postgres project, then copy `.env.example` to `.env` and set `DATABASE_URL` to Neon's **pooled** connection string.

3. Create the database tables (`rsvps`, `admins`, `sessions`):

   ```bash
   npm run db:push
   ```

4. Create an admin login (run again with the same email to reset the password):

   ```bash
   npm run create-admin -- you@example.com "a-strong-password"
   ```

5. Start the site and API together:

   ```bash
   npm run dev
   ```

   Open http://localhost:5173. Vite forwards `/api` requests to the API on port 3000.

## Project Layout

```
src/        React frontend (pages, components, styles)
shared/     RSVP validation rules used by BOTH the form and the API
server/     API: routes (app.ts), admin sessions (auth.ts), database (db/)
api/        Vercel Function entry point that serves server/app.ts at /api
scripts/    create-admin.ts
```

Validation limits (name length, phone format, max guests, message length) live in [shared/rsvp.ts](shared/rsvp.ts), so the form and the API always agree.

## Commands

```bash
npm run dev          # site + API (http://localhost:5173)
npm run dev:web      # site only
npm run dev:api      # API only (http://localhost:3000/api)
npm run build        # type-check everything and build the site
npm run lint         # ESLint
npm run db:push      # create/update database tables from server/db/schema.ts
npm run create-admin -- <email> "<password>"
```

## Routes

| Page | Purpose |
|---|---|
| `/` | Public event page and RSVP form |
| `/admin/login` | Admin login |
| `/admin/dashboard` | RSVP totals and table (edit, delete, add) |

## API

All endpoints are under `/api` on the same domain as the site.

| Method | Path | Access | Purpose |
|---|---|---|---|
| POST | `/api/rsvps` | Public | Submit an RSVP |
| POST | `/api/auth/login` | Public | Admin login (sets session cookie) |
| GET | `/api/auth/session` | Admin | Current admin, or 401 |
| POST | `/api/auth/logout` | Admin | End session |
| GET | `/api/rsvps` | Admin | All RSVPs, sorted by name |
| GET | `/api/rsvps/stats` | Admin | Totals: responses, yes, no, attending guests |
| PATCH | `/api/rsvps/:id` | Admin | Update an RSVP |
| DELETE | `/api/rsvps/:id` | Admin | Delete an RSVP |

Rules the API enforces:

- One RSVP per phone number. Phones are stored as 10 digits, so `(301) 555-1234` and `301-555-1234` count as duplicates (409).
- "Not attending" always saves 0 guests; "attending" needs 1–20.
- Admin sessions are httpOnly cookies, stored hashed in the database, valid for 7 days.

## Deploy (Vercel)

1. Import the repo in Vercel (framework: Vite).
2. In **Project Settings → Environment Variables**, add `DATABASE_URL` (Neon pooled connection string). Vercel's Neon integration under the Storage tab can set this for you.
3. Deploy. `vercel.json` routes `/api/*` to the API function and everything else to the React app.

Run `npm run db:push` and `npm run create-admin` against the production database once before launch.
