"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, ShieldX, BellOff } from "lucide-react";

type Permission = "granted" | "denied" | "default" | "unsupported";

/** Shows the browser's notification permission state with a re-enable hint. */
export function NotificationPermissionStatus() {
  const [permission, setPermission] = useState<Permission>(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
    return Notification.permission as Permission;
  });

  useEffect(() => {
    if (!("Notification" in window)) return;
    const update = () => setPermission(Notification.permission as Permission);
    update();
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);

  if (permission === "unsupported") {
    return (
      <div className="flex items-center gap-3 text-sm text-foreground/60">
        <BellOff className="w-4 h-4 text-foreground/40" />
        <span>This browser doesn&apos;t support push notifications.</span>
      </div>
    );
  }

  if (permission === "granted") {
    return (
      <div className="flex items-center gap-3 text-sm text-success-500">
        <ShieldCheck className="w-4 h-4" />
        <span>Push notifications are enabled in your browser.</span>
      </div>
    );
  }

  if (permission === "denied") {
    return (
      <div className="flex items-center gap-3 text-sm text-danger-500">
        <ShieldX className="w-4 h-4 shrink-0" />
        <span>
          Push is blocked in your browser. Re-enable it in your browser settings (the lock/notifications icon
          in the address bar) to receive reminders.
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 text-sm text-muted-foreground">
      <BellOff className="w-4 h-4 text-foreground/40" />
      <span>Push permission hasn&apos;t been requested yet — it will be prompted when you enable push below.</span>
    </div>
  );
}