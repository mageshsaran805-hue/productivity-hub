"use client";

import { motion } from "framer-motion";
import { PageTransition } from "@/components/animations/page-transition";
import { Button } from "@/components/ui/button";
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from "@/lib/queries";
import { Bell, Clock, CheckCircle2, AlertCircle, Flame, Sparkles, CheckCheck } from "lucide-react";
import type { AppNotification } from "@/types";

function formatRelative(dateStr: string) {
  const d = new Date(dateStr);
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
}

function iconFor(n: AppNotification) {
  switch (n.type) {
    case "habit_reminder":
      return { Icon: Flame, color: "text-secondary-500", bg: "bg-secondary-500/10" };
    case "task_reminder":
      return { Icon: Clock, color: "text-warning-500", bg: "bg-warning-500/10" };
    case "due_date":
      return { Icon: AlertCircle, color: "text-danger-500", bg: "bg-danger-500/10" };
    case "achievement":
      return { Icon: Sparkles, color: "text-success-500", bg: "bg-success-500/10" };
    default:
      return { Icon: Bell, color: "text-primary-500", bg: "bg-primary-500/10" };
  }
}

export default function NotificationsPage() {
  const { data: notifications, isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const unreadCount = (notifications ?? []).filter((n) => !n.read).length;

  const handleMarkAll = () => {
    if (unreadCount === 0) return;
    markAllRead.mutate();
  };

  const handleClick = (n: AppNotification) => {
    if (!n.read) markRead.mutate(n.id);
  };

  return (
    <PageTransition>
      <div className="space-y-6 max-w-3xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Notifications</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {unreadCount > 0
                ? `${unreadCount} unread`
                : "You're all caught up"}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAll}
            disabled={unreadCount === 0 || markAllRead.isPending}
            icon={<CheckCheck className="w-4 h-4" />}
          >
            Mark all read
          </Button>
        </div>

        {isLoading ? (
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
        ) : (notifications ?? []).length === 0 ? (
          <div className="rounded-3xl bg-foreground/[0.03] border border-border/50">
            <div className="text-center py-16">
              <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No notifications yet</h3>
              <p className="text-sm text-muted-foreground">
                Task and habit reminders will show up here.
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl bg-foreground/[0.03] border border-border/50 overflow-hidden">
            <div className="divide-y divide-border/50">
              {notifications!.map((notif, i) => {
                const { Icon, color, bg } = iconFor(notif);
                return (
                  <motion.button
                    key={notif.id}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.03, 0.4) }}
                    onClick={() => handleClick(notif)}
                    className={`w-full flex items-start gap-4 p-4 text-left transition-colors hover:bg-foreground/5 ${
                      !notif.read ? "bg-primary-500/[0.04]" : "opacity-60"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-2xl ${bg} flex items-center justify-center shrink-0`}>
                      <Icon className={`w-5 h-5 ${color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-medium">{notif.title}</p>
                        {!notif.read && <span className="w-1.5 h-1.5 rounded-full bg-primary-500 shrink-0" />}
                      </div>
                      {notif.message && <p className="text-sm text-foreground/60">{notif.message}</p>}
                      <p className="text-xs text-muted-foreground mt-1">{formatRelative(notif.created_at)}</p>
                    </div>
                    {notif.read && (
                      <span className="shrink-0 text-muted-foreground/40">
                        <CheckCircle2 className="w-4 h-4" />
                      </span>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}