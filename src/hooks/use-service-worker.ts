"use client";

import { useEffect } from "react";

/**
 * Registers the service worker so the app works as an installable PWA with
 * offline support. Separate from push notification logic so the SW is always
 * installed even when the user hasn't granted notification permission.
 */
export function useServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV === "development") return;

    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });
        if (reg.waiting) reg.update();
      } catch {
        // SW registration failed (e.g. unsupported browser) — app still works online
      }
    };
    register();
  }, []);
}