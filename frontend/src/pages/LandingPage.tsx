import { Link } from "react-router-dom";
import {
  Boxes,
  ArrowRight,
  Search,
  Waypoints,
  Wrench,
  ShieldCheck,
  GitPullRequest,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileSearch,
  Network,
  ClipboardCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { ROUTES } from "../constants/routes";

const oldWorkflow = ["Alert fires", "Investigate manually", "Find the owner", "Trace lineage by hand", "Guess root cause", "Write a fix", "Open a PR", "Document after the fact"];
const newWorkflow = ["Avenor investigates", "Root cause identified", "Impact scored", "Safe fix generated", "Pull request opened"];

const howItWorks = [
  { icon: Search, title: "Connect", description: "Point Avenor at your data sources and repositories — no agents to install, no pipelines to rewrite." },
  { icon: FileSearch, title: "Investigate", description: "Describe the incident. Avenor resolves the affected asset and starts tracing." },
  { icon: Network, title: "Understand", description: "Lineage, schema history, and ownership are walked automatically to find the actual cause." },
  { icon: Wrench, title: "Fix", description: "A concrete, reviewable fix is generated — SQL, tests, and file changes." },
  { icon: ClipboardCheck, title: "Validate", description: "A deterministic safety gate checks the fix before any human ever sees an approve button." },
  { icon: GitPullRequest, title: "Ship", description: "Once approved, Avenor opens a real pull request against your repository." },
];

const agents = [
  { title: "Planner", description: "Resolves the reported incident to a concrete data asset." },
  { title: "Investigator", description: "Walks lineage and schema history to find the root cause." },
  { title: "Impact Analyst", description: "Scores blast radius across dashboards, models, and pipelines." },
  { title: "Fixer", description: "Drafts a concrete fix — SQL, tests, and file diffs." },
  { title: "Validator", description: "Hard-gates unsafe fixes before they can reach approval." },
  { title: "Documentation", description: "Writes up the root cause and resolution for the record." },
];

const lineageChain = ["raw_orders", "orders", "revenue_model", "monthly_revenue", "revenue_dashboard"];

export default function LandingPage() {
  return (
    <div className="bg-background text-text-primary">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border-subtle bg-background/85 backdrop-blur-md">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent text-on-accent">
              <Boxes className="h-4 w-4" />
            </div>
            <span className="text-[15px] font-semibold tracking-tight">Avenor</span>
          </div>
          <div className="hidden items-center gap-7 md:flex">
            <a href="#how-it-works" className="text-sm text-text-secondary hover:text-text-primary transition-colors">How it works</a>
            <a href="#agents" className="text-sm text-text-secondary hover:text-text-primary transition-colors">Agents</a>
            <a href="#safety" className="text-sm text-text-secondary hover:text-text-primary transition-colors">Safety</a>
          </div>
          <div className="flex items-center gap-2">
            <Link to={ROUTES.login}>
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link to={ROUTES.register}>
              <Button size="sm">Start investigating</Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border-subtle">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage: "linear-gradient(var(--color-border-strong) 1px, transparent 1px), linear-gradient(90deg, var(--color-border-strong) 1px, transparent 1px)",
            backgroundSize: "36px 36px",
          }}
        />
        <div className="mx-auto grid max-w-6xl gap-14 px-6 py-20 lg:grid-cols-2 lg:items-center lg:py-28">
          <div className="relative z-10 space-y-6">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-text-secondary">
              <Sparkles className="h-3 w-3 text-accent" /> AI DataOps Engineer
            </div>
            <h1 className="text-4xl font-semibold leading-[1.1] tracking-tight text-text-primary md:text-5xl">Your AI DataOps Engineer.</h1>
            <p className="max-w-lg text-base leading-relaxed text-text-secondary md:text-lg">
              Avenor investigates broken dashboards, traces data lineage, identifies root causes, generates safe fixes, and opens GitHub pull requests — automatically.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link to={ROUTES.register}>
                <Button size="lg">
                  Start investigating <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a href="#how-it-works">
                <Button variant="outline" size="lg">See how it works</Button>
              </a>
            </div>
          </div>

          {/* Hero product visualization */}
          <div className="relative z-10">
            <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-overlay">
              <div className="flex items-center gap-2 border-b border-border-subtle px-4 py-3">
                <span className="h-2.5 w-2.5 rounded-full bg-danger/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-warning/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-success/60" />
                <span className="ml-2 font-mono text-xs text-text-tertiary">Avenor Investigation — INV-1042</span>
              </div>
              <div className="space-y-4 p-5">
                <div>
                  <p className="text-xs text-text-tertiary">Reported</p>
                  <p className="text-sm font-medium text-text-primary">Monthly Revenue Dashboard</p>
                </div>
                <div className="space-y-1.5 border-l-2 border-border pl-4 font-mono text-xs text-text-tertiary">
                  {["Revenue Model", "orders"].map((n) => (
                    <p key={n}>{n}</p>
                  ))}
                  <p className="flex items-center gap-1.5 text-danger">
                    customer_status <XCircle className="h-3.5 w-3.5" />
                  </p>
                </div>
                <div className="rounded-md border border-danger/25 bg-danger-muted px-3 py-2.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-danger">Root cause found</p>
                  <p className="mt-0.5 font-mono text-sm text-text-primary">COLUMN_REMOVED</p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-md bg-surface-elevated px-3 py-2">
                    <p className="text-xs text-text-tertiary">Risk</p>
                    <p className="font-medium text-danger">HIGH</p>
                  </div>
                  <div className="rounded-md bg-surface-elevated px-3 py-2">
                    <p className="text-xs text-text-tertiary">Impact</p>
                    <p className="font-medium text-text-primary">7 assets</p>
                  </div>
                </div>
                <div className="space-y-1.5 pt-1 text-sm text-text-secondary">
                  <p className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success" /> Fix validated
                  </p>
                  <p className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success" /> Pull request ready
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem / Solution */}
      <section className="border-b border-border-subtle px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight">The old workflow doesn't scale.</h2>
            <p className="mt-3 text-text-secondary">Every incident becomes a manual archaeology project. Avenor collapses it into one autonomous pass.</p>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-lg border border-border-subtle bg-surface p-6">
              <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-text-tertiary">Traditional DataOps</p>
              <ol className="space-y-2.5">
                {oldWorkflow.map((step, i) => (
                  <li key={step} className="flex items-center gap-3 text-sm text-text-secondary">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-surface-elevated text-[11px] text-text-tertiary">{i + 1}</span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
            <div className="rounded-lg border border-accent/25 bg-accent-muted/40 p-6">
              <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-accent-hover">With Avenor</p>
              <ol className="space-y-2.5">
                {newWorkflow.map((step, i) => (
                  <li key={step} className="flex items-center gap-3 text-sm text-text-primary">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-[11px] text-on-accent">{i + 1}</span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="border-b border-border-subtle px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight">How Avenor works</h2>
            <p className="mt-3 text-text-secondary">Six steps, one autonomous pass, end to end.</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {howItWorks.map((step) => (
              <div key={step.title} className="rounded-lg border border-border-subtle bg-surface p-5">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md bg-accent-muted text-accent-hover">
                  <step.icon className="h-4.5 w-4.5" />
                </div>
                <h3 className="text-sm font-semibold text-text-primary">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Agent pipeline */}
      <section id="agents" className="border-b border-border-subtle px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight">Autonomous investigation</h2>
            <p className="mt-3 text-text-secondary">A pipeline of specialized agents, each with one job.</p>
          </div>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-stretch">
            {agents.map((agent, i) => (
              <div key={agent.title} className="flex flex-1 items-center gap-3 lg:flex-col lg:items-start lg:gap-0">
                <div className="flex-1 rounded-lg border border-border-subtle bg-surface p-4 lg:w-full">
                  <p className="font-mono text-xs text-accent">0{i + 1}</p>
                  <h3 className="mt-1 text-sm font-semibold text-text-primary">{agent.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-text-secondary">{agent.description}</p>
                </div>
                {i < agents.length - 1 && (
                  <ArrowRight className="hidden h-4 w-4 shrink-0 text-text-tertiary lg:mx-1 lg:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Lineage */}
      <section className="border-b border-border-subtle px-6 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <Waypoints className="mx-auto mb-4 h-8 w-8 text-accent" />
          <h2 className="text-3xl font-semibold tracking-tight">Lineage, fully traced.</h2>
          <p className="mx-auto mt-3 max-w-xl text-text-secondary">Every asset's upstream and downstream dependencies, walked automatically — not maintained by hand in a wiki.</p>
          <div className="mx-auto mt-10 flex max-w-2xl flex-col items-center gap-2 sm:flex-row sm:justify-center sm:gap-0">
            {lineageChain.map((node, i) => (
              <div key={node} className="flex items-center">
                <div className="rounded-md border border-border bg-surface px-3.5 py-2 font-mono text-xs text-text-primary">{node}</div>
                {i < lineageChain.length - 1 && <ArrowRight className="mx-2 h-3.5 w-3.5 shrink-0 text-text-tertiary sm:rotate-0" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Safety */}
      <section id="safety" className="border-b border-border-subtle px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <ShieldCheck className="mx-auto mb-4 h-8 w-8 text-accent" />
            <h2 className="text-3xl font-semibold tracking-tight">Avenor doesn't blindly change production systems.</h2>
            <p className="mt-3 text-text-secondary">Every fix passes through a deterministic safety gate, then a human, before anything ships.</p>
          </div>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            {["AI proposes", "Safety validation", "Human approval", "GitHub PR"].map((step, i, arr) => (
              <div key={step} className="flex items-center gap-3">
                <div className="rounded-md border border-border bg-surface px-4 py-2.5 text-sm font-medium text-text-primary">{step}</div>
                {i < arr.length - 1 && <ArrowRight className="h-4 w-4 shrink-0 text-text-tertiary" />}
              </div>
            ))}
          </div>
          <div className="mx-auto mt-10 grid max-w-xl gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-success/25 bg-success-muted/40 p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-success">Avenor will</p>
              <ul className="space-y-1.5 text-sm text-text-secondary">
                <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-success" /> Propose a reviewable fix</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-success" /> Run it through validation</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-success" /> Open a pull request once approved</li>
              </ul>
            </div>
            <div className="rounded-lg border border-danger/25 bg-danger-muted/40 p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-danger">Avenor will not</p>
              <ul className="space-y-1.5 text-sm text-text-secondary">
                <li className="flex items-center gap-2"><XCircle className="h-3.5 w-3.5 shrink-0 text-danger" /> Execute destructive SQL</li>
                <li className="flex items-center gap-2"><XCircle className="h-3.5 w-3.5 shrink-0 text-danger" /> Merge a pull request automatically</li>
                <li className="flex items-center gap-2"><XCircle className="h-3.5 w-3.5 shrink-0 text-danger" /> Deploy to production</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* GitHub integration */}
      <section className="border-b border-border-subtle px-6 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <GitPullRequest className="mx-auto mb-4 h-8 w-8 text-accent" />
          <h2 className="text-3xl font-semibold tracking-tight">Ships as a real pull request.</h2>
          <p className="mx-auto mt-3 max-w-xl text-text-secondary">Not a suggestion in a chat window — an actual branch, commit, and PR against your repository.</p>
          <div className="mx-auto mt-10 flex max-w-2xl flex-wrap items-center justify-center gap-2">
            {["Avenor", "Repository", "Branch", "Commit", "Pull Request"].map((step, i, arr) => (
              <div key={step} className="flex items-center gap-2">
                <div className="rounded-md border border-border bg-surface px-3.5 py-2 text-sm font-medium text-text-primary">{step}</div>
                {i < arr.length - 1 && <ArrowRight className="h-3.5 w-3.5 shrink-0 text-text-tertiary" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <AlertTriangle className="mx-auto mb-4 h-7 w-7 text-warning" />
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Stop chasing data incidents.</h2>
          <p className="mt-3 text-lg text-text-secondary">Let Avenor investigate them.</p>
          <Link to={ROUTES.register} className="mt-8 inline-block">
            <Button size="lg">
              Start with Avenor <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-border-subtle px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-accent text-on-accent">
              <Boxes className="h-3.5 w-3.5" />
            </div>
            <span className="text-sm font-medium text-text-secondary">Avenor</span>
          </div>
          <p className="text-xs text-text-tertiary">AI DataOps Engineer</p>
        </div>
      </footer>
    </div>
  );
}
