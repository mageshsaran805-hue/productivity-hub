"use client";

import { motion } from "framer-motion";
import { StaggerChildren, StaggerItem } from "@/components/animations/stagger-children";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Product Designer",
    avatar: "SC",
    content: "This app completely transformed how I manage my daily workflow. The habit tracker integration with tasks is genius.",
    rating: 5,
  },
  {
    name: "Marcus Johnson",
    role: "Software Engineer",
    avatar: "MJ",
    content: "The cleanest productivity app I've ever used. The animations and attention to detail make it a joy to use every day.",
    rating: 5,
  },
  {
    name: "Emily Rodriguez",
    role: "Project Manager",
    avatar: "ER",
    content: "I've tried everything from Notion to Linear. This combines the best of all worlds in one beautiful package.",
    rating: 5,
  },
  {
    name: "David Kim",
    role: "Freelancer",
    avatar: "DK",
    content: "The calendar view and drag-and-drop are incredibly smooth. Finally, an app that doesn't slow me down.",
    rating: 5,
  },
];

export function TestimonialsSection() {
  return (
    <section className="relative py-32 px-4">
      <div className="container mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/20 text-sm text-primary-500 font-medium mb-4">
            Testimonials
          </span>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Loved by{" "}
            <span className="bg-gradient-to-r from-primary-500 via-secondary-500 to-accent-500 bg-clip-text text-transparent">
              Professionals
            </span>
          </h2>
          <p className="text-lg text-foreground/60 max-w-2xl mx-auto">
            See what our users are saying about their experience.
          </p>
        </motion.div>

        <StaggerChildren className="grid md:grid-cols-2 gap-6">
          {testimonials.map((t, i) => (
            <StaggerItem key={i}>
              <div className="p-6 rounded-3xl bg-white/70 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-white/10">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-warning-500 text-warning-500" />
                  ))}
                </div>
                <p className="text-foreground/80 mb-6 leading-relaxed">&ldquo;{t.content}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white text-sm font-medium">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{t.name}</p>
                    <p className="text-xs text-foreground/50">{t.role}</p>
                  </div>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerChildren>
      </div>
    </section>
  );
}
