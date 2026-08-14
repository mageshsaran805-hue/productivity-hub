"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Sun, CheckSquare, LayoutDashboard, Calendar, Target } from "lucide-react";

const items = [
  { id: "today", label: "Today", icon: Sun, href: "/app/today" },
  { id: "tasks", label: "Tasks", icon: CheckSquare, href: "/app/tasks" },
  { id: "dashboard", label: "Home", icon: LayoutDashboard, href: "/app" },
  { id: "calendar", label: "Calendar", icon: Calendar, href: "/app/calendar" },
  { id: "habits", label: "Habits", icon: Target, href: "/app/habits" },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden">
      <div className="bg-white/80 dark:bg-gray-950/80 backdrop-blur-2xl border-t border-white/20 dark:border-white/10" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="flex items-center justify-around h-16 px-2">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all",
                  isActive ? "text-primary-500" : "text-foreground/60 hover:text-foreground/80"
                )}
              >
                <div className={cn(
                  "p-1.5 rounded-lg transition-colors",
                  isActive && "bg-primary-500/10"
                )}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
