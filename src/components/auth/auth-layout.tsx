"use client";

import { motion } from "framer-motion";
import { AnimatedBackground } from "@/components/animations/animated-background";
import { useServiceWorker } from "@/hooks/use-service-worker";
import { Sparkles } from "lucide-react";
import Link from "next/link";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  useServiceWorker();

  return (
    <div className="relative min-h-dvh flex items-center justify-center p-4">
      <AnimatedBackground variant="auth" />
      
      <div className="absolute top-6 left-6 z-10">
        <Link href="/" className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary-500" />
          <span className="font-bold text-lg">Productivity Hub</span>
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        <div className="relative p-8 rounded-4xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl border border-white/20 dark:border-white/10 shadow-2xl">
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
              className="w-16 h-16 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center"
            >
              <Sparkles className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className="text-2xl font-bold mb-1">{title}</h1>
            <p className="text-sm text-foreground/50">{subtitle}</p>
          </div>
          {children}
        </div>
      </motion.div>
    </div>
  );
}
