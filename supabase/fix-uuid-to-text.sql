-- =============================================================================
-- Fix: Change all user ID columns from uuid to text
-- Better Auth generates text-based user IDs, but the original schema used uuid.
-- This mismatch causes 400 errors on every query because PostgreSQL can't cast
-- non-UUID text to uuid.
-- =============================================================================

-- Step 1: Drop all RLS policies (they reference user_id columns and block ALTER)
DROP POLICY IF EXISTS users_select          ON public.users;
DROP POLICY IF EXISTS users_update          ON public.users;
DROP POLICY IF EXISTS workspaces_own        ON public.workspaces;
DROP POLICY IF EXISTS workspaces_insert     ON public.workspaces;
DROP POLICY IF EXISTS projects_own          ON public.projects;
DROP POLICY IF EXISTS projects_insert       ON public.projects;
DROP POLICY IF EXISTS tasks_own             ON public.tasks;
DROP POLICY IF EXISTS tasks_insert          ON public.tasks;
DROP POLICY IF EXISTS subtasks_via_task     ON public.subtasks;
DROP POLICY IF EXISTS subtasks_insert       ON public.subtasks;
DROP POLICY IF EXISTS tags_own              ON public.tags;
DROP POLICY IF EXISTS tags_insert           ON public.tags;
DROP POLICY IF EXISTS task_tags_via_task    ON public.task_tags;
DROP POLICY IF EXISTS task_tags_insert      ON public.task_tags;
DROP POLICY IF EXISTS task_attachments_via_task ON public.task_attachments;
DROP POLICY IF EXISTS task_attachments_insert    ON public.task_attachments;
DROP POLICY IF EXISTS task_comments_select  ON public.task_comments;
DROP POLICY IF EXISTS task_comments_insert  ON public.task_comments;
DROP POLICY IF EXISTS task_comments_update  ON public.task_comments;
DROP POLICY IF EXISTS habit_categories_own  ON public.habit_categories;
DROP POLICY IF EXISTS habit_categories_insert ON public.habit_categories;
DROP POLICY IF EXISTS habits_own            ON public.habits;
DROP POLICY IF EXISTS habits_insert         ON public.habits;
DROP POLICY IF EXISTS habit_logs_via_habit  ON public.habit_logs;
DROP POLICY IF EXISTS habit_logs_insert     ON public.habit_logs;
DROP POLICY IF EXISTS calendar_events_own   ON public.calendar_events;
DROP POLICY IF EXISTS calendar_events_insert ON public.calendar_events;
DROP POLICY IF EXISTS notifications_own     ON public.notifications;
DROP POLICY IF EXISTS notifications_insert  ON public.notifications;
DROP POLICY IF EXISTS activity_logs_select  ON public.activity_logs;
DROP POLICY IF EXISTS activity_logs_insert  ON public.activity_logs;
DROP POLICY IF EXISTS user_settings_own     ON public.user_settings;
DROP POLICY IF EXISTS user_settings_insert  ON public.user_settings;

-- Step 2: Drop FK constraints referencing users(id)
ALTER TABLE IF EXISTS public.workspaces       DROP CONSTRAINT IF EXISTS workspaces_user_id_fkey;
ALTER TABLE IF EXISTS public.projects         DROP CONSTRAINT IF EXISTS projects_user_id_fkey;
ALTER TABLE IF EXISTS public.tasks            DROP CONSTRAINT IF EXISTS tasks_user_id_fkey;
ALTER TABLE IF EXISTS public.tags             DROP CONSTRAINT IF EXISTS tags_user_id_fkey;
ALTER TABLE IF EXISTS public.task_comments    DROP CONSTRAINT IF EXISTS task_comments_user_id_fkey;
ALTER TABLE IF EXISTS public.habit_categories DROP CONSTRAINT IF EXISTS habit_categories_user_id_fkey;
ALTER TABLE IF EXISTS public.habits           DROP CONSTRAINT IF EXISTS habits_user_id_fkey;
ALTER TABLE IF EXISTS public.calendar_events  DROP CONSTRAINT IF EXISTS calendar_events_user_id_fkey;
ALTER TABLE IF EXISTS public.notifications    DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;
ALTER TABLE IF EXISTS public.activity_logs    DROP CONSTRAINT IF EXISTS activity_logs_user_id_fkey;
ALTER TABLE IF EXISTS public.user_settings    DROP CONSTRAINT IF EXISTS user_settings_user_id_fkey;

-- Step 3: Change users.id from uuid to text
ALTER TABLE public.users
  ALTER COLUMN id DROP DEFAULT,
  ALTER COLUMN id TYPE text USING id::text;

-- Step 4: Change all user_id columns from uuid to text
ALTER TABLE public.workspaces
  ALTER COLUMN user_id TYPE text USING user_id::text;
ALTER TABLE public.projects
  ALTER COLUMN user_id TYPE text USING user_id::text;
ALTER TABLE public.tasks
  ALTER COLUMN user_id TYPE text USING user_id::text;
ALTER TABLE public.tags
  ALTER COLUMN user_id TYPE text USING user_id::text;
ALTER TABLE public.task_comments
  ALTER COLUMN user_id TYPE text USING user_id::text;
ALTER TABLE public.habit_categories
  ALTER COLUMN user_id TYPE text USING user_id::text;
ALTER TABLE public.habits
  ALTER COLUMN user_id TYPE text USING user_id::text;
ALTER TABLE public.calendar_events
  ALTER COLUMN user_id TYPE text USING user_id::text;
ALTER TABLE public.notifications
  ALTER COLUMN user_id TYPE text USING user_id::text;
ALTER TABLE public.activity_logs
  ALTER COLUMN user_id TYPE text USING user_id::text;
ALTER TABLE public.user_settings
  ALTER COLUMN user_id TYPE text USING user_id::text;

-- Step 5: Recreate FK constraints
ALTER TABLE public.workspaces
  ADD CONSTRAINT workspaces_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE public.projects
  ADD CONSTRAINT projects_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE public.tasks
  ADD CONSTRAINT tasks_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE public.tags
  ADD CONSTRAINT tags_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE public.task_comments
  ADD CONSTRAINT task_comments_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE public.habit_categories
  ADD CONSTRAINT habit_categories_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE public.habits
  ADD CONSTRAINT habits_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE public.calendar_events
  ADD CONSTRAINT calendar_events_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE public.activity_logs
  ADD CONSTRAINT activity_logs_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE public.user_settings
  ADD CONSTRAINT user_settings_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
