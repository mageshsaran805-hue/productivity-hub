"use client";

import { cn } from "@/lib/utils";

interface AuroraBackgroundProps {
  className?: string;
}

export function AuroraBackground({ className }: AuroraBackgroundProps) {
  return (
    <div className={cn("fixed inset-0 overflow-hidden pointer-events-none z-0", className)}>
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-primary-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-primary-950/20" />
      <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-gradient-to-br from-primary-500/20 to-secondary-500/20 rounded-full blur-[120px] animate-float" />
      <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-gradient-to-br from-accent-500/20 to-primary-500/20 rounded-full blur-[120px] animate-float-delayed" />
      <div className="absolute top-1/3 right-1/4 w-1/3 h-1/3 bg-gradient-to-br from-secondary-500/10 to-pink-500/10 rounded-full blur-[100px] animate-float-slow" />
    </div>
  );
}
