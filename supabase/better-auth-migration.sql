-- =============================================================================
-- Better Auth — Core Tables
-- Run this in Supabase SQL Editor
-- =============================================================================

-- 1. USER table (singular — does not conflict with existing public.users)
-- Column names are camelCase to match Better Auth's default schema.
CREATE TABLE IF NOT EXISTS "user" (
    id              text        PRIMARY KEY,
    name            text        NOT NULL,
    email           text        NOT NULL UNIQUE,
    "emailVerified" boolean     NOT NULL DEFAULT false,
    image           text,
    "createdAt"     timestamp   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"     timestamp   NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. SESSION table
CREATE TABLE IF NOT EXISTS "session" (
    id          text        PRIMARY KEY,
    "expiresAt" timestamp   NOT NULL,
    token       text        NOT NULL UNIQUE,
    "createdAt" timestamp   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" text,
    "userAgent" text,
    "userId"    text        NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
);

-- 3. ACCOUNT table
CREATE TABLE IF NOT EXISTS "account" (
    id                        text        PRIMARY KEY,
    "accountId"               text        NOT NULL,
    "providerId"              text        NOT NULL,
    "userId"                  text        NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    "accessToken"             text,
    "refreshToken"            text,
    "idToken"                 text,
    "accessTokenExpiresAt"    timestamp,
    "refreshTokenExpiresAt"   timestamp,
    scope                     text,
    password                  text,
    "createdAt"               timestamp   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"               timestamp   NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. VERIFICATION table
CREATE TABLE IF NOT EXISTS "verification" (
    id          text        PRIMARY KEY,
    identifier  text        NOT NULL,
    value       text        NOT NULL,
    "expiresAt" timestamp   NOT NULL,
    "createdAt" timestamp   DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp   DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- Disable RLS on existing Supabase tables (Better Auth handles auth now)
-- =============================================================================
ALTER TABLE IF EXISTS public.users              DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.workspaces         DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.projects           DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tasks              DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.subtasks           DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tags               DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.task_tags          DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.task_attachments   DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.task_comments      DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.habit_categories   DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.habits             DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.habit_logs         DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.calendar_events    DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notifications      DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.activity_logs      DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_settings      DISABLE ROW LEVEL SECURITY;

-- =============================================================================
-- Drop old RLS policies (optional cleanup)
-- =============================================================================
DROP POLICY IF EXISTS users_select ON public.users;
DROP POLICY IF EXISTS users_update ON public.users;
DROP POLICY IF EXISTS workspaces_own ON public.workspaces;
DROP POLICY IF EXISTS workspaces_insert ON public.workspaces;
DROP POLICY IF EXISTS projects_own ON public.projects;
DROP POLICY IF EXISTS projects_insert ON public.projects;
DROP POLICY IF EXISTS tasks_own ON public.tasks;
DROP POLICY IF EXISTS tasks_insert ON public.tasks;
DROP POLICY IF EXISTS subtasks_via_task ON public.subtasks;
DROP POLICY IF EXISTS subtasks_insert ON public.subtasks;
DROP POLICY IF EXISTS tags_own ON public.tags;
DROP POLICY IF EXISTS tags_insert ON public.tags;
DROP POLICY IF EXISTS task_tags_via_task ON public.task_tags;
DROP POLICY IF EXISTS task_tags_insert ON public.task_tags;
DROP POLICY IF EXISTS task_attachments_via_task ON public.task_attachments;
DROP POLICY IF EXISTS task_attachments_insert ON public.task_attachments;
DROP POLICY IF EXISTS task_comments_select ON public.task_comments;
DROP POLICY IF EXISTS task_comments_insert ON public.task_comments;
DROP POLICY IF EXISTS task_comments_update ON public.task_comments;
DROP POLICY IF EXISTS habit_categories_own ON public.habit_categories;
DROP POLICY IF EXISTS habit_categories_insert ON public.habit_categories;
DROP POLICY IF EXISTS habits_own ON public.habits;
DROP POLICY IF EXISTS habits_insert ON public.habits;
DROP POLICY IF EXISTS habit_logs_via_habit ON public.habit_logs;
DROP POLICY IF EXISTS habit_logs_insert ON public.habit_logs;
DROP POLICY IF EXISTS calendar_events_own ON public.calendar_events;
DROP POLICY IF EXISTS calendar_events_insert ON public.calendar_events;
DROP POLICY IF EXISTS notifications_own ON public.notifications;
DROP POLICY IF EXISTS activity_logs_select ON public.activity_logs;
DROP POLICY IF EXISTS activity_logs_insert ON public.activity_logs;
DROP POLICY IF EXISTS user_settings_own ON public.user_settings;
DROP POLICY IF EXISTS user_settings_insert ON public.user_settings;
