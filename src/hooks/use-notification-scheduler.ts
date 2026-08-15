"use client";

import { useEffect, useRef } from "react";
import { useCheckNotifications, useUserSettings } from "@/lib/queries";
import { useAuth } from "@/hooks/use-auth";

/**
 * Client-side notification scheduler. While the app is open it polls the
 * server for notifications that have become due (task lead-time reminders,
 * habit reminders at their scheduled time) so they surface in near-real-time
 * instead of waiting for the once-a-day cron.
 *
 * Performance notes:
 * - The first check is deferred until the tab has been visible for a short
 *   settle window, so an immediate fetch never competes with initial page
 *   render / data loading.
 * - The interval is paused while the document is hidden and resumes when the
 *   user returns, avoiding background polling traffic.
 */
export function useNotificationScheduler(intervalMs = 60_000) {
  const { user } = useAuth();
  const { data: settings } = useUserSettings();
  const check = useCheckNotifications();
  const checkRef = useRef(check);

  useEffect(() => {
    checkRef.current = check;
  }, [check]);

  useEffect(() => {
    if (!user?.id) return;
    if (!settings?.notifications_reminders && !settings?.notifications_push) return;

    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const run = async () => {
      if (cancelled) return;
      if (document.visibilityState === "hidden") return;
      try {
        const res = await checkRef.current.mutateAsync();
        for (const n of res.created) {
          if (!("Notification" in window)) continue;
          if (Notification.permission === "granted") {
            new Notification(n.title, { body: n.message ?? "" });
          }
        }
      } catch {
        // ignore transient failures; next tick retries
      }
    };

    // Defer the first check until the tab has been settled for a moment.
    const startTimer = window.setTimeout(() => {
      if (cancelled) return;
      run();
      intervalId = setInterval(run, intervalMs);
    }, 2_000);

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
      window.clearTimeout(startTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, settings?.notifications_reminders, settings?.notifications_push]);
}