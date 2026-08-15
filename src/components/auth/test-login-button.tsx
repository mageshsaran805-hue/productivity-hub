"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { FlaskConical, Loader2 } from "lucide-react";

const TEST_EMAIL = "test@productivityhub.app";
const TEST_PASSWORD = "testpass123";

/**
 * Dev-only convenience login. Creates the test account on first use
 * (auto signs in), then signs straight in on subsequent clicks.
 */
export function TestLoginButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Try signing in first in case the account already exists.
      const signInRes = await authClient.signIn.email({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        callbackURL: "/app",
      });
      if (signInRes.error) {
        // Account doesn't exist yet — create it (auto signs in).
        const signUpRes = await authClient.signUp.email({
          name: "Test User",
          email: TEST_EMAIL,
          password: TEST_PASSWORD,
          callbackURL: "/app",
        });
        if (signUpRes.error) {
          setError(signUpRes.error.message || "Test login failed");
          return;
        }
      }
      router.push("/app");
      router.refresh();
    } catch {
      setError("Something went wrong. Check the server logs.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={isLoading}
        className="w-full h-11 px-4 rounded-2xl bg-gradient-to-r from-primary-500 to-secondary-500 text-white text-sm font-medium shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 transition-all duration-200 flex items-center justify-center gap-2.5 disabled:opacity-60"
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <FlaskConical className="w-4 h-4" />
        )}
        Test Login
      </button>
      {error && <p className="text-xs text-danger-500">{error}</p>}
    </div>
  );
}