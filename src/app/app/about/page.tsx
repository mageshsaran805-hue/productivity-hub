"use client";

import { motion } from "framer-motion";
import {
  CheckSquare,
  FolderKanban,
  Target,
  CalendarDays,
  Sun,
  CalendarClock,
  BarChart3,
  Activity,
  Bell,
  Inbox,
  Settings,
  ListChecks,
  Repeat,
  Tags,
  Sparkles,
  Search,
  Command,
  Rocket,
  Zap,
  Keyboard,
} from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { PageTransition } from "@/components/animations/page-transition";
import { cn } from "@/lib/utils";

interface GuideSection {
  id: string;
  icon: React.ElementType;
  title: string;
  color: string;
  summary: string;
  points: string[];
}

const sections: GuideSection[] = [
  {
    id: "tasks",
    icon: CheckSquare,
    title: "Tasks",
    color: "text-primary-500",
    summary: "Your to-do list, organized your way.",
    points: [
      "Create tasks instantly with the Quick Add button or the ⌘K command palette.",
      "Set a status (To do / In progress / Done), a priority (none → urgent), and a due date.",
      "Drag tasks to reorder them — order is saved automatically.",
      "Use the search bar to find tasks by title, description, or tags (full-text search).",
      "Add subtasks and check them off as you go; completion progress shows right on the list.",
      "Attach tags (color-coded labels) to group work across projects, then filter by tag.",
      "Leave comments on a task to keep context in one place.",
      "Assign a task to a project, or leave it uncategorized and filter for loose ends.",
    ],
  },
  {
    id: "recurring",
    icon: Repeat,
    title: "Recurring Tasks",
    color: "text-secondary-500",
    summary: "Repeat tasks automatically — never rewrite them.",
    points: [
      "Mark any task as recurring and choose a rule: daily, weekly, monthly, yearly, or a custom interval like “every 3 days”.",
      "Completing a recurring task automatically creates the next occurrence, so your list stays ahead of you.",
      "A repeating icon appears on recurring tasks in Today, Upcoming, and Tasks so you can spot them at a glance.",
    ],
  },
  {
    id: "projects",
    icon: FolderKanban,
    title: "Projects",
    color: "text-violet-500",
    summary: "Group related tasks and watch progress.",
    points: [
      "Create projects and assign tasks to them from the task editor.",
      "Each project card shows a progress ring and completion stats.",
      "Edit or delete projects at any time from the Projects page.",
      "Filter the task list by a specific project, or by “Uncategorized” to find tasks still needing a home.",
    ],
  },
  {
    id: "habits",
    icon: Target,
    title: "Habits",
    color: "text-emerald-500",
    summary: "Build routines with streaks that stick.",
    points: [
      "Create daily, weekly, or monthly habits with a color and icon.",
      "Group habits into categories (Health, Learning, Finance…) managed in Settings → Habit Categories.",
      "Log a habit with one tap to keep your streak alive.",
      "Set an optional reminder time and the days of the week to nudge you.",
      "The Habits page shows your weekly grid; Analytics reveals longer-term streak history.",
    ],
  },
  {
    id: "calendar",
    icon: CalendarDays,
    title: "Calendar",
    color: "text-sky-500",
    summary: "Events and tasks on one timeline.",
    points: [
      "Add, edit, and delete calendar events directly on the month view.",
      "Tasks with due dates appear alongside your events, so nothing slips between the cracks.",
    ],
  },
  {
    id: "today",
    icon: Sun,
    title: "Today",
    color: "text-amber-500",
    summary: "What needs your attention right now.",
    points: [
      "A focused view of tasks due today, sorted by priority so urgent work rises to the top.",
      "Complete tasks straight from the list with one click.",
    ],
  },
  {
    id: "upcoming",
    icon: CalendarClock,
    title: "Upcoming",
    color: "text-orange-500",
    summary: "A look at the week ahead.",
    points: [
      "Browse tasks due over the next seven days, grouped by day.",
      "Each row shows its priority badge and recurring marker, so you can plan ahead.",
    ],
  },
  {
    id: "inbox",
    icon: Inbox,
    title: "Inbox",
    color: "text-pink-500",
    summary: "Capture quickly, triage later.",
    points: [
      "Jot down quick ideas and notes without leaving your flow.",
      "Turn captured items into full tasks whenever you're ready.",
    ],
  },
  {
    id: "analytics",
    icon: BarChart3,
    title: "Analytics",
    color: "text-teal-500",
    summary: "See the numbers behind your momentum.",
    points: [
      "Charts of task completion and habit streaks over time.",
      "Spot your most consistent habits and busiest days.",
    ],
  },
  {
    id: "activity",
    icon: Activity,
    title: "Activity Feed",
    color: "text-lime-500",
    summary: "A chronological log of everything you do.",
    points: [
      "Every task, project, habit, subtask, tag, and comment you create or complete is recorded.",
      "Scroll the timeline to review what you've accomplished recently.",
    ],
  },
  {
    id: "notifications",
    icon: Bell,
    title: "Notifications",
    color: "text-red-500",
    summary: "Stay on top of what's due.",
    points: [
      "In-app notification center with unread counts on the bell icon.",
      "PWA push notifications (after you allow them in Settings → Notifications) for due dates and reminders.",
      "Optional email reminders — delivered in test mode until a custom sending domain is verified.",
    ],
  },
  {
    id: "settings",
    icon: Settings,
    title: "Settings & Tags",
    color: "text-slate-500",
    summary: "Make the app yours.",
    points: [
      "Manage notification permissions and preferences (email / push / reminders).",
      "Create, recolor, and delete tags, plus habit categories.",
      "Update your profile, and switch dark mode from the theme toggle.",
    ],
  },
];

