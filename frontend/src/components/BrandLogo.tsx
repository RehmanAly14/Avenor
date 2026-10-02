import { Link } from "react-router-dom";
import { Boxes } from "lucide-react";
import { ROUTES } from "../constants/routes";
import { cn } from "../utils/cn";

const SIZES = {
  md: { box: "h-8 w-8", icon: "h-4.5 w-4.5", text: "text-[15px] font-semibold tracking-tight text-text-primary" },
  sm: { box: "h-7 w-7", icon: "h-4 w-4", text: "text-[15px] font-semibold tracking-tight text-text-primary" },
  xs: { box: "h-6 w-6", icon: "h-3.5 w-3.5", text: "text-sm font-medium text-text-secondary" },
} as const;

interface BrandLogoProps {
  size?: keyof typeof SIZES;
  /** Hide the "Avenor" wordmark, e.g. for a collapsed sidebar — the icon mark still links home. */
  showText?: boolean;
  className?: string;
}

/**
 * Avenor's brand mark. Always links to the public homepage — every place it
 * appears (public navbar, footer, auth screens, app sidebar) shares this one
 * component so that behavior can't drift out of sync between them.
 */
export function BrandLogo({ size = "md", showText = true, className }: BrandLogoProps) {
  const { box, icon, text } = SIZES[size];
  return (
    <Link
      to={ROUTES.landing}
      aria-label="Avenor home"
      className={cn(
        "flex items-center gap-2.5 rounded-md transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className
      )}
    >
      <div className={cn("flex shrink-0 items-center justify-center rounded-md bg-accent text-on-accent", box)}>
        <Boxes className={icon} />
      </div>
      {showText && <span className={text}>Avenor</span>}
    </Link>
  );
}
