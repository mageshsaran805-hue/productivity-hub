"use client";

import { AuthLayout } from "@/components/auth/auth-layout";
import { GoogleButton } from "@/components/auth/google-button";
import { Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push("/app");
    }
  }, [user, loading, router]);

  if (loading) return null;
  if (user) return null;

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in with your Google account to continue">
      <div className="space-y-4">
        <GoogleButton text="Continue with Google" />

        <div className="flex items-center gap-2 rounded-2xl bg-primary-500/5 border border-primary-500/20 px-4 py-3">
          <Sparkles className="w-4 h-4 text-primary-500 shrink-0" />
          <p className="text-xs text-foreground/60">
            Only verified Google accounts can sign in.
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}