import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Activity, AlertOctagon, Boxes, GitPullRequest, Plus, Search } from "lucide-react";
import { Card, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Skeleton } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { StatusPill } from "../components/ui/StatusPill";
import { Table, TableContainer, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../components/ui/Table";
import * as investigationsApi from "../lib/api/investigations";
import { useAuth } from "../context/AuthContext";
import { ROUTES } from "../constants/routes";
import { greeting, formatRelativeTime, truncate } from "../utils/format";

const ACTIVE_STAGES = ["PENDING", "PLANNING", "INVESTIGATING", "ANALYZING_IMPACT", "GENERATING_FIX", "DOCUMENTING"];

export default function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["investigations", "dashboard"],
    queryFn: () => investigationsApi.listInvestigations({ limit: 100 }),
  });

  const investigations = data?.investigations ?? [];
  const active = investigations.filter((inv) => ACTIVE_STAGES.includes(inv.stage)).length;
  const critical = investigations.filter((inv) => inv.severity === "HIGH" || inv.severity === "CRITICAL").length;
  const affectedAssets = investigations.reduce((sum, inv) => sum + (inv.impact?.summary?.totalAffected ?? 0), 0);
  const openPRs = investigations.filter((inv) => inv.fixApprovalStatus === "PR_CREATED").length;

  const metrics = [
    { label: "Active Investigations", value: active, icon: Activity, tone: "text-info" },
    { label: "Critical Incidents", value: critical, icon: AlertOctagon, tone: "text-danger" },
    { label: "Affected Assets", value: affectedAssets, icon: Boxes, tone: "text-warning" },
    { label: "Open PRs", value: openPRs, icon: GitPullRequest, tone: "text-success" },
  ];

  const recent = [...investigations].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)).slice(0, 8);

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 md:px-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
            {greeting()}, {user?.name?.split(" ")[0]}
          </h1>
          <p className="mt-1 text-sm text-text-secondary">Here's what's happening across your data infrastructure.</p>
        </div>
        <Link to={ROUTES.newInvestigation}>
          <Button>
            <Plus className="h-4 w-4" /> New Investigation
          </Button>
        </Link>
      </div>

      {isError ? (
        <ErrorState description="We couldn't load your dashboard data." onRetry={() => refetch()} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {metrics.map((m) => (
              <Card key={m.label}>
                <CardContent className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-text-tertiary">{m.label}</p>
                    {isLoading ? <Skeleton className="mt-2 h-7 w-10" /> : <p className="mt-1 text-2xl font-semibold text-text-primary">{m.value}</p>}
                  </div>
                  <m.icon className={`h-5 w-5 ${m.tone}`} />
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <div className="flex items-center justify-between border-b border-border-subtle px-5 py-4">
              <h2 className="text-sm font-semibold text-text-primary">Recent Incidents</h2>
              <Link to={ROUTES.investigations} className="text-xs font-medium text-accent hover:text-accent-hover">
                View all
              </Link>
            </div>

            {isLoading ? (
              <div className="space-y-3 p-5">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : recent.length === 0 ? (
              <EmptyState
                className="border-none"
                icon={<Search className="h-5 w-5" />}
                title="No investigations yet"
                description="Start your first investigation to see root causes, impact, and fixes here."
                action={
                  <Link to={ROUTES.newInvestigation}>
                    <Button size="sm">Start investigating</Button>
                  </Link>
                }
              />
            ) : (
              <TableContainer className="rounded-none border-none">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Incident</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Risk</TableHead>
                      <TableHead>Root Cause</TableHead>
                      <TableHead>Assets</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recent.map((inv) => (
                      <TableRow key={inv.id} className="cursor-pointer">
                        <TableCell>
                          <Link to={ROUTES.investigationDetail(inv.id)} className="font-medium text-text-primary hover:text-accent">
                            {truncate(inv.title, 48)}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <StatusPill value={inv.stage} />
                        </TableCell>
                        <TableCell>
                          <StatusPill value={inv.severity} />
                        </TableCell>
                        <TableCell className="max-w-[220px] truncate text-text-secondary">{inv.rootCause ?? "—"}</TableCell>
                        <TableCell className="text-text-secondary">{inv.impact?.summary?.totalAffected ?? "—"}</TableCell>
                        <TableCell className="whitespace-nowrap text-text-tertiary">{formatRelativeTime(inv.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
