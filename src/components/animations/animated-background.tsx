"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedBackgroundProps {
  variant?: "default" | "landing" | "auth" | "dashboard";
  className?: string;
}

export function AnimatedBackground({ variant = "default", className }: AnimatedBackgroundProps) {
  const blobs = useMemo(() => {
    const colors = [
      { from: "#6366f1", to: "#8b5cf6" },
      { from: "#8b5cf6", to: "#ec4899" },
      { from: "#06b6d4", to: "#6366f1" },
      { from: "#22c55e", to: "#06b6d4" },
      { from: "#f59e0b", to: "#ef4444" },
    ];

    // Deterministic positions based on index — avoids hydration mismatch from Math.random()
    const positions = [
      { x: 15, y: 20, size: 200, duration: 18, delay: 0 },
      { x: 70, y: 60, size: 280, duration: 22, delay: 1.5 },
      { x: 45, y: 80, size: 240, duration: 16, delay: 3 },
      { x: 80, y: 30, size: 320, duration: 20, delay: 0.5 },
      { x: 30, y: 70, size: 260, duration: 24, delay: 2 },
    ];

    return Array.from({ length: variant === "landing" ? 5 : 3 }, (_, i) => ({
      id: i,
      color: colors[i % colors.length],
      x: positions[i].x,
      y: positions[i].y,
      size: positions[i].size,
      duration: positions[i].duration,
      delay: positions[i].delay,
    }));
  }, [variant]);

  return (
    <div className={cn("fixed inset-0 overflow-hidden pointer-events-none z-0", className)}>
      {/* Gradient base */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-primary-50/30 to-secondary-50/30 dark:from-gray-950 dark:via-primary-950/20 dark:to-secondary-950/20" />

      {/* Blobs */}
      {blobs.map((blob) => (
        <motion.div
          key={blob.id}
          className="absolute rounded-full blur-3xl opacity-20 dark:opacity-10"
          style={{
            background: `linear-gradient(135deg, ${blob.color.from}, ${blob.color.to})`,
            width: blob.size,
            height: blob.size,
          }}
          animate={{
            x: [blob.x, blob.x + (Math.random() - 0.5) * 30, blob.x],
            y: [blob.y, blob.y + (Math.random() - 0.5) * 30, blob.y],
            scale: [1, 1.1, 1, 0.95, 1],
          }}
          transition={{
            duration: blob.duration,
            repeat: Infinity,
            delay: blob.delay,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Noise overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "256px 256px",
        }}
      />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(99,102,241,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.1) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />
    </div>
  );
}
