"use client";

import { motion } from "framer-motion";
import { CheckSquare, FolderKanban, Calendar, Target, BarChart3, Bell, Search, Zap, Shield, Users, Layers, Palette } from "lucide-react";
import { StaggerChildren, StaggerItem } from "@/components/animations/stagger-children";

const features = [
  {
    icon: CheckSquare,
    title: "Smart Task Management",
    description: "Organize tasks with priorities, due dates, subtasks, and multiple views including list, board, and kanban.",
    gradient: "from-primary-500 to-secondary-500",
  },
  {
    icon: FolderKanban,
    title: "Project Management",
    description: "Manage projects with progress tracking, milestones, team collaboration, and beautiful visual layouts.",
    gradient: "from-secondary-500 to-pink-500",
  },
  {
    icon: Calendar,
    title: "Calendar Integration",
    description: "Seamlessly view and manage your tasks, events, and habits in a beautiful calendar interface.",
    gradient: "from-accent-500 to-cyan-500",
  },
  {
    icon: Target,
    title: "Habit Tracking",
    description: "Build better habits with streaks, heatmaps, milestones, and insightful progress analytics.",
    gradient: "from-success-500 to-emerald-500",
  },
  {
    icon: BarChart3,
    title: "Powerful Analytics",
    description: "Understand your productivity with detailed charts, trends, and actionable insights.",
    gradient: "from-warning-500 to-orange-500",
  },
  {
    icon: Bell,
    title: "Smart Notifications",
    description: "Never miss a deadline with intelligent reminders and a beautiful notification center.",
    gradient: "from-danger-500 to-rose-500",
  },
  {
    icon: Search,
    title: "Instant Search",
    description: "Find anything instantly with global search powered by keyboard shortcuts (⌘K).",
    gradient: "from-primary-500 to-accent-500",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Built for performance with instant updates, smooth animations, and 60fps interactions.",
    gradient: "from-secondary-500 to-accent-500",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description: "Your data is protected with end-to-end encryption and industry-standard security practices.",
    gradient: "from-primary-500 to-indigo-500",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="relative py-32 px-4">
      <div className="container mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/20 text-sm text-primary-500 font-medium mb-4">
            Everything You Need
          </span>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Powerful Features for
            <br />
            <span className="bg-gradient-to-r from-primary-500 via-secondary-500 to-accent-500 bg-clip-text text-transparent">
              Peak Productivity
            </span>
          </h2>
          <p className="text-lg text-foreground/60 max-w-2xl mx-auto">
            Everything you need to manage your tasks, projects, habits, and calendar in one place.
          </p>
        </motion.div>

        <StaggerChildren className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <StaggerItem key={index}>
                <motion.div
                  whileHover={{ y: -5, scale: 1.02 }}
                  className="p-6 rounded-3xl bg-white/70 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-white/10 hover:shadow-xl hover:shadow-primary-500/5 transition-all duration-300"
                >
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${feature.gradient} p-2.5 flex items-center justify-center mb-4`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-foreground/60">{feature.description}</p>
                </motion.div>
              </StaggerItem>
            );
          })}
        </StaggerChildren>
      </div>
    </section>
  );
}
