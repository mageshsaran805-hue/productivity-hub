"use client";

import { motion } from "framer-motion";
import { PageTransition } from "@/components/animations/page-transition";
import { useDueNotifications } from "@/lib/queries";
import { Bell, Clock, CheckCircle2, AlertCircle } from "lucide-react";

function getDayStart(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

// ponytail: derives notifications from tasks instead of a separate notifications table.
// Keeps the data model simple — notifications are just time-sensitive task views.
// Add a dedicated notification system when users need push notifications or cross-entity feeds.
export default function NotificationsPage() {
  const { data: tasks, isLoading } = useDueNotifications();

  const todayStart = getDayStart(new Date());
  const todayEnd = new Date(todayStart.getTime() + 86400000 - 1);
  const tomorrowStart = new Date(todayStart.getTime() + 86400000);
  const tomorrowEnd = new Date(todayStart.getTime() + 2 * 86400000 - 1);

  const getTimeLabel = (dueDate: string | undefined) => {
    if (!dueDate) return "";
    const d = new Date(dueDate);
    if (d >= todayStart && d <= todayEnd) return "Due today";
    if (d >= tomorrowStart && d <= tomorrowEnd) return "Due tomorrow";
    const daysAgo = Math.ceil((todayStart.getTime() - d.getTime()) / 86400000);
    return `${daysAgo} day${daysAgo > 1 ? "s" : ""} ago`;
  };

  const notificationItems = (tasks || [])
    .map((task) => {
      const dueDate = task.due_date ? new Date(task.due_date) : null;
      let icon = Clock;
      let color = "text-warning-500";
      let bg = "bg-warning-500/10";
      let message = "Due today";

      if (task.status === "completed") {
        icon = CheckCircle2;
        color = "text-success-500";
        bg = "bg-success-500/10";
        message = "Completed";
      } else if (dueDate && dueDate < todayStart) {
        icon = AlertCircle;
        color = "text-danger-500";
        bg = "bg-danger-500/10";
        message = "Overdue";
      } else if (dueDate && dueDate >= tomorrowStart) {
        icon = Clock;
        color = "text-primary-500";
        bg = "bg-primary-500/10";
        message = "Due tomorrow";
      }

      let group = 3;
      if (task.status !== "completed") {
        if (dueDate && dueDate < todayStart) group = 0;
        else if (dueDate && dueDate <= todayEnd) group = 1;
        else group = 2;
      }

      return {
        id: task.id,
        icon,
        color,
        bg,
        title: task.title,
        message,
        time: getTimeLabel(task.due_date),
        group,
      };
    })
    .sort((a, b) => a.group - b.group);

  if (isLoading) {
    return (
      <PageTransition>
        <div className="space-y-6 max-w-3xl">
          <h2 className="text-2xl font-bold">Notifications</h2>
          <div className="rounded-3xl bg-foreground/[0.03] border border-border/50 overflow-hidden">
            <div className="divide-y divide-border/50">
              {[1, 2, 3].map((_, i) => (
                <div key={i} className="flex items-start gap-4 p-4">
                  <div className="w-10 h-10 rounded-2xl bg-foreground/10 animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-1/3 bg-foreground/10 rounded animate-pulse" />
                    <div className="h-3 w-2/3 bg-foreground/10 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-6 max-w-3xl">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Notifications</h2>
        </div>

        <div className="rounded-3xl bg-foreground/[0.03] border border-border/50 overflow-hidden">
          {notificationItems.length === 0 ? (
            <div className="text-center py-16">
              <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No notifications</h3>
              <p className="text-sm text-muted-foreground">You&apos;re all caught up!</p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {notificationItems.map((notif, i) => {
                const Icon = notif.icon;
                return (
                  <motion.div
                    key={notif.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`flex items-start gap-4 p-4 transition-colors hover:bg-foreground/5 ${
                      notif.group === 0 ? "bg-danger-500/[0.04]" : ""
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-2xl ${notif.bg} flex items-center justify-center shrink-0`}
                    >
                      <Icon className={`w-5 h-5 ${notif.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-medium">{notif.title}</p>
                        {notif.group === 0 && (
                          <span className="w-1.5 h-1.5 rounded-full bg-danger-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-foreground/60">{notif.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">{notif.time}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
