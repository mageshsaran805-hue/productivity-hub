"use client";

import { useEffect } from "react";
import { useCheckNotifications, useUserSettings } from "@/lib/queries";
import { useAuth } from "@/hooks/use-auth";

/**
 * Client-side notification scheduler. While the app is open it polls the
 * server for notifications that have become due (task lead-time reminders,
 * habit reminders at their scheduled time) so they surface in near-real-time
 * instead of waiting for the once-a-day cron.
 */
export function useNotificationScheduler(intervalMs = 60_000) {
  const { user } = useAuth();
  const { data: settings } = useUserSettings();
  const check = useCheckNotifications();

  useEffect(() => {
    if (!user?.id) return;
    if (!settings?.notifications_reminders && !settings?.notifications_push) return;

    let cancelled = false;

    const run = async () => {
      if (cancelled) return;
      try {
        const res = await check.mutateAsync();
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

    // Run immediately, then on an interval.
    run();
    const id = setInterval(run, intervalMs);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, settings?.notifications_reminders, settings?.notifications_push]);
}