import type { ActivityAction } from "@/lib/activity";

/**
 * Client-safe display metadata for activity actions. Pure module (no DB
 * imports) so it can be used from client components.
 */
const ACTION_META: Record<ActivityAction, { icon: string; label: string }> = {
  "task.created": { icon: "Plus", label: "created task" },
  "task.updated": { icon: "Pencil", label: "updated task" },
  "task.completed": { icon: "Check", label: "completed task" },
  "task.reopened": { icon: "RotateCcw", label: "reopened task" },
  "task.deleted": { icon: "Trash2", label: "deleted task" },
  "subtask.created": { icon: "ListChecks", label: "added subtask" },
  "subtask.completed": { icon: "CheckCheck", label: "completed subtask" },
  "subtask.deleted": { icon: "XCircle", label: "removed subtask" },
  "project.created": { icon: "FolderPlus", label: "created project" },
  "project.updated": { icon: "FolderEdit", label: "updated project" },
  "project.deleted": { icon: "FolderX", label: "deleted project" },
  "habit.created": { icon: "Plus", label: "created habit" },
  "habit.updated": { icon: "Pencil", label: "updated habit" },
  "habit.deleted": { icon: "Trash2", label: "deleted habit" },
  "habit.logged": { icon: "Flame", label: "logged habit" },
  "tag.created": { icon: "Plus", label: "created tag" },
  "tag.updated": { icon: "Pencil", label: "updated tag" },
  "tag.deleted": { icon: "Trash2", label: "deleted tag" },
  "comment.created": { icon: "MessageSquare", label: "commented on task" },
};

export function actionMeta(action: ActivityAction) {
  return ACTION_META[action] ?? { icon: "Activity", label: action };
}