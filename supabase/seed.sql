op-- =============================================================================
-- Productivity Hub — Seed Data
-- =============================================================================
-- Run this AFTER you have created a user account (sign up through the app).
--
-- 1. Sign up at http://localhost:3000/auth/signup (creates your auth user +
--    profile + workspace + settings automatically via trigger)
-- 2. Get your user UUID from Supabase Dashboard → Authentication → Users
-- 3. Replace 'YOUR_USER_ID_HERE' below with that UUID
-- 4. Run this SQL in the Supabase SQL Editor
-- =============================================================================

-- =============================================================================
-- CONFIG: Paste your auth user UUID here
-- =============================================================================
-- (keep the leading 'uuid' — it casts the string to a UUID type)
-- Example: _user_id := 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid;
DO $$
DECLARE
  _user_id    uuid := 'YOUR_USER_ID_HERE'::uuid;
  _workspace  uuid;
  _project_a  uuid;
  _project_b  uuid;
  _habit_fit  uuid;
  _habit_read uuid;
  _habit_med  uuid;
  _task_ids   uuid[];
BEGIN

-- =============================================================================
-- WORKSPACE
-- =============================================================================
-- (your default "Personal" workspace was created by the trigger, but we'll
--  add a second one to show multi-workspace support)
INSERT INTO workspaces (user_id, name, description, color)
VALUES (_user_id, 'Work', 'Work-related projects and tasks', '#f59e0b')
RETURNING id INTO _workspace;

-- =============================================================================
-- PROJECTS
-- =============================================================================
INSERT INTO projects (user_id, workspace_id, name, description, color, status, due_date, progress)
VALUES
  (_user_id, _workspace, 'Website Redesign', 'Redesign the company landing page and blog', '#6366f1', 'active', NOW() + INTERVAL '14 days', 35),
  (_user_id, _workspace, 'Q3 Marketing Campaign', 'Prepare assets and copy for Q3 launch', '#22c55e', 'active', NOW() + INTERVAL '30 days', 10)
RETURNING id INTO _project_a;
INSERT INTO projects (user_id, workspace_id, name, description, color, status, due_date, progress)
VALUES (_user_id, _workspace, 'Mobile App v2', 'Version 2 of the mobile app with new features', '#06b6d4', 'active', NOW() + INTERVAL '60 days', 5)
RETURNING id INTO _project_b;

-- =============================================================================
-- TASKS
-- =============================================================================
INSERT INTO tasks (user_id, workspace_id, project_id, title, description, status, priority, due_date, estimated_minutes, "order")
VALUES
  (_user_id, _workspace, _project_a, 'Design new homepage mockup', 'Create Figma mockups for the new homepage layout', 'in_progress', 'high', NOW() + INTERVAL '3 days', 120, 1),
  (_user_id, _workspace, _project_a, 'Finalize color palette', 'Review and approve the new brand colors', 'todo', 'medium', NOW() + INTERVAL '5 days', 60, 2),
  (_user_id, _workspace, _project_b, 'Research push notification APIs', 'Compare Firebase, OneSignal, and custom solutions', 'in_progress', 'medium', NOW() + INTERVAL '7 days', 180, 1),
  (_user_id, _workspace, NULL, 'Review team pull requests', NULL, 'todo', 'low', NOW() + INTERVAL '1 day', 45, 1),
  (_user_id, _workspace, NULL, 'Prepare weekly standup notes', NULL, 'completed', 'none', NOW() - INTERVAL '1 day', 15, 2),
  (_user_id, _workspace, NULL, 'Buy groceries', NULL, 'backlog', 'low', NOW() + INTERVAL '2 days', 30, 3)
RETURNING id INTO _task_ids;

-- =============================================================================
-- SUBTASKS (checklist items for first task)
-- =============================================================================
INSERT INTO subtasks (task_id, title, completed, "order")
VALUES
  (_task_ids[1], 'Create wireframes', true, 1),
  (_task_ids[1], 'Design hero section', false, 2),
  (_task_ids[1], 'Design footer', false, 3),
  (_task_ids[1], 'Get stakeholder feedback', false, 4);

