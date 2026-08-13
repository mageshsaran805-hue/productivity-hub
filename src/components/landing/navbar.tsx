"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sparkles, Menu, X } from "lucide-react";
import Link from "next/link";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/80 dark:bg-gray-950/80 backdrop-blur-2xl border-b border-white/20 dark:border-white/10"
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto max-w-6xl px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary-500" />
            <span className="font-bold text-lg">Productivity Hub</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link href="#about" className="text-sm text-foreground/60 hover:text-foreground transition-colors">About</Link>
            <Link href="#features" className="text-sm text-foreground/60 hover:text-foreground transition-colors">Features</Link>
            <Link href="#faq" className="text-sm text-foreground/60 hover:text-foreground transition-colors">FAQ</Link>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/auth/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/auth/signup">
              <Button size="sm" icon={<Sparkles className="w-3.5 h-3.5" />}>Get Started</Button>
            </Link>
          </div>

          <button
            className="md:hidden p-2 rounded-xl hover:bg-foreground/5"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden bg-white/90 dark:bg-gray-950/90 backdrop-blur-xl border-b border-white/20 dark:border-white/10"
        >
          <div className="px-4 py-4 space-y-3">
            <Link href="#about" className="block text-sm text-foreground/60 hover:text-foreground py-2">About</Link>
            <Link href="#features" className="block text-sm text-foreground/60 hover:text-foreground py-2">Features</Link>
            <Link href="#faq" className="block text-sm text-foreground/60 hover:text-foreground py-2">FAQ</Link>
            <div className="flex gap-3 pt-2">
              <Link href="/auth/login" className="flex-1"><Button variant="outline" className="w-full">Sign In</Button></Link>
              <Link href="/auth/signup" className="flex-1"><Button className="w-full">Get Started</Button></Link>
            </div>
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
}
