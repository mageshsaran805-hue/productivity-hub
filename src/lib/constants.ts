export const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: "LayoutDashboard", href: "/app" },
  { id: "inbox", label: "Inbox", icon: "Inbox", href: "/app/inbox" },
  { id: "today", label: "Today", icon: "Sun", href: "/app/today" },
  { id: "upcoming", label: "Upcoming", icon: "CalendarClock", href: "/app/upcoming" },
  { id: "tasks", label: "Tasks", icon: "CheckSquare", href: "/app/tasks" },
  { id: "projects", label: "Projects", icon: "FolderKanban", href: "/app/projects" },
  { id: "calendar", label: "Calendar", icon: "Calendar", href: "/app/calendar" },
  { id: "habits", label: "Habits", icon: "Target", href: "/app/habits" },
  { id: "analytics", label: "Analytics", icon: "BarChart3", href: "/app/analytics" },
];

export const BOTTOM_NAV_ITEMS = [
  { id: "today", label: "Today", icon: "Sun", href: "/app/today" },
  { id: "tasks", label: "Tasks", icon: "CheckSquare", href: "/app/tasks" },
  { id: "dashboard", label: "Home", icon: "LayoutDashboard", href: "/app" },
  { id: "calendar", label: "Calendar", icon: "Calendar", href: "/app/calendar" },
  { id: "habits", label: "Habits", icon: "Target", href: "/app/habits" },
];

export const PRIORITIES = [
  { value: "urgent", label: "Urgent", color: "text-red-500", bg: "bg-red-500" },
  { value: "high", label: "High", color: "text-orange-500", bg: "bg-orange-500" },
  { value: "medium", label: "Medium", color: "text-yellow-500", bg: "bg-yellow-500" },
  { value: "low", label: "Low", color: "text-green-500", bg: "bg-green-500" },
  { value: "none", label: "None", color: "text-muted-foreground", bg: "bg-muted-foreground" },
];

export const TASK_STATUSES = [
  { value: "backlog", label: "Backlog", color: "text-muted-foreground/50" },
  { value: "todo", label: "To Do", color: "text-muted-foreground" },
  { value: "in_progress", label: "In Progress", color: "text-blue-500" },
  { value: "completed", label: "Completed", color: "text-green-500" },
  { value: "archived", label: "Archived", color: "text-muted-foreground/50" },
];

export const HABIT_FREQUENCIES = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "custom", label: "Custom" },
];

export const HABIT_CATEGORIES = [
  { value: "health", label: "Health", color: "#22c55e", icon: "Heart" },
  { value: "fitness", label: "Fitness", color: "#ef4444", icon: "Zap" },
  { value: "mindfulness", label: "Mindfulness", color: "#8b5cf6", icon: "Brain" },
  { value: "learning", label: "Learning", color: "#06b6d4", icon: "BookOpen" },
  { value: "productivity", label: "Productivity", color: "#f59e0b", icon: "Briefcase" },
  { value: "finance", label: "Finance", color: "#22c55e", icon: "DollarSign" },
  { value: "social", label: "Social", color: "#ec4899", icon: "Users" },
  { value: "custom", label: "Custom", color: "#6366f1", icon: "Star" },
];
