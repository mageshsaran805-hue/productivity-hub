import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";
import { AuthProvider } from "@/hooks/use-auth";
import { AuthCallbackHandler } from "@/components/auth/auth-callback-handler";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Productivity Hub - Organize Your Digital Life",
  description: "The all-in-one productivity platform that combines tasks, projects, habits, and calendar into a beautiful, seamless experience.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`h-full antialiased dark ${inter.variable}`}>
      <body className="min-h-full flex flex-col font-sans">
        <AuthProvider>
          {children}
          <AuthCallbackHandler />
          <ToastProvider />
        </AuthProvider>
      </body>
    </html>
  );
}