-- =============================================================================
-- TAGS
-- =============================================================================
INSERT INTO tags (user_id, name, color)
VALUES
  (_user_id, 'design', '#6366f1'),
  (_user_id, 'frontend', '#06b6d4'),
  (_user_id, 'backend', '#22c55e'),
  (_user_id, 'urgent', '#ef4444'),
  (_user_id, 'meeting', '#f59e0b');

-- =============================================================================
-- TASK TAGS (link tag "design" to task 1)
-- =============================================================================
INSERT INTO task_tags (task_id, tag_id)
SELECT _task_ids[1], id FROM tags WHERE user_id = _user_id AND name = 'design';

-- =============================================================================
-- HABITS
-- =============================================================================
INSERT INTO habits (user_id, workspace_id, name, description, frequency, color, icon)
VALUES
  (_user_id, _workspace, 'Morning Run', 'Run 3km every morning', 'daily', '#ef4444', 'Zap')
RETURNING id INTO _habit_fit;

INSERT INTO habits (user_id, workspace_id, name, description, frequency, color, icon)
VALUES
  (_user_id, _workspace, 'Read 30 Minutes', 'Read a book for at least 30 minutes', 'daily', '#06b6d4', 'BookOpen')
RETURNING id INTO _habit_read;

INSERT INTO habits (user_id, workspace_id, name, description, frequency, color, icon)
VALUES
  (_user_id, _workspace, 'Meditate', '10-minute mindfulness meditation', 'daily', '#8b5cf6', 'Brain')
RETURNING id INTO _habit_med;

-- =============================================================================
-- HABIT LOGS (last 7 days of check-ins)
-- =============================================================================
INSERT INTO habit_logs (habit_id, date, completed)
SELECT _habit_fit, CURRENT_DATE - i, (i % 3 != 0)  -- skip every 3rd day
FROM generate_series(0, 6) AS i;

INSERT INTO habit_logs (habit_id, date, completed)
SELECT _habit_read, CURRENT_DATE - i, (i % 4 != 0)  -- skip every 4th day
FROM generate_series(0, 6) AS i;

INSERT INTO habit_logs (habit_id, date, completed)
SELECT _habit_med, CURRENT_DATE - i, true  -- perfect streak
FROM generate_series(0, 6) AS i;

-- =============================================================================
-- CALENDAR EVENTS
-- =============================================================================
INSERT INTO calendar_events (user_id, title, description, start_date, end_date, is_all_day, color)
VALUES
  (_user_id, 'Design Review', 'Review homepage mockups with the team', NOW() + INTERVAL '1 day' + INTERVAL '15 hours', NOW() + INTERVAL '1 day' + INTERVAL '16 hours', false, '#6366f1'),
  (_user_id, 'Team Standup', 'Daily standup meeting', NOW() + INTERVAL '2 days' + INTERVAL '9 hours', NOW() + INTERVAL '2 days' + INTERVAL '9 hours 30 minutes', false, '#22c55e');

-- =============================================================================
-- NOTIFICATIONS
-- =============================================================================
INSERT INTO notifications (user_id, type, title, message, read)
VALUES
  (_user_id, 'task_reminder', 'Design Review Due Soon', 'Design Review mockups are due in 2 hours', false),
  (_user_id, 'achievement', '7-Day Streak!', 'You maintained your meditation streak for 7 days', false),
  (_user_id, 'system', 'Weekly Report Ready', 'Your productivity report for this week is available', true);

-- =============================================================================
-- ACTIVITY LOGS
-- =============================================================================
INSERT INTO activity_logs (user_id, action, entity_type, metadata)
VALUES
  (_user_id, 'workspace.created', 'workspace', jsonb_build_object('name', 'Work')),
  (_user_id, 'project.created', 'project', jsonb_build_object('name', 'Website Redesign')),
  (_user_id, 'project.created', 'project', jsonb_build_object('name', 'Mobile App v2'));

END $$;
