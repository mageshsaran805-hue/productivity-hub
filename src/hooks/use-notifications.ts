"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useUserSettings } from "@/lib/queries";
import { useDueNotifications } from "@/lib/queries";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function useBrowserNotifications() {
  const { user } = useAuth();
  const { data: settings } = useUserSettings();
  const { data: dueTasks } = useDueNotifications();
  const notifiedRef = useRef<Set<string>>(new Set());

  // Register service worker and subscribe for push notifications
  useEffect(() => {
    if (!user?.id) return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js");
        await navigator.serviceWorker.ready;

        const sub = await reg.pushManager.getSubscription();
        if (!sub) {
          const permission = await Notification.requestPermission();
          if (permission !== "granted") return;
          const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
          if (!publicKey) return;
          await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicKey),
          });
        } else {
          // If permission was revoked, clean up
          if (Notification.permission === "denied") {
            await sub.unsubscribe();
            return;
          }
        }
      } catch {
        // Notifications unsupported or blocked — silently ignore
      }
    };
    register();
  }, [user?.id]);

  // Save the subscription to the server once it exists
  useEffect(() => {
    if (!user?.id) return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    if (!settings?.notifications_push) return;

    const sync = async () => {
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (!sub) return;

        const json = sub.toJSON();
        if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return;

        await fetch("/api/push-subscriptions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            endpoint: json.endpoint,
            keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
          }),
        });
      } catch {
        // ignore
      }
    };
    sync();
  }, [user?.id, settings?.notifications_push]);

  // Trigger an immediate push check for due tasks (once per session)
  useEffect(() => {
    if (!user?.id || !settings?.notifications_push) return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    if (sessionStorage.getItem("push_checked")) return;
    sessionStorage.setItem("push_checked", "true");

    fetch("/api/notifications/send-push", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    }).catch(() => {});
  }, [user?.id, settings?.notifications_push]);

  // Fallback: show in-page browser notifications while the site is open
  useEffect(() => {
    if (!user?.id || !settings || !dueTasks?.length) return;

    if (settings.notifications_push && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

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
