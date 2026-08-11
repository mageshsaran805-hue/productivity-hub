"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { PageTransition } from "@/components/animations/page-transition";
import { GlassPanel } from "@/components/ui/glass-panel";
import { EmptyState } from "@/components/ui/empty-state";
import { useTasksDueInRange, useCompleteTask } from "@/lib/queries";
import { CalendarClock, Loader2 } from "lucide-react";
import type { Task } from "@/types";
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

function TaskRow({ task, onComplete }: { task: Task; onComplete: (id: string) => void }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-2xl hover:bg-foreground/[0.03] group transition-colors">
      <button
        onClick={() => onComplete(task.id)}
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
      <span className={`text-sm flex-1 ${task.status === "completed" ? "line-through text-muted-foreground" : "text-foreground/80"}`}>
        {task.title}
      </span>
      <PriorityBadge priority={task.priority} />
    </div>
  );
}

function DayGroup({ label, tasks, onComplete }: { label: string; tasks: Task[]; onComplete: (id: string) => void }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-foreground/60 mb-2 sticky top-0 bg-background py-2 z-10">{label}</h3>
      <GlassPanel className="p-2 space-y-0.5">
        {tasks.map((task) => (
          <TaskRow key={task.id} task={task} onComplete={onComplete} />
        ))}
      </GlassPanel>
    </div>
  );
}

export default function UpcomingPage() {
  const completeTask = useCompleteTask();

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const endDate = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() + 7);
    return d;
  }, [today]);

  const { data: tasks, isLoading, error } = useTasksDueInRange(
    today.toISOString(),
    endDate.toISOString()
  );

  const grouped = useMemo(() => {
    if (!tasks) return [];
    const groups: { label: string; tasks: Task[] }[] = [];
    const map = new Map<string, Task[]>();

    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      map.set(d.toDateString(), []);
    }

    for (const task of tasks) {
      if (!task.due_date) continue;
      const key = new Date(task.due_date).toDateString();
      if (map.has(key)) map.get(key)!.push(task);
    }

    for (const [dateStr, dayTasks] of map) {
      if (dayTasks.length === 0) continue;
      const d = new Date(dateStr);
      const isToday = d.toDateString() === today.toDateString();
      const label = isToday ? "Today" : d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
      groups.push({ label, tasks: dayTasks });
    }

    return groups;
  }, [tasks, today]);

  const handleComplete = (id: string) => {
    completeTask.mutate(id, { onSuccess: () => toast.success("Task completed!") });
  };

  return (
    <PageTransition>
      <div className="space-y-6 max-w-3xl">
        <h2 className="text-2xl font-bold">Upcoming</h2>
        <p className="text-sm text-muted-foreground -mt-4">
          Tasks due in the next 7 days.
        </p>

        {error ? (
          <GlassPanel className="p-6">
            <EmptyState icon={<CalendarClock className="w-8 h-8" />} title="Failed to load" description="Try refreshing." />
          </GlassPanel>
        ) : isLoading ? (
          <GlassPanel className="p-6 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </GlassPanel>
        ) : grouped.length === 0 ? (
          <GlassPanel className="p-6">
            <EmptyState
              icon={<CalendarClock className="w-8 h-8" />}
              title="Nothing upcoming"
              description="No tasks are due in the next 7 days."
            />
          </GlassPanel>
        ) : (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {grouped.map((group) => (
              <DayGroup key={group.label} label={group.label} tasks={group.tasks} onComplete={handleComplete} />
            ))}
          </motion.div>
        )}
      </div>
    </PageTransition>
  );
}
