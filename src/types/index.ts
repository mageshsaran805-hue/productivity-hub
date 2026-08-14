export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Workspace {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  color?: string;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  workspace_id: string;
  user_id: string;
  name: string;
  description?: string;
  color: string;
  status: "active" | "completed" | "archived";
  due_date?: string;
  progress: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface Task {
  id: string;
  workspace_id: string;
  user_id: string;
  project_id?: string;
  parent_id?: string;
  title: string;
  description?: string;
  status: "backlog" | "todo" | "in_progress" | "completed" | "archived";
  priority: "urgent" | "high" | "medium" | "low" | "none";
  due_date?: string;
  start_date?: string;
  remind_before_minutes?: number | null;
  completed_at?: string;
  is_recurring: boolean;
  recurring_rule?: string;
  is_favorite: boolean;
  estimated_minutes?: number;
  order: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface SubTask {
  id: string;
  task_id: string;
  title: string;
  completed: boolean;
  order: number;
  created_at: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  created_at: string;
  task_count?: number;
}

export interface TaskTag {
  task_id: string;
  tag_id: string;
}

export interface TaskAttachment {
  id: string;
  task_id: string;
  file_name: string;
  file_url: string;
  file_size: number;
  file_type: string;
  created_at: string;
}

export interface TaskComment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  email?: string;
  name?: string;
}

export interface HabitCategory {
  id: string;
  name: string;
  color: string;
  icon: string;
  user_id: string;
  created_at: string;
}

export interface Habit {
  id: string;
  user_id: string;
  workspace_id: string;
  name: string;
  description?: string;
  frequency: "daily" | "weekly" | "monthly" | "custom";
  frequency_times: number;
  category_id?: string;
  color: string;
  icon: string;
  reminder_time?: string;
  reminder_days?: number[];
  current_streak?: number;
  best_streak?: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface HabitLog {
  id: string;
  habit_id: string;
  date: string;
  completed: boolean;
  value?: number;
  note?: string;
  created_at: string;
}

export interface CalendarEvent {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  is_all_day: boolean;
  color: string;
  is_recurring: boolean;
  recurring_rule?: string;
  task_id?: string;
  habit_id?: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: "task_reminder" | "habit_reminder" | "due_date" | "achievement" | "system";
  title: string;
  message?: string | null;
  read: boolean;
  data?: Record<string, unknown> | null;
  created_at: string;
}

export type AppNotification = Notification;

export interface UserSettings {
  id: string;
  user_id: string;
  theme: string;
  language: string;
  notifications_email: boolean;
  notifications_push: boolean;
  notifications_reminders: boolean;
  timezone: string;
  week_starts_on: number;
  created_at: string;
  updated_at: string;
}

export type ViewType = "list" | "board" | "kanban" | "calendar" | "timeline";
export type CalendarView = "month" | "week" | "day" | "agenda";
