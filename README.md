# Finance Tracker

A personal finance dashboard: accounts, transactions, budgets and a monthly
overview. Next.js + TypeScript + Tailwind, with Supabase for storage and login.

## Running it locally

```bash
npm install
cp .env.local.example .env.local   # then fill in your two values
npm run dev
```

Open http://localhost:3000.

### Environment variables

Both are safe to expose to the browser — that is what `NEXT_PUBLIC_` means,
and the anon key is designed to be public. Your data is protected by row
level security in the database, not by hiding this key.

| Variable | Where to find it in Supabase |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Project Settings → Data API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Project Settings → API Keys → `anon` |

**Never add the `service_role` key to this project.** It bypasses every
security rule, and anything the browser can read, anyone can read.

## Database setup

Run these in the Supabase SQL Editor, in order:

1. `supabase/schema.sql` — creates the tables. **Destructive**: it drops and
   recreates them, so only run it on an empty project.
2. `supabase/add-auth.sql` — adds per-user ownership and row level security.
   Safe to re-run.
3. `supabase/seed-accounts.sql` — *optional*, and only useful before logins
   existed. Prefer adding accounts through the app so they get an owner.

## Deploying to Vercel

1. Push this repository to GitHub.
2. In Vercel, import the repository. The framework is detected automatically —
   no build settings to change.
3. Add the two environment variables above (Production, Preview and
   Development).
4. Deploy, then copy your `*.vercel.app` URL.
5. In Supabase → Authentication → URL Configuration, set **Site URL** to that
   domain and add both it and `http://localhost:3000` to **Redirect URLs**.

## How the data is protected

Every row in `accounts`, `transactions` and `budgets` carries a `user_id`.
Row level security policies compare it against `auth.uid()`, so the database
itself refuses to return or accept rows belonging to anyone else. Someone
holding the anon key but no login gets nothing at all.
