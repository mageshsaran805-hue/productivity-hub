"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useCreateTask } from "@/lib/queries";
import { useDefaultWorkspace } from "@/hooks/use-workspace";
import { useAuth } from "@/hooks/use-auth";
import toast from "react-hot-toast";

interface NewTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewTaskModal({ isOpen, onClose }: NewTaskModalProps) {
  const { user } = useAuth();
  const { data: workspace } = useDefaultWorkspace();
  const createTask = useCreateTask();
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");

  const reset = () => {
    setTitle("");
    setPriority("medium");
    setDueDate("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !user?.id || !workspace?.id) return;
    try {
      await createTask.mutateAsync({
        title: title.trim(),
        workspace_id: workspace.id,
        status: "todo",
        priority: priority as "urgent" | "high" | "medium" | "low" | "none",
        due_date: dueDate || undefined,
      });
      toast.success("Task created");
      reset();
      onClose();
    } catch {
      toast.error("Failed to create task");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Task">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Title"
          placeholder="What needs to be done?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
        />

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

        <Input
          label="Due date"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!title.trim()} loading={createTask.isPending} icon={<Plus className="w-4 h-4" />}>
            Create
          </Button>
        </div>
      </form>
    </Modal>
  );
}