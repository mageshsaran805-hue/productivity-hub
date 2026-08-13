"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PageTransition } from "@/components/animations/page-transition";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Button } from "@/components/ui/button";
import { Tabs } from "@/components/ui/tabs";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import toast from "react-hot-toast";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  CalendarDays,
  CalendarRange,
  Clock,
  ListChecks,
  FolderKanban,
  Sparkles,
  Loader2,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCalendarEvents, useTasksDueInRange, useProjectsDueInRange, useCreateCalendarEvent } from "@/lib/queries";

type ViewType = "month" | "week" | "day";

const views = [
  { id: "month", label: "Month", icon: <CalendarDays className="w-4 h-4" /> },
  { id: "week", label: "Week", icon: <CalendarRange className="w-4 h-4" /> },
  { id: "day", label: "Day", icon: <Clock className="w-4 h-4" /> },
];

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = Array.from({ length: 24 }, (_, i) =>
  `${i === 0 ? "12" : i > 12 ? i - 12 : i} ${i < 12 ? "AM" : "PM"}`
);

const priorityColors: Record<string, string> = {
  urgent: "#ef4444",
  high: "#f59e0b",
  medium: "#eab308",
  low: "#22c55e",
  none: "#6b7280",
};

const EVENT_COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#ef4444",
  "#f59e0b",
  "#22c55e",
  "#06b6d4",
  "#3b82f6",
];

