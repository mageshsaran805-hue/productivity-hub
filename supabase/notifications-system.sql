-- =============================================================================
-- Notification system upgrade
-- =============================================================================
-- 1. Per-task reminder lead time (remind before due).
-- 2. Dedup key on notifications so repeated scans never double-insert.

-- Tasks: how many minutes before due_date to fire a reminder (NULL = none).
ALTER TABLE IF EXISTS public.tasks
    ADD COLUMN IF NOT EXISTS remind_before_minutes integer;

COMMENT ON COLUMN public.tasks.remind_before_minutes
    IS 'Minutes before due_date to send a reminder. NULL disables the reminder.';

-- Notifications: stable dedup key (e.g. task:<id>, habit:<id>:<yyyy-mm-dd>).
ALTER TABLE IF EXISTS public.notifications
    ADD COLUMN IF NOT EXISTS dedup_key text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_notifications_dedup_key
    ON public.notifications(user_id, dedup_key)
    WHERE dedup_key IS NOT NULL;

COMMENT ON COLUMN public.notifications.dedup_key
    IS 'Deduplication key to prevent duplicate notifications for the same event.';