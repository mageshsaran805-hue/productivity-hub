"use client";

import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { springDefault } from "@/lib/motion";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  glass?: boolean;
  tilt?: boolean;
  hover?: boolean;
  glow?: boolean;
  spotlight?: boolean;
  onClick?: () => void;
}

export function Card({
  children,
  className,
  glass = true,
  tilt = false,
  hover = true,
  glow = false,
  spotlight = true,
  onClick,
}: CardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [spot, setSpot] = useState({ x: 50, y: 50 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * 100;
    const py = ((e.clientY - rect.top) / rect.height) * 100;
    setSpot({ x: px, y: py });
    if (!tilt) return;
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setRotate({ x: -y * 6, y: x * 6 });
  };

  const handleMouseLeave = () => {
    setRotate({ x: 0, y: 0 });
    setIsHovered(false);
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      animate={{
        rotateX: tilt ? rotate.x : 0,
        rotateY: tilt ? rotate.y : 0,
        scale: isHovered && hover ? 1.015 : 1,
      }}
      transition={springDefault}
      onClick={onClick}
      className={cn(
        "group relative rounded-3xl p-6 transition-shadow duration-300",
        glass &&
          "bg-white/70 dark:bg-white/[0.04] backdrop-blur-xl border border-white/20 dark:border-white/[0.08] shadow-lg shadow-black/[0.03] dark:shadow-black/30",
        !glass && "bg-card border border-border",
        hover && "cursor-pointer",
        glow && isHovered && "shadow-xl shadow-primary-500/10 dark:shadow-primary-500/15",
        className,
      )}
      style={
        {
          transformStyle: "preserve-3d",
          "--spot-x": `${spot.x}%`,
          "--spot-y": `${spot.y}%`,
        } as React.CSSProperties
      }
    >
      {/* Spotlight glare */}
      {spotlight && (
        <div
          className={cn(
            "pointer-events-none absolute inset-0 rounded-3xl transition-opacity duration-300",
            isHovered ? "opacity-100" : "opacity-0",
          )}
          style={{
            background: `radial-gradient(420px circle at ${spot.x}% ${spot.y}%, rgba(255,255,255,0.10), transparent 45%)`,
          }}
        />
      )}

      {/* Hover top highlight */}
      <div
        className="pointer-events-none absolute inset-x-6 top-0 h-px opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)",
        }}
      />

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}

export function CardHeader({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("mb-4", className)}>{children}</div>;
}

export function CardContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn(className)}>{children}</div>;
}

export function CardFooter({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mt-4 pt-4 border-t border-border/50", className)}>
      {children}
    </div>
  );
}