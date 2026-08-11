"use client";

import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  floating?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, floating, placeholder, ...props }, ref) => {
    return (
      <div className="relative w-full">
        {label && !floating && (
          <label className="block text-sm font-medium text-foreground/80 mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            placeholder={placeholder || (floating ? label : "")}
            className={cn(
              "w-full h-11 px-4 py-2.5 bg-white/50 dark:bg-white/5 backdrop-blur-xl border rounded-2xl text-foreground placeholder:text-muted-foreground transition-all duration-200",
              "focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500/50",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              icon && "pl-10",
              error &&
                "border-danger-500 focus:ring-danger-500/30 focus:border-danger-500",
              !error && "border-border/50 hover:border-border",
              className,
            )}
            {...props}
          />
          {floating && label && (
            <label
              className={cn(
                "absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-all duration-200 pointer-events-none",
                props.value && "opacity-0",
              )}
            >
              {label}
            </label>
          )}
        </div>
        {error && <p className="mt-1 text-xs text-danger-500">{error}</p>}
      </div>
    );
  },
);

Input.displayName = "Input";
export { Input };
