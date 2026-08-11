-- =============================================================================
-- Productivity Hub — PostgreSQL Schema for Supabase
-- =============================================================================
-- This schema defines 16 tables covering workspaces, projects, tasks,
-- subtasks, tags, habits, calendar events, notifications, activity logs,
-- and user settings. Designed for Supabase with Row Level Security in mind.
--
-- Conventions:
--   - All primary keys use UUID v4 via gen_random_uuid()
--   - All tables include created_at; mutable tables include updated_at
--   - Soft deletes use a nullable deleted_at timestamptz
--   - Foreign keys include ON DELETE rules appropriate to the relationship
--   - Check constraints enforce enum-like fields at the database level
-- =============================================================================

-- =============================================================================
-- EXTENSIONS
-- =============================================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";  -- for gen_random_uuid()

-- =============================================================================
-- USERS
-- =============================================================================
-- Mirrors Supabase auth.users. Keeping a local users table lets us store
-- profile info without coupling to the auth schema.
CREATE TABLE users (
    id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    email       text        NOT NULL UNIQUE,
    name        text        NOT NULL,
    avatar_url  text,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  users              IS 'Local user profiles mirroring auth.users';
COMMENT ON COLUMN users.email        IS 'Must match auth.users email for RLS joins';
COMMENT ON COLUMN users.avatar_url   IS 'Supabase Storage URL or external avatar';

-- =============================================================================
-- WORKSPACES
-- =============================================================================
-- Top-level organizational unit. Every project, task, and habit belongs to a
-- workspace. A user can have multiple workspaces.
CREATE TABLE workspaces (
    id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name        text        NOT NULL,
    description text,
    color       text        NOT NULL DEFAULT '#6366f1',
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  workspaces           IS 'Top-level containers for projects, tasks, and habits';
COMMENT ON COLUMN workspaces.color     IS 'Hex color for UI display';

CREATE INDEX idx_workspaces_user_id ON workspaces(user_id);

-- =============================================================================
-- PROJECTS
-- =============================================================================
-- Organizes tasks within a workspace. Supports soft delete via deleted_at.
CREATE TABLE projects (
    id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id uuid       NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id     uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name        text        NOT NULL,
    description text,
    color       text        NOT NULL DEFAULT '#6366f1',
    status      text        NOT NULL DEFAULT 'active'
                            CHECK (status IN ('active', 'completed', 'archived')),
    due_date    timestamptz,
    progress    integer     NOT NULL DEFAULT 0,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now(),
    deleted_at  timestamptz          -- soft delete
);

COMMENT ON TABLE  projects             IS 'Task groupings within a workspace';
COMMENT ON COLUMN projects.status      IS 'active | completed | archived';
COMMENT ON COLUMN projects.progress    IS '0–100 percentage computed from task completion';

CREATE INDEX idx_projects_workspace_id ON projects(workspace_id);
CREATE INDEX idx_projects_user_id      ON projects(user_id);
CREATE INDEX idx_projects_status       ON projects(status);
-- Partial index: only scan non-deleted rows for active queries
CREATE INDEX idx_projects_active       ON projects(id) WHERE deleted_at IS NULL;

-- =============================================================================
-- TASKS
-- =============================================================================
-- Core unit of work. Supports subtasks via self-referential parent_id,
-- full-text search, and soft delete.
CREATE TABLE tasks (
    id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id      uuid        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id           uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id        uuid        REFERENCES projects(id) ON DELETE SET NULL,
    parent_id         uuid        REFERENCES tasks(id) ON DELETE SET NULL,
    title             text        NOT NULL,
    description       text,
    status            text        NOT NULL DEFAULT 'todo'
                                  CHECK (status IN ('backlog', 'todo', 'in_progress', 'completed', 'archived')),
    priority          text        NOT NULL DEFAULT 'none'
                                  CHECK (priority IN ('urgent', 'high', 'medium', 'low', 'none')),
    due_date          timestamptz,
    start_date        timestamptz,
    completed_at      timestamptz,
    is_recurring      boolean     NOT NULL DEFAULT false,
    recurring_rule    text,                 -- rrule string (e.g. 'FREQ=WEEKLY;BYDAY=MO')
    is_favorite       boolean     NOT NULL DEFAULT false,
    estimated_minutes integer,
    "order"           integer     NOT NULL DEFAULT 0,
    created_at        timestamptz NOT NULL DEFAULT now(),
    updated_at        timestamptz NOT NULL DEFAULT now(),
    deleted_at        timestamptz           -- soft delete
);

COMMENT ON TABLE  tasks                  IS 'Core work unit with subtask, recurring, and full-text search support';
COMMENT ON COLUMN tasks.parent_id        IS 'Self-referential FK for subtasks; NULL means top-level task';
COMMENT ON COLUMN tasks.status           IS 'backlog | todo | in_progress | completed | archived';
COMMENT ON COLUMN tasks.priority         IS 'urgent | high | medium | low | none';
COMMENT ON COLUMN tasks.recurring_rule   IS 'RRULE-compatible string for recurring tasks';
COMMENT ON COLUMN tasks."order"          IS 'User-defined sort order within a project or workspace';

-- Full-text search vector (auto-maintained via generated column)
ALTER TABLE tasks ADD COLUMN search_vector tsvector
    GENERATED ALWAYS AS (
        to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, ''))
    ) STORED;

