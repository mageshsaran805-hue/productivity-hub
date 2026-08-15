"use client";

import { SidebarProvider } from "@/hooks/use-sidebar";
import { Sidebar, MobileSidebar } from "@/components/layout/sidebar";
import { TopNav } from "@/components/layout/top-nav";
import { MobileNav } from "@/components/layout/mobile-nav";
import { AnimatedBackground } from "@/components/animations/animated-background";
import dynamic from "next/dynamic";
import { CommandPaletteProvider, useCommandPaletteContext } from "@/hooks/use-command-palette";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useIsMobile } from "@/hooks/use-media-query";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useBrowserNotifications } from "@/hooks/use-notifications";
import { useNotificationScheduler } from "@/hooks/use-notification-scheduler";
import { useServiceWorker } from "@/hooks/use-service-worker";
import { InstallPrompt } from "@/components/layout/install-prompt";

// Lazy-load the overlay UI so its code only downloads when actually opened.
const CommandPalette = dynamic(() =>
  import("@/components/layout/command-palette").then((m) => m.CommandPalette)
);
const NewTaskModal = dynamic(() =>
  import("@/components/tasks/new-task-modal").then((m) => m.NewTaskModal)
);

function AppContent({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();
  const { user, loading } = useAuth();
  const router = useRouter();
  const { paletteOpen, newTaskOpen, closePalette, openNewTask, closeNewTask } = useCommandPaletteContext();

  // Once an overlay has been opened it stays mounted so its close animation
  // plays, but until then its code chunk never downloads (lazy dynamic import).
  const [hasOpenedPalette, setHasOpenedPalette] = useState(false);
  const [hasOpenedNewTask, setHasOpenedNewTask] = useState(false);

  // Render-time state adjustment (React Compiler friendly): flipping the flag
  // while rendering is fine because it doesn't loop — the flag only goes one way.
  const [prevPaletteOpen, setPrevPaletteOpen] = useState(paletteOpen);
  if (paletteOpen !== prevPaletteOpen) {
    setPrevPaletteOpen(paletteOpen);
    if (paletteOpen) setHasOpenedPalette(true);
  }
  const [prevNewTaskOpen, setPrevNewTaskOpen] = useState(newTaskOpen);
  if (newTaskOpen !== prevNewTaskOpen) {
    setPrevNewTaskOpen(newTaskOpen);
    if (newTaskOpen) setHasOpenedNewTask(true);
  }

  // must be called before early returns — Rules of Hooks
  useServiceWorker();
  useBrowserNotifications();
  useNotificationScheduler();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-dvh">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex h-dvh overflow-hidden">
      <AnimatedBackground variant="dashboard" />
      <Sidebar />
      <MobileSidebar />
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        <TopNav />
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-6 pb-20 md:pb-6 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
      {isMobile && <MobileNav />}

      {(hasOpenedPalette || paletteOpen) && (
        <CommandPalette
          open={paletteOpen}
          onClose={closePalette}
          onNewTask={() => { closePalette(); openNewTask(); }}
        />
      )}
      {(hasOpenedNewTask || newTaskOpen) && (
        <NewTaskModal isOpen={newTaskOpen} onClose={closeNewTask} />
      )}
      <InstallPrompt />
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            staleTime: 30_000,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <SidebarProvider>
        <CommandPaletteProvider>
          <AppContent>{children}</AppContent>
        </CommandPaletteProvider>
      </SidebarProvider>
    </QueryClientProvider>
  );
}
