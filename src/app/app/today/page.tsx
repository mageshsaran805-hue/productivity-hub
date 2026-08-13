"use client";

import { PageTransition } from "@/components/animations/page-transition";
import { GlassPanel } from "@/components/ui/glass-panel";
import { ProgressRing } from "@/components/ui/progress-ring";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { useDefaultWorkspace } from "@/hooks/use-workspace";
import { useTasks, useCreateTask, useCompleteTask, useHabits, useLogHabit } from "@/lib/queries";
import { CheckSquare, Target, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import toast from "react-hot-toast";

export default function TodayPage() {
  const { user } = useAuth();
  const { data: workspace } = useDefaultWorkspace();
  const { data: tasks, isLoading: tasksLoading } = useTasks();
  const { data: habits, isLoading: habitsLoading } = useHabits();
  const createTask = useCreateTask();
  const completeTask = useCompleteTask();
  const logHabit = useLogHabit();

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<"urgent" | "high" | "medium" | "low" | "none">("medium");

  const today = new Date().toISOString().split("T")[0];
  const todayTasks = tasks?.filter((t) => {
    if (!t.due_date) return false;
    return t.due_date.split("T")[0] === today;
  }) ?? [];

  const todayDate = new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim() || !user || !workspace) return;
    try {
      await createTask.mutateAsync({
        title: newTaskTitle.trim(),
        workspace_id: workspace.id,
        status: "todo",
        priority: newTaskPriority,
        due_date: today,
      });
      toast.success("Task created!");
      setShowTaskModal(false);
      setNewTaskTitle("");
    } catch {
      toast.error("Failed to create task");
    }
  };

  const handleToggleTask = (id: string) => {
    completeTask.mutate(id, {
      onSuccess: () => toast.success("Task completed!"),
      onError: () => toast.error("Failed to update task"),
    });
  };

  const handleToggleHabit = (habitId: string, completed: boolean) => {
    logHabit.mutate(
      { habit_id: habitId, date: today, completed },
      { onError: () => toast.error("Failed to log habit") },
    );
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Today</h2>
            <p className="text-sm text-muted-foreground">{todayDate}</p>
          </div>
          <Button size="md" icon={<Plus className="w-4 h-4" />} onClick={() => setShowTaskModal(true)}>
            Add Task
          </Button>
        </div>

        <div className="grid gap-4">
          <GlassPanel className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-primary-500" />
                Today&apos;s Tasks
              </h3>
              <ProgressRing
                progress={todayTasks.length > 0 ? (todayTasks.filter((t) => t.completed_at).length / todayTasks.length) * 100 : 0}
                size={36}
                strokeWidth={3}
              />
            </div>
            {tasksLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}
              </div>
            ) : todayTasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No tasks for today. Enjoy your day! 🎉
              </div>
            ) : (
              <div className="space-y-1">
                {todayTasks.map((task) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-foreground/5 transition-colors"
                  >
                    <button
                      onClick={() => handleToggleTask(task.id)}
                      className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all shrink-0 ${
                        task.completed_at ? "bg-primary-500 border-primary-500" : "border-foreground/20 hover:border-foreground/40"
                      }`}
                    >
                      {task.completed_at && (
                        <motion.svg initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-3 h-3 text-white" viewBox="0 0 12 12">
                          <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </motion.svg>
                      )}
                    </button>
                    <span className={`flex-1 text-sm ${task.completed_at ? "line-through text-muted-foreground" : ""}`}>
                      {task.title}
                    </span>
                    {task.priority === "urgent" && (
                      <span className="px-1.5 py-0.5 text-[10px] rounded-md bg-danger-500/10 text-danger-500 font-medium">Urgent</span>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </GlassPanel>

          <GlassPanel className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Target className="w-4 h-4 text-success-500" />
                Today&apos;s Habits
              </h3>
            </div>
            {habitsLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}
              </div>
            ) : !habits || habits.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No habits tracked yet. Create one in the Habits page.
              </div>
            ) : (
              <div className="space-y-3">
                {habits.map((habit) => {
                  // ponytail: show today's completion state if needed later
                  return (
                    <div key={habit.id} className="flex items-center gap-3">
                      <button
                        onClick={() => handleToggleHabit(habit.id, true)}
                        className="w-8 h-8 rounded-xl bg-foreground/5 flex items-center justify-center hover:bg-success-500/10 transition-colors group"
                      >
                        <span className="group-hover:text-success-500 transition-colors">✓</span>
                      </button>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{habit.name}</p>
                        <p className="text-xs text-muted-foreground">{habit.frequency}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </GlassPanel>
        </div>

        <Modal isOpen={showTaskModal} onClose={() => setShowTaskModal(false)} title="New Task">
          <div className="space-y-4">
            <Input
              label="Task Title"
              placeholder="What needs to be done?"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              autoFocus
            />
            <Select
              options={[
                { value: "none", label: "None" },
                { value: "low", label: "Low" },
                { value: "medium", label: "Medium" },
                { value: "high", label: "High" },
                { value: "urgent", label: "Urgent" },
              ]}
              value={newTaskPriority}
              onChange={(v) => setNewTaskPriority(v as "urgent" | "high" | "medium" | "low" | "none")}
            />
            <Button
              className="w-full"
              onClick={handleCreateTask}
              loading={createTask.isPending}
            >
              Create Task
            </Button>
          </div>
        </Modal>
      </div>
    </PageTransition>
  );
}
