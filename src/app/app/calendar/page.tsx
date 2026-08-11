"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { PageTransition } from "@/components/animations/page-transition";
import { Button } from "@/components/ui/button";
import { Tabs } from "@/components/ui/tabs";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCalendarEvents, useTasksDueInRange, useProjectsDueInRange } from "@/lib/queries";

type ViewType = "month" | "week" | "day";

const views = [
  { id: "month", label: "Month" },
  { id: "week", label: "Week" },
  { id: "day", label: "Day" },
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

type CalendarEvent = { day: number; date: Date; title: string; time: string; color: string; due_date?: string };

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
          time: evt.is_all_day ? "All day" : d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          color: evt.color,
          due_date: evt.start_date,
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
        });
      }
    }

    list.sort((a, b) => a.date.getTime() - b.date.getTime());
    return list;
  }, [calendarEvents, tasksDue, projectsDue]);
}

function isSameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString();
}

export default function CalendarPage() {
  const now = new Date();
  const [view, setView] = useState<ViewType>("month");
  const [currentDate, setCurrentDate] = useState(new Date(now.getFullYear(), now.getMonth(), 1));


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
    // day
    return { rangeStart: currentDate, rangeEnd: currentDate, headerLabel: `${MONTHS[currentDate.getMonth()]} ${currentDate.getDate()}, ${currentDate.getFullYear()}` };
  }, [view, currentDate]);

  const events = useViewEvents(rangeStart, rangeEnd);

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

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold">Calendar</h2>
            <div className="flex items-center gap-1">
              <button onClick={navBack} className="p-1.5 rounded-xl hover:bg-foreground/5 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={navForward} className="p-1.5 rounded-xl hover:bg-foreground/5 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <span className="text-lg font-medium">{headerLabel}</span>
          </div>
          <div className="flex items-center gap-3">
            <Tabs tabs={views} activeTab={view} onChange={(v) => setView(v as ViewType)} />
            <Button size="sm" icon={<Plus className="w-4 h-4" />}>Event</Button>
          </div>
        </div>

        {view === "month" && <MonthView events={events} currentDate={currentDate} />}
        {view === "week" && <WeekView events={events} weekStart={getWeekStart(currentDate)} />}
        {view === "day" && <DayView events={events} date={currentDate} />}
      </div>
    </PageTransition>
  );
}

// ─── MONTH VIEW ──────────────────────────────────────────────────────────

function MonthView({ events, currentDate }: { events: CalendarEvent[]; currentDate: Date }) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const today = new Date();

  const isToday = (day: number) =>
    today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;

  return (
    <div className="rounded-3xl bg-foreground/[0.03] border border-border/50 p-6">
      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAYS.map((day) => (
          <div key={day} className="text-center text-xs text-foreground/40 font-medium py-2">{day}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`e-${i}`} className="min-h-[100px] rounded-xl" />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dayEvents = events.filter((e) => isSameDay(e.date, new Date(year, month, day)));
          return (
            <motion.div
              key={day}
              whileHover={{ scale: 1.02 }}
              className={cn(
                "min-h-[100px] p-2 rounded-xl transition-all cursor-pointer border",
                isToday(day)
                  ? "bg-primary-500/10 border-primary-500/30"
                  : "hover:bg-foreground/5 border-transparent"
              )}
            >
              <span className={cn("text-sm font-medium", isToday(day) && "text-primary-500")}>{day}</span>
              <div className="mt-1 space-y-1">
                {dayEvents.slice(0, 3).map((event, j) => (
                  <div key={j} className="px-1.5 py-0.5 rounded-md text-[10px] font-medium text-white truncate" style={{ backgroundColor: event.color }}>
                    {event.time !== "All day" && <span>{event.time} </span>}
                    {event.title}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-[10px] text-muted-foreground">+{dayEvents.length - 3} more</div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ─── WEEK VIEW ───────────────────────────────────────────────────────────

function WeekView({ events, weekStart }: { events: CalendarEvent[]; weekStart: Date }) {
  const today = new Date();

  return (
    <div className="rounded-3xl bg-foreground/[0.03] border border-border/50 p-4">
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 7 }).map((_, i) => {
          const date = addDays(weekStart, i);
          const dayEvents = events.filter((e) => isSameDay(e.date, date));
          const isTodayDay = isSameDay(date, today);

          return (
            <div key={i} className="min-h-[200px]">
              <div className={cn("text-center py-2 rounded-xl mb-2", isTodayDay && "bg-primary-500/10")}>
                <div className="text-xs text-foreground/40">{DAYS[i]}</div>
                <div className={cn("text-lg font-semibold", isTodayDay && "text-primary-500")}>{date.getDate()}</div>
              </div>
              <div className="space-y-1">
                {dayEvents.map((event, j) => (
                  <div key={j} className="px-1.5 py-1 rounded-md text-[11px] font-medium text-white truncate" style={{ backgroundColor: event.color }}>
                    {event.time !== "All day" && <span className="opacity-80">{event.time} </span>}
                    {event.title}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── DAY VIEW ────────────────────────────────────────────────────────────

function DayView({ events, date }: { events: CalendarEvent[]; date: Date }) {
  const today = new Date();
  const isTodayDay = isSameDay(date, today);
  const dayEvents = events.filter((e) => isSameDay(e.date, date));

  return (
    <div className="rounded-3xl bg-foreground/[0.03] border border-border/50 p-6">
      <div className={cn("text-center mb-4", isTodayDay && "text-primary-500")}>
        <div className="text-sm text-foreground/40">{DAYS[date.getDay()]}</div>
        <div className="text-3xl font-bold">{date.getDate()}</div>
      </div>

      {/* All-day events */}
      {dayEvents.filter((e) => e.time === "All day").length > 0 && (
        <div className="mb-4 space-y-1">
          <div className="text-xs text-foreground/40 font-medium mb-1">All day</div>
          {dayEvents.filter((e) => e.time === "All day").map((event, j) => (
            <div key={j} className="px-2 py-1.5 rounded-lg text-sm font-medium text-white" style={{ backgroundColor: event.color }}>
              {event.title}
            </div>
          ))}
        </div>
      )}

      {/* Hour slots */}
      <div className="space-y-0">
        {HOURS.map((label, hour) => {
          const hourEvents = dayEvents.filter((e) => {
            if (e.time === "All day") return false;
            const d = new Date(e.due_date!);
            return d.getHours() === hour;
          });
          return (
            <div key={hour} className="flex gap-3 border-t border-border/30 min-h-[48px] group">
              <div className="w-16 text-[10px] text-foreground/40 py-1 text-right shrink-0">{label}</div>
              <div className="flex-1 py-0.5 space-y-0.5">
                {hourEvents.map((event, j) => (
                  <div key={j} className="px-2 py-1 rounded-md text-xs font-medium text-white" style={{ backgroundColor: event.color }}>
                    {event.title}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
