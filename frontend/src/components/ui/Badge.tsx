import { type HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../utils/cn";

const badgeVariants = cva("inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium border", {
  variants: {
    tone: {
      neutral: "bg-surface-elevated text-text-secondary border-border",
      accent: "bg-accent-muted text-accent-hover border-accent/30",
      success: "bg-success-muted text-success border-success/30",
      warning: "bg-warning-muted text-warning border-warning/30",
      danger: "bg-danger-muted text-danger border-danger/30",
      info: "bg-info-muted text-info border-info/30",
    },
  },
  defaultVariants: { tone: "neutral" },
});

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

export function Badge({ className, tone, dot, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ tone }), className)} {...props}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />}
      {children}
    </span>
  );
}
