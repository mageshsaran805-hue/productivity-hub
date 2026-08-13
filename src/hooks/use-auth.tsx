"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useSession, signIn, signUp, signOut, authClient } from "@/lib/auth-client";
interface AuthUser {
  id: string;
  email: string;
  name: string;
  image?: string | null;
  emailVerified: boolean;
}

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
}

interface AuthActions {
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
}

type AuthContextType = AuthState & AuthActions;

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => ({ error: "not initialized" }),
  signUp: async () => ({ error: "not initialized" }),
  signInWithGoogle: async () => {},
  signOut: async () => {},
  resetPassword: async () => ({ error: "not initialized" }),
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, isPending } = useSession();

  const signInAction = async (email: string, password: string) => {
    const { error } = await signIn.email({ email, password });
    return { error: error?.message ?? null };
  };

  const signUpAction = async (email: string, password: string, name: string) => {
    const { error } = await signUp.email({ email, password, name });
    return { error: error?.message ?? null };
  };

  const signInWithGoogleAction = async () => {
    await signIn.social({ provider: "google", callbackURL: "/app" });
  };

  const signOutAction = async () => {
    await signOut();
  };

  const resetPasswordAction = async (email: string) => {
    const { error } = await authClient.requestPasswordReset({ email, redirectTo: "/auth/reset-password" });
    return { error: error?.message ?? null };
  };

  return (
    <AuthContext.Provider
      value={{
        user: session?.user ?? null,
        loading: isPending,
        signIn: signInAction,
        signUp: signUpAction,
        signInWithGoogle: signInWithGoogleAction,
        signOut: signOutAction,
        resetPassword: resetPasswordAction,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
