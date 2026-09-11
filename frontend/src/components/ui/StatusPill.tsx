import { Badge } from "./Badge";

// Central status → tone mapping so risk/status colors stay consistent
// everywhere (dashboard, investigations list, detail tabs, data sources).
const TONE_MAP: Record<string, "neutral" | "accent" | "success" | "warning" | "danger" | "info"> = {
  // Risk / severity
  LOW: "success",
  MEDIUM: "warning",
  HIGH: "danger",
  CRITICAL: "danger",
  // Investigation stage
  PENDING: "neutral",
  PLANNING: "info",
  INVESTIGATING: "info",
  ANALYZING_IMPACT: "info",
  GENERATING_FIX: "info",
  DOCUMENTING: "info",
  COMPLETED: "success",
  FAILED: "danger",
  // Incident status
  OPEN: "warning",
  RESOLVED: "success",
  // Fix approval status
  PROPOSED: "neutral",
  VALIDATED: "info",
  AWAITING_APPROVAL: "warning",
  APPROVED: "success",
  REJECTED: "danger",
  PR_CREATED: "accent",
  // Data source / GitHub
  ACTIVE: "success",
  INACTIVE: "neutral",
  ERROR: "danger",
  CONNECTED: "success",
  DISCONNECTED: "neutral",
};

const LABEL_OVERRIDES: Record<string, string> = {
  ANALYZING_IMPACT: "Analyzing impact",
  GENERATING_FIX: "Generating fix",
  AWAITING_APPROVAL: "Awaiting approval",
  PR_CREATED: "PR created",
};

function formatLabel(value: string) {
  if (LABEL_OVERRIDES[value]) return LABEL_OVERRIDES[value];
  return value
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}

export function StatusPill({ value, className }: { value: string; className?: string }) {
  const tone = TONE_MAP[value] ?? "neutral";
  const isLive = ["INVESTIGATING", "ANALYZING_IMPACT", "GENERATING_FIX", "PLANNING"].includes(value);
  return (
    <Badge tone={tone} className={className}>
      <span className={isLive ? "h-1.5 w-1.5 rounded-full bg-current animate-pulse" : "h-1.5 w-1.5 rounded-full bg-current"} aria-hidden />
      {formatLabel(value)}
    </Badge>
  );
}
