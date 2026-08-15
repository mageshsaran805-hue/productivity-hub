"use client";

import { motion, type Variants } from "framer-motion";
import { cn } from "@/lib/utils";
import { easeSoft } from "@/lib/motion";

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Smooth entrance for page content. Uses a soft cubic-bezier for the
 * entrance and a slightly faster exit so returning feels responsive.
 */
const pageVariants: Variants = {
  initial: { opacity: 0, y: 14, scale: 0.995 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: easeSoft },
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.995,
    transition: { duration: 0.25, ease: "easeIn" as const },
  },
};

export function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}