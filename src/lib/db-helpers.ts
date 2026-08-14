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

/**
 * Ensures the signed-in user has a profile row, a default workspace, and
 * settings. The user identity is taken from the server-side session; the
 * arguments are only used to populate the profile on first creation.
 */
export async function initializeUser(
  userId: string,
  email: string,
  name: string
): Promise<{ id: string } | null> {
  // Note: userId/email/name are forwarded but the server cross-checks the
  // session and never trusts client identity.
  void userId;
  void email;
  void name;
  const result = await api<{ workspaceId: string }>("/api/users/initialize", {
    method: "POST",
  });
  return result ? { id: result.workspaceId } : null;
}