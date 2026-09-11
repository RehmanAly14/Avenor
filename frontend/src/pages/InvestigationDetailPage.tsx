import { useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Database,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  GitPullRequest,
  ExternalLink,
  AlertTriangle,
  RefreshCcw,
} from "lucide-react";
import { Badge } from "../components/ui/Badge";
import { StatusPill } from "../components/ui/StatusPill";
import { Card, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Skeleton } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { CodeBlock } from "../components/ui/CodeBlock";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { Timeline, type TimelineItem } from "../components/ui/Timeline";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/Tabs";
import { LineageGraph } from "../components/shared/LineageGraph";
import { useToast } from "../components/ui/Toast";
import * as investigationsApi from "../lib/api/investigations";
import { ApiError } from "../lib/api/client";
import type { IncidentEventType } from "../lib/api/types";
import { ROUTES } from "../constants/routes";
import { formatRelativeTime } from "../utils/format";

const TABS = ["overview", "lineage", "evidence", "impact", "fix", "timeline"] as const;
type TabKey = (typeof TABS)[number];

const EVENT_TONE: Record<IncidentEventType, TimelineItem["tone"]> = {
  INVESTIGATION_STARTED: "neutral",
  ASSET_RESOLVED: "info",
  ROOT_CAUSE_FOUND: "danger",
  IMPACT_ANALYZED: "warning",
  FIX_GENERATED: "accent",
  FIX_VALIDATED: "info",
  AWAITING_APPROVAL: "warning",
  FIX_APPROVED: "success",
  FIX_REJECTED: "danger",
  GITHUB_BRANCH_CREATED: "accent",
  GITHUB_PR_CREATED: "success",
  GITHUB_PR_MERGED: "success",
  GITHUB_PR_CLOSED: "neutral",
  DOCUMENTATION_GENERATED: "neutral",
  INCIDENT_RESOLVED: "success",
};

function humanizeEventType(type: string) {
  return type
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
}

function confidenceBucket(confidence: number): "LOW" | "MEDIUM" | "HIGH" {
  if (confidence >= 0.8) return "HIGH";
  if (confidence >= 0.5) return "MEDIUM";
  return "LOW";
}

