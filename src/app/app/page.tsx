"use client";

import { useState, type FormEvent, type ElementType } from "react";
import { motion } from "framer-motion";
import { PageTransition } from "@/components/animations/page-transition";
import { GlassPanel } from "@/components/ui/glass-panel";
import { ProgressRing } from "@/components/ui/progress-ring";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StaggerChildren, StaggerItem } from "@/components/animations/stagger-children";
import { CountUp } from "@/components/animations/count-up";
import { useAuth } from "@/hooks/use-auth";
import { useDashboardStats, useTasks, useCreateTask } from "@/lib/queries";
import { useDefaultWorkspace } from "@/hooks/use-workspace";
import {
  CheckSquare, Target, TrendingUp, Zap, Plus, ArrowRight, Loader2,
} from "lucide-react";
import toast from "react-hot-toast";

type Priority = "urgent" | "high" | "medium" | "low";

const priorityLabel: Record<Priority, string> = {
  urgent: "Urgent",
  high: "High",
  medium: "Medium",
  low: "Low",
};

const priorityColor: Record<Priority, string> = {
  urgent: "bg-danger-500/10 text-danger-500",
  high: "bg-warning-500/10 text-warning-500",
  medium: "bg-primary-500/10 text-primary-500",
  low: "bg-foreground/10 text-foreground/50",
};

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function StatSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-10 w-10 rounded-2xl bg-foreground/10 mb-3" />
      <div className="h-7 w-20 bg-foreground/10 rounded mb-1" />
      <div className="h-3 w-16 bg-foreground/10 rounded" />
    </div>
  );
}

function TaskRowSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3 animate-pulse">
      <div className="w-5 h-5 rounded-lg bg-foreground/10 shrink-0" />
      <div className="h-4 flex-1 bg-foreground/10 rounded" />
    </div>
  );
}

