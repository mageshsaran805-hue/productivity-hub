"use client";

import { useState } from "react";
import { PageTransition } from "@/components/animations/page-transition";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useAuth } from "@/hooks/use-auth";
import { useUserSettings, useUpdateUserSettings, useTestNotification, useTags, useCreateTag, useUpdateTag, useDeleteTag, useHabitCategories, useCreateHabitCategory, useDeleteHabitCategory } from "@/lib/queries";
import { NotificationPermissionStatus } from "@/components/ui/notification-permission-status";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Bell, User, Palette, ChevronRight, Moon, Trash2, AlertTriangle, Send, Tag as TagIcon, Plus, Pencil, Check, X, FolderOpen } from "lucide-react";
import toast from "react-hot-toast";

const TAG_COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4", "#6366f1", "#8b5cf6", "#ec4899"];

function TagManager() {
  const { data: tags } = useTags();
  const createTag = useCreateTag();
  const updateTag = useUpdateTag();
  const deleteTag = useDeleteTag();

  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(TAG_COLORS[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingColor, setEditingColor] = useState(TAG_COLORS[0]);

  const handleCreate = () => {
    if (!newName.trim()) return;
    createTag.mutate(
      { name: newName.trim(), color: newColor },
      {
        onSuccess: () => {
          setNewName("");
          setNewColor(TAG_COLORS[0]);
          toast.success("Tag created");
        },
        onError: () => toast.error("Failed to create tag"),
      }
    );
  };

  const handleSaveEdit = () => {
    if (!editingId || !editingName.trim()) return;
    updateTag.mutate(
      { id: editingId, name: editingName.trim(), color: editingColor },
      {
        onSuccess: () => {
          setEditingId(null);
          toast.success("Tag updated");
        },
        onError: () => toast.error("Failed to update tag"),
      }
    );
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Tags let you categorize and filter your tasks. Create tags here, then assign them in a task&apos;s detail view.
      </p>

      <div className="flex items-center gap-2">
        <Input
          placeholder="New tag name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
        />
        <div className="flex items-center gap-1.5">
          {TAG_COLORS.slice(0, 5).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setNewColor(c)}
              className="w-7 h-7 rounded-full transition-all"
              style={{
                backgroundColor: c,
                outline: newColor === c ? `2px solid ${c}` : "none",
                outlineOffset: 2,
              }}
            />
          ))}
        </div>
        <Button onClick={handleCreate} icon={<Plus className="w-4 h-4" />} disabled={!newName.trim()}>
          Add
        </Button>
      </div>

      <div className="space-y-2">
        {(tags ?? []).map((tag) => (
          <div key={tag.id} className="flex items-center gap-3 p-3 rounded-2xl border border-border/50 bg-foreground/[0.02]">
            {editingId === tag.id ? (
              <>
                <Input
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSaveEdit()}
                  className="flex-1"
                />
                <div className="flex items-center gap-1.5">
                  {TAG_COLORS.slice(0, 5).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setEditingColor(c)}
                      className="w-5 h-5 rounded-full transition-all"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <button
                  onClick={handleSaveEdit}
                  className="p-2 rounded-lg hover:bg-emerald-500/10 text-emerald-400 transition-colors"
                  aria-label="Save tag"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="p-2 rounded-lg hover:bg-foreground/5 text-muted-foreground transition-colors"
                  aria-label="Cancel edit"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: tag.color }}
                />
                <span className="flex-1 text-sm font-medium">{tag.name}</span>
                <span className="text-xs text-muted-foreground">
                  {tag.task_count ?? 0} task{(tag.task_count ?? 0) === 1 ? "" : "s"}
                </span>
                <button
                  onClick={() => {
                    setEditingId(tag.id);
                    setEditingName(tag.name);
                    setEditingColor(tag.color);
                  }}
                  className="p-2 rounded-lg hover:bg-foreground/5 text-muted-foreground transition-colors"
                  aria-label="Edit tag"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteTag.mutate(tag.id)}
                  className="p-2 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
                  aria-label="Delete tag"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        ))}
        {!tags?.length && (
          <p className="text-xs text-muted-foreground">No tags yet — create your first one above.</p>
        )}
      </div>
    </div>
  );
}

