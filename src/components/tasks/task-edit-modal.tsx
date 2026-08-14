"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { useUpdateTask } from "@/lib/queries";
import type { Task } from "@/types";
import toast from "react-hot-toast";

interface TaskEditModalProps {
  task: Task | null;
  onClose: () => void;
}

const RECURRENCE_OPTIONS = [
  { value: "", label: "Does not repeat" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

const REMIND_OPTIONS = [
  { value: "", label: "No reminder" },
  { value: "15", label: "15 minutes before" },
  { value: "30", label: "30 minutes before" },
  { value: "60", label: "1 hour before" },
  { value: "180", label: "3 hours before" },
  { value: "1440", label: "1 day before" },
  { value: "4320", label: "3 days before" },
  { value: "10080", label: "1 week before" },
];

export function TaskEditModal({ task, onClose }: TaskEditModalProps) {
  const updateTask = useUpdateTask();
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [priority, setPriority] = useState<string>(task?.priority ?? "medium");
  const [status, setStatus] = useState<string>(task?.status ?? "todo");
  const [dueDate, setDueDate] = useState(task?.due_date?.slice(0, 10) ?? "");
  const [remindBefore, setRemindBefore] = useState<string>(task?.remind_before_minutes ? String(task.remind_before_minutes) : "");
  const [recurrence, setRecurrence] = useState(task?.recurring_rule ?? "");

  const reset = () => {
    if (!task) return;
    setTitle(task.title);
    setDescription(task.description ?? "");
    setPriority(task.priority);
    setStatus(task.status);
    setDueDate(task.due_date?.slice(0, 10) ?? "");
    setRemindBefore(task.remind_before_minutes ? String(task.remind_before_minutes) : "");
    setRecurrence(task.recurring_rule ?? "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task || !title.trim()) return;
    try {
      await updateTask.mutateAsync({
        id: task.id,
        title: title.trim(),
        description: description.trim() || undefined,
        priority: priority as Task["priority"],
        status: status as Task["status"],
        due_date: dueDate || undefined,
        remind_before_minutes: remindBefore ? Number(remindBefore) : null,
        is_recurring: !!recurrence,
        recurring_rule: recurrence || undefined,
      });
      toast.success("Task updated");
      onClose();
    } catch {
      toast.error("Failed to update task");
    }
  };

  return (
    <Modal isOpen={!!task} onClose={onClose} title="Edit Task">
      {task && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Title"
            placeholder="What needs to be done?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground/80">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Add more detail..."
              className="w-full px-4 py-2.5 bg-white/50 dark:bg-white/5 backdrop-blur-xl border rounded-2xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary-500/30 transition-all resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground/80">Priority</label>
              <Select
                options={[
                  { value: "urgent", label: "Urgent" },
                  { value: "high", label: "High" },
                  { value: "medium", label: "Medium" },
                  { value: "low", label: "Low" },
                  { value: "none", label: "None" },
                ]}
                value={priority}
                onChange={setPriority}
                placeholder="Select priority"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground/80">Status</label>
              <Select
                options={[
                  { value: "todo", label: "To Do" },
                  { value: "in_progress", label: "In Progress" },
                  { value: "completed", label: "Completed" },
                  { value: "backlog", label: "Backlog" },
                ]}
                value={status}
                onChange={setStatus}
                placeholder="Select status"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Due date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground/80">Repeat</label>
              <Select
                options={RECURRENCE_OPTIONS}
                value={recurrence}
                onChange={setRecurrence}
                placeholder="Does not repeat"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground/80">Remind me</label>
            <Select
              options={REMIND_OPTIONS}
              value={remindBefore}
              onChange={setRemindBefore}
              placeholder="No reminder"
              disabled={!dueDate}
            />
            {!dueDate && (
              <p className="text-xs text-muted-foreground">Set a due date to schedule a reminder.</p>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="ghost" type="button" onClick={() => { reset(); onClose(); }}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!title.trim()}
              loading={updateTask.isPending}
              icon={<Save className="w-4 h-4" />}
            >
              Save
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}