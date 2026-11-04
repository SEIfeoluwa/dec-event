# December Event RSVP

A React, TypeScript, Vite, and Supabase app for collecting event RSVPs and managing responses from a private admin dashboard.

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` in the project root:

```bash
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
```

3. Start the local app:

```bash
npm run dev
```

4. Open the local Vite URL shown in the terminal.

## What This Project Is

This is a single-page event RSVP site. Guests can submit their name, phone number, attendance status, number of guests in their party, and an optional message. Admin users can log in to view RSVP totals, edit responses, and delete entries.

The app exists to provide a simple public RSVP experience while keeping the RSVP list and dashboard behind Supabase authentication and row-level security policies.

## How It Runs

The frontend runs in the browser with Vite and talks directly to Supabase using the publishable key.

Main routes:

- `/` - public event site and RSVP form
- `/admin/login` - admin login
- `/admin/dashboard` - authenticated RSVP dashboard

Useful commands:

```bash
npm run dev       # start local development
npm run build     # type-check and build for production
npm run preview   # preview the production build locally
npm run lint      # run ESLint
npm run test      # run tests once
npm run test:watch # run tests in watch mode
```

## How To Use It

Guests use the public form on `/` to submit one RSVP party, entering the total number of guests in their party (at least 1, no upper limit).

Admins use `/admin/login` with a Supabase auth account. After logging in, `/admin/dashboard` shows response totals and the RSVP table. Admins can edit RSVP details or delete entries.

## Supabase Requirements

The app expects a `public.rsvps` table with columns matching the TypeScript types in `src/types/database.ts`.

The public form inserts into `public.rsvps`, so RLS needs an `INSERT` policy for `anon` and, if admins may submit from the same browser session, `authenticated`.

Recommended submit policy constraints:

- `attendance` is `yes` or `no`
- `guest_count` is a whole number of at least `1`
- first name, last name, and phone are required
- message is optional and no longer than `500` characters

To prevent duplicate phone submissions, add a unique normalized-phone index:

```sql
create unique index rsvps_unique_normalized_phone
on public.rsvps (
  regexp_replace(phone, '\D', '', 'g')
);
```

The admin dashboard also uses Supabase auth, `SELECT`, `UPDATE`, and `DELETE` policies on `public.rsvps`, plus the `get_rsvp_dashboard_stats` RPC.
