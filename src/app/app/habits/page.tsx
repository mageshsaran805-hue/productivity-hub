"use client";

import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { useDefaultWorkspace } from "@/hooks/use-workspace";
import { useHabits, useLogHabit, useDeleteHabit, useCreateHabit, useUpdateHabit } from "@/lib/queries";
import { PageTransition } from "@/components/animations/page-transition";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProgressRing } from "@/components/ui/progress-ring";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { StaggerChildren, StaggerItem } from "@/components/animations/stagger-children";
import { EmptyState } from "@/components/ui/empty-state";
import { CardSkeleton } from "@/components/ui/skeleton";
import { Plus, Target, CheckCircle2, Sparkles, Check, Trash2, Flame, Pencil } from "lucide-react";
import toast from "react-hot-toast";
import type { HabitLog, Habit } from "@/types";
import { cn } from "@/lib/utils";

const PRESET_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4",
  "#6366f1", "#8b5cf6", "#ec4899",
];

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getWeekDates(): string[] {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.toISOString().split("T")[0];
  });
}

export default function HabitsPage() {
  const { user } = useAuth();
  const { data: workspace } = useDefaultWorkspace();

  const { data: habits, isLoading } = useHabits();
  const logHabit = useLogHabit();
  const deleteHabit = useDeleteHabit();
  const createHabit = useCreateHabit();
  const updateHabit = useUpdateHabit();

  const [showModal, setShowModal] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [newName, setNewName] = useState("");
  const [newFrequency, setNewFrequency] = useState("daily");
  const [newColor, setNewColor] = useState("#6366f1");
  const [newReminderTime, setNewReminderTime] = useState("");
  const [newReminderDays, setNewReminderDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);

  const today = useMemo(() => new Date().toISOString().split("T")[0], []);
  const weekDates = useMemo(() => getWeekDates(), []);
  const habitIds = useMemo(() => habits?.map((h) => h.id) ?? [], [habits]);

  // ponytail: single weekly query instead of N+1 per-habit useHabitLogs
  const { data: logs } = useQuery({
    queryKey: ["habit_logs", "week", user?.id, habitIds],
    enabled: !!user?.id && habitIds.length > 0,
    queryFn: async () => {
      const res = await fetch(
        `/api/habit-logs?habit_ids=${encodeURIComponent(habitIds.join(","))}&start=${weekDates[0]}&end=${weekDates[6]}`,
        { headers: { "Content-Type": "application/json" } }
      );
      if (!res.ok) {
        let message = `Request failed (${res.status})`;
        try {
          const body = (await res.json()) as { error?: string };
          if (body.error) message = body.error;
        } catch {
          // ignore
        }
        throw new Error(message);
      }
      return (await res.json()) as HabitLog[];
    },
  });

  // ponytail: keep a stable ref to the weekly map for all compute
  const weeklyMap = useMemo(() => {
    const map: Record<string, Record<string, boolean>> = {};
    if (!logs) return map;
    for (const log of logs) {
      if (!map[log.habit_id]) map[log.habit_id] = {};
      map[log.habit_id][log.date] = log.completed;
    }
    return map;
  }, [logs]);

  const todayStatus = useMemo(() => {
    const map: Record<string, boolean> = {};
    for (const habit of habits ?? []) {
      map[habit.id] = weeklyMap[habit.id]?.[today] ?? false;
    }
    return map;
  }, [weeklyMap, habits, today]);

  const habitsDoneToday = useMemo(
    () => Object.values(todayStatus).filter(Boolean).length,
    [todayStatus],
  );

  const bestStreak = useMemo(
    () => Math.max(0, ...(habits ?? []).map((h) => h.best_streak ?? 0)),
    [habits],
  );

  const createHabitAction = useCallback(async () => {
    if (!user?.id || !workspace?.id) throw new Error("Not authenticated");
    await createHabit.mutateAsync({
      name: newName.trim(),
      workspace_id: workspace.id,
      frequency: newFrequency as "daily" | "weekly" | "monthly",
      color: newColor,
      icon: "Target",
      frequency_times: 1,
      reminder_time: newReminderTime || undefined,
      reminder_days: newReminderTime ? newReminderDays : undefined,
    });
    setShowModal(false);
    setNewName("");
    setNewFrequency("daily");
    setNewColor("#6366f1");
    setNewReminderTime("");
    setNewReminderDays([0, 1, 2, 3, 4, 5, 6]);
    toast.success("Habit created!");
  }, [createHabit, user?.id, workspace?.id, newName, newFrequency, newColor, newReminderTime, newReminderDays]);

  const handleToggle = useCallback(
    (habitId: string, completed: boolean) => {
      logHabit
        .mutateAsync({ habit_id: habitId, date: today, completed })
        .catch((err: Error) => {
          toast.error(err.message);
        });
    },
    [logHabit, today],
  );

  const handleDeleteHabit = (id: string) => {
    deleteHabit.mutate(id);
    toast.success("Habit deleted");
  };

  const updateHabitAction = async () => {
    if (!editingHabit) throw new Error("No habit selected");
    await updateHabit.mutateAsync({
      id: editingHabit.id,
      name: newName.trim(),
      frequency: newFrequency as "daily" | "weekly" | "monthly",
      color: newColor,
      reminder_time: newReminderTime || undefined,
      reminder_days: newReminderTime ? newReminderDays : undefined,
    });
    setEditingHabit(null);
    toast.success("Habit updated");
  };

  // Populate the form fields when opening the edit modal
  const openEdit = (habit: Habit) => {
    setEditingHabit(habit);
    setNewName(habit.name);
    setNewFrequency(habit.frequency);
    setNewColor(habit.color || "#6366f1");
    setNewReminderTime(habit.reminder_time?.slice(0, 5) ?? "");
    setNewReminderDays(habit.reminder_days?.length ? habit.reminder_days : [0, 1, 2, 3, 4, 5, 6]);
  };

  // ── Loading ────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <PageTransition>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="h-8 w-24 rounded-xl bg-foreground/5 animate-pulse" />
            <div className="h-10 w-32 rounded-2xl bg-foreground/5 animate-pulse" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        </div>
      </PageTransition>
    );
  }

  // ── Empty ──────────────────────────────────────────────────────────
  if (!habits?.length) {
    return (
      <PageTransition>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Habits</h2>
            <Button
              size="md"
              icon={<Plus className="h-4 w-4" />}
              onClick={() => setShowModal(true)}
            >
              New Habit
            </Button>
          </div>
          <EmptyState
            icon={<Target className="h-10 w-10" />}
            title="No habits yet"
            description="Start building better habits, one day at a time."
            action={
              <Button
                size="lg"
                icon={<Plus className="h-4 w-4" />}
                onClick={() => setShowModal(true)}
              >
                Create Your First Habit
              </Button>
            }
          />
        </div>

        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title="Create New Habit"
        >
          <HabitForm
            name={newName}
            onNameChange={setNewName}
            frequency={newFrequency}
            onFrequencyChange={setNewFrequency}
            color={newColor}
            onColorChange={setNewColor}
            reminderTime={newReminderTime}
            onReminderTimeChange={setNewReminderTime}
            reminderDays={newReminderDays}
            onReminderDaysChange={setNewReminderDays}
            onSubmit={() => createHabitAction().catch((err: Error) => toast.error(err.message))}
            loading={createHabit.isPending}
          />
        </Modal>
      </PageTransition>
    );
  }

  // ── Data ───────────────────────────────────────────────────────────
  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Habits</h2>
          <Button
            size="md"
            icon={<Plus className="h-4 w-4" />}
            onClick={() => setShowModal(true)}
          >
            New Habit
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card glass className="p-4 text-center">
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 p-2">
              <Target className="h-5 w-5 text-white" />
            </div>
            <p className="text-lg font-bold">{habits.length}</p>
            <p className="text-xs text-foreground/50">Total Habits</p>
          </Card>
          <Card glass className="p-4 text-center">
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-success-500 to-emerald-500 p-2">
              <CheckCircle2 className="h-5 w-5 text-white" />
            </div>
            <p className="text-lg font-bold">
              {habitsDoneToday}/{habits.length}
            </p>
            <p className="text-xs text-foreground/50">Done Today</p>
          </Card>
          <Card glass className="p-4 text-center">
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-warning-500 to-orange-500 p-2">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <p className="text-lg font-bold">
              {habitsDoneToday === 0
                ? "0%"
                : Math.round((habitsDoneToday / habits.length) * 100) + "%"}
            </p>
            <p className="text-xs text-foreground/50">Today Rate</p>
          </Card>
          <Card glass className="p-4 text-center">
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-danger-500 p-2">
              <Flame className="h-5 w-5 text-white" />
            </div>
            <p className="text-lg font-bold">{bestStreak}</p>
            <p className="text-xs text-foreground/50">Best Streak</p>
          </Card>
        </div>

        {/* Weekly heatmap */}
        <div className="rounded-3xl border border-border/50 bg-foreground/[0.03] p-6">
          <h3 className="mb-4 font-semibold">This Week</h3>
          <div className="grid grid-cols-7 gap-2">
            {weekDates.map((date, i) => (
              <div key={date} className="text-center">
                <p className="mb-2 text-xs text-muted-foreground">
                  {DAY_LABELS[i]}
                </p>
                <div className="space-y-1">
                  {habits.map((habit) => {
                    const done = weeklyMap[habit.id]?.[date] ?? false;
                    return (
                      <motion.div
                        key={habit.id}
                        whileHover={{ scale: 1.2 }}
                        className={`mx-auto flex h-8 w-8 items-center justify-center rounded-lg text-xs ${
                          done
                            ? "bg-success-500/20 text-success-500"
                            : "bg-foreground/5 text-foreground/20"
                        }`}
                      >
                        {done ? "✓" : "−"}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Habit cards */}
        <StaggerChildren className="grid gap-4 sm:grid-cols-2">
          {habits.map((habit) => {
            const doneToday = todayStatus[habit.id] ?? false;
            const weekDone = weekDates.filter(
              (d) => weeklyMap[habit.id]?.[d],
            ).length;

            return (
              <StaggerItem key={habit.id}>
                <Card glass tilt hover glow className="p-5">
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-12 w-12 items-center justify-center rounded-2xl text-xl"
                        style={{ backgroundColor: habit.color + "20" }}
                      >
                        <Target
                          className="h-5 w-5"
                          style={{ color: habit.color }}
                        />
                      </div>
                      <div>
                        <h3 className="font-semibold">{habit.name}</h3>
                        <p className="text-xs capitalize text-muted-foreground">
                          {habit.frequency}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEdit(habit)}
                        className="shrink-0 p-1.5 rounded-xl opacity-0 group-hover:opacity-100 hover:bg-foreground/5 text-foreground/30 hover:text-foreground transition-all"
                        aria-label="Edit habit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteHabit(habit.id)}
                        className="shrink-0 p-1.5 rounded-xl opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-foreground/30 hover:text-red-400 transition-all"
                        aria-label="Delete habit"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <ProgressRing
                        progress={(weekDone / 7) * 100}
                        size={44}
                        strokeWidth={4}
                        color="stroke-success-500"
                      />
                      <button
                        onClick={() => handleToggle(habit.id, !doneToday)}
                        className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
                          doneToday
                            ? "bg-success-500 text-white shadow-lg shadow-success-500/25"
                            : "bg-foreground/5 text-muted-foreground hover:bg-foreground/10"
                        }`}
                        aria-label={doneToday ? "Mark incomplete" : "Mark complete"}
                      >
                        <Check className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-success-500" />
                      <span className="font-medium">
                        {weekDone}/{7}
                      </span>
                      <span className="text-muted-foreground">this week</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Flame className="h-4 w-4 text-orange-500" />
                      <span className="font-medium">
                        {habit.current_streak ?? 0}
                      </span>
                      <span className="text-muted-foreground">
                        day{habit.current_streak === 1 ? "" : "s"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex gap-1">
                    {weekDates.map((date) => (
                      <div
                        key={date}
                        className={`h-1.5 flex-1 rounded-full ${
                          weeklyMap[habit.id]?.[date]
                            ? "bg-success-500"
                            : "bg-foreground/10"
                        }`}
                      />
                    ))}
                  </div>
                </Card>
              </StaggerItem>
            );
          })}
        </StaggerChildren>
      </div>

      {/* Create modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Create New Habit"
      >
        <HabitForm
          name={newName}
          onNameChange={setNewName}
          frequency={newFrequency}
          onFrequencyChange={setNewFrequency}
          color={newColor}
          onColorChange={setNewColor}
          reminderTime={newReminderTime}
          onReminderTimeChange={setNewReminderTime}
          reminderDays={newReminderDays}
          onReminderDaysChange={setNewReminderDays}
          onSubmit={() => createHabitAction().catch((err: Error) => toast.error(err.message))}
          loading={createHabit.isPending}
          submitLabel="Create Habit"
        />
      </Modal>

      {/* Edit modal */}
      <Modal
        isOpen={!!editingHabit}
        onClose={() => setEditingHabit(null)}
        title="Edit Habit"
      >
        {editingHabit && (
          <HabitForm
            name={newName}
            onNameChange={setNewName}
            frequency={newFrequency}
            onFrequencyChange={setNewFrequency}
            color={newColor}
            onColorChange={setNewColor}
            reminderTime={newReminderTime}
            onReminderTimeChange={setNewReminderTime}
            reminderDays={newReminderDays}
            onReminderDaysChange={setNewReminderDays}
            onSubmit={() => updateHabitAction().catch((err: Error) => toast.error(err.message))}
            loading={updateHabit.isPending}
            submitLabel="Save Changes"
          />
        )}
      </Modal>
    </PageTransition>
  );
}

// ponytail: extracted to avoid duplicating form JSX in empty+data states
function HabitForm({
  name,
  onNameChange,
  frequency,
  onFrequencyChange,
  color,
  onColorChange,
  reminderTime,
  onReminderTimeChange,
  reminderDays,
  onReminderDaysChange,
  onSubmit,
  loading,
  submitLabel,
}: {
  name: string;
  onNameChange: (v: string) => void;
  frequency: string;
  onFrequencyChange: (v: string) => void;
  color: string;
  onColorChange: (v: string) => void;
  reminderTime: string;
  onReminderTimeChange: (v: string) => void;
  reminderDays: number[];
  onReminderDaysChange: (v: number[]) => void;
  onSubmit: () => void;
  loading: boolean;
  submitLabel?: string;
}) {
  const toggleDay = (day: number) => {
    if (reminderDays.includes(day)) {
      onReminderDaysChange(reminderDays.filter((d) => d !== day));
    } else {
      onReminderDaysChange([...reminderDays, day].sort((a, b) => a - b));
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) {
          toast.error("Habit name is required");
          return;
        }
        onSubmit();
      }}
      className="space-y-4"
    >
      <Input
        label="Habit Name"
        placeholder="e.g., Morning Run"
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        required
      />
      <Select
        options={[
          { value: "daily", label: "Daily" },
          { value: "weekly", label: "Weekly" },
          { value: "monthly", label: "Monthly" },
        ]}
        value={frequency}
        onChange={onFrequencyChange}
        placeholder="Frequency"
      />
      <Input
        label="Reminder time (optional)"
        type="time"
        value={reminderTime}
        onChange={(e) => onReminderTimeChange(e.target.value)}
      />
      {reminderTime && (
        <div>
          <label className="mb-2 block text-sm font-medium text-foreground/80">
            Remind on days
          </label>
          <div className="flex gap-1.5">
            {DAY_LABELS.map((label, i) => (
              <button
                key={label}
                type="button"
                onClick={() => toggleDay(i)}
                className={cn(
                  "flex-1 h-9 rounded-lg text-xs font-medium border transition-all",
                  reminderDays.includes(i)
                    ? "bg-primary-500/15 text-primary-500 border-primary-500/40"
                    : "text-muted-foreground border-border/50 hover:bg-foreground/5",
                )}
                aria-pressed={reminderDays.includes(i)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
      <div>
        <label className="mb-2 block text-sm font-medium text-foreground/80">
          Color
        </label>
        <div className="flex gap-2">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => onColorChange(c)}
              className={`h-8 w-8 rounded-xl transition-all ${
                color === c
                  ? "scale-110 ring-2 ring-primary-500 ring-offset-2"
                  : ""
              }`}
              style={{ backgroundColor: c }}
              aria-label={`Select color ${c}`}
            />
          ))}
        </div>
      </div>
      <Button type="submit" className="w-full" loading={loading}>
        {submitLabel ?? "Create Habit"}
      </Button>
    </form>
  );
}
