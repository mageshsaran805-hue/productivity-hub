"use client";

import { motion, AnimatePresence } from "framer-motion";
import { PageTransition } from "@/components/animations/page-transition";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useUncategorizedTasks, useCompleteTask, useDeleteTask } from "@/lib/queries";
import { Inbox, Trash2, Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { NewTaskModal } from "@/components/tasks/new-task-modal";
import toast from "react-hot-toast";

function PriorityBadge({ priority }: { priority?: string | null }) {
  const colors: Record<string, string> = {
    urgent: "bg-red-500/10 text-red-400",
    high: "bg-orange-500/10 text-orange-400",
    medium: "bg-yellow-500/10 text-yellow-400",
    low: "bg-green-500/10 text-green-400",
  };
  if (!priority || priority === "none") return null;
  return (
    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${colors[priority] || ""}`}>
      {priority}
    </span>
  );
}

function DueDate({ date }: { date?: string | null }) {
  if (!date) return null;
  const d = new Date(date);
  const now = new Date();
  const isOverdue = d < now && d.toDateString() !== now.toDateString();
  return (
    <span className={`text-xs ${isOverdue ? "text-red-400" : "text-foreground/40"}`}>
      {d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
    </span>
  );
}

export default function InboxPage() {
  const { data: tasks, isLoading, error } = useUncategorizedTasks();
  const completeTask = useCompleteTask();
  const deleteTask = useDeleteTask();
  const [modalOpen, setModalOpen] = useState(false);

  const handleComplete = (id: string) => {
    completeTask.mutate(id);
  };

  const handleDelete = (id: string) => {
    deleteTask.mutate(id, { onSuccess: () => toast.success("Task deleted") });
  };

  return (
    <PageTransition>
      <div className="space-y-6 max-w-3xl">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Inbox</h2>
          <Button size="md" icon={<Plus className="w-4 h-4" />} onClick={() => setModalOpen(true)}>
            New Task
          </Button>
        </div>

        <p className="text-sm text-muted-foreground -mt-4">
          Tasks without a project — capture quick thoughts here.
        </p>

        <AnimatePresence mode="wait">
          {error ? (
            <GlassPanel className="p-6">
              <EmptyState icon={<Inbox className="w-8 h-8" />} title="Failed to load" description="Try refreshing." />
            </GlassPanel>
          ) : isLoading ? (
            <GlassPanel className="p-6 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </GlassPanel>
          ) : !tasks?.length ? (
            <GlassPanel className="p-6">
              <EmptyState
                icon={<Inbox className="w-8 h-8" />}
                title="Inbox is empty"
                description="Great job! All caught up."
              />
            </GlassPanel>
          ) : (
            <GlassPanel className="p-4 space-y-1">
              {tasks.map((task) => (
                <motion.div
                  key={task.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex items-center gap-3 p-3 rounded-2xl hover:bg-foreground/[0.03] group transition-colors"
                >
                  <button
                    onClick={() => handleComplete(task.id)}
                    className={`shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                      task.status === "completed"
                        ? "bg-success-500 border-success-500"
                        : "border-foreground/20 hover:border-primary-500"
                    }`}
                  >
                    {task.status === "completed" && (
                      <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <span className={`text-sm font-medium block truncate ${
                      task.status === "completed" ? "line-through text-muted-foreground" : "text-foreground/80"
                    }`}>
                      {task.title}
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <PriorityBadge priority={task.priority} />
                      <DueDate date={task.due_date} />
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(task.id)}
                    className="shrink-0 p-1.5 rounded-xl opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-all"
                    aria-label="Delete task"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </GlassPanel>
          )}
        </AnimatePresence>

        <NewTaskModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
      </div>
    </PageTransition>
  );
}
