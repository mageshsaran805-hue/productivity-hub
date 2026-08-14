"use client";

import { SidebarProvider } from "@/hooks/use-sidebar";
import { Sidebar, MobileSidebar } from "@/components/layout/sidebar";
import { TopNav } from "@/components/layout/top-nav";
import { MobileNav } from "@/components/layout/mobile-nav";
import { AnimatedBackground } from "@/components/animations/animated-background";
import { CommandPalette } from "@/components/layout/command-palette";
import { NewTaskModal } from "@/components/tasks/new-task-modal";
import { CommandPaletteProvider, useCommandPaletteContext } from "@/hooks/use-command-palette";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-media-query";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useBrowserNotifications } from "@/hooks/use-notifications";
import { useServiceWorker } from "@/hooks/use-service-worker";
import { InstallPrompt } from "@/components/layout/install-prompt";

function AppContent({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();
  const { user, loading } = useAuth();
  const router = useRouter();
  const { paletteOpen, newTaskOpen, closePalette, togglePalette, openNewTask, closeNewTask } = useCommandPaletteContext();

  // must be called before early returns — Rules of Hooks
  useServiceWorker();
  useBrowserNotifications();

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
          <div className="p-4 lg:p-6 pb-20 md:pb-6 max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
      {isMobile && <MobileNav />}

      <CommandPalette
        open={paletteOpen}
        onClose={closePalette}
        onToggle={togglePalette}
        onNewTask={() => { closePalette(); openNewTask(); }}
      />
      <NewTaskModal isOpen={newTaskOpen} onClose={closeNewTask} />
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
