"use client";

import React, { useRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { springFast } from "@/lib/motion";
import { Loader2 } from "lucide-react";

interface ButtonProps {
  variant?: "primary" | "secondary" | "ghost" | "outline" | "danger" | "glass";
  size?: "sm" | "md" | "lg" | "xl";
  loading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  magnetic?: boolean;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
  type?: "button" | "submit" | "reset";
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
}

const variantStyles = {
  primary:
    "bg-gradient-to-r from-primary-500 to-secondary-500 text-white hover:shadow-lg hover:shadow-primary-500/25",
  secondary:
    "bg-secondary-500/10 text-secondary-600 dark:text-secondary-400 hover:bg-secondary-500/20 border border-secondary-500/20",
  ghost: "text-foreground/70 hover:text-foreground hover:bg-foreground/5",
  outline:
    "border border-border bg-transparent hover:bg-foreground/5 text-foreground",
  danger:
    "bg-danger-500 text-white hover:bg-danger-600 hover:shadow-lg hover:shadow-danger-500/25",
  glass:
    "bg-white/10 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-white/10 text-white hover:bg-white/20",
};

const sizeStyles = {
  sm: "h-8 px-3 text-xs rounded-xl gap-1.5",
  md: "h-10 px-4 text-sm rounded-2xl gap-2",
  lg: "h-12 px-6 text-base rounded-2xl gap-2.5",
  xl: "h-14 px-8 text-lg rounded-3xl gap-3",
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  loading,
  disabled,
  icon,
  iconRight,
  children,
  magnetic = true,
  type = "button",
  onClick,
}: ButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [mousePos, setMousePos] = React.useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = React.useState(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!magnetic || !buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setMousePos({ x: x * 0.3, y: y * 0.3 });
  };

  const handleMouseLeave = () => {
    setMousePos({ x: 0, y: 0 });
    setIsHovered(false);
  };

  return (
    <motion.button
      ref={buttonRef}
      type={type}
      onMouseMove={magnetic ? handleMouseMove : undefined}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      animate={magnetic ? { x: mousePos.x, y: mousePos.y } : {}}
      whileTap={magnetic ? { scale: 0.97 } : {}}
      transition={springFast}
      className={cn(
        "relative inline-flex items-center justify-center font-medium transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:pointer-events-none disabled:opacity-50 overflow-hidden select-none",
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      disabled={disabled || loading}
    >
      {/* Sheen sweep on hover (primary/secondary/danger gradients) */}
      {(variant === "primary" || variant === "danger") && (
        <motion.span
          className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]"
          aria-hidden
        >
          <motion.span
            className="absolute top-0 left-[-75%] h-full w-[50%] bg-gradient-to-r from-transparent via-white/25 to-transparent"
            initial={{ x: 0, opacity: 0 }}
            whileHover={{ x: "400%", opacity: 1 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          />
        </motion.span>
      )}

      {/* Ripple on hover */}
      {isHovered && (
        <motion.span
          className="absolute inset-0 bg-white/10 rounded-[inherit]"
          initial={{ scale: 0, opacity: 0.5 }}
          animate={{ scale: 1, opacity: 0 }}
          transition={{ duration: 0.5 }}
        />
      )}
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        icon && <span className="shrink-0">{icon}</span>
      )}
      {children && <span>{children}</span>}
      {!loading && iconRight && <span className="shrink-0">{iconRight}</span>}
    </motion.button>
  );
}
