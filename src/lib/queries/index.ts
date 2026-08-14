"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import type { Task, Project, Habit, HabitLog, CalendarEvent, UserSettings, AppNotification } from "@/types";

// ─── API helper ───────────────────────────────────────────────────────────
// All data access goes through server-side, session-authenticated routes.
// The server binds user_id from the better-auth session cookie; the client
// never sends or trusts a user_id.

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body.error) message = body.error;
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }
  return (await res.json()) as T;
}

const get = <T>(path: string) => api<T>(path);
const post = <T>(path: string, body: unknown) =>
  api<T>(path, { method: "POST", body: JSON.stringify(body) });
const patch = <T>(path: string, body: unknown) =>
  api<T>(path, { method: "PATCH", body: JSON.stringify(body) });
const del = <T>(path: string) => api<T>(path, { method: "DELETE" });

// ─── TASKS ───────────────────────────────────────────────────────────────

export function useTasks(projectId?: string) {
  return useQuery({
    queryKey: ["tasks", projectId ?? "all"],
    staleTime: 30_000,
    queryFn: () => get<Task[]>(`/api/tasks${projectId ? `?project_id=${encodeURIComponent(projectId)}` : ""}`),
  });
}

export function useTaskSearch(query: string) {
  return useQuery({
    queryKey: ["tasks", "search", query],
    enabled: query.length > 0,
    queryFn: () => get<Task[]>(`/api/tasks?search=${encodeURIComponent(query)}`),
  });
}

export function useUncategorizedTasks() {
  return useQuery({
    queryKey: ["tasks", "uncategorized"],
    staleTime: 30_000,
    queryFn: () => get<Task[]>("/api/tasks?uncategorized=true"),
  });
}

export function useTask(id: string) {
  return useQuery({
    queryKey: ["task", id],
    enabled: !!id,
    queryFn: () => get<Task>(`/api/tasks/${encodeURIComponent(id)}`),
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (task: Partial<Task>) => post<Task>("/api/tasks", task),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["tasks_due"] });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...updates }: Partial<Task> & { id: string }) =>
      patch<Task>(`/api/tasks/${encodeURIComponent(id)}`, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["tasks_due"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard_stats"] });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => del<{ success: boolean }>(`/api/tasks/${encodeURIComponent(id)}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["tasks_due"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard_stats"] });
    },
  });
}

export function useCompleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      patch<Task>(`/api/tasks/${encodeURIComponent(id)}`, {
        status: "completed",
        completed_at: new Date().toISOString(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["tasks_due"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard_stats"] });
    },
  });
}

// ─── PROJECTS ────────────────────────────────────────────────────────────

export function useProjects() {
  return useQuery({
    queryKey: ["projects"],
    staleTime: 30_000,
    queryFn: () => get<Project[]>("/api/projects"),
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => del<{ success: boolean }>(`/api/projects/${encodeURIComponent(id)}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["projects_due"] });
    },
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (project: Partial<Project>) => post<Project>("/api/projects", project),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["projects_due"] });
    },
  });
}

export function useProjectsDueInRange(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ["projects_due", startDate, endDate],
    staleTime: 30_000,
    queryFn: () =>
      get<Project[]>(
        `/api/projects?due_start=${encodeURIComponent(startDate)}&due_end=${encodeURIComponent(endDate)}`
      ),
  });
}

// ─── HABITS ──────────────────────────────────────────────────────────────

export function useHabits() {
  const today = useMemo(() => new Date().toISOString().split("T")[0], []);
  return useQuery({
    queryKey: ["habits", today],
    staleTime: 30_000,
    queryFn: () => get<Habit[]>(`/api/habits?today=${encodeURIComponent(today)}`),
  });
}

export function useHabitLogs(habitId: string, startDate: string, endDate: string) {
  return useQuery({
    queryKey: ["habit_logs", habitId, startDate, endDate],
    enabled: !!habitId,
    queryFn: () =>
      get<HabitLog[]>(
        `/api/habit-logs?habit_id=${encodeURIComponent(habitId)}&start=${encodeURIComponent(startDate)}&end=${encodeURIComponent(endDate)}`
      ),
  });
}

export function useCreateHabit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (habit: Partial<Habit>) => post<Habit>("/api/habits", habit),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
    },
  });
}

export function useLogHabit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (log: { habit_id: string; date: string; completed: boolean }) =>
      post<HabitLog>("/api/habit-logs", log),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habit_logs"] });
      queryClient.invalidateQueries({ queryKey: ["habits"] });
    },
  });
}

export function useDeleteHabit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => del<{ success: boolean }>(`/api/habits/${encodeURIComponent(id)}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
    },
  });
}

