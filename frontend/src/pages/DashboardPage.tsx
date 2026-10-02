import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { AlertOctagon, CalendarClock, Database, Boxes, GitPullRequest, Plus, Search, Zap } from "lucide-react";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Skeleton } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { StatusPill } from "../components/ui/StatusPill";
import { MetricCard } from "../components/ui/MetricCard";
import { Table, TableContainer, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../components/ui/Table";
import * as investigationsApi from "../lib/api/investigations";
import * as datasourcesApi from "../lib/api/datasources";
import * as catalogApi from "../lib/api/catalog";
import { useAuth } from "../context/AuthContext";
import { useWorkspace } from "../context/WorkspaceContext";
import { ROUTES } from "../constants/routes";
import { greeting, formatRelativeTime, truncate } from "../utils/format";

const TERMINAL_STAGES = ["COMPLETED", "FAILED"];

function isToday(dateInput: string) {
  const d = new Date(dateInput);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { currentWorkspace, currentProject, hasWorkspace, hasProject } = useWorkspace();

  const investigationsQuery = useQuery({
    queryKey: ["investigations", "dashboard"],
    queryFn: () => investigationsApi.listInvestigations({ limit: 100 }),
  });
  const dataSourcesQuery = useQuery({
    queryKey: ["datasources", currentWorkspace?.id, currentProject?.id],
    queryFn: () => datasourcesApi.listDataSources({ workspaceId: currentWorkspace?.id, projectId: currentProject?.id, limit: 1 }),
    enabled: hasWorkspace && hasProject,
  });
  const assetsQuery = useQuery({
    queryKey: ["catalog", "all", currentWorkspace?.id, currentProject?.id],
    queryFn: () => catalogApi.listCatalogAssets({ workspaceId: currentWorkspace?.id, projectId: currentProject?.id, limit: 1 }),
    enabled: hasWorkspace && hasProject,
  });

  const investigations = investigationsQuery.data?.investigations ?? [];
  const isLoading = investigationsQuery.isLoading;

  const openIncidents = investigations.filter((inv) => inv.status === "OPEN" || inv.status === "INVESTIGATING").length;
  const investigationsToday = investigations.filter((inv) => isToday(inv.createdAt)).length;
  const pendingFixes = investigations.filter((inv) => inv.fixApprovalStatus === "AWAITING_APPROVAL").length;

  const metrics = [
    { label: "Open Incidents", value: openIncidents, icon: AlertOctagon, tone: "danger" as const, href: ROUTES.investigations, loading: isLoading },
    { label: "Investigations Today", value: investigationsToday, icon: Zap, tone: "info" as const, href: ROUTES.investigations, loading: isLoading },
    { label: "Data Sources", value: dataSourcesQuery.data?.meta?.total ?? 0, icon: Database, tone: "neutral" as const, href: ROUTES.dataSources, loading: dataSourcesQuery.isLoading },
    { label: "Assets Tracked", value: assetsQuery.data?.meta?.total ?? 0, icon: Boxes, tone: "neutral" as const, href: ROUTES.metadata, loading: assetsQuery.isLoading },
    { label: "Pending Fixes", value: pendingFixes, icon: GitPullRequest, tone: "warning" as const, href: ROUTES.investigations, loading: isLoading },
  ];

  const active = [...investigations]
    .filter((inv) => !TERMINAL_STAGES.includes(inv.stage))
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    .slice(0, 5);

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
        <div className="flex items-center gap-2">
          <Link to={ROUTES.dataSources}>
            <Button variant="outline">Connect Data Source</Button>
          </Link>
          <Link to={ROUTES.newInvestigation}>
            <Button>
              <Plus className="h-4 w-4" /> New Investigation
            </Button>
          </Link>
        </div>
      </div>

      {investigationsQuery.isError ? (
        <ErrorState description="We couldn't load your dashboard data." onRetry={() => investigationsQuery.refetch()} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            {metrics.map((m) => (
              <MetricCard key={m.label} {...m} />
            ))}
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-text-primary">Active Incidents</h2>
              <Link to={ROUTES.investigations} className="text-xs font-medium text-accent hover:text-accent-hover">
                View all
              </Link>
            </div>

            {isLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : active.length === 0 ? (
              <EmptyState icon={<AlertOctagon className="h-5 w-5" />} title="No active incidents" description="Everything Avenor is watching is resolved or hasn't surfaced an issue." />
            ) : (
              <div className="space-y-2">
                {active.map((inv) => (
                  <Link key={inv.id} to={ROUTES.investigationDetail(inv.id)}>
                    <Card className="transition-colors hover:border-border-strong">
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5">
                        <StatusPill value={inv.severity} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-text-primary">{inv.title}</p>
                          {inv.rootCause && <p className="truncate text-xs text-text-tertiary">Root cause: {inv.rootCause}</p>}
                        </div>
                        <StatusPill value={inv.stage} />
                        <span className="shrink-0 text-xs text-text-tertiary">{formatRelativeTime(inv.createdAt)}</span>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <Card>
            <div className="flex items-center justify-between border-b border-border-subtle px-5 py-4">
              <h2 className="text-sm font-semibold text-text-primary">Recent Investigations</h2>
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
                      <TableHead>Root Cause</TableHead>
                      <TableHead>Risk</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Updated</TableHead>
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
                        <TableCell className="max-w-[220px] truncate text-text-secondary">{inv.rootCause ?? "—"}</TableCell>
                        <TableCell>
                          <StatusPill value={inv.severity} />
                        </TableCell>
                        <TableCell>
                          <StatusPill value={inv.stage} />
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-text-tertiary">
                          <span className="inline-flex items-center gap-1.5">
                            <CalendarClock className="h-3 w-3" /> {formatRelativeTime(inv.updatedAt)}
                          </span>
                        </TableCell>
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
