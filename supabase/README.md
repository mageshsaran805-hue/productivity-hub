# Supabase Setup

## Prerequisites

- Supabase project created at https://supabase.com
- Project API keys in `.env.local` (already configured)

---

## 1. Run the Schema

Creates all 16 tables, indexes, triggers, and full-text search.

```
Open Supabase Dashboard → SQL Editor → paste schema.sql → Run
```

## 2. Enable Row-Level Security

Locks down every table so users can only see/modify their own data.

```
Open Supabase Dashboard → SQL Editor → paste rls.sql → Run
```

Two policy patterns are used:
- **Direct ownership** — tables with a `user_id` column: `auth.uid() = user_id`
- **Child tables** — tables linked through a parent (subtasks, habit_logs, etc.): `EXISTS (SELECT 1 FROM parent WHERE ...)`

Run this verification query after:

```sql
SELECT tablename FROM pg_tables
WHERE schemaname = 'public' AND NOT rowsecurity;
```

It should return **zero rows**. If any table shows up, RLS isn't enabled on it.

## 3. Configure Authentication

| Setting | Value |
|---------|-------|
| Auth → Settings → Email Auth | Enable email/password |
| Auth → Settings → Site URL | `http://localhost:3000` (dev) |
| Auth → Settings → Redirect URLs | `http://localhost:3000/auth/callback` |

## 4. Seed Sample Data (Optional)

Populates your account with sample projects, tasks, habits, etc.

```
1. Sign up at http://localhost:3000/auth/signup
2. Get your user UUID from Supabase Dashboard → Authentication → Users
3. Open seed.sql, replace 'YOUR_USER_ID_HERE' with your actual UUID
4. Paste into SQL Editor → Run
```

## 5. Auto-Create User on Signup

A database trigger automatically creates a user profile, default workspace, and
settings when someone signs up. This is already included in `schema.sql`.

The trigger function `handle_new_user()`:
- Inserts into `users` (id, email, name)
- Creates a "Personal" workspace
- Creates default `user_settings`

---

## File Reference

| File | Purpose |
|------|---------|
| `schema.sql` | 16 tables + indexes + triggers + search vector |
| `rls.sql` | Row Level Security policies for all tables |
| `seed.sql` | Sample data for development/testing |

## Environment Variables

Already in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://euxevqnovsukdaxdblbk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_HjV4vtC_-HYINh-z61zGuQ_QDD50n9x
```
