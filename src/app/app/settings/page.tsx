"use client";

import { useState, useEffect } from "react";
import { PageTransition } from "@/components/animations/page-transition";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useUserSettings, useUpdateUserSettings } from "@/lib/queries";
import { authClient } from "@/lib/auth-client";
import { Bell, User, Palette, ChevronRight, Moon } from "lucide-react";
import toast from "react-hot-toast";

export default function SettingsPage() {
  const { user } = useAuth();
  const { data: settings } = useUserSettings();
  const updateSettings = useUpdateUserSettings();
  const [activeSection, setActiveSection] = useState("notifications");
  const [notifState, setNotifState] = useState({ email: true, push: true, reminders: false });
  const [name, setName] = useState(user?.name ?? "");

  useEffect(() => {
    if (settings) {
      setNotifState({
        email: settings.notifications_email,
        push: settings.notifications_push,
        reminders: settings.notifications_reminders,
      });
    }
  }, [settings]);

  useEffect(() => {
    if (user?.name) setName(user.name);
  }, [user?.name]);

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
        </div>
      ),
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
      </div>
    </PageTransition>
  );
}
