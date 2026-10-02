import { type ReactNode } from "react";
import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "./Card";
import { Skeleton } from "./Skeleton";
import { cn } from "../../utils/cn";

interface MetricCardProps {
  label: string;
  value: ReactNode;
  icon: LucideIcon;
  tone?: "neutral" | "accent" | "success" | "warning" | "danger" | "info";
  href?: string;
  loading?: boolean;
  hint?: string;
}

const TONE_CLASSES: Record<NonNullable<MetricCardProps["tone"]>, string> = {
  neutral: "text-text-tertiary",
  accent: "text-accent",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
  info: "text-info",
};

export function MetricCard({ label, value, icon: Icon, tone = "neutral", href, loading, hint }: MetricCardProps) {
  const content = (
    <Card className={cn("h-full transition-colors", href && "hover:border-border-strong")}>
      <CardContent className="flex items-center justify-between">
        <div className="min-w-0">
          <p className="text-xs text-text-tertiary">{label}</p>
          {loading ? <Skeleton className="mt-2 h-7 w-10" /> : <p className="mt-1 text-2xl font-semibold text-text-primary">{value}</p>}
          {hint && !loading && <p className="mt-0.5 text-[11px] text-text-tertiary">{hint}</p>}
        </div>
        <Icon className={cn("h-5 w-5 shrink-0", TONE_CLASSES[tone])} />
      </CardContent>
    </Card>
  );

  if (!href) return content;
  return <Link to={href}>{content}</Link>;
}
