"use client";

import { motion } from "framer-motion";
import { Layers, Target, CalendarDays, LineChart, ShieldCheck, HeartHandshake, CheckCircle2 } from "lucide-react";

const highlights = [
  {
    icon: Layers,
    title: "Tasks & Projects",
    description: "Prioritized task lists, boards, and projects that keep every deadline visible and every plan on track.",
    gradient: "from-primary-500 to-secondary-500",
  },
  {
    icon: CalendarDays,
    title: "Calendar & Today",
    description: "A smart Today view and weekly calendar that surface exactly what deserves your attention right now.",
    gradient: "from-accent-500 to-cyan-500",
  },
  {
    icon: Target,
    title: "Habit Tracking",
    description: "Streaks, logs, and gentle consistency — build routines that actually stick without the noise.",
    gradient: "from-success-500 to-emerald-500",
  },
  {
    icon: LineChart,
    title: "Analytics",
    description: "Understand where your time goes with clean charts and trends that make progress easy to see.",
    gradient: "from-warning-500 to-orange-500",
  },
];

const principles = [
  "Free forever — no paywalls, no trial countdowns",
  "Open source and self-hostable",
  "Your data belongs to you",
  "Designed to be calm, not overwhelming",
];

export function AboutSection() {
  return (
    <section id="about" className="relative py-28 px-4">
      <div className="container mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/20 text-sm text-primary-500 font-medium mb-4">
            About Productivity Hub
          </span>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            One calm home for your{" "}
            <span className="bg-gradient-to-r from-primary-500 via-secondary-500 to-accent-500 bg-clip-text text-transparent">
              entire digital life
            </span>
          </h2>
          <p className="text-lg text-foreground/60 max-w-3xl mx-auto leading-relaxed">
            Productivity Hub is a modern, open-source productivity platform built to replace the
            scattered pile of to-do lists, project trackers, and habit apps with a single,
            beautiful workspace. It brings tasks, projects, habits, calendar, and analytics
            together so you can stop managing your tools and start getting things done.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {highlights.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                whileHover={{ y: -4, scale: 1.01 }}
                className="p-6 rounded-3xl bg-white/70 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-white/10 hover:shadow-xl hover:shadow-primary-500/5 transition-all duration-300"
              >
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${item.gradient} p-2.5 flex items-center justify-center mb-4`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-foreground/60 leading-relaxed">{item.description}</p>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="rounded-3xl p-8 md:p-10 bg-gradient-to-br from-primary-500/10 via-secondary-500/10 to-accent-500/10 border border-white/20 dark:border-white/10"
        >
          <div className="flex items-center gap-3 mb-6">
            <ShieldCheck className="w-5 h-5 text-primary-500" />
            <h3 className="text-lg font-semibold">What we stand for</h3>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {principles.map((principle) => (
              <div key={principle} className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-success-500 shrink-0 mt-0.5" />
                <p className="text-sm text-foreground/70">{principle}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm text-foreground/50 flex items-center gap-1.5">
            <HeartHandshake className="w-4 h-4 text-danger-500" />
            Built with care — by people who actually use it every day.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
