"use client";

import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { initializeUser } from "@/lib/db-helpers";

export function AuthCallbackHandler() {
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      initializeUser(
        user.id,
        user.email || "",
        user.name || user.email?.split("@")[0] || "User"
      ).then((workspace) => {
        if (workspace) {
          console.log("User initialized with workspace:", workspace.id);
        }
      });
    }
  }, [user]);

  return null;
}
