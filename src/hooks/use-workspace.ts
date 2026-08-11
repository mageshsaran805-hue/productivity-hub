"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./use-auth";
import type { Workspace } from "@/types";

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
      // ignore
    }
    throw new Error(message);
  }
  return (await res.json()) as T;
}

export function useDefaultWorkspace() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["default_workspace", user?.id],
    enabled: !!user?.id,
    staleTime: 30_000,
    queryFn: async (): Promise<Workspace | null> => {
      const workspaces = await api<Workspace[]>("/api/workspaces");
      if (workspaces.length > 0) return workspaces[0];

      // No workspace yet — create the default one server-side.
      return api<Workspace>("/api/workspaces", {
        method: "POST",
        body: JSON.stringify({ name: "Personal", color: "#6366f1" }),
      });
    },
  });
}
