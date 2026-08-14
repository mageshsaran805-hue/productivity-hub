"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PageTransition } from "@/components/animations/page-transition";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Button } from "@/components/ui/button";
import { Tabs } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { NewTaskModal } from "@/components/tasks/new-task-modal";
import { TaskEditModal } from "@/components/tasks/task-edit-modal";
import {
  useTasks,
  useTaskSearch,
  useCompleteTask,
  useDeleteTask,
  useUpdateTask,
} from "@/lib/queries";
import type { Task } from "@/types";
import toast from "react-hot-toast";
import {
  CheckSquare,
  List,
  Layout,
  Calendar,
  Plus,
  Trash2,
  Pencil,
  CalendarDays,
  AlertCircle,
  ArrowUp,
  Minus,
  ArrowDown,
  Search,
} from "lucide-react";

const views = [
  { id: "list", label: "List", icon: <List className="w-4 h-4" /> },
  { id: "board", label: "Board", icon: <Layout className="w-4 h-4" /> },
  { id: "calendar", label: "Calendar", icon: <Calendar className="w-4 h-4" /> },
];

const priorityConfig: Record<
  string,
  { label: string; color: string; icon: React.ReactNode }
> = {
  urgent: {
    label: "Urgent",
    color: "bg-red-500/10 text-red-400 border-red-500/20",
    icon: <AlertCircle className="w-3 h-3" />,
  },
  high: {
    label: "High",
    color: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    icon: <ArrowUp className="w-3 h-3" />,
  },
  medium: {
    label: "Medium",
    color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    icon: <Minus className="w-3 h-3" />,
  },
  low: {
    label: "Low",
    color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    icon: <ArrowDown className="w-3 h-3" />,
  },
  none: {
    label: "",
    color: "bg-gray-500/10 text-gray-400 border-gray-500/20",
    icon: null,
  },
};

const columns = [
  { id: "todo", label: "To Do", statuses: ["backlog", "todo"] },
  { id: "in_progress", label: "In Progress", statuses: ["in_progress"] },
  { id: "completed", label: "Completed", statuses: ["completed"] },
];

function TaskSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="h-16 bg-white/5 dark:bg-white/[0.03] rounded-2xl animate-pulse"
        />
      ))}
    </div>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const cfg = priorityConfig[priority] ?? priorityConfig.none;
  if (priority === "none") return null;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-medium border ${cfg.color}`}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

function DueDate({ date }: { date?: string | null }) {
  if (!date) return null;
  const d = new Date(date);
  const isPast = d < new Date(new Date().toDateString());
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs ${
        isPast ? "text-red-400" : "text-muted-foreground"
      }`}
    >
      <CalendarDays className="w-3 h-3" />
      {d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
    </span>
  );
}

