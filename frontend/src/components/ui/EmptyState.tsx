import { type ReactNode } from "react";
import { cn } from "../../utils/cn";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border px-6 py-14 text-center", className)}>
      {icon && <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-surface-elevated text-text-tertiary">{icon}</div>}
      <div className="space-y-1">
        <p className="text-sm font-medium text-text-primary">{title}</p>
        {description && <p className="text-sm text-text-secondary max-w-sm">{description}</p>}
      </div>
      {action}
    </div>
  );
}