export default function InvestigationDetailPage() {
  const { id = "" } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);

  const activeTab = (TABS.includes(searchParams.get("tab") as TabKey) ? searchParams.get("tab") : "overview") as TabKey;
  const setActiveTab = (tab: string) => setSearchParams((prev) => ({ ...Object.fromEntries(prev), tab }), { replace: true });

  const investigationQuery = useQuery({ queryKey: ["investigation", id], queryFn: () => investigationsApi.getInvestigation(id), enabled: Boolean(id) });
  const reportQuery = useQuery({ queryKey: ["investigation", id, "report"], queryFn: () => investigationsApi.getInvestigationReport(id), enabled: Boolean(id) });
  const timelineQuery = useQuery({ queryKey: ["investigation", id, "timeline"], queryFn: () => investigationsApi.getTimeline(id), enabled: Boolean(id) });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["investigation", id] });
  };

  const validateMutation = useMutation({
    mutationFn: () => investigationsApi.validateFix(id),
    onSuccess: (result) => {
      invalidateAll();
      toast(
        result.validation?.blocked
          ? { title: "Fix blocked", description: "Validation found this fix unsafe to approve.", variant: "error" }
          : { title: "Fix validated", description: "The fix passed validation and is awaiting approval.", variant: "success" }
      );
    },
    onError: (err) => toast({ title: "Validation failed", description: err instanceof ApiError ? err.message : undefined, variant: "error" }),
  });

  const approveMutation = useMutation({
    mutationFn: () => investigationsApi.approveFix(id),
    onSuccess: (result) => {
      invalidateAll();
      setApproveOpen(false);
      if (result.githubError) {
        toast({ title: "Fix approved", description: `Approved, but the PR couldn't be created: ${result.githubError}`, variant: "warning" });
      } else {
        toast({ title: "Fix approved", description: "A pull request is being prepared.", variant: "success" });
      }
    },
    onError: (err) => toast({ title: "Approval failed", description: err instanceof ApiError ? err.message : undefined, variant: "error" }),
  });

  const rejectMutation = useMutation({
    mutationFn: () => investigationsApi.rejectFix(id),
    onSuccess: () => {
      invalidateAll();
      setRejectOpen(false);
      toast({ title: "Fix rejected", variant: "info" });
    },
    onError: (err) => toast({ title: "Reject failed", description: err instanceof ApiError ? err.message : undefined, variant: "error" }),
  });

  const retryPrMutation = useMutation({
    mutationFn: () => investigationsApi.retryPullRequest(id),
    onSuccess: () => {
      invalidateAll();
      toast({ title: "Pull request created", variant: "success" });
    },
    onError: (err) => toast({ title: "Couldn't create the pull request", description: err instanceof ApiError ? err.message : undefined, variant: "error" }),
  });

  const investigation = investigationQuery.data;
  const report = reportQuery.data;

  const lineageGraph = useMemo(() => {
    const chain = report?.lineage ?? [];
    if (chain.length === 0) return null;
    const rootAssetName = report?.evidence?.[0]?.asset;
    const nodes = chain.map((name, i) => ({ id: name, position: { x: i * 220, y: 0 }, data: { label: name, depth: i } }));
    const edges = chain.slice(1).map((name, i) => ({ id: `${chain[i]}-${name}`, source: chain[i], target: name, label: "DOWNSTREAM" }));
    return { nodes, edges, rootCauseNodeId: rootAssetName };
  }, [report]);

  if (investigationQuery.isLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 md:px-8">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (investigationQuery.isError || !investigation) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 md:px-8">
        <ErrorState description="We couldn't load this investigation." onRetry={() => investigationQuery.refetch()} />
      </div>
    );
  }

  const fix = report?.proposedFix ?? null;
  const validation = report?.validation ?? null;
  const github = report?.github ?? null;
  const approvalStatus = investigation.fixApprovalStatus;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-8">
      <Link to={ROUTES.investigations} className="mb-4 inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary">
        <ArrowLeft className="h-3.5 w-3.5" /> Investigations
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-text-primary md:text-2xl">{investigation.title}</h1>
          <p className="mt-1 font-mono text-xs text-text-tertiary">INV-{investigation.id.slice(0, 8).toUpperCase()}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={investigation.severity === "HIGH" || investigation.severity === "CRITICAL" ? "danger" : investigation.severity === "MEDIUM" ? "warning" : "success"}>
            {investigation.severity} RISK
          </Badge>
          <StatusPill value={investigation.stage} />
        </div>
      </div>

      {investigation.stage === "FAILED" && investigation.error && (
        <div className="mt-5 flex items-start gap-2 rounded-md border border-danger/30 bg-danger-muted px-3.5 py-3 text-sm text-danger">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {investigation.error}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-7">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="lineage">Lineage</TabsTrigger>
          <TabsTrigger value="evidence">Evidence</TabsTrigger>
          <TabsTrigger value="impact">Impact</TabsTrigger>
          <TabsTrigger value="fix">Fix</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="mt-6 space-y-5">
          {reportQuery.isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : !report?.rootCause ? (
            <EmptyState icon={<Database className="h-5 w-5" />} title="No root cause available yet" />
          ) : (
            <>
              <Card>
                <CardContent className="space-y-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-text-tertiary">Root Cause</p>
                  {report.rootCause.column && <p className="font-mono text-sm text-text-primary">{report.rootCause.column}</p>}
                  <Badge tone="danger" className="font-mono">
                    {report.rootCause.type}
                  </Badge>
                  <p className="text-sm leading-relaxed text-text-secondary">{report.rootCause.description}</p>
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-xs text-text-tertiary">Confidence</span>
                    <StatusPill value={confidenceBucket(report.rootCause.confidence)} />
                  </div>
                </CardContent>
              </Card>
              {report.recommendation && (
                <Card className="border-accent/25 bg-accent-muted/30">
                  <CardContent>
                    <p className="text-xs font-medium uppercase tracking-wide text-accent-hover">Recommendation</p>
                    <p className="mt-2 text-sm leading-relaxed text-text-primary">{report.recommendation}</p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* Lineage */}
        <TabsContent value="lineage" className="mt-6">
          {reportQuery.isLoading ? (
            <Skeleton className="h-[420px] w-full" />
          ) : !lineageGraph ? (
            <EmptyState icon={<Database className="h-5 w-5" />} title="No lineage trace available" />
          ) : (
            <Card>
              <CardContent className="p-2">
                <LineageGraph nodes={lineageGraph.nodes} edges={lineageGraph.edges} rootCauseNodeId={lineageGraph.rootCauseNodeId} />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Evidence */}
        <TabsContent value="evidence" className="mt-6 space-y-3">
          {reportQuery.isLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : !report?.evidence || report.evidence.length === 0 ? (
            <EmptyState icon={<Database className="h-5 w-5" />} title="No evidence collected" />
          ) : (
            report.evidence.map((item, i) => (
              <Card key={i}>
                <CardContent className="flex items-start gap-3">
                  <Database className="mt-0.5 h-4 w-4 shrink-0 text-text-tertiary" />
                  <div>
                    <p className="font-mono text-sm text-text-primary">{item.asset}</p>
                    <p className="mt-1 text-sm text-text-secondary">{item.finding}</p>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Impact */}
        <TabsContent value="impact" className="mt-6 space-y-5">
          {reportQuery.isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : !report?.impact ? (
            <EmptyState icon={<Database className="h-5 w-5" />} title="No impact analysis available" />
          ) : (
            <>
              <div className="flex items-center gap-3">
                <p className="text-sm text-text-secondary">Overall risk</p>
                <StatusPill value={report.impact.risk} />
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                <Card>
                  <CardContent>
                    <p className="text-xs text-text-tertiary">Total affected</p>
                    <p className="mt-1 text-2xl font-semibold text-text-primary">{report.impact.summary.totalAffected}</p>
                  </CardContent>
                </Card>
                {Object.entries(report.impact.categories).map(([key, value]) => (
                  <Card key={key}>
                    <CardContent>
                      <p className="text-xs capitalize text-text-tertiary">{key.replace(/([A-Z])/g, " $1")}</p>
                      <p className="mt-1 text-2xl font-semibold text-text-primary">{value}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </TabsContent>

        {/* Fix */}
        <TabsContent value="fix" className="mt-6 space-y-5">
          {reportQuery.isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : !fix ? (
            <EmptyState icon={<Database className="h-5 w-5" />} title="No fix has been proposed yet" />
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="neutral" className="font-mono">
                  {fix.fixType}
                </Badge>
                <StatusPill value={fix.risk} />
                {approvalStatus && <StatusPill value={approvalStatus} />}
              </div>
              <p className="text-sm text-text-secondary">{fix.summary}</p>
              <CodeBlock code={fix.sql} language="sql" title={fix.fixType} />

              {validation && (
                <Card className={validation.blocked ? "border-danger/30" : undefined}>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2">
                      {validation.blocked ? <ShieldAlert className="h-4 w-4 text-danger" /> : <ShieldCheck className="h-4 w-4 text-success" />}
                      <p className="text-sm font-medium text-text-primary">{validation.blocked ? "Validation blocked this fix" : "Fix passed validation"}</p>
                    </div>
                    {validation.warnings.length > 0 && (
                      <ul className="ml-6 list-disc space-y-1 text-sm text-text-secondary">
                        {validation.warnings.map((w, i) => (
                          <li key={i}>{w}</li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              )}

              {github ? (
                <Card className="border-success/25 bg-success-muted/20">
                  <CardContent className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-text-primary">
                      <GitPullRequest className="h-4 w-4 text-success" /> PR #{github.prNumber} on <span className="font-mono">{github.branch}</span>
                    </div>
                    <a href={github.prUrl} target="_blank" rel="noreferrer">
                      <Button variant="outline" size="sm">
                        View PR <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </a>
                  </CardContent>
                </Card>
              ) : approvalStatus === "APPROVED" ? (
                <Card className="border-warning/25 bg-warning-muted/20">
                  <CardContent className="flex items-center justify-between gap-3">
                    <p className="text-sm text-text-secondary">Approved, but no pull request exists yet — connect GitHub or retry.</p>
                    <Button variant="outline" size="sm" onClick={() => retryPrMutation.mutate()} loading={retryPrMutation.isPending}>
                      <RefreshCcw className="h-3.5 w-3.5" /> Retry
                    </Button>
                  </CardContent>
                </Card>
              ) : null}

              <div className="flex flex-wrap gap-2 pt-1">
                {(!approvalStatus || approvalStatus === "PROPOSED") && (
                  <Button onClick={() => validateMutation.mutate()} loading={validateMutation.isPending}>
                    Validate Fix
                  </Button>
                )}
                {(approvalStatus === "VALIDATED" || approvalStatus === "AWAITING_APPROVAL") && (
                  <>
                    <Button onClick={() => setApproveOpen(true)}>Approve Fix</Button>
                    <Button variant="outline" onClick={() => setRejectOpen(true)}>
                      Reject
                    </Button>
                  </>
                )}
                {approvalStatus === "REJECTED" && (
                  <Badge tone="danger">
                    <XCircle className="h-3.5 w-3.5" /> Rejected
                  </Badge>
                )}
                {(approvalStatus === "APPROVED" || approvalStatus === "PR_CREATED" || approvalStatus === "RESOLVED") && (
                  <Badge tone="success">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Fix validated
                  </Badge>
                )}
              </div>
            </>
          )}
        </TabsContent>

        {/* Timeline */}
        <TabsContent value="timeline" className="mt-6">
          {timelineQuery.isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : !timelineQuery.data || timelineQuery.data.length === 0 ? (
            <EmptyState icon={<Database className="h-5 w-5" />} title="No activity yet" />
          ) : (
            <Card>
              <CardContent>
                <Timeline
                  items={timelineQuery.data.map((event) => ({
                    id: event.id,
                    title: humanizeEventType(event.type),
                    description: event.message,
                    timestamp: formatRelativeTime(event.createdAt),
                    tone: EVENT_TONE[event.type] ?? "neutral",
                  }))}
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={approveOpen}
        onOpenChange={setApproveOpen}
        title="Review before approval"
        confirmLabel="Approve & Prepare PR"
        onConfirm={() => approveMutation.mutate()}
        loading={approveMutation.isPending}
      >
        <div className="space-y-3 text-sm">
          <div>
            <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-success">Avenor will</p>
            <ul className="space-y-1 text-text-secondary">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-success" /> Modify the proposed dbt model
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-success" /> Add or update tests
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-success" /> Create a GitHub branch and pull request
              </li>
            </ul>
          </div>
          <div>
            <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-danger">Avenor will not</p>
            <ul className="space-y-1 text-text-secondary">
              <li className="flex items-center gap-2">
                <XCircle className="h-3.5 w-3.5 shrink-0 text-danger" /> Execute destructive SQL
              </li>
              <li className="flex items-center gap-2">
                <XCircle className="h-3.5 w-3.5 shrink-0 text-danger" /> Merge the pull request automatically
              </li>
              <li className="flex items-center gap-2">
                <XCircle className="h-3.5 w-3.5 shrink-0 text-danger" /> Deploy to production
              </li>
            </ul>
          </div>
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        title="Reject this fix?"
        description="This cannot be undone. The investigation will remain on record."
        confirmLabel="Reject Fix"
        variant="danger"
        onConfirm={() => rejectMutation.mutate()}
        loading={rejectMutation.isPending}
      />
    </div>
  );
}
