"use client";

import { motion, type Variants } from "framer-motion";
import { cn } from "@/lib/utils";
import { easeSoft } from "@/lib/motion";

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Smooth entrance for page content. Uses a short, soft ease so navigation
 * feels responsive (snappier than a long fade-up) while still having polish.
 */
const pageVariants: Variants = {
  initial: { opacity: 0, y: 10, scale: 0.997 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.28, ease: easeSoft },
  },
  exit: {
    opacity: 0,
    y: -8,
    scale: 0.997,
    transition: { duration: 0.15, ease: "easeIn" as const },
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