import { type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Boxes, GitPullRequest, ShieldCheck, Waypoints } from "lucide-react";
import { ROUTES } from "../constants/routes";

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}

export default function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Left: brand panel */}
      <aside className="relative hidden w-[440px] shrink-0 flex-col justify-between overflow-hidden border-r border-border-subtle bg-surface p-10 lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: "linear-gradient(var(--color-border-strong) 1px, transparent 1px), linear-gradient(90deg, var(--color-border-strong) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        <Link to={ROUTES.landing} className="relative z-10 flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-accent text-on-accent">
            <Boxes className="h-4.5 w-4.5" />
          </div>
          <span className="text-[15px] font-semibold tracking-tight text-text-primary">Avenor</span>
        </Link>

        <div className="relative z-10 space-y-8">
          <div className="space-y-3">
            <h2 className="text-2xl font-semibold leading-snug text-text-primary">
              Root cause before <span className="text-accent">reaction.</span>
            </h2>
            <p className="max-w-[320px] text-sm leading-relaxed text-text-secondary">
              Avenor investigates broken dashboards, traces lineage, and opens pull requests — so your team fixes the cause, not the symptom.
            </p>
          </div>

          <ul className="space-y-3.5 text-sm text-text-secondary">
            <li className="flex items-center gap-2.5">
              <Waypoints className="h-4 w-4 shrink-0 text-accent" /> Full lineage tracing, upstream to downstream
            </li>
            <li className="flex items-center gap-2.5">
              <ShieldCheck className="h-4 w-4 shrink-0 text-accent" /> Every fix is human-approved before it ships
            </li>
            <li className="flex items-center gap-2.5">
              <GitPullRequest className="h-4 w-4 shrink-0 text-accent" /> Real pull requests, not just suggestions
            </li>
          </ul>
        </div>

        <p className="relative z-10 text-xs text-text-tertiary">Avenor — AI DataOps Engineer</p>
      </aside>

      {/* Right: form */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-[380px]">
          <div className="mb-8 lg:hidden">
            <Link to={ROUTES.landing} className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-accent text-on-accent">
                <Boxes className="h-4.5 w-4.5" />
              </div>
              <span className="text-[15px] font-semibold tracking-tight text-text-primary">Avenor</span>
            </Link>
          </div>

          <h1 className="text-xl font-semibold text-text-primary">{title}</h1>
          <p className="mt-1.5 text-sm text-text-secondary">{subtitle}</p>

          <div className="mt-7">{children}</div>

          <div className="mt-6 text-center text-sm text-text-secondary">{footer}</div>
        </div>
      </div>
    </div>
  );
}