// ─── CALENDAR ────────────────────────────────────────────────────────────

export function useCalendarEvents(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ["calendar_events", startDate, endDate],
    staleTime: 30_000,
    queryFn: () =>
      get<CalendarEvent[]>(
        `/api/calendar-events?start=${encodeURIComponent(startDate)}&end=${encodeURIComponent(endDate)}`
      ),
  });
}

export function useCreateCalendarEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (event: {
      title: string;
      description?: string | null;
      start_date: string;
      end_date: string;
      is_all_day?: boolean;
      color?: string;
    }) => post<CalendarEvent>("/api/calendar-events", event),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar_events"] });
    },
  });
}

export function useUpdateCalendarEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (updates: {
      id: string;
      title?: string;
      description?: string | null;
      start_date?: string;
      end_date?: string;
      is_all_day?: boolean;
      color?: string;
    }) => patch<CalendarEvent>(`/api/calendar-events/${encodeURIComponent(updates.id)}`, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar_events"] });
    },
  });
}

export function useDeleteCalendarEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => del<{ success: boolean }>(`/api/calendar-events/${encodeURIComponent(id)}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar_events"] });
    },
  });
}

export function useTasksDueInRange(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ["tasks_due", startDate, endDate],
    staleTime: 30_000,
    queryFn: () =>
      get<Task[]>(
        `/api/tasks?due_start=${encodeURIComponent(startDate)}&due_end=${encodeURIComponent(endDate)}`
      ),
  });
}

export function useDueNotifications() {
  return useQuery({
    queryKey: ["tasks", "due_notifications"],
    staleTime: 30_000,
    queryFn: () => get<Task[]>("/api/tasks?due_next_24h=true"),
  });
}

export function useNotifications() {
  return useQuery({
    queryKey: ["notifications"],
    staleTime: 30_000,
    queryFn: () => get<AppNotification[]>("/api/notifications?limit=100"),
  });
}

export function useUnreadNotifications() {
  return useQuery({
    queryKey: ["notifications", "unread_count"],
    staleTime: 30_000,
    queryFn: () => get<{ count: number }>("/api/notifications/unread-count"),
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => post<{ updated: number }>("/api/notifications/read", { id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications", "unread_count"] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => post<{ updated: number }>("/api/notifications/read", { all: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications", "unread_count"] });
    },
  });
}

export function useTestNotification() {
  return useMutation({
    mutationFn: () => post<{ sent: number; subscribed: number }>("/api/notifications/test", {}),
  });
}

export function useCheckNotifications() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => post<{ created: AppNotification[] }>("/api/notifications/check", {}),
    onSuccess: (data) => {
      if (data.created.length > 0) {
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
        queryClient.invalidateQueries({ queryKey: ["notifications", "unread_count"] });
      }
    },
  });
}

// ─── USER SETTINGS ──────────────────────────────────────────────────────

export function useUserSettings() {
  return useQuery({
    queryKey: ["user_settings"],
    staleTime: 30_000,
    queryFn: () => get<UserSettings | null>("/api/user-settings"),
  });
}

export function useUpdateUserSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (settings: {
      notifications_email: boolean;
      notifications_push: boolean;
      notifications_reminders: boolean;
    }) => patch<UserSettings>("/api/user-settings", settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_settings"] });
    },
  });
}

// ─── ANALYTICS ───────────────────────────────────────────────────────────

export interface AnalyticsData {
  weeklyData: { day: string; tasks: number; habits: number }[];
  monthlyData: { month: string; tasks: number; habits: number }[];
  totalTasks: number;
  completedTasks: number;
  totalHabits: number;
  completionRate: number;
}

export function useAnalyticsData() {
  return useQuery({
    queryKey: ["analytics"],
    staleTime: 60_000,
    queryFn: () => get<AnalyticsData>("/api/analytics"),
  });
}

// ─── DASHBOARD ───────────────────────────────────────────────────────────

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard_stats"],
    staleTime: 30_000,
    queryFn: () =>
      get<{
        tasksToday: number;
        totalTasks: number;
        habitsDone: number;
        totalHabits: number;
        today: string;
      }>("/api/dashboard"),
  });
}
