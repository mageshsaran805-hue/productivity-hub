"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, Search, LogOut } from "lucide-react";
import { useSidebar } from "@/hooks/use-sidebar";
import { useAuth } from "@/hooks/use-auth";
import { useCommandPaletteContext } from "@/hooks/use-command-palette";
import { useUnreadNotifications } from "@/lib/queries";
import { getInitials } from "@/lib/utils";

const pageNames: Record<string, string> = {
  "/app": "Dashboard",
  "/app/inbox": "Inbox",
  "/app/today": "Today",
  "/app/upcoming": "Upcoming",
  "/app/tasks": "Tasks",
  "/app/projects": "Projects",
  "/app/calendar": "Calendar",
  "/app/habits": "Habits",
  "/app/analytics": "Analytics",
  "/app/notifications": "Notifications",
  "/app/settings": "Settings",
};

export function TopNav() {
  const pathname = usePathname();
  const { toggle } = useSidebar();
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { openPalette } = useCommandPaletteContext();

  const title = pageNames[pathname] || "Dashboard";
  const userInitials = user?.email ? getInitials(user.email) : "?";
  const { data: unread } = useUnreadNotifications();
  const hasUnseen = (unread?.count ?? 0) > 0;

  const handleSignOut = async () => {
    await signOut();
    router.push("/auth/login");
  };

  return (
    <header className="sticky top-0 z-20 h-16 bg-white/40 dark:bg-gray-950/40 backdrop-blur-2xl border-b border-white/20 dark:border-white/10">
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        <div className="flex items-center gap-3">
          <button onClick={toggle} className="md:hidden p-2 rounded-xl hover:bg-foreground/5 transition-colors" aria-label="Open menu">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-foreground">
              <path d="M2.5 5H17.5M2.5 10H17.5M2.5 15H17.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
          <motion.h1 key={title} initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-lg font-semibold">
            {title}
          </motion.h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={openPalette}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-foreground/5 border border-border/50 text-muted-foreground text-xs"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Quick search...</span>
            <kbd className="px-1 py-0.5 text-[10px] rounded bg-foreground/5 border border-border/50 font-mono">⌘K</kbd>
          </button>

          <button
            onClick={openPalette}
            className="md:hidden p-2 rounded-xl hover:bg-foreground/5 transition-colors text-foreground/60 hover:text-foreground"
            aria-label="Search"
          >
            <Search className="w-4 h-4" />
          </button>

          <Link
            href="/app/notifications"
            className="relative p-2 rounded-xl hover:bg-foreground/5 transition-colors text-foreground/60 hover:text-foreground"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {hasUnseen && (
              <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-danger-500 text-white text-[10px] font-semibold flex items-center justify-center">
                {(unread?.count ?? 0) > 9 ? "9+" : unread?.count}
              </span>
            )}
          </Link>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white text-xs font-medium hover:shadow-lg hover:shadow-primary-500/25 transition-all"
            >
              {userInitials}
            </button>
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 py-1 bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl border border-white/20 dark:border-white/10 rounded-2xl shadow-xl overflow-hidden z-50">
                <div className="px-4 py-2 border-b border-border/50">
                  <p className="text-sm font-medium truncate">{user?.email}</p>
                </div>
                <button onClick={handleSignOut} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-foreground/70 hover:text-foreground hover:bg-foreground/5 transition-colors">
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