-- =============================================================================
-- SUBTASKS
-- =============================================================================
-- Lightweight checklist items within a task. No soft delete — hard delete is
-- sufficient for checklist items.
CREATE TABLE subtasks (
    id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id     uuid        NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    title       text        NOT NULL,
    completed   boolean     NOT NULL DEFAULT false,
    "order"     integer     NOT NULL DEFAULT 0,
    created_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  subtasks           IS 'Checklist items within a task';
COMMENT ON COLUMN subtasks."order"   IS 'Sort order within the checklist';

CREATE INDEX idx_subtasks_task_id ON subtasks(task_id);

-- =============================================================================
-- TAGS
-- =============================================================================
-- User-scoped labels attachable to tasks via the junction table task_tags.
CREATE TABLE tags (
    id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    name        text        NOT NULL,
    color       text        NOT NULL DEFAULT '#6366f1',
    user_id     uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at  timestamptz NOT NULL DEFAULT now(),
    UNIQUE (name, user_id)
);

COMMENT ON TABLE  tags           IS 'User-scoped labels for task categorization';
COMMENT ON COLUMN tags.color      IS 'Hex color for UI badge';

CREATE INDEX idx_tags_user_id ON tags(user_id);

-- =============================================================================
-- TASK TAGS (junction)
-- =============================================================================
-- Many-to-many relationship between tasks and tags.
CREATE TABLE task_tags (
    task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    tag_id  uuid NOT NULL REFERENCES tags(id)  ON DELETE CASCADE,
    PRIMARY KEY (task_id, tag_id)
);

COMMENT ON TABLE task_tags IS 'Junction table: many-to-many tasks ↔ tags';

CREATE INDEX idx_task_tags_tag_id ON task_tags(tag_id);

-- =============================================================================
-- TASK ATTACHMENTS
-- =============================================================================
-- Files linked to a task. File_url typically points to a Supabase Storage
-- bucket or external URL.
CREATE TABLE task_attachments (
    id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id     uuid        NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    file_name   text        NOT NULL,
    file_url    text        NOT NULL,
    file_size   integer,              -- bytes
    file_type   text,                 -- MIME type
    created_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  task_attachments      IS 'File attachments linked to tasks';
COMMENT ON COLUMN task_attachments.file_url  IS 'Supabase Storage signed URL or external link';

CREATE INDEX idx_task_attachments_task_id ON task_attachments(task_id);

-- =============================================================================
-- TASK COMMENTS
-- =============================================================================
-- Discussion threads on tasks. Supports rich text content.
CREATE TABLE task_comments (
    id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id     uuid        NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id     uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content     text        NOT NULL,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE task_comments IS 'User comments/discussion on tasks';

CREATE INDEX idx_task_comments_task_id ON task_comments(task_id);
CREATE INDEX idx_task_comments_user_id ON task_comments(user_id);

-- =============================================================================
-- HABIT CATEGORIES
-- =============================================================================
-- User-defined groups for habits (e.g. "Health", "Learning", "Finance").
CREATE TABLE habit_categories (
    id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    name        text        NOT NULL,
    color       text        NOT NULL DEFAULT '#6366f1',
    icon        text        NOT NULL DEFAULT 'Star',
    user_id     uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at  timestamptz NOT NULL DEFAULT now(),
    UNIQUE (name, user_id)
);

COMMENT ON TABLE  habit_categories       IS 'User-defined groupings for habits';
COMMENT ON COLUMN habit_categories.icon   IS 'Lucide icon name for UI';

CREATE INDEX idx_habit_categories_user_id ON habit_categories(user_id);

-- =============================================================================
-- HABITS
-- =============================================================================
-- Trackable routines with configurable frequency, optional category, and
-- time-based reminders.
CREATE TABLE habits (
    id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    workspace_id    uuid        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name            text        NOT NULL,
    description     text,
    frequency       text        NOT NULL DEFAULT 'daily'
                                CHECK (frequency IN ('daily', 'weekly', 'monthly', 'custom')),
    frequency_times integer     NOT NULL DEFAULT 1,
    category_id     uuid        REFERENCES habit_categories(id) ON DELETE SET NULL,
    color           text        NOT NULL DEFAULT '#6366f1',
    icon            text        NOT NULL DEFAULT 'Target',
    reminder_time   time,                -- time of day for push/email reminder
    reminder_days   integer[],            -- days of week (0=Sun, 6=Sat)
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    deleted_at      timestamptz           -- soft delete
);

COMMENT ON TABLE  habits                  IS 'Trackable routines with frequency and reminders';
COMMENT ON COLUMN habits.frequency        IS 'daily | weekly | monthly | custom';
COMMENT ON COLUMN habits.frequency_times  IS 'Target completions per frequency period';
COMMENT ON COLUMN habits.reminder_time    IS 'Time of day for notifications';
COMMENT ON COLUMN habits.reminder_days    IS 'Array of weekday indices for reminder (0=Sun, 6=Sat)';

CREATE INDEX idx_habits_user_id      ON habits(user_id);
CREATE INDEX idx_habits_workspace_id ON habits(workspace_id);
CREATE INDEX idx_habits_category_id  ON habits(category_id);
-- Partial index: exclude soft-deleted habits from daily queries
CREATE INDEX idx_habits_active       ON habits(id) WHERE deleted_at IS NULL;

-- =============================================================================
-- HABIT LOGS
-- =============================================================================
-- Daily check-in records for habits. One row per habit per date with unique
-- constraint to prevent duplicates.
CREATE TABLE habit_logs (
    id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    habit_id    uuid        NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
    date        date        NOT NULL,
    completed   boolean     NOT NULL DEFAULT true,
    value       numeric,              -- optional numeric tracking (e.g. 30 for "30 min")
    note        text,
    created_at  timestamptz NOT NULL DEFAULT now(),
    UNIQUE (habit_id, date)
);

COMMENT ON TABLE  habit_logs            IS 'Daily check-in records for habits';
COMMENT ON COLUMN habit_logs.completed  IS 'Marked true on check-in, false for skipped entries';
COMMENT ON COLUMN habit_logs.value      IS 'Optional measured value (minutes, count, etc.)';
COMMENT ON COLUMN habit_logs.note       IS 'Optional user note for this log entry';

CREATE INDEX idx_habit_logs_habit_id ON habit_logs(habit_id);
CREATE INDEX idx_habit_logs_date     ON habit_logs(date);

-- =============================================================================
-- CALENDAR EVENTS
-- =============================================================================
-- Events on the user's calendar. Can be standalone or linked to a task/habit
-- for unified timeline display.
CREATE TABLE calendar_events (
    id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title           text        NOT NULL,
    description     text,
    start_date      timestamptz NOT NULL,
    end_date        timestamptz NOT NULL,
    is_all_day      boolean     NOT NULL DEFAULT false,
    color           text        NOT NULL DEFAULT '#6366f1',
    is_recurring    boolean     NOT NULL DEFAULT false,
    recurring_rule  text,               -- rrule string
    task_id         uuid        REFERENCES tasks(id)  ON DELETE SET NULL,
    habit_id        uuid        REFERENCES habits(id) ON DELETE SET NULL,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  calendar_events           IS 'Calendar entries, optionally linked to tasks or habits';
COMMENT ON COLUMN calendar_events.task_id   IS 'Linked task — null if standalone event';
COMMENT ON COLUMN calendar_events.habit_id  IS 'Linked habit — null if standalone event';

CREATE INDEX idx_calendar_events_user_id    ON calendar_events(user_id);
CREATE INDEX idx_calendar_events_start_date ON calendar_events(start_date);
CREATE INDEX idx_calendar_events_task_id    ON calendar_events(task_id);
CREATE INDEX idx_calendar_events_habit_id   ON calendar_events(habit_id);

-- =============================================================================
-- NOTIFICATIONS
-- =============================================================================
-- In-app and (optionally) push/email notifications. The data column stores
-- type-specific payload as JSONB for flexibility.
CREATE TABLE notifications (
    id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type        text        NOT NULL
                            CHECK (type IN ('task_reminder', 'habit_reminder', 'due_date', 'achievement', 'system')),
    title       text        NOT NULL,
    message     text,
    read        boolean     NOT NULL DEFAULT false,
    data        jsonb,               -- flexible payload per notification type
    created_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  notifications            IS 'In-app notifications with type-specific JSONB data';
COMMENT ON COLUMN notifications.type       IS 'task_reminder | habit_reminder | due_date | achievement | system';
COMMENT ON COLUMN notifications.data       IS 'Type-specific payload (e.g. {"task_id": "..."})';

CREATE INDEX idx_notifications_user_id_read ON notifications(user_id, read);
CREATE INDEX idx_notifications_created_at   ON notifications(created_at);

-- =============================================================================
-- ACTIVITY LOGS
-- =============================================================================
-- Append-only audit trail for user actions. Useful for history views,
-- undo support, and analytics.
CREATE TABLE activity_logs (
    id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action      text        NOT NULL,
    entity_type text,                 -- 'task' | 'project' | 'habit' | etc.
    entity_id   uuid,                 -- UUID of the affected entity
    metadata    jsonb,                -- action-specific context
    created_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  activity_logs               IS 'Immutable audit trail of user actions';
COMMENT ON COLUMN activity_logs.action         IS 'Verb describing the action (e.g. task.created, task.completed)';
COMMENT ON COLUMN activity_logs.entity_type    IS 'Target entity type';
COMMENT ON COLUMN activity_logs.entity_id      IS 'Target entity UUID';
COMMENT ON COLUMN activity_logs.metadata       IS 'Contextual data for the action';

CREATE INDEX idx_activity_logs_user_id_created ON activity_logs(user_id, created_at);
CREATE INDEX idx_activity_logs_entity          ON activity_logs(entity_type, entity_id);

-- =============================================================================
-- USER SETTINGS
-- =============================================================================
-- One-to-one with users. Stores preferences for theme, language,
-- notification toggles, and calendar defaults.
CREATE TABLE user_settings (
    id                       uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                  uuid        NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    theme                    text        NOT NULL DEFAULT 'system',
    language                 text        NOT NULL DEFAULT 'en',
    notifications_email      boolean     NOT NULL DEFAULT true,
    notifications_push       boolean     NOT NULL DEFAULT true,
    notifications_reminders  boolean     NOT NULL DEFAULT true,
    timezone                 text        NOT NULL DEFAULT 'UTC',
    week_starts_on           integer     NOT NULL DEFAULT 0,
    created_at               timestamptz NOT NULL DEFAULT now(),
    updated_at               timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  user_settings                   IS 'One-to-one user preferences';
COMMENT ON COLUMN user_settings.theme             IS 'system | light | dark';
COMMENT ON COLUMN user_settings.week_starts_on    IS '0=Sunday, 1=Monday (ISO), etc.';

-- =============================================================================
-- INDEXES (performance)
-- =============================================================================

-- Tasks: project queries, due-date views, subtask lookups, status filters
CREATE INDEX idx_tasks_project_id    ON tasks(project_id);
CREATE INDEX idx_tasks_user_id_status ON tasks(user_id, status);
CREATE INDEX idx_tasks_due_date      ON tasks(due_date);
CREATE INDEX idx_tasks_parent_id     ON tasks(parent_id);
-- Partial index: active tasks only (common query pattern)
CREATE INDEX idx_tasks_active        ON tasks(id) WHERE deleted_at IS NULL;

-- Tasks: full-text search via GIN on auto-maintained tsvector
CREATE INDEX idx_tasks_search ON tasks USING GIN (search_vector);

-- Habits: user-scoped queries
CREATE INDEX idx_habits_user_id_lookup ON habits(user_id) WHERE deleted_at IS NULL;

-- Habit logs: per-habit date-range queries
CREATE INDEX idx_habit_logs_habit_id_date ON habit_logs(habit_id, date);

-- Notifications: unread-first queries
CREATE INDEX idx_notifications_user_read    ON notifications(user_id, read) WHERE NOT read;
CREATE INDEX idx_notifications_user_all     ON notifications(user_id, created_at DESC);

-- Activity logs: time-range queries
CREATE INDEX idx_activity_logs_created_at   ON activity_logs(user_id, created_at DESC);

-- Calendar events: date-range queries
CREATE INDEX idx_calendar_events_range      ON calendar_events(user_id, start_date, end_date);

-- =============================================================================
-- UPDATED_AT TRIGGER
-- =============================================================================
-- Automatically sets updated_at = now() on row modification for any table
-- that has an updated_at column.

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION update_updated_at_column IS 'Trigger function: sets updated_at to current timestamp on row update';

-- Apply trigger to every table that has an updated_at column
CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_workspaces_updated_at
    BEFORE UPDATE ON workspaces
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_task_comments_updated_at
    BEFORE UPDATE ON task_comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_habits_updated_at
    BEFORE UPDATE ON habits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_calendar_events_updated_at
    BEFORE UPDATE ON calendar_events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_user_settings_updated_at
    BEFORE UPDATE ON user_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
