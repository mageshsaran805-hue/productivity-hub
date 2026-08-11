"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useUserSettings } from "@/lib/queries";
import { useDueNotifications } from "@/lib/queries";

export function useBrowserNotifications() {
  const { user } = useAuth();
  const { data: settings } = useUserSettings();
  const { data: dueTasks } = useDueNotifications();
  const notifiedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user?.id || !settings || !dueTasks?.length) return;

    // Request permission once
    if (settings.notifications_push && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    // Show browser notifications for unseen tasks
    if (settings.notifications_push && "Notification" in window && Notification.permission === "granted") {
      for (const task of dueTasks) {
        if (notifiedRef.current.has(task.id)) continue;
        notifiedRef.current.add(task.id);
        new Notification("Task Due Soon", {
          body: `${task.title} — due ${new Date(task.due_date!).toLocaleDateString()}`,
        });
      }
    }
  }, [user?.id, settings, dueTasks]);

  // Trigger email notification once per session
  useEffect(() => {
    if (!settings?.notifications_email || !dueTasks?.length || !user?.id) return;
    // Use a session flag to avoid spamming
    const sent = sessionStorage.getItem("email_notified");
    if (sent) return;
    sessionStorage.setItem("email_notified", "true");

    fetch("/api/notifications/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskIds: dueTasks.map((t) => t.id) }),
    }).catch(() => {});
    // ponytail: one-shot email per session, no dedup tracking in DB yet
  }, [settings?.notifications_email, dueTasks, user?.id]);
}
