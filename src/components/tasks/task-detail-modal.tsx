"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import {
  useSubtasks,
  useCreateSubtask,
  useUpdateSubtask,
  useDeleteSubtask,
  useTags,
  useTaskTags,
  useAssignTag,
  useUnassignTag,
  useTaskComments,
  useCreateTaskComment,
  useDeleteTaskComment,
} from "@/lib/queries";
import type { Task } from "@/types";
import {
  Plus,
  Trash2,
  Check,
  X,
  MessageSquare,
  Tag as TagIcon,
  ListChecks,
  CalendarDays,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

interface TaskDetailModalProps {
  task: Task | null;
  onClose: () => void;
  onEdit: (task: Task) => void;
}

const PRIORITY_STYLES: Record<string, string> = {
  urgent: "bg-red-500/10 text-red-400 border-red-500/20",
  high: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  medium: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  low: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  none: "bg-gray-500/10 text-gray-400 border-gray-500/20",
};

const STATUS_STYLES: Record<string, string> = {
  backlog: "bg-gray-500/10 text-gray-400 border-gray-500/20",
  todo: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  in_progress: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  archived: "bg-gray-500/10 text-gray-400 border-gray-500/20",
};

export function TaskDetailModal({ task, onClose, onEdit }: TaskDetailModalProps) {
  const { data: subtasks, isLoading: subtasksLoading } = useSubtasks(task?.id ?? "");
  const { data: taskTags, isLoading: tagsLoading } = useTaskTags(task?.id ?? "");
  const { data: allTags } = useTags();
  const { data: comments, isLoading: commentsLoading } = useTaskComments(task?.id ?? "");

  const createSubtask = useCreateSubtask();
  const updateSubtask = useUpdateSubtask();
  const deleteSubtask = useDeleteSubtask();
  const assignTag = useAssignTag();
  const unassignTag = useUnassignTag();
  const createComment = useCreateTaskComment();
  const deleteComment = useDeleteTaskComment();

  const [newSubtask, setNewSubtask] = useState("");
  const [newComment, setNewComment] = useState("");
  const [showTagPicker, setShowTagPicker] = useState(false);

  const taskId = task?.id ?? "";

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskId || !newSubtask.trim()) return;
    createSubtask.mutate({ taskId, title: newSubtask.trim() }, {
      onSuccess: () => {
        setNewSubtask("");
        toast.success("Subtask added");
      },
      onError: () => toast.error("Failed to add subtask"),
    });
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskId || !newComment.trim()) return;
    createComment.mutate({ taskId, content: newComment.trim() }, {
      onSuccess: () => {
        setNewComment("");
        toast.success("Comment added");
      },
      onError: () => toast.error("Failed to add comment"),
    });
  };

  const assignedIds = new Set(taskTags?.map((t) => t.id) ?? []);

  return (
    <Modal
      isOpen={!!task}
      onClose={onClose}
      title={task?.title ?? "Task"}
      size="lg"
    >
      {task && (
        <div className="space-y-6">
          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border",
                STATUS_STYLES[task.status] ?? STATUS_STYLES.todo,
              )}
            >
              {task.status.replace("_", " ")}
            </span>
            <span
              className={cn(
                "inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border capitalize",
                PRIORITY_STYLES[task.priority] ?? PRIORITY_STYLES.none,
              )}
            >
              {task.priority} priority
            </span>
            {task.due_date && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border border-border/50 text-muted-foreground">
                <CalendarDays className="w-3 h-3" />
                {new Date(task.due_date).toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            )}
          </div>

          {task.description && (
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{task.description}</p>
          )}

          {/* Tags */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground/80 flex items-center gap-1.5">
                <TagIcon className="w-4 h-4" /> Tags
              </label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowTagPicker((v) => !v)}
                icon={<Plus className="w-3.5 h-3.5" />}
              >
                Add
              </Button>
            </div>
            {tagsLoading ? (
              <div className="flex gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {(taskTags ?? []).map((t) => (
                  <span
                    key={t.id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                    style={{ backgroundColor: `${t.color}22`, color: t.color }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: t.color }} />
                    {t.name}
                    <button
                      onClick={() => unassignTag.mutate({ taskId, tagId: t.id })}
                      className="hover:opacity-70"
                      aria-label={`Remove tag ${t.name}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                {!taskTags?.length && (
                  <span className="text-xs text-muted-foreground">No tags yet</span>
                )}
              </div>
            )}
            {showTagPicker && (
              <div className="p-3 rounded-2xl border border-border/50 bg-foreground/[0.02] space-y-1">
                {(allTags ?? [])
                  .filter((t) => !assignedIds.has(t.id))
                  .map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        assignTag.mutate({ taskId, tagId: t.id });
                        setShowTagPicker(false);
                      }}
                      className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg hover:bg-foreground/5 text-sm transition-colors"
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color }} />
                      {t.name}
                    </button>
                  ))}
                {!allTags?.length && (
                  <p className="text-xs text-muted-foreground">
                    No tags exist yet — create one in Settings.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Subtasks */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground/80 flex items-center gap-1.5">
              <ListChecks className="w-4 h-4" /> Subtasks
            </label>
            {subtasksLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            ) : (
              <div className="space-y-1.5">
                {(subtasks ?? []).map((st) => (
                  <div
                    key={st.id}
                    className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-foreground/[0.02] group"
                  >
                    <button
                      onClick={() =>
                        updateSubtask.mutate({ taskId, id: st.id, completed: !st.completed })
                      }
                      className={cn(
                        "shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all",
                        st.completed
                          ? "bg-emerald-500 border-emerald-500 text-white"
                          : "border-foreground/20 hover:border-primary-500/50",
                      )}
                      aria-label={st.completed ? "Mark subtask incomplete" : "Mark subtask complete"}
                    >
                      {st.completed && <Check className="w-3 h-3" />}
                    </button>
                    <span
                      className={cn(
                        "flex-1 text-sm min-w-0 truncate",
                        st.completed ? "line-through text-muted-foreground" : "text-foreground/80",
                      )}
                    >
                      {st.title}
                    </span>
                    <button
                      onClick={() => deleteSubtask.mutate({ taskId, id: st.id })}
                      className="shrink-0 p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-all"
                      aria-label="Delete subtask"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {!subtasks?.length && (
                  <p className="text-xs text-muted-foreground">No subtasks yet</p>
                )}
              </div>
            )}
            <form onSubmit={handleAddSubtask} className="flex items-center gap-2">
              <input
                type="text"
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                placeholder="Add a subtask..."
                className="flex-1 h-9 px-3 rounded-xl bg-foreground/[0.03] border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary-500/50 transition-colors"
              />
              <Button type="submit" size="sm" disabled={!newSubtask.trim()} loading={createSubtask.isPending}>
                Add
              </Button>
            </form>
          </div>

          {/* Comments */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground/80 flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4" /> Comments
            </label>
            {commentsLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            ) : (
              <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                {(comments ?? []).map((c) => (
                  <div key={c.id} className="group flex items-start gap-3">
                    <div className="flex-1 min-w-0 rounded-xl border border-border/50 bg-foreground/[0.02] p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-foreground/60">
                          {c.name || c.email?.split("@")[0] || "You"}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {new Date(c.created_at).toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-foreground/80 mt-1 whitespace-pre-wrap">{c.content}</p>
                    </div>
                    <button
                      onClick={() => deleteComment.mutate({ taskId, id: c.id })}
                      className="shrink-0 p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-all"
                      aria-label="Delete comment"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {!comments?.length && (
                  <p className="text-xs text-muted-foreground">No comments yet</p>
                )}
              </div>
            )}
            <form onSubmit={handleAddComment} className="flex items-start gap-2">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                rows={2}
                className="flex-1 px-3 py-2 rounded-xl bg-foreground/[0.03] border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary-500/50 transition-colors resize-none"
              />
              <Button type="submit" size="sm" disabled={!newComment.trim()} loading={createComment.isPending}>
                Post
              </Button>
            </form>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-border/50">
            <Button variant="ghost" type="button" onClick={onClose}>
              Close
            </Button>
            <Button type="button" onClick={() => onEdit(task)}>
              Edit Task
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}