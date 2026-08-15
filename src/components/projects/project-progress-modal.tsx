"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { useUpdateProject } from "@/lib/queries";
import type { Project } from "@/types";
import { CheckCircle2, Save } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

const PRESETS = [10, 25, 50, 75, 100];

interface ProjectProgressModalProps {
  project: Project | null;
  onClose: () => void;
}

export function ProjectProgressModal({ project, onClose }: ProjectProgressModalProps) {
  const updateProject = useUpdateProject();
  const [value, setValue] = useState(10);

  // Sync the slider when a different project opens (adjust state during render).
  const [lastProjectId, setLastProjectId] = useState<string | null>(null);
  if (project && project.id !== lastProjectId) {
    setLastProjectId(project.id);
    setValue(project.progress > 0 ? Math.round(project.progress) : 10);
  }

  if (!project) return null;

  const isComplete = value >= 100;

  const handleSave = async () => {
    try {
      await updateProject.mutateAsync({
        id: project.id,
        progress: value,
        status: isComplete ? "completed" : project.status === "completed" ? "active" : project.status,
      });
      toast.success(isComplete ? "Project completed!" : `Progress set to ${value}%`);
      onClose();
    } catch {
      toast.error("Failed to update progress");
    }
  };

  return (
    <Modal isOpen={!!project} onClose={onClose} title="Update Progress">
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="truncate font-semibold text-sm">{project.name}</p>
            <p className="text-xs text-muted-foreground">
              How much of this project is done?
            </p>
          </div>
          <div className="shrink-0">
            <p
              className={cn(
                "text-4xl font-bold tabular-nums",
                isComplete ? "text-success-500" : "text-primary-500",
              )}
            >
              {value}%
            </p>
          </div>
        </div>

        <div>
          <input
            type="range"
            min={10}
            max={100}
            step={10}
            value={value}
            onChange={(e) => setValue(Number(e.target.value))}
            aria-label="Project progress percentage"
            className="w-full accent-primary-500"
          />
          <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
            {[10, 25, 50, 75, 100].map((n) => (
              <span key={n}>{n}</span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-5 gap-2">
          {PRESETS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setValue(n)}
              className={cn(
                "rounded-xl border py-2 text-sm font-medium transition-all",
                value === n
                  ? "border-primary-500/40 bg-primary-500/10 text-primary-500"
                  : "border-border/50 bg-foreground/5 text-foreground/60 hover:bg-foreground/10",
              )}
            >
              {n}%
            </button>
          ))}
        </div>

        {isComplete && (
          <div className="flex items-center gap-2 rounded-xl bg-success-500/10 px-3 py-2.5 text-sm text-success-500">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>Saving 100% will mark this project as completed.</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={value < 10}
            loading={updateProject.isPending}
            icon={<Save className="h-4 w-4" />}
          >
            Save
          </Button>
        </div>
      </div>
    </Modal>
  );
}