function getWeekStart(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

function addDays(date: Date, n: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function formatDateISO(date: Date) {
  return date.toISOString().split("T")[0];
}

function isSameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString();
}

function formatTime(date: Date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

type CalendarEvent = { day: number; date: Date; title: string; time: string; color: string; due_date?: string; kind: "event" | "task" | "project" };

function useViewEvents(start: Date, end: Date) {
  const startStr = formatDateISO(start);
  const endStr = formatDateISO(end);

  const { data: calendarEvents } = useCalendarEvents(startStr, endStr);
  const { data: tasksDue } = useTasksDueInRange(startStr, endStr);
  const { data: projectsDue } = useProjectsDueInRange(startStr, endStr);

  return useMemo(() => {
    const list: CalendarEvent[] = [];

    if (calendarEvents) {
      for (const evt of calendarEvents) {
        const d = new Date(evt.start_date);
        list.push({
          day: d.getDate(),
          date: d,
          title: evt.title,
          time: evt.is_all_day ? "All day" : formatTime(d),
          color: evt.color,
          due_date: evt.start_date,
          kind: "event",
        });
      }
    }

    if (tasksDue) {
      for (const task of tasksDue) {
        if (!task.due_date) continue;
        list.push({
          day: new Date(task.due_date).getDate(),
          date: new Date(task.due_date),
          title: task.title,
          time: "All day",
          color: priorityColors[task.priority] ?? priorityColors.none,
          due_date: task.due_date,
          kind: "task",
        });
      }
    }

    if (projectsDue) {
      for (const project of projectsDue) {
        if (!project.due_date) continue;
        list.push({
          day: new Date(project.due_date).getDate(),
          date: new Date(project.due_date),
          title: `📁 ${project.name}`,
          time: "All day",
          color: project.color || "#6366f1",
          due_date: project.due_date,
          kind: "project",
        });
      }
    }

    list.sort((a, b) => a.date.getTime() - b.date.getTime());
    return list;
  }, [calendarEvents, tasksDue, projectsDue]);
}

// ─── Event chip ───────────────────────────────────────────────────────────

function EventChip({ event, compact = false }: { event: CalendarEvent; compact?: boolean }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      className={cn(
        "group/chip flex items-center gap-1.5 rounded-lg border transition-shadow",
        compact ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1 text-[11px]",
      )}
      style={{
        backgroundColor: `${event.color}1a`,
        borderColor: `${event.color}40`,
        color: event.color,
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full shrink-0"
        style={{ backgroundColor: event.color }}
      />
      {!compact && event.time !== "All day" && (
        <span className="text-[10px] opacity-80 shrink-0">{event.time}</span>
      )}
      <span className="truncate font-semibold">{event.title}</span>
    </motion.div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────

export default function CalendarPage() {
  const now = new Date();
  const [view, setView] = useState<ViewType>("month");
  const [currentDate, setCurrentDate] = useState(new Date(now.getFullYear(), now.getMonth(), 1));
  const [showModal, setShowModal] = useState(false);

  const { rangeStart, rangeEnd, headerLabel } = useMemo(() => {
    if (view === "month") {
      const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      return { rangeStart: start, rangeEnd: end, headerLabel: `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}` };
    }
    if (view === "week") {
      const start = getWeekStart(currentDate);
      const end = addDays(start, 6);
      return { rangeStart: start, rangeEnd: end, headerLabel: `${MONTHS[start.getMonth()]} ${start.getDate()} — ${MONTHS[end.getMonth()]} ${end.getDate()}, ${end.getFullYear()}` };
    }
    return { rangeStart: currentDate, rangeEnd: currentDate, headerLabel: `${MONTHS[currentDate.getMonth()]} ${currentDate.getDate()}, ${currentDate.getFullYear()}` };
  }, [view, currentDate]);

  const events = useViewEvents(rangeStart, rangeEnd);

  const totalEvents = countKind(events, "event");

  const navBack = () => {
    if (view === "month") setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    else if (view === "week") setCurrentDate(addDays(currentDate, -7));
    else setCurrentDate(addDays(currentDate, -1));
  };

  const navForward = () => {
    if (view === "month") setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    else if (view === "week") setCurrentDate(addDays(currentDate, 7));
    else setCurrentDate(addDays(currentDate, 1));
  };

  const goToday = () => {
    if (view === "month") setCurrentDate(new Date(now.getFullYear(), now.getMonth(), 1));
    else if (view === "week") setCurrentDate(new Date(now.getFullYear(), now.getMonth(), now.getDate()));
    else setCurrentDate(new Date(now.getFullYear(), now.getMonth(), now.getDate()));
  };

  const todayRef = useMemo(() => new Date(), []);
  const isCurrentPeriod =
    view === "month"
      ? isSameDay(rangeStart, new Date(todayRef.getFullYear(), todayRef.getMonth(), 1))
      : view === "week"
        ? isSameDay(rangeStart, getWeekStart(todayRef))
        : isSameDay(rangeStart, todayRef);

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 via-secondary-500 to-accent-500 shadow-lg shadow-primary-500/20">
                <CalendarDays className="h-5 w-5 text-white" />
              </span>
              <span className="bg-gradient-to-r from-primary-500 via-secondary-500 to-accent-500 bg-clip-text text-transparent">
                Calendar
              </span>
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Plan your days — events, task due dates and project milestones in one view.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Tabs tabs={views} activeTab={view} onChange={(v) => setView(v as ViewType)} />
            <Button
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => setShowModal(true)}
              className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-lg shadow-primary-500/20"
            >
              New Event
            </Button>
          </div>
        </div>

        {/* Navigation + stats */}
        <GlassPanel className="p-4 sm:p-5">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 p-1 bg-foreground/5 rounded-2xl">
                <button
                  onClick={navBack}
                  className="p-2 rounded-xl hover:bg-foreground/10 transition-colors text-foreground/60 hover:text-foreground"
                  aria-label="Previous"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={navForward}
                  className="p-2 rounded-xl hover:bg-foreground/10 transition-colors text-foreground/60 hover:text-foreground"
                  aria-label="Next"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-3">
                <h3 className="text-lg sm:text-xl font-semibold">{headerLabel}</h3>
                <button
                  onClick={goToday}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-200",
                    isCurrentPeriod
                      ? "bg-primary-500/10 border-primary-500/30 text-primary-500"
                      : "bg-foreground/5 border-border/50 text-foreground/60 hover:text-foreground hover:bg-foreground/10",
                  )}
                >
                  Today
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 w-full lg:w-auto">
              <StatMini
                icon={<Sparkles className="w-3.5 h-3.5" />}
                value={totalEvents}
                label="Events"
                color="#6366f1"
              />
              <StatMini
                icon={<ListChecks className="w-3.5 h-3.5" />}
                value={countKind(events, "task")}
                label="Tasks due"
                color="#22c55e"
              />
              <StatMini
                icon={<FolderKanban className="w-3.5 h-3.5" />}
                value={countKind(events, "project")}
                label="Milestones"
                color="#f59e0b"
              />
            </div>
          </div>
        </GlassPanel>

        {/* Views */}
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            {view === "month" && <MonthView events={events} currentDate={currentDate} onNewEvent={() => setShowModal(true)} />}
            {view === "week" && <WeekView events={events} weekStart={getWeekStart(currentDate)} />}
            {view === "day" && <DayView events={events} date={currentDate} />}
          </motion.div>
        </AnimatePresence>

        {/* Create event modal */}
        <NewEventModal isOpen={showModal} onClose={() => setShowModal(false)} />
      </div>
    </PageTransition>
  );
}

// ─── Helpers for stats ────────────────────────────────────────────────────

function countKind(events: CalendarEvent[], kind: "event" | "task" | "project") {
  return events.filter((e) => e.kind === kind).length;
}

function StatMini({ icon, value, label, color }: { icon: React.ReactNode; value: number; label: string; color: string }) {
  return (
    <div className="flex items-center gap-2.5 px-3 py-2 rounded-2xl bg-foreground/[0.03] border border-border/50">
      <span
        className="flex h-7 w-7 items-center justify-center rounded-xl"
        style={{ backgroundColor: `${color}1a`, color }}
      >
        {icon}
      </span>
      <div className="leading-tight">
        <div className="text-base font-bold text-foreground">{value}</div>
        <div className="text-[10px] text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}

// ─── MONTH VIEW ──────────────────────────────────────────────────────────

function MonthView({
  events,
  currentDate,
  onNewEvent,
}: {
  events: CalendarEvent[];
  currentDate: Date;
  onNewEvent: () => void;
}) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const today = new Date();

  const isToday = (day: number) =>
    today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;

  return (
    <GlassPanel className="p-4 sm:p-6" intensity="light">
      <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
        {DAYS.map((day) => (
          <div key={day} className="text-center text-xs text-foreground/40 font-semibold uppercase tracking-wider py-2">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`e-${i}`} className="min-h-[92px] sm:min-h-[110px] rounded-2xl" />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dayEvents = events.filter((e) => isSameDay(e.date, new Date(year, month, day)));
          return (
            <motion.div
              key={day}
              whileHover={{ scale: 1.02, y: -2 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              onClick={() => {
                // clicking a day opens day view at that date
                onNewEvent();
              }}
              className={cn(
                "min-h-[92px] sm:min-h-[110px] p-1.5 sm:p-2 rounded-2xl transition-all cursor-pointer border",
                isToday(day)
                  ? "bg-gradient-to-br from-primary-500/15 to-secondary-500/15 border-primary-500/40 ring-2 ring-primary-500/20 shadow-lg shadow-primary-500/5"
                  : "bg-foreground/[0.02] hover:bg-foreground/[0.05] border-white/10 dark:border-white/5",
              )}
            >
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-sm font-semibold",
                    isToday(day) && "bg-gradient-to-br from-primary-500 to-secondary-500 text-white shadow-md shadow-primary-500/30",
                  )}
                >
                  {day}
                </span>
                {dayEvents.length > 0 && (
                  <span className="hidden sm:inline-flex text-[10px] font-bold text-primary-500/70">
                    {dayEvents.length}
                  </span>
                )}
              </div>
              <div className="mt-1.5 space-y-1">
                {dayEvents.slice(0, 3).map((event, j) => (
                  <EventChip key={j} event={event} compact />
                ))}
                {dayEvents.length > 3 && (
                  <div className="px-1 text-[10px] font-semibold text-muted-foreground">
                    +{dayEvents.length - 3} more
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </GlassPanel>
  );
}

// ─── WEEK VIEW ───────────────────────────────────────────────────────────

function WeekView({ events, weekStart }: { events: CalendarEvent[]; weekStart: Date }) {
  const today = new Date();

  return (
    <GlassPanel className="p-4" intensity="light">
      <div className="grid grid-cols-2 sm:grid-cols-7 gap-2 sm:gap-3">
        {Array.from({ length: 7 }).map((_, i) => {
          const date = addDays(weekStart, i);
          const dayEvents = events.filter((e) => isSameDay(e.date, date));
          const isTodayDay = isSameDay(date, today);

          return (
            <motion.div
              key={i}
              whileHover={{ y: -3 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className={cn(
                "min-h-[180px] rounded-2xl border p-2.5 transition-all",
                isTodayDay
                  ? "bg-gradient-to-b from-primary-500/12 to-secondary-500/5 border-primary-500/30 shadow-lg shadow-primary-500/5"
                  : "bg-foreground/[0.02] border-white/10 dark:border-white/5 hover:bg-foreground/[0.04]",
              )}
            >
              <div className="text-center py-1.5 mb-2">
                <div className={cn("text-xs font-medium uppercase tracking-wider", isTodayDay ? "text-primary-500" : "text-foreground/40")}>
                  {DAYS[i]}
                </div>
                <div
                  className={cn(
                    "mx-auto mt-1 flex h-8 w-8 items-center justify-center rounded-full text-lg font-bold",
                    isTodayDay && "bg-gradient-to-br from-primary-500 to-secondary-500 text-white shadow-md shadow-primary-500/30",
                  )}
                >
                  {date.getDate()}
                </div>
              </div>
              <div className="space-y-1.5">
                {dayEvents.length === 0 && (
                  <div className="text-center text-[10px] text-foreground/25 pt-3">No events</div>
                )}
                {dayEvents.map((event, j) => (
                  <EventChip key={j} event={event} />
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>
    </GlassPanel>
  );
}

// ─── DAY VIEW ────────────────────────────────────────────────────────────

function DayView({ events, date }: { events: CalendarEvent[]; date: Date }) {
  const now = new Date();
  const isTodayDay = isSameDay(date, now);
  const dayEvents = events.filter((e) => isSameDay(e.date, date));
  const allDayEvents = dayEvents.filter((e) => e.time === "All day");
  const timedEvents = dayEvents.filter((e) => e.time !== "All day");
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  return (
    <GlassPanel className="p-4 sm:p-6" intensity="light">
      <div className={cn("text-center mb-5", isTodayDay && "text-primary-500")}>
        <div className="text-sm text-foreground/40 uppercase tracking-wider font-medium">
          {DAYS[date.getDay()]}
        </div>
        <div
          className={cn(
            "mx-auto mt-1 inline-flex h-12 w-12 items-center justify-center rounded-2xl text-3xl font-bold",
            isTodayDay && "bg-gradient-to-br from-primary-500 to-secondary-500 text-white shadow-lg shadow-primary-500/30",
          )}
        >
          {date.getDate()}
        </div>
      </div>

      {allDayEvents.length > 0 && (
        <div className="mb-5">
          <div className="flex items-center gap-2 text-xs text-foreground/40 font-semibold uppercase tracking-wider mb-2">
            <span className="h-1.5 w-1.5 rounded-full bg-foreground/40" /> All day
          </div>
          <div className="space-y-1.5">
            {allDayEvents.map((event, j) => (
              <EventChip key={j} event={event} />
            ))}
          </div>
        </div>
      )}

      <div className="space-y-0 relative">
        {isTodayDay && (
          <div
            className="pointer-events-none absolute left-0 right-0 z-10"
            style={{ top: `${(nowMinutes / 1440) * 100}%` }}
          >
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-danger-500 shadow-[0_0_0_4px_rgba(239,68,68,0.2)]" />
              <span className="h-px flex-1 bg-gradient-to-r from-danger-500 to-transparent" />
            </div>
          </div>
        )}
        {HOURS.map((label, hour) => {
          const hourEvents = timedEvents.filter((e) => {
            const d = new Date(e.due_date!);
            return d.getHours() === hour;
          });
          const isPast = isTodayDay && now.getHours() > hour;
          return (
            <div key={hour} className="flex gap-3 border-t border-border/30 min-h-[52px] group">
              <div
                className={cn(
                  "w-16 text-[10px] py-1 text-right shrink-0 font-medium",
                  isPast ? "text-foreground/20" : "text-foreground/40",
                )}
              >
                {label}
              </div>
              <div className="flex-1 py-1 space-y-1">
                {hourEvents.map((event, j) => (
                  <EventChip key={j} event={event} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </GlassPanel>
  );
}

// ─── NEW EVENT MODAL ─────────────────────────────────────────────────────

function NewEventModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const createEvent = useCreateCalendarEvent();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(() => formatDateISO(new Date()));
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [allDay, setAllDay] = useState(false);
  const [color, setColor] = useState(EVENT_COLORS[0]);

  const reset = () => {
    setTitle("");
    setDescription("");
    setDate(formatDateISO(new Date()));
    setStartTime("09:00");
    setEndTime("10:00");
    setAllDay(false);
    setColor(EVENT_COLORS[0]);
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error("Please give your event a title");
      return;
    }
    if (!allDay && !startTime) {
      toast.error("Please pick a start time");
      return;
    }

    const startIso = new Date(`${date}T${startTime || "09:00"}`).toISOString();
    const endIso = allDay
      ? new Date(`${date}T23:59`).toISOString()
      : new Date(`${date}T${endTime || startTime}`).toISOString();

    try {
      await createEvent.mutateAsync({
        title: title.trim(),
        description: description.trim() || null,
        start_date: startIso,
        end_date: endIso,
        is_all_day: allDay,
        color,
      });
      toast.success("Event added to your calendar");
      reset();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create event");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="New event"
      size="md"
    >
      <div className="space-y-4">
        <Input
          label="Title"
          placeholder="e.g. Team standup"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <Input
          label="Description (optional)"
          placeholder="Add a note or agenda..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <div className="flex items-end pb-1">
            <label className="flex items-center gap-3 text-sm font-medium text-foreground/80">
              <Switch checked={allDay} onChange={setAllDay} />
              All day
            </label>
          </div>
        </div>

        {!allDay && (
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Start"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
            <Input
              label="End"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-foreground/80 mb-2">Color</label>
          <div className="flex gap-2 flex-wrap">
            {EVENT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-200",
                  color === c && "ring-2 ring-foreground/60 ring-offset-2 ring-offset-background scale-110",
                )}
                style={{ backgroundColor: c }}
                aria-label={`Select color ${c}`}
              >
                {color === c && <Check className="w-4 h-4 text-white" />}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            loading={createEvent.isPending}
            icon={!createEvent.isPending ? <Plus className="w-4 h-4" /> : <Loader2 className="w-4 h-4 animate-spin" />}
          >
            Create event
          </Button>
        </div>
      </div>
    </Modal>
  );
}