function EmptyState({ icon: Icon, title, description }: { icon: ElementType; title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center py-8 text-center">
      <Icon className="w-8 h-8 text-muted-foreground mb-2" />
      <p className="text-sm text-muted-foreground">{title}</p>
      {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
    </div>
  );
}

function ErrorBlock({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center py-6 text-center">
      <p className="text-sm text-danger-500">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="text-xs text-foreground/40 hover:text-foreground/60 mt-2 underline underline-offset-2">
          Try again
        </button>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const { data: stats, isLoading: statsLoading, isError: statsError, refetch: refetchStats } = useDashboardStats();
  const { data: tasks, isLoading: tasksLoading, isError: tasksError, refetch: refetchTasks } = useTasks();
  const { data: workspace, isLoading: workspaceLoading } = useDefaultWorkspace();
  const createTask = useCreateTask();

  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  const incomplete = (tasks ?? []).filter((t) => !t.completed_at);
  // Productivity = tasks + habits completed today out of the total scheduled.
  const doneToday = (stats?.tasksToday ?? 0) + (stats?.habitsDone ?? 0);
  const plannedToday = (stats?.totalTasks ?? 0) + (stats?.totalHabits ?? 0);
  const pct = plannedToday > 0 ? Math.round((doneToday / plannedToday) * 100) : 0;

  const handleQuickAdd = async (e: FormEvent) => {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title || !user?.id || !workspace?.id) return;

    try {
      await createTask.mutateAsync({
        title,
        workspace_id: workspace.id,
        status: "todo",
        priority: "medium",
      });
      toast.success("Task created");
      setNewTitle("");
      setIsAdding(false);
    } catch {
      toast.error("Failed to create task");
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-foreground/40" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-foreground/40">Please sign in</p>
      </div>
    );
  }

  const statCards = [
    {
      label: "Tasks Today",
      value: stats?.tasksToday ?? 0,
      total: stats?.totalTasks ?? 0,
      icon: CheckSquare,
      color: "from-primary-500 to-secondary-500",
    },
    {
      label: "Habits Done",
      value: stats?.habitsDone ?? 0,
      total: stats?.totalHabits ?? 0,
      icon: Target,
      color: "from-success-500 to-emerald-500",
    },
    {
      label: "Productivity",
      value: pct,
      total: 100,
      icon: Zap,
      color: "from-warning-500 to-orange-500",
    },
    {
      label: "Total Tasks",
      value: stats?.totalTasks ?? 0,
      total: 0,
      icon: TrendingUp,
      color: "from-secondary-500 to-pink-500",
    },
  ];

  return (
    <PageTransition>
      <StaggerChildren>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold font-display">{greeting()}!</h2>
              <p className="text-foreground/50">Here&apos;s your productivity overview</p>
            </div>
            <Button
              variant="primary"
              size="md"
              icon={isAdding ? undefined : <Plus className="w-4 h-4" />}
              onClick={() => setIsAdding(!isAdding)}
            >
              {isAdding ? "Cancel" : "Quick Add"}
            </Button>
          </div>

          {/* Quick Add */}
          {isAdding && (
            <motion.form
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleQuickAdd}
              className="flex gap-2"
            >
              <input
                autoFocus
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder={workspaceLoading ? "Loading..." : "What do you need to do?"}
                disabled={createTask.isPending || workspaceLoading}
                className="flex-1 px-4 py-2.5 rounded-xl bg-white/70 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-white/10 text-sm placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
              />
              <Button
                variant="primary"
                size="md"
                type="submit"
                disabled={!newTitle.trim() || createTask.isPending || workspaceLoading}
              >
                {createTask.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add"}
              </Button>
            </motion.form>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((stat, i) => {
              const Icon = stat.icon;
              const progress = stat.total > 0 ? (stat.value / stat.total) * 100 : 0;

              if (statsLoading) {
                return (
                  <StaggerItem key={i}>
                    <Card glass tilt hover={false} className="p-5">
                      <StatSkeleton />
                    </Card>
                  </StaggerItem>
                );
              }

              if (statsError) {
                return (
                  <StaggerItem key={i}>
                    <Card glass tilt hover={false} className="p-5">
                      <ErrorBlock message="Failed to load stats" onRetry={refetchStats} />
                    </Card>
                  </StaggerItem>
                );
              }

              return (
                <StaggerItem key={i}>
                  <Card glass tilt hover={false} className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${stat.color} p-2 flex items-center justify-center`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      {stat.total > 0 && (
                        <ProgressRing progress={progress} size={44} strokeWidth={3} showPercentage={false} />
                      )}
                    </div>
                    <p className="text-2xl font-bold font-display mb-0.5">
                      <CountUp end={stat.value} />
                      {stat.total > 0 && stat.total !== 100 && (
                        <span className="text-lg text-foreground/40">/{stat.total}</span>
                      )}
                    </p>
                    <p className="text-xs text-foreground/50">{stat.label}</p>
                  </Card>
                </StaggerItem>
              );
            })}
          </div>

          {/* Main grid */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Tasks */}
            <div className="lg:col-span-2">
              <GlassPanel className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-primary-500" />
                    Today&apos;s Tasks
                    {!tasksLoading && incomplete.length > 0 && (
                      <span className="text-xs text-foreground/40 font-normal">({incomplete.length})</span>
                    )}
                  </h3>
                  <Button variant="ghost" size="sm" icon={<ArrowRight className="w-3.5 h-3.5" />}>
                    View All
                  </Button>
                </div>

                {tasksError ? (
                  <ErrorBlock message="Failed to load tasks" onRetry={refetchTasks} />
                ) : tasksLoading ? (
                  <div className="space-y-1">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <TaskRowSkeleton key={i} />
                    ))}
                  </div>
                ) : incomplete.length === 0 ? (
                  <EmptyState icon={CheckSquare} title="No tasks for today" description="Add one above to get started" />
                ) : (
                  <div className="space-y-1">
                    {incomplete.slice(0, 8).map((task) => {
                      const p = task.priority === "urgent" || task.priority === "high" || task.priority === "medium" || task.priority === "low"
                        ? (task.priority as Priority)
                        : null;

                      return (
                        <motion.div
                          key={task.id}
                          whileHover={{ x: 4 }}
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                          className="flex items-center gap-3 p-3 rounded-xl hover:bg-foreground/5 transition-colors group"
                        >
                          <button
                            className="w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all shrink-0 border-foreground/20 hover:border-foreground/40"
                            aria-label="Mark as complete"
                          />
                          <span className="flex-1 text-sm">{task.title}</span>
                          {p && (
                            <span className={`px-1.5 py-0.5 text-[10px] rounded-md font-medium ${priorityColor[p]}`}>
                              {priorityLabel[p]}
                            </span>
                          )}
                          {task.due_date && (
                            <span className="text-xs text-foreground/40">
                              {new Date(task.due_date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                            </span>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                )}

                <button
                  onClick={() => { setIsAdding(true); setNewTitle(""); }}
                  className="flex items-center gap-2 w-full mt-2 p-3 rounded-xl text-sm text-foreground/30 hover:text-foreground/50 hover:bg-foreground/5 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add task
                </button>
              </GlassPanel>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <GlassPanel className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Target className="w-4 h-4 text-success-500" />
                    Habits
                  </h3>
                </div>
                {statsError ? (
                  <ErrorBlock message="Failed to load" />
                ) : statsLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-3 animate-pulse">
                        <div className="w-8 h-8 rounded-xl bg-foreground/10" />
                        <div className="flex-1 space-y-1">
                          <div className="h-4 w-24 bg-foreground/10 rounded" />
                          <div className="h-3 w-16 bg-foreground/10 rounded" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center py-6 text-center">
                    <CountUp end={stats?.habitsDone ?? 0} className="text-3xl font-bold" />
                    <p className="text-xs text-foreground/40 mt-1">
                      of {stats?.totalHabits ?? 0} habits done today
                    </p>
                  </div>
                )}
              </GlassPanel>

              <GlassPanel className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-secondary-500" />
                    Today
                  </h3>
                </div>
                <div className="flex flex-col items-center py-6 text-center">
                  <CountUp end={stats?.tasksToday ?? 0} className="text-3xl font-bold" />
                  <p className="text-xs text-foreground/40 mt-1">tasks completed</p>
                </div>
              </GlassPanel>
            </div>
          </div>
        </div>
      </StaggerChildren>
    </PageTransition>
  );
}
