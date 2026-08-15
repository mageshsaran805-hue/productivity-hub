"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/hooks/use-sidebar";
import { Sun, CheckSquare, LayoutDashboard, Calendar, Target, MoreHorizontal } from "lucide-react";

const items = [
  { id: "today", label: "Today", icon: Sun, href: "/app/today" },
  { id: "tasks", label: "Tasks", icon: CheckSquare, href: "/app/tasks" },
  { id: "dashboard", label: "Home", icon: LayoutDashboard, href: "/app" },
  { id: "calendar", label: "Calendar", icon: Calendar, href: "/app/calendar" },
  { id: "habits", label: "Habits", icon: Target, href: "/app/habits" },
];

export function MobileNav() {
  const pathname = usePathname();
  const { open } = useSidebar();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden">
      <div className="glass-elevated border-t border-white/20 dark:border-white/10" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="flex items-center justify-around h-16 px-2">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.id}
                href={item.href}
                className="relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors active:scale-95"
                aria-label={item.label}
              >
                {isActive && (
                  <motion.div
                    layoutId="mobileNavActive"
                    className="absolute inset-x-0 top-0 bottom-0 rounded-xl bg-primary-500/10 border border-primary-500/15"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                <div className={cn("relative p-1.5 rounded-lg transition-colors", isActive && "text-primary-500")}>
                  <Icon className="w-4 h-4" />
                </div>
                <span
                  className={cn(
                    "relative text-[10px] font-medium transition-colors",
                    isActive ? "text-primary-500" : "text-foreground/60",
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}

          {/* Open the full menu drawer */}
          <button
            onClick={open}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-foreground/60 hover:text-foreground active:scale-95 transition-all"
            aria-label="More"
          >
            <div className="p-1.5 rounded-lg">
              <MoreHorizontal className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>
      </div>
    </nav>
  );
}