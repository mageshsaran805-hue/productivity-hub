"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface CheckboxProps {
  checked: boolean;
  onChange?: (checked: boolean) => void;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-6 h-6",
};

const iconSizeMap = {
  sm: "w-2.5 h-2.5",
  md: "w-3 h-3",
  lg: "w-3.5 h-3.5",
};

export function Checkbox({
  checked,
  onChange,
  className,
  size = "md",
}: CheckboxProps) {
  return (
    <motion.button
      type="button"
      onClick={() => onChange?.(!checked)}
      className={cn(
        "relative inline-flex items-center justify-center rounded-lg border-2 transition-colors duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2",
        checked
          ? "bg-primary-500 border-primary-500"
          : "border-foreground/20 hover:border-foreground/40 bg-transparent",
        sizeMap[size],
        className,
      )}
      whileTap={{ scale: 0.9 }}
      aria-checked={checked}
      role="checkbox"
    >
      <motion.span
        initial={false}
        animate={
          checked ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }
        }
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <Check
          className={cn("text-white", iconSizeMap[size])}
          strokeWidth={3}
        />
      </motion.span>
    </motion.button>
  );
}
