"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { easeSoft } from "@/lib/motion";

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: easeSoft }}
      className={cn(
        "flex flex-col items-center justify-center py-16 px-6 text-center",
        className,
      )}
    >
      {/* Glowing icon tile */}
      <div className="relative mb-6">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 220, damping: 18, delay: 0.1 }}
          className="relative flex h-20 w-20 items-center justify-center rounded-3xl border border-white/10 bg-gradient-to-br from-primary-500/15 via-secondary-500/10 to-accent-500/10 text-primary-400 shadow-lg shadow-primary-500/10"
        >
          {/* Ambient glow */}
          <div className="pointer-events-none absolute -inset-3 rounded-[28px] bg-primary-500/10 blur-xl" />
          <div className="relative">{icon}</div>
        </motion.div>
      </div>
      <motion.h3
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: easeSoft, delay: 0.15 }}
        className="font-display text-xl font-bold text-foreground/90 mb-2"
      >
        {title}
      </motion.h3>
      {description && (
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: easeSoft, delay: 0.2 }}
          className="text-sm text-muted-foreground max-w-sm mb-6"
        >
          {description}
        </motion.p>
      )}
      {action && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: easeSoft, delay: 0.25 }}
        >
          {action}
        </motion.div>
      )}
    </motion.div>
  );
}