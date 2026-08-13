"use client";
import { createContext, useContext, type ReactNode } from "react";
import { useSession, signIn, signOut } from "@/lib/auth-client";

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
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

type AuthContextType = AuthState & AuthActions;

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithGoogle: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, isPending } = useSession();

  const signInWithGoogleAction = async () => {
    await signIn.social({ provider: "google", callbackURL: "/app" });
  };

  const signOutAction = async () => {
    await signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        user: session?.user ?? null,
        loading: isPending,
        signInWithGoogle: signInWithGoogleAction,
        signOut: signOutAction,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