export default function TasksPage() {
  const { data: tasks, isLoading, error } = useTasks();

  const completeTask = useCompleteTask();
  const deleteTask = useDeleteTask();
  const updateTask = useUpdateTask();

  const [activeView, setActiveView] = useState("list");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { data: searchResults, isLoading: searchLoading, error: searchError } = useTaskSearch(searchQuery);

  const isSearching = searchQuery.trim().length > 0;
  const activeTasks = (isSearching ? searchResults ?? [] : tasks ?? []).filter((t) => t.status !== "archived");
  const resolvedIsLoading = isSearching ? searchLoading : isLoading;
  const resolvedError = isSearching ? searchError : error;

  const handleToggle = (task: Task) => {
    if (task.status === "completed") {
      updateTask.mutate({ id: task.id, status: "todo" as const, completed_at: undefined });
    } else {
      completeTask.mutate(task.id);
    }
  };

  const handleDelete = (id: string) => {
    deleteTask.mutate(id);
    toast.success("Task deleted");
  };

  const renderTaskRow = (task: Task) => (
    <motion.div
      key={task.id}
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="flex items-center gap-3 p-4 bg-white/40 dark:bg-white/[0.04] rounded-2xl border border-white/20 dark:border-white/[0.06] hover:bg-white/60 dark:hover:bg-white/[0.06] transition-colors group"
    >
      <button
        onClick={() => handleToggle(task)}
        className={`shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
          task.status === "completed"
            ? "bg-emerald-500 border-emerald-500 text-white"
            : "border-foreground/20 hover:border-primary-500/50"
        }`}
        aria-label={task.status === "completed" ? "Mark incomplete" : "Mark complete"}
      >
        {task.status === "completed" && (
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      <div className="flex-1 min-w-0">
        <span
          className={`text-sm font-medium block truncate ${
            task.status === "completed" ? "line-through text-muted-foreground" : "text-foreground/80"
          }`}
        >
          {task.title}
        </span>
        <div className="flex items-center gap-2 mt-1">
          <PriorityBadge priority={task.priority} />
          <DueDate date={task.due_date} />
        </div>
      </div>

      <button
        onClick={() => setEditingTask(task)}
        className="shrink-0 p-1.5 rounded-xl opacity-0 group-hover:opacity-100 hover:bg-foreground/5 text-muted-foreground hover:text-foreground transition-all"
        aria-label="Edit task"
      >
        <Pencil className="w-4 h-4" />
      </button>

      <button
        onClick={() => handleDelete(task.id)}
        className="shrink-0 p-1.5 rounded-xl opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-all"
        aria-label="Delete task"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </motion.div>
  );

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h2 className="text-2xl font-bold">Tasks</h2>
          <div className="flex items-center gap-3">
            <Button size="md" icon={<Plus className="w-4 h-4" />} onClick={() => setIsModalOpen(true)}>
              New Task
            </Button>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-9 pr-4 rounded-2xl bg-foreground/[0.03] border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary-500/50 transition-colors"
          />
        </div>

        <div className="flex items-center justify-between">
          <Tabs tabs={views} activeTab={activeView} onChange={setActiveView} />
          <span className="text-sm text-muted-foreground">
            {isSearching ? `${activeTasks.length} results` : `${activeTasks.length} task${activeTasks.length !== 1 ? "s" : ""}`}
          </span>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {resolvedError && (
              <GlassPanel className="p-6">
                <EmptyState
                  icon={<AlertCircle className="w-8 h-8" />}
                  title="Failed to load tasks"
                  description="Something went wrong. Please try refreshing."
                />
              </GlassPanel>
            )}

            {!resolvedError && resolvedIsLoading && (
              <GlassPanel className="p-6">
                <TaskSkeleton />
              </GlassPanel>
            )}

            {!resolvedError && !resolvedIsLoading && activeView === "list" && (
              <GlassPanel className="p-6">
                {activeTasks.length === 0 ? (
                  <EmptyState
                    icon={<CheckSquare className="w-8 h-8" />}
                    title="No tasks yet"
                    description="Create your first task to get started with tracking your work."
                    action={
                      <Button
                        icon={<Plus className="w-4 h-4" />}
                        onClick={() => setIsModalOpen(true)}
                      >
                        Create Task
                      </Button>
                    }
                  />
                ) : (
                  <AnimatePresence mode="popLayout">
                    <div className="space-y-2">
                      {activeTasks.map(renderTaskRow)}
                    </div>
                  </AnimatePresence>
                )}
              </GlassPanel>
            )}

            {!resolvedError && !resolvedIsLoading && activeView === "board" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {columns.map((col) => {
                  const colTasks = activeTasks.filter((t) =>
                    col.statuses.includes(t.status),
                  );
                  return (
                    <GlassPanel key={col.id} className="p-4 min-h-[300px]">
                      <h3 className="font-medium text-sm mb-4 flex items-center gap-2">
                        {col.label}
                        <span className="text-xs text-muted-foreground">
                          {colTasks.length}
                        </span>
                      </h3>
                      {colTasks.length === 0 ? (
                        <EmptyState
                          icon={<CheckSquare className="w-6 h-6" />}
                          title=""
                          description="No tasks"
                        />
                      ) : (
                        <AnimatePresence mode="popLayout">
                          <div className="space-y-2">
                            {colTasks.map(renderTaskRow)}
                          </div>
                        </AnimatePresence>
                      )}
                    </GlassPanel>
                  );
                })}
              </div>
            )}

            {!resolvedError && !resolvedIsLoading && activeView === "calendar" && (
              <GlassPanel className="p-6">
                <EmptyState
                  icon={<Calendar className="w-8 h-8" />}
                  title="No scheduled tasks"
                  description="Tasks with due dates will appear on the calendar."
                />
              </GlassPanel>
            )}
          </motion.div>
        </AnimatePresence>

        <NewTaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        <TaskEditModal task={editingTask} onClose={() => setEditingTask(null)} />
      </div>
    </PageTransition>
  );
}
