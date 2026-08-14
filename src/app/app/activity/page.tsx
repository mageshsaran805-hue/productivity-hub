"use client";

import { PageTransition } from "@/components/animations/page-transition";
import { GlassPanel } from "@/components/ui/glass-panel";
import { EmptyState } from "@/components/ui/empty-state";
import { CardSkeleton } from "@/components/ui/skeleton";
import { useActivity } from "@/lib/queries";
import { actionMeta } from "@/lib/activity-meta";
import type { ActivityRow } from "@/types";
import { Activity as ActivityIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const ICONS = {
  Plus: "text-emerald-400",
  Pencil: "text-blue-400",
  Check: "text-success-500",
  CheckCheck: "text-success-500",
  RotateCcw: "text-yellow-400",
  Trash2: "text-red-400",
  ListChecks: "text-indigo-400",
  XCircle: "text-red-400",
  FolderPlus: "text-secondary-500",
  FolderEdit: "text-blue-400",
  FolderX: "text-red-400",
  Flame: "text-orange-500",
  MessageSquare: "text-sky-400",
  Activity: "text-foreground/60",
} as const;

function ActivityIconView({ name }: { name: string }) {
  // Map the metadata icon names to a small set of lucide glyphs via char.
  const color = (ICONS as Record<string, string>)[name] ?? "text-foreground/60";
  const glyph: Record<string, string> = {
    Plus: "＋",
    Pencil: "✎",
    Check: "✓",
    CheckCheck: "✓✓",
    RotateCcw: "↺",
    Trash2: "✕",
    ListChecks: "☰",
    XCircle: "✕",
    FolderPlus: "＋",
    FolderEdit: "✎",
    FolderX: "✕",
    Flame: "⚡",
    MessageSquare: "💬",
    Activity: "•",
  };
  return (
    <span
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold",
        color,
        "bg-foreground/[0.04]",
      )}
    >
      {glyph[name] ?? "•"}
    </span>
  );
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function entityLabel(action: string) {
  if (action.startsWith("task")) return "task";
  if (action.startsWith("project")) return "project";
  if (action.startsWith("habit")) return "habit";
  if (action.startsWith("subtask")) return "subtask";
  if (action.startsWith("tag")) return "tag";
  if (action.startsWith("comment")) return "task";
  return "item";
}

function formatTarget(action: string, metadata: Record<string, unknown> | null) {
  const name = metadata?.title ?? metadata?.name;
  if (typeof name === "string" && name) return ` "${name}"`;
  const date = metadata?.date;
  if (typeof date === "string" && date) return ` on ${date}`;
  return ` ${entityLabel(action)}`;
}

export default function ActivityPage() {
  const { data: activity, isLoading, error } = useActivity(50);

  return (
    <PageTransition>
      <div className="space-y-6 max-w-3xl">
        <div>
          <h2 className="text-2xl font-bold">Activity</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Your recent actions across tasks, projects, and habits.
          </p>
        </div>

        <GlassPanel className="p-6">
          {error && (
            <EmptyState
              icon={<ActivityIcon className="w-8 h-8" />}
              title="Failed to load activity"
              description="Something went wrong. Please try refreshing."
            />
          )}

          {!error && isLoading && (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          )}

          {!error && !isLoading && !activity?.length && (
            <EmptyState
              icon={<ActivityIcon className="w-8 h-8" />}
              title="No activity yet"
              description="Actions you take across the app will show up here."
            />
          )}

          {!error && !isLoading && activity && activity.length > 0 && (
            <ol className="relative space-y-5 before:absolute before:left-4 before:top-2 before:bottom-2 before:w-px before:bg-border/60">
              {(activity as ActivityRow[]).map((entry) => {
                const meta = actionMeta(entry.action as Parameters<typeof actionMeta>[0]);
                return (
                  <li key={entry.id} className="relative flex items-start gap-4">
                    <span className="relative z-10">
                      <ActivityIconView name={meta.icon} />
                    </span>
                    <div className="flex-1 min-w-0 pt-1">
                      <p className="text-sm text-foreground/85">
                        You <span className="font-medium">{meta.label}</span>
                        <span className="text-foreground/70">
                          {formatTarget(entry.action, entry.metadata)}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {relativeTime(entry.created_at)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </GlassPanel>
      </div>
    </PageTransition>
  );
}