function HabitCategoryManager() {
  const { data: categories } = useHabitCategories();
  const createCategory = useCreateHabitCategory();
  const deleteCategory = useDeleteHabitCategory();

  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(TAG_COLORS[0]);

  const handleCreate = () => {
    if (!newName.trim()) return;
    createCategory.mutate(
      { name: newName.trim(), color: newColor },
      {
        onSuccess: () => {
          setNewName("");
          setNewColor(TAG_COLORS[0]);
          toast.success("Category created");
        },
        onError: () => toast.error("Failed to create category"),
      }
    );
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Organize your habits into groups like Health, Learning, or Finance. Pick a category when creating or editing a habit.
      </p>

      <div className="flex items-center gap-2">
        <Input
          placeholder="New category name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
        />
        <div className="flex items-center gap-1.5">
          {TAG_COLORS.slice(0, 5).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setNewColor(c)}
              className="w-7 h-7 rounded-full transition-all"
              style={{
                backgroundColor: c,
                outline: newColor === c ? `2px solid ${c}` : "none",
                outlineOffset: 2,
              }}
            />
          ))}
        </div>
        <Button onClick={handleCreate} icon={<Plus className="w-4 h-4" />} disabled={!newName.trim()}>
          Add
        </Button>
      </div>

      <div className="space-y-2">
        {(categories ?? []).map((category) => (
          <div key={category.id} className="flex items-center gap-3 p-3 rounded-2xl border border-border/50 bg-foreground/[0.02]">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: category.color }}
            />
            <span className="flex-1 text-sm font-medium">{category.name}</span>
            <span className="text-xs text-muted-foreground">
              {category.habit_count ?? 0} habit{(category.habit_count ?? 0) === 1 ? "" : "s"}
            </span>
            <button
              onClick={() => deleteCategory.mutate(category.id)}
              className="p-2 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
              aria-label="Delete category"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        {!categories?.length && (
          <p className="text-xs text-muted-foreground">No categories yet — create your first one above.</p>
        )}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { user } = useAuth();
  const { data: settings } = useUserSettings();
  const updateSettings = useUpdateUserSettings();
  const testNotification = useTestNotification();
  const router = useRouter();
  const [activeSection, setActiveSection] = useState("notifications");
  const [notifState, setNotifState] = useState({ email: true, push: true, reminders: false });
  const [name, setName] = useState(user?.name ?? "");
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Sync server data into local state by adjusting state during render
  // (React's recommended replacement for "setState in effect").
  const [prevSettings, setPrevSettings] = useState(settings);
  if (settings !== prevSettings) {
    setPrevSettings(settings);
    if (settings) {
      setNotifState({
        email: settings.notifications_email,
        push: settings.notifications_push,
        reminders: settings.notifications_reminders,
      });
    }
  }
  const [prevUserName, setPrevUserName] = useState(user?.name);
  if (user?.name !== prevUserName) {
    setPrevUserName(user?.name);
    if (user?.name) setName(user.name);
  }

  const handleToggle = (key: "email" | "push" | "reminders", checked: boolean) => {
    const next = { ...notifState, [key]: checked };
    setNotifState(next);
    if (user?.id) {
      updateSettings.mutate(
        {
          notifications_email: next.email,
          notifications_push: next.push,
          notifications_reminders: next.reminders,
        },
        { onError: () => toast.error("Failed to save setting") }
      );
    }
  };

  const handleSaveProfile = async () => {
    if (!name.trim()) return toast.error("Name is required");
    const { error } = await authClient.updateUser({ name: name.trim() });
    if (error) return toast.error(error.message || "Failed to update profile");
    toast.success("Profile updated!");
  };

  const handleDeleteAccount = async () => {
    if (confirmText !== "DELETE") return;
    setIsDeleting(true);
    try {
      const res = await fetch("/api/account/delete", { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to delete account");
      }
      await authClient.signOut();
      toast.success("Account deleted");
      router.push("/");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete account");
      setIsDeleting(false);
    }
  };

  const sections = [
    {
      id: "appearance",
      icon: Palette,
      label: "Appearance",
      color: "text-primary-500",
      render: () => (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Moon className="w-4 h-4" />
          Dark mode is enabled
        </div>
      ),
    },
    {
      id: "notifications",
      icon: Bell,
      label: "Notifications",
      color: "text-accent-500",
      render: () => (
        <div className="space-y-4">
          {[
            { label: "Email notifications", desc: "Receive email updates", key: "email" as const },
            { label: "Push notifications", desc: "Receive push notifications", key: "push" as const },
            { label: "Task reminders", desc: "Get reminded about due tasks", key: "reminders" as const },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-foreground/40">{item.desc}</p>
              </div>
              <Switch
                checked={notifState[item.key]}
                onChange={(checked) => handleToggle(item.key, checked)}
              />
            </div>
          ))}
          <p className="text-xs text-foreground/40 -mt-1">
            Email is on Resend&apos;s free test mode and only reaches your own inbox. It will reach other recipients once a custom domain is verified.
          </p>

          <div className="pt-3 border-t border-border/50 space-y-3">
            <NotificationPermissionStatus />
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">Send test notification</p>
                <p className="text-xs text-foreground/40">
                  Fire a test push + in-app notification to verify everything works
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                loading={testNotification.isPending}
                onClick={() => {
                  testNotification.mutate(
                    undefined,
                    {
                      onSuccess: (res) => {
                        if (res.sent > 0) toast.success("Test notification sent!");
                        else toast.error("No devices subscribed. Open the app and enable push first.");
                      },
                      onError: () => toast.error("Failed to send test notification"),
                    },
                  );
                }}
                icon={<Send className="w-3.5 h-3.5" />}
              >
                Send test
              </Button>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "tags",
      icon: TagIcon,
      label: "Tags",
      color: "text-yellow-500",
      render: () => <TagManager />,
    },
    {
      id: "habit-categories",
      icon: FolderOpen,
      label: "Habit Categories",
      color: "text-emerald-500",
      render: () => <HabitCategoryManager />,
    },
    {
      id: "profile",
      icon: User,
      label: "Profile",
      color: "text-secondary-500",
      render: () => (
        <div className="space-y-4">
          <Input label="Display Name" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Email" type="email" value={user?.email ?? ""} disabled />
          <Button onClick={handleSaveProfile}>Save Changes</Button>
        </div>
      ),
    },
    {
      id: "danger",
      icon: Trash2,
      label: "Delete Account",
      color: "text-red-400",
      render: () => (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>
          <Button variant="danger" onClick={() => setShowDeleteModal(true)} icon={<AlertTriangle className="w-4 h-4" />}>
            Delete Account
          </Button>
        </div>
      ),
    },
  ];

  return (
    <PageTransition>
      <div className="space-y-6 max-w-3xl">
        <h2 className="text-2xl font-bold">Settings</h2>
        <div className="grid gap-4">
          {sections.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            return (
              <div
                key={section.id}
                className="rounded-3xl bg-foreground/[0.03] border border-border/50 overflow-hidden"
              >
                <button
                  onClick={() => setActiveSection(isActive ? "" : section.id)}
                  className="flex items-center justify-between w-full p-5 hover:bg-foreground/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 ${section.color}`} />
                    <span className="font-medium">{section.label}</span>
                  </div>
                  <ChevronRight
                    className={`w-4 h-4 text-foreground/40 transition-transform ${
                      isActive ? "rotate-90" : ""
                    }`}
                  />
                </button>
                {isActive && (
                  <div className="px-5 pb-5 border-t border-border/50 pt-4">
                    {section.render()}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <Modal isOpen={showDeleteModal} onClose={() => { if (!isDeleting) { setShowDeleteModal(false); setConfirmText(""); } }} title="Delete Account">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This will permanently delete your account, tasks, projects, habits, calendar events, and all other data.
              Type <span className="font-semibold text-foreground">DELETE</span> to confirm.
            </p>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
            />
            <div className="flex items-center justify-end gap-3">
              <Button
                variant="ghost"
                type="button"
                onClick={() => { setShowDeleteModal(false); setConfirmText(""); }}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                type="button"
                disabled={confirmText !== "DELETE" || isDeleting}
                loading={isDeleting}
                onClick={handleDeleteAccount}
              >
                Delete permanently
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </PageTransition>
  );
}