const shortcuts = [
  { keys: "⌘K", action: "Open the command palette" },
  { keys: "⌘N", action: "Create a new task (Quick Add)" },
  { keys: "Click the circle", action: "Complete a task" },
  { keys: "Search bar", action: "Find tasks by title, tags, or full text" },
  { keys: "Drag & drop", action: "Reorder tasks in a list" },
];

export default function AboutPage() {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Hero */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-primary-500/10 via-secondary-500/10 to-transparent">
          <CardContent>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center shrink-0">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Productivity Hub — User Guide</h2>
                <p className="mt-1 text-sm text-foreground/60 max-w-2xl">
                  Everything you can do in the app, and how to do it. Use the section list below to jump to any feature.
                </p>
              </div>
            </div>

            {/* Quick jump chips */}
            <div className="mt-5 flex flex-wrap gap-2">
              {sections.map((s) => (
                <button
                  key={s.id}
                  onClick={() => scrollTo(s.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-foreground/5 hover:bg-foreground/10 border border-border/50 text-foreground/70 hover:text-foreground transition-colors"
                >
                  <s.icon className={cn("w-3.5 h-3.5", s.color)} />
                  {s.title}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Getting started */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary-500/10 flex items-center justify-center">
                <Rocket className="w-4 h-4 text-primary-500" />
              </div>
              <div>
                <h3 className="font-semibold">Getting started</h3>
                <p className="text-xs text-foreground/50">Three habits that make the app feel effortless</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm text-foreground/70">
              <li className="flex gap-3">
                <Zap className="w-4 h-4 text-secondary-500 shrink-0 mt-0.5" />
                <span><strong className="text-foreground">⌘K to go anywhere.</strong> The command palette opens with a keystroke and jumps to any page or creates a new task instantly.</span>
              </li>
              <li className="flex gap-3">
                <Search className="w-4 h-4 text-primary-500 shrink-0 mt-0.5" />
                <span><strong className="text-foreground">Search instead of scrolling.</strong> Type a title, tag, or keyword in the search bar to find any task across your workspace.</span>
              </li>
              <li className="flex gap-3">
                <ListChecks className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong className="text-foreground">Finish from any view.</strong> Complete tasks and log habits with one tap from Today, Upcoming, Tasks, and the Dashboard — no need to open the detail view.</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Feature sections */}
        {sections.map((s, i) => (
          <motion.div
            key={s.id}
            id={s.id}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.35, delay: i * 0.02 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center bg-foreground/5 border border-border/50")}>
                    <s.icon className={cn("w-4 h-4", s.color)} />
                  </div>
                  <div>
                    <h3 className="font-semibold">{s.title}</h3>
                    <p className="text-xs text-foreground/50">{s.summary}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {s.points.map((point) => (
                    <li key={point} className="flex gap-2.5 text-sm text-foreground/70">
                      <span className={cn("mt-1.5 w-1.5 h-1.5 rounded-full shrink-0", s.color.replace("text-", "bg-"))} />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        ))}

        {/* Shortcuts */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-secondary-500/10 flex items-center justify-center">
                <Keyboard className="w-4 h-4 text-secondary-500" />
              </div>
              <div>
                <h3 className="font-semibold">Handy shortcuts</h3>
                <p className="text-xs text-foreground/50">Small things that add up</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {shortcuts.map((s) => (
                <div key={s.action} className="flex items-center justify-between gap-4 text-sm">
                  <span className="text-foreground/70">{s.action}</span>
                  <kbd className="inline-flex items-center px-2 py-1 text-xs rounded-lg bg-foreground/5 border border-border/50 font-mono text-foreground/80 shrink-0">
                    {s.keys}
                  </kbd>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-foreground/50 flex items-center gap-1.5">
              <Command className="w-3.5 h-3.5" />
              Tip: this is a PWA — install it to your home screen from the browser menu to use it like a native app.
            </p>
          </CardContent>
        </Card>

        {/* Tags quick card */}
        <Card className="bg-gradient-to-br from-violet-500/10 to-transparent">
          <CardContent className="flex items-start gap-3">
            <Tags className="w-5 h-5 text-violet-500 shrink-0 mt-0.5" />
            <p className="text-sm text-foreground/70">
              <strong className="text-foreground">Pro tip:</strong> tags and habit categories are both managed in
              <strong className="text-foreground"> Settings</strong>. Create them once, then reuse them across tasks and habits for tidy, filterable organization.
            </p>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
