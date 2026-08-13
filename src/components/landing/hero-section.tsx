"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sparkles, CheckCircle2, Target, Calendar, GitFork, ArrowRight } from "lucide-react";
import Link from "next/link";

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Floating cards */}
      <motion.div
        className="absolute top-32 right-[15%] hidden lg:block"
        animate={{ y: [0, -15, 0], rotate: [0, 1, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="w-64 p-4 rounded-2xl bg-white/80 dark:bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Design Review</p>
              <p className="text-xs text-foreground/50">Today at 3pm</p>
            </div>
            <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-primary-500/10 text-primary-500">Urgent</span>
          </div>
          <div className="h-1.5 rounded-full bg-foreground/10 overflow-hidden">
            <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500" />
          </div>
        </div>
      </motion.div>

      <motion.div
        className="absolute top-48 left-[10%] hidden lg:block"
        animate={{ y: [0, 15, 0], rotate: [0, -1, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      >
        <div className="w-56 p-4 rounded-2xl bg-white/80 dark:bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl">
          <div className="flex items-center gap-3 mb-2">
            <Target className="w-4 h-4 text-primary-500" />
            <span className="text-sm font-medium">Daily Habits</span>
          </div>
          <div className="flex gap-1 mb-2">
            {["M","T","W","T","F","S","S"].map((d, i) => (
              <div key={i} className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-medium ${i < 5 ? "bg-primary-500/20 text-primary-500" : "bg-foreground/5 text-foreground/30"}`}>
                {d}
              </div>
            ))}
          </div>
          <p className="text-xs text-foreground/50">5-day streak 🔥</p>
        </div>
      </motion.div>

      <motion.div
        className="absolute bottom-32 right-[20%] hidden lg:block"
        animate={{ y: [0, -10, 0], rotate: [0, 1.5, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      >
        <div className="w-48 p-4 rounded-2xl bg-white/80 dark:bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-secondary-500" />
            <span className="text-sm font-medium">This Week</span>
          </div>
          <div className="flex items-center justify-between text-xs text-foreground/50 mb-1">
            <span>Tasks completed</span>
            <span className="text-success-500 font-medium">12/15</span>
          </div>
          <div className="h-1.5 rounded-full bg-foreground/10 overflow-hidden">
            <div className="h-full w-4/5 rounded-full bg-gradient-to-r from-secondary-500 to-accent-500" />
          </div>
        </div>
      </motion.div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/20">
                <Sparkles className="w-3.5 h-3.5 text-primary-500" />
                <span className="text-sm text-primary-500 font-medium">The Ultimate Productivity Hub</span>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-success-500/10 border border-success-500/20">
                <GitFork className="w-3.5 h-3.5 text-success-500" />
                <span className="text-sm text-success-500 font-medium">Open Source · MIT</span>
              </div>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6"
          >
            <span className="bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
              Organize Your
            </span>
            <br />
            <span className="bg-gradient-to-r from-primary-500 via-secondary-500 to-accent-500 bg-clip-text text-transparent">
              Digital Life
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-foreground/60 max-w-2xl mx-auto mb-8"
          >
            The all-in-one productivity platform that combines tasks, projects, habits, 
            and calendar into a beautiful, seamless experience.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
          >
            <Link href="/auth/signup">
              <Button size="xl" icon={<Sparkles className="w-5 h-5" />} iconRight={<ArrowRight className="w-5 h-5" />}>
                Get Started Free
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button variant="glass" size="xl">
                Sign In
              </Button>
            </Link>
          </motion.div>

          {/* Trust strip */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 mb-16"
          >
            {[
              "Free forever",
              "No credit card required",
              "Your data, your rules",
              "Built for focus",
            ].map((item) => (
              <span key={item} className="flex items-center gap-1.5 text-sm text-foreground/50">
                <CheckCircle2 className="w-3.5 h-3.5 text-success-500" />
                {item}
              </span>
            ))}
          </motion.div>

          {/* Dashboard preview */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
            whileHover={{ y: -4 }}
            className="relative mx-auto max-w-5xl"
          >
            <div className="rounded-3xl overflow-hidden shadow-2xl border border-white/20 bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl">
              <div className="p-1 bg-foreground/5 border-b border-border/50 flex items-center gap-2">
                <div className="flex gap-1.5 px-3">
                  <div className="w-3 h-3 rounded-full bg-danger-500/80" />
                  <div className="w-3 h-3 rounded-full bg-warning-500/80" />
                  <div className="w-3 h-3 rounded-full bg-success-500/80" />
                </div>
                <div className="flex-1 text-center">
                  <span className="text-xs text-foreground/40 font-mono">productivity.app</span>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-4 gap-4 mb-4">
                  {[
                    { label: "Tasks Today", value: "12", color: "from-primary-500 to-secondary-500" },
                    { label: "Completed", value: "89%", color: "from-success-500 to-emerald-500" },
                    { label: "Streak", value: "7 days", color: "from-warning-500 to-orange-500" },
                    { label: "Projects", value: "5", color: "from-accent-500 to-cyan-500" },
                  ].map((stat, i) => (
                    <div key={i} className="p-3 rounded-xl bg-foreground/5">
                      <p className="text-xs text-foreground/50 mb-1">{stat.label}</p>
                      <p className="text-lg font-bold">
                        <span className={`bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                          {stat.value}
                        </span>
                      </p>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-xl bg-foreground/5">
                    <p className="text-xs text-foreground/50 mb-2">Upcoming Tasks</p>
                    {["Design Review • 3pm", "Team Sync • 4pm", "Review PR #42"].map((t, i) => (
                      <div key={i} className="flex items-center gap-2 py-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${i === 0 ? "bg-danger-500" : i === 1 ? "bg-warning-500" : "bg-primary-500"}`} />
                        <span className="text-xs text-foreground/70">{t}</span>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 rounded-xl bg-foreground/5">
                    <p className="text-xs text-foreground/50 mb-2">Habit Streaks</p>
                    {["Morning Run • 12 days", "Read • 7 days", "Meditate • 5 days"].map((t, i) => (
                      <div key={i} className="flex items-center gap-2 py-1.5">
                        <span className="text-xs">{["🏃", "📚", "🧘"][i]}</span>
                        <span className="text-xs text-foreground/70">{t}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
