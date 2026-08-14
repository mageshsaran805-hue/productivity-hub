"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { initializeUser } from "@/lib/db-helpers";

export function AuthCallbackHandler() {
  const { user } = useAuth();
  const initialized = useRef(false);

  useEffect(() => {
    if (!user || initialized.current) return;
    if (sessionStorage.getItem("user_initialized")) return;
    initialized.current = true;
    sessionStorage.setItem("user_initialized", "1");

    initializeUser(
      user.id,
      user.email || "",
      user.name || user.email?.split("@")[0] || "User"
    ).catch(() => {
      // ignore — the initialize endpoint is idempotent and will run again next session
    });
  }, [user]);

  return null;
}
