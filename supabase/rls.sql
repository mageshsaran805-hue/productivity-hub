-- =============================================================================
-- Productivity Hub — Row Level Security Policies
-- =============================================================================
-- Run this AFTER schema.sql.
-- Enables RLS on all 16 tables and creates policies so users can only see
-- and modify their own data.
--
-- Two patterns:
--   1. Direct ownership — table has a `user_id` column → auth.uid() = user_id
--   2. Child table      — no `user_id`, linked through a parent → EXISTS subquery
-- =============================================================================

-- =============================================================================
-- 1. USERS
-- =============================================================================
-- Special case: id = auth.uid() instead of user_id column.
-- INSERT is handled by the on_auth_user_created trigger (SECURITY DEFINER).
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_update" ON users
  FOR UPDATE USING (auth.uid() = id);

-- =============================================================================
-- 2. WORKSPACES
-- =============================================================================
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workspaces_own" ON workspaces
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "workspaces_insert" ON workspaces
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =============================================================================
-- 3. PROJECTS
-- =============================================================================
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "projects_own" ON projects
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "projects_insert" ON projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =============================================================================
-- 4. TASKS
-- =============================================================================
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tasks_own" ON tasks
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "tasks_insert" ON tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =============================================================================
-- 5. SUBTASKS (child of tasks — no direct user_id)
-- =============================================================================
ALTER TABLE subtasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subtasks_via_task" ON subtasks
  FOR ALL USING (
    EXISTS (SELECT 1 FROM tasks WHERE tasks.id = subtasks.task_id AND tasks.user_id = auth.uid())
  );

CREATE POLICY "subtasks_insert" ON subtasks
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM tasks WHERE tasks.id = subtasks.task_id AND tasks.user_id = auth.uid())
  );

-- =============================================================================
-- 6. TAGS
-- =============================================================================
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tags_own" ON tags
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "tags_insert" ON tags
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =============================================================================
-- 7. TASK TAGS (junction table — check via task_id)
-- =============================================================================
ALTER TABLE task_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "task_tags_via_task" ON task_tags
  FOR ALL USING (
    EXISTS (SELECT 1 FROM tasks WHERE tasks.id = task_tags.task_id AND tasks.user_id = auth.uid())
  );

CREATE POLICY "task_tags_insert" ON task_tags
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM tasks WHERE tasks.id = task_tags.task_id AND tasks.user_id = auth.uid())
  );

-- =============================================================================
-- 8. TASK ATTACHMENTS (child of tasks)
-- =============================================================================
ALTER TABLE task_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "task_attachments_via_task" ON task_attachments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM tasks WHERE tasks.id = task_attachments.task_id AND tasks.user_id = auth.uid())
  );

CREATE POLICY "task_attachments_insert" ON task_attachments
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM tasks WHERE tasks.id = task_attachments.task_id AND tasks.user_id = auth.uid())
  );

-- =============================================================================
-- 9. TASK COMMENTS
-- =============================================================================
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;

-- Users can read comments on their tasks (or comments they wrote)
CREATE POLICY "task_comments_select" ON task_comments
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM tasks WHERE tasks.id = task_comments.task_id AND tasks.user_id = auth.uid())
  );

CREATE POLICY "task_comments_insert" ON task_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "task_comments_update" ON task_comments
  FOR UPDATE USING (auth.uid() = user_id);

-- =============================================================================
-- 10. HABIT CATEGORIES
-- =============================================================================
ALTER TABLE habit_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "habit_categories_own" ON habit_categories
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "habit_categories_insert" ON habit_categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =============================================================================
-- 11. HABITS
-- =============================================================================
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "habits_own" ON habits
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "habits_insert" ON habits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =============================================================================
-- 12. HABIT LOGS (child of habits)
-- =============================================================================
ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "habit_logs_via_habit" ON habit_logs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM habits WHERE habits.id = habit_logs.habit_id AND habits.user_id = auth.uid())
  );

CREATE POLICY "habit_logs_insert" ON habit_logs
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM habits WHERE habits.id = habit_logs.habit_id AND habits.user_id = auth.uid())
  );

-- =============================================================================
-- 13. CALENDAR EVENTS
-- =============================================================================
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "calendar_events_own" ON calendar_events
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "calendar_events_insert" ON calendar_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =============================================================================
-- 14. NOTIFICATIONS
-- =============================================================================
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_own" ON notifications
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "notifications_insert" ON notifications
  FOR ALL USING (auth.uid() = user_id);

-- =============================================================================
-- 15. ACTIVITY LOGS
-- =============================================================================
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "activity_logs_select" ON activity_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Activity logs are append-only (inserted by triggers/app, not users)
CREATE POLICY "activity_logs_insert" ON activity_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =============================================================================
-- 16. USER SETTINGS
-- =============================================================================
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_settings_own" ON user_settings
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "user_settings_insert" ON user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =============================================================================
-- VERIFICATION
-- =============================================================================
-- Run this to confirm all tables have RLS enabled:
--   SELECT tablename, rowsecurity FROM pg_tables
--   WHERE schemaname = 'public' AND tablename IN (
--     'users','workspaces','projects','tasks','subtasks','tags','task_tags',
--     'task_attachments','task_comments','habit_categories','habits','habit_logs',
--     'calendar_events','notifications','activity_logs','user_settings'
--   );
