"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlassPanelProps {
  children: React.ReactNode;
  className?: string;
  intensity?: "light" | "medium" | "heavy";
  border?: boolean;
  glow?: boolean;
  as?: "div" | "section" | "aside";
}

export function GlassPanel({
  children,
  className,
  intensity = "medium",
  border = true,
  glow = false,
  as: Component = "div",
}: GlassPanelProps) {
  const intensityStyles = {
    light: "bg-white/40 dark:bg-white/[0.02] backdrop-blur-md",
    medium: "bg-white/70 dark:bg-white/[0.05] backdrop-blur-xl",
    heavy: "bg-white/90 dark:bg-white/[0.08] backdrop-blur-2xl",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={cn(
        "rounded-3xl",
        intensityStyles[intensity],
        border && "border border-white/20 dark:border-white/10",
        glow && "shadow-lg shadow-primary-500/5",
        className,
      )}
    >
      {children}
    </motion.div>
  );
}
