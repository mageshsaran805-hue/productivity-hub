import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";
import { AuthProvider } from "@/hooks/use-auth";
import { AuthCallbackHandler } from "@/components/auth/auth-callback-handler";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Productivity Hub - Organize Your Digital Life",
  description: "The all-in-one productivity platform that combines tasks, projects, habits, and calendar into a beautiful, seamless experience.",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#020617",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`h-full antialiased dark ${inter.variable} ${plusJakarta.variable}`}>
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
