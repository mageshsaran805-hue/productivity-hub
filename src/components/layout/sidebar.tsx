"use client";

import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/hooks/use-sidebar";
import { useCommandPaletteContext } from "@/hooks/use-command-palette";
import {
  LayoutDashboard, Inbox, Sun, CalendarClock, CheckSquare, FolderKanban,
  Calendar, Target, BarChart3, Bell, Settings, ChevronLeft, ChevronRight,
  Sparkles, Search, Plus, X
} from "lucide-react";

const navItems = [
  { section: "Menu", items: [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/app" },
    { id: "inbox", label: "Inbox", icon: Inbox, href: "/app/inbox" },
    { id: "today", label: "Today", icon: Sun, href: "/app/today" },
    { id: "upcoming", label: "Upcoming", icon: CalendarClock, href: "/app/upcoming" },
  ]},
  { section: "Workspace", items: [
    { id: "tasks", label: "Tasks", icon: CheckSquare, href: "/app/tasks" },
    { id: "projects", label: "Projects", icon: FolderKanban, href: "/app/projects" },
    { id: "calendar", label: "Calendar", icon: Calendar, href: "/app/calendar" },
    { id: "habits", label: "Habits", icon: Target, href: "/app/habits" },
    { id: "analytics", label: "Analytics", icon: BarChart3, href: "/app/analytics" },
  ]},
  { section: "Account", items: [
    { id: "notifications", label: "Notifications", icon: Bell, href: "/app/notifications" },
    { id: "settings", label: "Settings", icon: Settings, href: "/app/settings" },
  ]},
];

/** Shared sidebar content (logo, search, nav, quick add) used by both the
 *  desktop sidebar and the mobile drawer. */
function SidebarContent({ onNavigate, collapsed }: { onNavigate?: () => void; collapsed?: boolean }) {
  const pathname = usePathname();
  const { isCollapsed: ctxCollapsed } = useSidebar();
  const isCollapsed = collapsed ?? ctxCollapsed;
  const { openPalette, openNewTask } = useCommandPaletteContext();

  return (
    <>
      {/* Logo */}
      <div className={cn("flex items-center h-16 px-4 border-b border-border/50", isCollapsed && "justify-center")}>
        <Link href="/app" onClick={onNavigate} className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <AnimatePresence>
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="font-bold text-sm whitespace-nowrap overflow-hidden"
              >
                Productivity Hub
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
      </div>

      {/* Search */}
      <div className={cn("p-3", isCollapsed && "p-2")}>
        <button
          onClick={() => { openPalette(); onNavigate?.(); }}
          className={cn(
          "flex items-center gap-2 w-full px-3 py-2 rounded-xl bg-foreground/5 hover:bg-foreground/10 border border-border/50 text-muted-foreground text-sm transition-all",
          isCollapsed && "justify-center px-2"
        )}>
          <Search className="w-4 h-4 shrink-0" />
          <AnimatePresence>
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 text-left"
              >
                Search...
              </motion.span>
            )}
          </AnimatePresence>
          {!isCollapsed && (
            <kbd className="hidden md:inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] rounded-md bg-foreground/5 border border-border/50 font-mono">
              ⌘K
            </kbd>
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 pb-4 scrollbar-thin">
        {navItems.map((section) => (
          <div key={section.section} className="mb-4">
            <AnimatePresence>
              {!isCollapsed && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  {section.section}
                </motion.p>
              )}
            </AnimatePresence>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link key={item.id} href={item.href} onClick={onNavigate}>
                    <motion.div
                      whileHover={{ x: 2 }}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all duration-200",
                        isCollapsed && "justify-center px-2",
                        isActive
                          ? "bg-gradient-to-r from-primary-500/10 to-secondary-500/10 text-primary-500 font-medium"
                          : "text-foreground/60 hover:text-foreground hover:bg-foreground/5"
                      )}
                    >
                      <div className="relative">
                        <Icon className="w-4 h-4 shrink-0" />
                        {isActive && (
                          <motion.div
                            layoutId="activeIndicator"
                            className="absolute -left-3 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-primary-500 rounded-full"
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                          />
                        )}
                      </div>
                      <AnimatePresence>
                        {!isCollapsed && (
                          <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                          >
                            {item.label}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Quick Add */}
      <div className={cn("p-3 border-t border-border/50", isCollapsed && "p-2")}>
        <button
          onClick={() => { openNewTask(); onNavigate?.(); }}
          className={cn(
          "flex items-center gap-2 w-full px-3 py-2.5 rounded-xl bg-gradient-to-r from-primary-500 to-secondary-500 text-white text-sm font-medium hover:shadow-lg hover:shadow-primary-500/25 transition-all",
          isCollapsed && "justify-center px-2"
        )}>
          <Plus className="w-4 h-4 shrink-0" />
          <AnimatePresence>
            {!isCollapsed && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>Quick Add</motion.span>}
          </AnimatePresence>
        </button>
      </div>
    </>
  );
}

/** Desktop sidebar — always visible on md+ screens, supports collapse. */
export function Sidebar() {
  const { isCollapsed, toggleCollapse } = useSidebar();

  return (
    <motion.aside
      animate={{ width: isCollapsed ? 72 : 260 }}
      transition={{ type: "spring", stiffness: 200, damping: 25 }}
      className="hidden md:flex relative h-dvh flex-col bg-white/60 dark:bg-gray-950/60 backdrop-blur-2xl border-r border-white/20 dark:border-white/10 z-30"
    >
      <SidebarContent />

      {/* Collapse toggle */}
      <button
        onClick={toggleCollapse}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-background border border-border shadow-md flex items-center justify-center hover:bg-foreground/5 transition-colors z-10"
      >
        {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </motion.aside>
  );
}

/** Mobile drawer sidebar — slides in from the left on small screens. */
export function MobileSidebar() {
  const { isOpen, close } = useSidebar();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={close}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          />
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-y-0 left-0 z-50 flex flex-col w-[280px] max-w-[85vw] bg-white/90 dark:bg-gray-950/90 backdrop-blur-2xl border-r border-white/20 dark:border-white/10 shadow-2xl md:hidden"
          >
            <button
              onClick={close}
              className="absolute top-4 right-3 p-1.5 rounded-lg text-foreground/50 hover:text-foreground hover:bg-foreground/5 transition-colors"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
            <SidebarContent onNavigate={close} collapsed={false} />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}