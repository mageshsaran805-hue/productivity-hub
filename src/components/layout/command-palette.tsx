"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Search, LayoutDashboard, Inbox, Sun, CalendarClock, CheckSquare,
  FolderKanban, Calendar, Target, BarChart3, Bell, Settings, Activity,
  ArrowRight, Plus, BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  href?: string;
  action?: () => void;
  category: string;
}

interface CommandPaletteProps {
  open?: boolean;
  onClose?: () => void;
  onToggle?: () => void;
  onNewTask?: () => void;
}

export function CommandPalette({ open, onClose, onToggle, onNewTask }: CommandPaletteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const show = open !== undefined ? open : isOpen;
  const close = onClose || (() => setIsOpen(false));
  const toggle = onToggle || (() => setIsOpen((prev) => !prev));

  const items: CommandItem[] = [
    { id: "dashboard", label: "Go to Dashboard", icon: <LayoutDashboard className="w-4 h-4" />, href: "/app", category: "Navigation" },
    { id: "inbox", label: "Go to Inbox", icon: <Inbox className="w-4 h-4" />, href: "/app/inbox", category: "Navigation" },
    { id: "today", label: "Go to Today", icon: <Sun className="w-4 h-4" />, href: "/app/today", category: "Navigation" },
    { id: "upcoming", label: "Go to Upcoming", icon: <CalendarClock className="w-4 h-4" />, href: "/app/upcoming", category: "Navigation" },
    { id: "tasks", label: "Go to Tasks", icon: <CheckSquare className="w-4 h-4" />, href: "/app/tasks", category: "Navigation" },
    { id: "projects", label: "Go to Projects", icon: <FolderKanban className="w-4 h-4" />, href: "/app/projects", category: "Navigation" },
    { id: "calendar", label: "Go to Calendar", icon: <Calendar className="w-4 h-4" />, href: "/app/calendar", category: "Navigation" },
    { id: "habits", label: "Go to Habits", icon: <Target className="w-4 h-4" />, href: "/app/habits", category: "Navigation" },
    { id: "analytics", label: "Go to Analytics", icon: <BarChart3 className="w-4 h-4" />, href: "/app/analytics", category: "Navigation" },
    { id: "activity", label: "Go to Activity", icon: <Activity className="w-4 h-4" />, href: "/app/activity", category: "Navigation" },
    { id: "notifications", label: "Go to Notifications", icon: <Bell className="w-4 h-4" />, href: "/app/notifications", category: "Navigation" },
    { id: "about", label: "About / User Guide", description: "What you can do in the app", icon: <BookOpen className="w-4 h-4" />, href: "/app/about", category: "Navigation" },
    { id: "settings", label: "Go to Settings", icon: <Settings className="w-4 h-4" />, href: "/app/settings", category: "Navigation" },
    { id: "new-task", label: "Create New Task", description: "Add a task to your list", icon: <Plus className="w-4 h-4" />, action: onNewTask, category: "Actions" },
    { id: "new-project", label: "Create New Project", description: "Start a new project", icon: <Plus className="w-4 h-4" />, action: onNewTask, category: "Actions" },
    { id: "new-habit", label: "Create New Habit", description: "Track a new habit", icon: <Plus className="w-4 h-4" />, category: "Actions" },
  ];

  const filtered = items.filter((item) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      item.label.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.description?.toLowerCase().includes(q)
    );
  });

  const grouped = filtered.reduce<Record<string, CommandItem[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  const flatItems = filtered;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        toggle();
      }
      if (e.key === "Escape") {
        close();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [toggle, close]);

  useEffect(() => {
    if (show) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setActiveIndex(0);
      setQuery("");
    }
  }, [show]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((prev) => Math.min(prev + 1, flatItems.length - 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((prev) => Math.max(prev - 1, 0));
      }
      if (e.key === "Enter" && flatItems[activeIndex]) {
        const item = flatItems[activeIndex];
        if (item.href) {
          router.push(item.href);
        }
        item.action?.();
        close();
      }
    },
    [flatItems, activeIndex, router, close],
  );

  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={close}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="relative w-full max-w-lg mx-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl border border-white/20 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden"
          >
            {/* Search input */}
            <div className="flex items-center gap-3 p-4 border-b border-border/50">
              <Search className="w-5 h-5 text-muted-foreground shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => { setQuery(e.target.value); setActiveIndex(0); }}
                onKeyDown={handleKeyDown}
placeholder="Search or jump to..."
                 className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                aria-label="Search commands"
              />
              <kbd className="px-1.5 py-0.5 text-[10px] rounded-md bg-foreground/5 border border-border/50 text-muted-foreground font-mono">
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div className="max-h-[300px] overflow-y-auto p-2">
              {flatItems.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-sm text-muted-foreground">No results found</p>
                </div>
              ) : (
                Object.entries(grouped).map(([category, categoryItems]) => (
                  <div key={category} className="mb-2">
                    <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {category}
                    </p>
                    {categoryItems.map((item) => {
                      const globalIdx = flatItems.indexOf(item);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            if (item.href) router.push(item.href);
                            item.action?.();
                            close();
                          }}
                          onMouseEnter={() => setActiveIndex(globalIdx)}
                          className={cn(
                            "group flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm transition-all text-left",
                            globalIdx === activeIndex
                              ? "bg-primary-500/10 text-primary-500"
                              : "text-foreground/60 hover:text-foreground hover:bg-foreground/5",
                          )}
                        >
                          <span className="shrink-0">{item.icon}</span>
                          <div className="flex-1">
                            <p className="font-medium">{item.label}</p>
                            {item.description && (
                              <p className="text-xs text-muted-foreground">{item.description}</p>
                            )}
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0 text-muted-foreground" />
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-border/50 flex items-center gap-4 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 rounded bg-foreground/5 border border-border/50">↑↓</kbd> Navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 rounded bg-foreground/5 border border-border/50">↵</kbd> Open
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 rounded bg-foreground/5 border border-border/50">ESC</kbd> Close
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function useCommandPalette() {
  const [show, setShow] = useState(false);
  const toggle = useCallback(() => setShow((prev) => !prev), []);
  return { show, toggle };
}
