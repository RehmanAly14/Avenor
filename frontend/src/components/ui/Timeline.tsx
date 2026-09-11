import { type ReactNode } from "react";
import { cn } from "../../utils/cn";

export interface TimelineItem {
  id: string;
  icon?: ReactNode;
  title: string;
  description?: string;
  timestamp?: string;
  tone?: "neutral" | "success" | "warning" | "danger" | "info" | "accent";
}

const DOT_TONE: Record<NonNullable<TimelineItem["tone"]>, string> = {
  neutral: "bg-text-tertiary",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  info: "bg-info",
  accent: "bg-accent",
};

export function Timeline({ items }: { items: TimelineItem[] }) {
  return (
    <ol className="relative space-y-6">
      {items.map((item, i) => (
        <li key={item.id} className="relative flex gap-3.5">
          <div className="relative flex flex-col items-center">
            <span className={cn("z-10 mt-1 h-2.5 w-2.5 shrink-0 rounded-full ring-4 ring-surface", DOT_TONE[item.tone ?? "neutral"])} />
            {i < items.length - 1 && <span className="w-px flex-1 bg-border-strong mt-1" aria-hidden />}
          </div>
          <div className="min-w-0 flex-1 pb-1">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
              <p className="text-sm font-medium text-text-primary">{item.title}</p>
              {item.timestamp && <time className="text-xs text-text-tertiary font-mono">{item.timestamp}</time>}
            </div>
            {item.description && <p className="mt-0.5 text-sm text-text-secondary">{item.description}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}
