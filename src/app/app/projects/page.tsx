"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { PageTransition } from "@/components/animations/page-transition";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { StaggerChildren, StaggerItem } from "@/components/animations/stagger-children";
import { useAuth } from "@/hooks/use-auth";
import { useDefaultWorkspace } from "@/hooks/use-workspace";
import { useProjects, useCreateProject, useDeleteProject } from "@/lib/queries";
import { FolderKanban, Plus, Search, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#06b6d4", "#ef4444", "#ec4899"];

export default function ProjectsPage() {
  const { user } = useAuth();
  const { data: workspace } = useDefaultWorkspace();
  const { data: projects, isLoading } = useProjects();
  const createProject = useCreateProject();
  const deleteProject = useDeleteProject();

  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [isCreating, setIsCreating] = useState(false);

  const filtered = (projects ?? []).filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const resetForm = () => {
    setName("");
    setDescription("");
    setDueDate("");
    setSelectedColor(COLORS[0]);
  };

  const handleDelete = (id: string) => {
    deleteProject.mutate(id);
    toast.success("Project deleted");
  };

  const handleCreate = async () => {
    if (!name.trim() || !user || !workspace) return;
    setIsCreating(true);
    try {
      await createProject.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
        due_date: dueDate || undefined,
        color: selectedColor,
        workspace_id: workspace.id,
      });
      toast.success("Project created!");
      setShowModal(false);
      resetForm();
    } catch {
      toast.error("Failed to create project");
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <PageTransition>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="h-8 w-32 bg-foreground/5 rounded-xl animate-pulse" />
            <div className="h-10 w-36 bg-foreground/5 rounded-xl animate-pulse" />
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="p-5 rounded-3xl bg-foreground/5 animate-pulse h-[140px]" />
            ))}
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h2 className="text-2xl font-bold">Projects</h2>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects..."
                className="w-48 pl-9 pr-3 py-2 text-sm rounded-xl bg-foreground/5 border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
              />
            </div>
            <Button size="md" icon={<Plus className="w-4 h-4" />} onClick={() => setShowModal(true)} className="shadow-lg shadow-primary-500/30 border border-primary-400/20">
              New Project
            </Button>
          </div>
        </div>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <FolderKanban className="w-12 h-12 text-muted-foreground" />
            <p className="text-muted-foreground text-sm">
              {searchQuery ? "No projects match your search" : "No projects yet"}
            </p>
            {!searchQuery && (
              <Button onClick={() => setShowModal(true)}>Create your first project</Button>
            )}
          </div>
        )}

        {filtered.length > 0 && (
          <StaggerChildren className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((project) => (
              <StaggerItem key={project.id}>
                <Card glass tilt hover glow className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-2xl flex items-center justify-center"
                        style={{ backgroundColor: project.color + "20" }}
                      >
                        <FolderKanban className="w-5 h-5" style={{ color: project.color }} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm">{project.name}</h3>
                        {project.due_date && (
                          <p className="text-xs text-foreground/40">
                            Due{" "}
                            {new Date(project.due_date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(project.id)}
                      className="shrink-0 p-1.5 rounded-xl opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-foreground/30 hover:text-red-400 transition-all"
                      aria-label="Delete project"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-xs text-foreground/50 mb-2">
                    <span className="text-muted-foreground">{project.progress}% complete</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-foreground/10 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${project.progress}%` }}
                      transition={{ duration: 1, delay: 0.2 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: project.color }}
                    />
                  </div>
                </Card>
              </StaggerItem>
            ))}
            <StaggerItem>
              <button
                onClick={() => setShowModal(true)}
                className="p-5 rounded-3xl border-2 border-dashed border-foreground/20 hover:border-foreground/40 hover:bg-foreground/5 transition-all h-full min-h-[140px] flex flex-col items-center justify-center gap-2 w-full"
              >
                <Plus className="w-6 h-6 text-foreground/30" />
                <span className="text-sm text-foreground/40">New Project</span>
              </button>
            </StaggerItem>
          </StaggerChildren>
        )}

        <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create New Project">
          <div className="space-y-4">
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
            <Input
              label="Due Date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-2">Color</label>
              <div className="flex gap-2">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className="w-8 h-8 rounded-xl transition-all"
                    style={{
                      backgroundColor: color,
                      outline: selectedColor === color ? `2px solid ${color}` : "none",
                      outlineOffset: 2,
                    }}
                  />
                ))}
              </div>
            </div>
            <Button className="w-full" onClick={handleCreate} disabled={!name.trim() || isCreating}>
              {isCreating ? "Creating..." : "Create Project"}
            </Button>
          </div>
        </Modal>
      </div>
    </PageTransition>
  );
}
