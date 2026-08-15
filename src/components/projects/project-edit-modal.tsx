"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { useUpdateProject } from "@/lib/queries";
import type { Project } from "@/types";
import { Save } from "lucide-react";
import toast from "react-hot-toast";

const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#06b6d4", "#ef4444", "#ec4899"];

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "archived", label: "Archived" },
];

interface ProjectEditModalProps {
  project: Project | null;
  onClose: () => void;
}

export function ProjectEditModal({ project, onClose }: ProjectEditModalProps) {
  const updateProject = useUpdateProject();
  const [name, setName] = useState(project?.name ?? "");
  const [description, setDescription] = useState(project?.description ?? "");
  const [dueDate, setDueDate] = useState(project?.due_date?.slice(0, 10) ?? "");
  const [color, setColor] = useState(project?.color ?? COLORS[0]);
  const [status, setStatus] = useState<string>(project?.status ?? "active");

  const reset = () => {
    if (!project) return;
    setName(project.name);
    setDescription(project.description ?? "");
    setDueDate(project.due_date?.slice(0, 10) ?? "");
    setColor(project.color || COLORS[0]);
    setStatus(project.status);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !name.trim()) return;
    try {
      await updateProject.mutateAsync({
        id: project.id,
        name: name.trim(),
        description: description.trim() || undefined,
        due_date: dueDate || undefined,
        color,
        status: status as Project["status"],
      });
      toast.success("Project updated");
      onClose();
    } catch {
      toast.error("Failed to update project");
    }
  };

  return (
    <Modal isOpen={!!project} onClose={onClose} title="Edit Project">
      {project && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Project Name"
            placeholder="Enter project name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            label="Description"
            placeholder="Brief description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Due Date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground/70 mb-2">Status</label>
              <Select
                value={status}
                onChange={setStatus}
                options={STATUS_OPTIONS}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/70 mb-2">Color</label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-8 h-8 rounded-xl transition-all"
                  style={{
                    backgroundColor: c,
                    outline: color === c ? `2px solid ${c}` : "none",
                    outlineOffset: 2,
                  }}
                />
              ))}
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="ghost" type="button" onClick={() => { reset(); onClose(); }}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!name.trim()}
              loading={updateProject.isPending}
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