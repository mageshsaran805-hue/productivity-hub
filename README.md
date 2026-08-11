# Productivity Hub

A full-stack personal productivity suite — tasks, habits, projects, calendar, and analytics — built with Next.js, TypeScript, and PostgreSQL on Supabase.

## Features

- **Tasks** — list and kanban board views, priorities (urgent/high/medium/low), due dates, recurring tasks, favorites, drag-and-drop ordering, full-text search
- **Projects** — organize tasks into projects with status (active/completed/archived), computed progress, and colors
- **Habits** — daily/weekly/monthly/custom frequency, streak tracking, categories, per-day logs with optional values (minutes, counts) and notes
- **Today & Upcoming** — due-date-first views of everything scheduled
- **Inbox** — quick capture of tasks without context, promoted into a workspace later
- **Calendar** — unified view of tasks, habits, and events
- **Analytics** — completion trends, habit streaks, and productivity stats
- **Notifications** — in-app, browser push, and email reminders (optional Resend)
- **Auth** — email/password signup, login, forgot/reset password via [Better Auth](https://better-auth.com), session-gated API with cross-user ownership checks
- **Settings** — per-user notification toggles

## Tech Stack

| Layer    | Technology |
| -------- | ---------- |
| Framework | [Next.js 16](https://nextjs.org) (App Router) + React 19 |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4, Radix UI primitives, framer-motion |
| Data | PostgreSQL via direct `pg` pool, Zod validation |
| Database | [Supabase](https://supabase.com) (schema, RLS in `supabase/`) |
| Auth | Better Auth (email/password) |
| Notifications | Browser Push + Resend email |
| Testing | Vitest (unit + HTTP integration) |

## Project Structure

```
src/
├── app/            # App Router routes (landing, /app/*, /auth/*, /api/*)
│   ├── api/        # Route handlers — session-gated REST endpoints
│   ├── app/        # Authenticated app UI (dashboard, tasks, habits, …)
│   └── auth/       # Login, signup, forgot/reset password
├── components/     # UI primitives, layouts, landing, animations
├── hooks/          # Auth, workspace, sidebar, notifications
├── lib/            # DB pool, auth config, queries, validation, rate limiting
└── proxy.ts        # Edge middleware — protects /app/*, redirects auth pages
supabase/           # PostgreSQL schema, RLS policies, seed data
tests/              # Unit + integration suites
```

## Getting Started

Prerequisites: Node.js ≥ 20, a PostgreSQL database (Supabase free tier works).

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create your database. If using Supabase, run the scripts in `supabase/` in order:
   `schema.sql`, `rls.sql`, `seed.sql`, plus `better-auth-migration.sql` for auth tables.

3. Configure environment variables:

   ```bash
   cp .env.example .env.local
   ```

   ```env
   DATABASE_URL=postgresql://postgres.<ref>:<password>@<host>:5432/postgres
   BETTER_AUTH_SECRET=<generate with: openssl rand -base64 32>
   BETTER_AUTH_URL=http://localhost:3000
   RESEND_API_KEY=            # optional — needed for password-reset emails
   ```

4. Run the dev server:

   ```bash
   npm run dev
   ```

   Open http://localhost:3000.

## Scripts

| Command            | Description                                    |
| ------------------ | ---------------------------------------------- |
| `npm run dev`      | Start the dev server                           |
| `npm run build`    | Production build (`next build`)                |
| `npm start`        | Start the production server                    |
| `npm run lint`     | ESLint (Next core-web-vitals + TypeScript)     |
| `npm test`         | Run Vitest unit + integration suites           |
| `test:watch`       | Run tests in watch mode                        |

The integration suite (`tests/integration/api.test.ts`) targets a running server and auto-skips if none is reachable. Start `npm run dev` in one terminal, then `npm test` in another.

## Deployment

### Vercel (recommended)

1. Import the repository at [vercel.com/new](https://vercel.com/new).
2. Add these environment variables in Project Settings → Environment Variables:
   - `DATABASE_URL` — use the Supabase **transaction pooler** (`:6543`) for the serverless connection
   - `BETTER_AUTH_SECRET`
   - `BETTER_AUTH_URL` — your production origin, e.g. `https://your-app.vercel.app`
   - `RESEND_API_KEY` (optional)
3. Deploy. CD on `main` is handled by `.github/workflows/cd.yml` once a `VERCEL_TOKEN` is added to repo Actions secrets.

### CI/CD

- **CI** (`.github/workflows/ci.yml`) — runs on push/PR to `main`: typecheck, lint, test, build
- **CD** (`.github/workflows/cd.yml`) — runs on push to `main`: builds and deploys to Vercel production

## Testing

- **Unit** — validation schemas, error mapping, rate limiting (`tests/unit/`)
- **Integration** — end-to-end HTTP tests against the running app: auth gate, task/habit/project CRUD, cross-user isolation, read-only endpoints (`tests/integration/`)

## Database

16 tables covering workspaces, projects, tasks (with subtasks, tags, and full-text search), habits + logs, calendar events, notifications, activity logs, and user settings. Soft deletes via `deleted_at`, `updated_at` maintained by trigger, and Row Level Security in `supabase/rls.sql`.

## License

Private project.