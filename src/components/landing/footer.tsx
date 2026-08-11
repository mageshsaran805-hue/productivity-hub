"use client";

import { Sparkles, Heart } from "lucide-react";
import Link from "next/link";

const footerLinks = {
  Product: ["Features", "Open Source", "Integrations", "Changelog", "Roadmap"],
  Company: ["About", "Blog", "Careers", "Press", "Partners"],
  Resources: ["Documentation", "API Reference", "Guides", "Community", "Status"],
  Legal: ["Privacy", "Terms", "Security", "Cookies", "GDPR"],
};

export function Footer() {
  return (
    <footer className="relative border-t border-border/50 py-16 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-primary-500" />
              <span className="font-bold text-lg">Productivity Hub</span>
            </div>
            <p className="text-sm text-foreground/50 mb-4 max-w-xs">
              The all-in-one productivity platform for modern professionals.
            </p>
            <p className="text-xs text-foreground/30 flex items-center gap-1">
              Made with <Heart className="w-3 h-3 text-danger-500 fill-danger-500" /> by the team
            </p>
          </div>
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="font-medium text-sm mb-4">{category}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link}>
                    <Link href="#" className="text-sm text-foreground/50 hover:text-foreground transition-colors">
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="pt-8 border-t border-border/50 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-foreground/30">
            &copy; {new Date().getFullYear()} Productivity Hub. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <a href="#" className="text-xs text-foreground/30 hover:text-foreground transition-colors">Twitter</a>
            <a href="#" className="text-xs text-foreground/30 hover:text-foreground transition-colors">GitHub</a>
            <a href="#" className="text-xs text-foreground/30 hover:text-foreground transition-colors">Discord</a>
            <a href="#" className="text-xs text-foreground/30 hover:text-foreground transition-colors">LinkedIn</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
