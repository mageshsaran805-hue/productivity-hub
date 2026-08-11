import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?:
    | "default"
    | "primary"
    | "success"
    | "warning"
    | "danger"
    | "outline";
  size?: "sm" | "md" | "lg";
  className?: string;
}

const variantStyles = {
  default: "bg-foreground/10 text-foreground/70 border border-foreground/10",
  primary:
    "bg-primary-500/10 text-primary-500 border border-primary-500/20",
  success:
    "bg-success-500/10 text-success-500 border border-success-500/20",
  warning:
    "bg-warning-500/10 text-warning-500 border border-warning-500/20",
  danger: "bg-danger-500/10 text-danger-500 border border-danger-500/20",
  outline: "bg-transparent border border-border text-foreground/60",
};

const sizeStyles = {
  sm: "px-2 py-0.5 text-[10px]",
  md: "px-2.5 py-1 text-xs",
  lg: "px-3 py-1.5 text-sm",
};

export function Badge({
  children,
  variant = "default",
  size = "md",
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-medium rounded-full",
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
    >
      {children}
    </span>
  );
}
