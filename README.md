# Productivity Hub

A full-featured productivity PWA: unified task management, habit tracking with streak analytics, projects, calendar, notifications, and an activity feed — all in one place.

Built with Next.js, TypeScript, Postgres, and Tailwind CSS, deployed on Vercel.

## Features

- **Tasks** — create/edit/delete, statuses, priorities, due dates, drag-and-drop reordering, full-text search, tags, and subtasks. Tasks can be assigned to projects or left uncategorized.
- **Recurring tasks** — mark a task as recurring (daily / weekly / monthly / yearly, or a custom interval like "every 3 days"); completing it automatically creates the next occurrence.
- **Projects** — organize tasks into projects with progress tracking, plus an "uncategorized" filter.
- **Habits** — daily/weekly/monthly habits with colors, categories, reminder times/days, and one-tap logging with streak stats (weekly view + analytics).
- **Habit categories** — group habits (Health, Learning, Finance, ...) and manage them in Settings.
- **Calendar** — month view with events and tasks; add/edit/delete calendar events.
- **Today & Upcoming** — smart views for what's due now and next.
- **Analytics** — charts for habit streaks and task completion.
- **Activity feed** — a chronological timeline of everything you create, complete, or change.
- **Notifications** — PWA push notifications (via VAPID) for task reminders and due dates, plus an in-app notification center. A Vercel cron ticks daily.
- **Inbox** — quick capture of ideas and quick tasks.
- **Email** — scheduled task reminders delivered via Resend (test mode when no custom domain is verified).
- **Google auth** via better-auth, with per-user data isolation.
- **PWA** — installable, offline-ready manifest + service worker.

## Tech Stack

| Layer      | Choice                                        |
| ---------- | --------------------------------------------- |
| Framework  | Next.js 16 (App Router), React 19             |
| Language   | TypeScript                                    |
| Database   | PostgreSQL (via `pg`)                         |
| Auth       | better-auth (Google OAuth)                    |
| Data fetch | TanStack React Query                          |
| UI         | Tailwind CSS 4, framer-motion, lucide-react   |
| Charts     | recharts                                      |
| Push       | web-push + Service Worker + VAPID             |
| Email      | Resend                                        |
| Tests      | Vitest                                        |

## Getting Started

### Prerequisites

- Node.js 20+
- A PostgreSQL database
- A Google OAuth app (for auth)
- Resend API key (for email)
- VAPID keys (for push notifications)

### 1. Install

```bash
npm install
```

### 2. Configure environment

Create `.env.local`:

```env
DATABASE_URL=postgres://user:pass@host:5432/dbname
BETTER_AUTH_SECRET=your-auth-secret
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Email (optional — defaults to Resend test mode)
RESEND_API_KEY=re_...
EMAIL_FROM=onboarding@resend.dev

# Push notifications (optional)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:you@example.com
```

> **Email note:** Resend's free tier only allows delivery to your own address unless you verify a custom domain. The app detects this and falls back to a clear "test mode" response. Set `EMAIL_FROM` once you have a verified domain.

### 3. Set up the database

The schema lives in `supabase/schema.sql`. Apply it to your database:

```bash
psql "$DATABASE_URL" -f supabase/schema.sql
```

(Auth tables from better-auth are added by `supabase/better-auth-migration.sql`.)

The schema includes: `users`, `workspaces`, `tasks` (with `search_vector` for full-text search), `subtasks`, `tags`, `task_tags`, `task_comments`, `projects`, `habits`, `habit_logs`, `habit_categories`, `calendar_events`, `activity_logs`, `notifications`, `push_subscriptions`, and `user_settings`.

### 4. Generate VAPID keys (optional)

```bash
npx web-push generate-vapid-keys
```

Put the public key in `NEXT_PUBLIC_VAPID_PUBLIC_KEY` and the private key in `VAPID_PRIVATE_KEY`.

### 5. Run

```bash
npm run dev        # start dev server
npm run build      # production build
npm run start      # run production build
```

## Scripts

| Command               | Description                             |
| --------------------- | --------------------------------------- |
| `npm run dev`         | Start the dev server                    |
| `npm run build`       | Production build                        |
| `npm run start`       | Serve the production build              |
| `npm run lint`        | ESLint check                            |
| `npm test`            | Run the Vitest suite                    |
| `npm run test:watch`  | Vitest watch mode                       |
| `npm run accounts:list`  | List accounts for cleanup           |
| `npm run accounts:delete` | Delete user accounts (cleanup)   |

## Architecture

### API Routes

All routes live under `src/app/api/` and use a shared helper layer (`src/lib/db.ts`) that centralizes auth (`requireUser`), connection pooling, JSON helpers, error responses, rate limiting, and ownership assertions.

- `/api/tasks` and `/api/tasks/[id]` — CRUD, search, tag/project filters, subtask counts, recurring rollover.
- `/api/tasks/[id]/subtasks`, `/tags`, `/comments` — per-task child resources.
- `/api/projects`, `/api/habits`, `/api/habit-logs`, `/api/habit-categories` — CRUD.
- `/api/calendar-events` — calendar events CRUD.
- `/api/activity` — activity feed (with entity/type filters).
- `/api/notifications` — in-app notification center + send.
- `/api/push-subscriptions` — PWA push subscription management.
- `/api/dashboard` and `/api/analytics` — stats and chart data.
- `/api/user-settings`, `/api/workspaces`, `/api/account` — profile & preferences.
- `/api/auth/*` — better-auth endpoints.

### Recurring task logic

`src/lib/recurring.ts` contains the pure `nextOccurrence` function (also unit-tested in `tests/unit/recurring.test.ts`). When a recurring task is completed, `src/app/api/tasks/[id]/route.ts` rolls it over by inserting the next occurrence.

### Activity feed

`src/lib/activity.ts` exposes `logActivity`, called from every mutating route (tasks, projects, habits, habit logs, subtasks, tags, comments). It is fire-and-forget — a failure to log never fails the request. Client-facing metadata lives in the pure module `src/lib/activity-meta.ts` so it can be imported safely in client components.

### Tests

Unit tests live in `tests/unit/` (pure logic: streaks, recurring). They import via relative paths (Vitest is not aliased to `@/`). Run with `npm test`.

## Deployment

The project deploys to Vercel. A CD GitHub Action (`.github/workflows/cd.yml`) runs the quality gate (`tsc --noEmit` → lint → tests → build) and then promotes to production on success.

Production URL: <https://productivity-hub-green.vercel.app>

### Vercel cron

A `cron` schedule in `vercel.json` (once per day) triggers `/api/notifications/daily-push` to fire due reminders. Precise reminder timing while the app is open is handled by a client-side scheduler.
