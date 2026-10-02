import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Database, Plus, Trash2, MoreVertical, RefreshCw, Check, X, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Card, CardContent } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Skeleton } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { Modal } from "../components/ui/Modal";
import { Input, Label, Select } from "../components/ui/Input";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { Dropdown, DropdownTrigger, DropdownContent, DropdownItem } from "../components/ui/Dropdown";
import { useToast } from "../components/ui/Toast";
import * as datasourcesApi from "../lib/api/datasources";
import type { DataSource, DataSourceProvider, DataSourceSyncSummary } from "../lib/api/types";
import { useWorkspace } from "../context/WorkspaceContext";
import { ApiError } from "../lib/api/client";
import { formatRelativeTime } from "../utils/format";
import { cn } from "../utils/cn";

// Only PostgreSQL is actually connectable/syncable today (see
// backend/src/integrations/postgres). MySQL is left out of the picker
// rather than offering a provider the backend will reject on save.
const PROVIDERS: { value: DataSourceProvider; label: string; defaultPort: number }[] = [{ value: "POSTGRESQL", label: "PostgreSQL", defaultPort: 5432 }];

const STATUS_LABEL = { ACTIVE: "Connected", INACTIVE: "Inactive", ERROR: "Error" } as const;

const WIZARD_STEPS = ["Connection", "Test", "Configure", "Sync"] as const;

const emptyForm = { name: "", provider: "POSTGRESQL" as DataSourceProvider, host: "", port: 5432, database: "", username: "", password: "" };

function StepIndicator({ step }: { step: number }) {
  return (
    <div className="mb-5 flex items-center gap-2">
      {WIZARD_STEPS.map((label, i) => {
        const index = i + 1;
        const done = index < step;
        const active = index === step;
        return (
          <div key={label} className="flex flex-1 items-center gap-2">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
                  done ? "bg-accent text-on-accent" : active ? "border-2 border-accent text-accent" : "border border-border text-text-tertiary"
                )}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : index}
              </div>
              <span className={cn("text-xs font-medium", active || done ? "text-text-primary" : "text-text-tertiary")}>{label}</span>
            </div>
            {i < WIZARD_STEPS.length - 1 && <div className={cn("h-px flex-1", done ? "bg-accent" : "bg-border")} />}
          </div>
        );
      })}
    </div>
  );
}

function ConnectWizard({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const { currentWorkspace, currentProject } = useWorkspace();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(emptyForm);
  const [createdSource, setCreatedSource] = useState<DataSource | null>(null);
  const [syncSummary, setSyncSummary] = useState<DataSourceSyncSummary | null>(null);

  const testAndCreateMutation = useMutation({
    mutationFn: () => datasourcesApi.createDataSource({ ...form, workspaceId: currentWorkspace!.id, projectId: currentProject!.id }),
    onSuccess: (source) => {
      setCreatedSource(source);
      onCreated();
    },
  });

  const syncMutation = useMutation({
    mutationFn: () => datasourcesApi.syncDataSource(createdSource!.id),
    onSuccess: (summary) => {
      setSyncSummary(summary);
      onCreated();
    },
  });

  const reset = () => {
    setStep(1);
    setForm(emptyForm);
    setCreatedSource(null);
    setSyncSummary(null);
    testAndCreateMutation.reset();
    syncMutation.reset();
  };

  return (
    <Modal
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          onClose();
          reset();
        }
      }}
      title="Connect a data source"
      size="md"
    >
      <StepIndicator step={step} />

      {step === 1 && (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            setStep(2);
            testAndCreateMutation.mutate();
          }}
        >
          <div>
            <Label htmlFor="ds-name">Name</Label>
            <Input id="ds-name" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Production Postgres" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="ds-provider">Provider</Label>
              <Select id="ds-provider" value={form.provider} disabled>
                {PROVIDERS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="ds-port">Port</Label>
              <Input id="ds-port" type="number" required value={form.port} onChange={(e) => setForm((f) => ({ ...f, port: Number(e.target.value) }))} />
            </div>
          </div>
          <div>
            <Label htmlFor="ds-host">Host</Label>
            <Input id="ds-host" required value={form.host} onChange={(e) => setForm((f) => ({ ...f, host: e.target.value }))} placeholder="db.internal" />
          </div>
          <div>
            <Label htmlFor="ds-database">Database</Label>
            <Input id="ds-database" required value={form.database} onChange={(e) => setForm((f) => ({ ...f, database: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="ds-username">Username</Label>
              <Input id="ds-username" required value={form.username} onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="ds-password">Password</Label>
              <Input id="ds-password" type="password" required value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
            </div>
          </div>
          <Button type="submit" className="w-full">
            Continue
          </Button>
        </form>
      )}

      {step === 2 && (
        <div className="space-y-4 py-4 text-center">
          {testAndCreateMutation.isPending ? (
            <>
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-accent" />
              <p className="text-sm text-text-secondary">Testing connection…</p>
            </>
          ) : testAndCreateMutation.isError ? (
            <>
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-danger-muted text-danger">
                <X className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">Connection failed</p>
                <p className="mt-1 text-sm text-text-secondary">
                  {testAndCreateMutation.error instanceof ApiError ? testAndCreateMutation.error.message : "Unable to connect using the provided credentials."}
                </p>
              </div>
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="h-3.5 w-3.5" /> Back to connection details
              </Button>
            </>
          ) : (
            <>
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-success-muted text-success">
                <Check className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">Connection successful</p>
                <p className="mt-1 text-sm text-text-secondary">PostgreSQL database is reachable.</p>
              </div>
              <Button onClick={() => setStep(3)}>Continue</Button>
            </>
          )}
        </div>
      )}

      {step === 3 && createdSource && (
        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-text-tertiary" />
                <p className="text-sm font-medium text-text-primary">{createdSource.name}</p>
              </div>
              <p className="font-mono text-xs text-text-tertiary">
                {createdSource.host}:{createdSource.port}/{createdSource.database}
              </p>
              <Badge tone="success">Connected</Badge>
            </CardContent>
          </Card>
          <p className="text-sm text-text-secondary">Avenor is ready to track this database. Next, run an initial sync to discover its tables and lineage.</p>
          <Button className="w-full" onClick={() => setStep(4)}>
            Continue to sync
          </Button>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4 py-2 text-center">
          {syncMutation.isSuccess && syncSummary ? (
            <>
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-success-muted text-success">
                <Check className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium text-text-primary">Sync complete</p>
              <p className="text-sm text-text-secondary">
                {syncSummary.tablesScanned} table{syncSummary.tablesScanned === 1 ? "" : "s"} scanned · {syncSummary.assetsCreated} new asset
                {syncSummary.assetsCreated === 1 ? "" : "s"} · {syncSummary.lineageCreated} lineage edge{syncSummary.lineageCreated === 1 ? "" : "s"}
              </p>
              <Button
                className="w-full"
                onClick={() => {
                  onClose();
                  reset();
                }}
              >
                Done
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm text-text-secondary">Run an initial sync to discover tables, schemas, and lineage from this database.</p>
              <Button className="w-full" onClick={() => syncMutation.mutate()} loading={syncMutation.isPending}>
                <RefreshCw className="h-4 w-4" /> Sync now
              </Button>
              <button
                onClick={() => {
                  onClose();
                  reset();
                }}
                className="text-xs text-text-tertiary hover:text-text-secondary"
              >
                Skip for now
              </button>
            </>
          )}
        </div>
      )}
    </Modal>
  );
}

export default function DataSourcesPage() {
  const { currentWorkspace, currentProject, hasWorkspace, hasProject } = useWorkspace();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [wizardOpen, setWizardOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["datasources", currentWorkspace?.id, currentProject?.id],
    queryFn: () => datasourcesApi.listDataSources({ workspaceId: currentWorkspace?.id, projectId: currentProject?.id, limit: 100 }),
    enabled: hasWorkspace && hasProject,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => datasourcesApi.deleteDataSource(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["datasources"] });
      setDeleteTarget(null);
      toast({ title: "Data source removed", variant: "info" });
    },
  });

  const syncMutation = useMutation({
    mutationFn: (id: string) => datasourcesApi.syncDataSource(id),
    onSuccess: (summary) => {
      queryClient.invalidateQueries({ queryKey: ["datasources"] });
      queryClient.invalidateQueries({ queryKey: ["catalog"] });
      queryClient.invalidateQueries({ queryKey: ["metadata"] });
      const lineagePart = summary.lineageError
        ? `Lineage discovery failed: ${summary.lineageError}`
        : `${summary.lineageCreated} lineage edge${summary.lineageCreated === 1 ? "" : "s"} (${summary.lineageDiscovered} found, ${summary.lineageRemoved} removed).`;
      toast({
        title: "Sync complete",
        description: `${summary.tablesScanned} table${summary.tablesScanned === 1 ? "" : "s"} scanned · ${summary.assetsCreated} new · ${summary.schemaChangesDetected} schema change${summary.schemaChangesDetected === 1 ? "" : "s"} detected. ${lineagePart}`,
        variant: summary.lineageError ? "info" : "success",
      });
    },
    onError: (err) => toast({ title: "Sync failed", description: err instanceof ApiError ? err.message : undefined, variant: "error" }),
  });

  const dataSources = data?.dataSources ?? [];

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 md:px-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary">Data Sources</h1>
          <p className="mt-1 text-sm text-text-secondary">Connect the databases and systems Avenor monitors.</p>
        </div>
        <Button onClick={() => setWizardOpen(true)} disabled={!hasWorkspace || !hasProject}>
          <Plus className="h-4 w-4" /> Connect Data Source
        </Button>
      </div>

      {!hasWorkspace || !hasProject ? (
        <EmptyState icon={<Database className="h-5 w-5" />} title="Select a workspace and project" description="Use the switcher in the sidebar to pick a workspace and project first." />
      ) : isError ? (
        <ErrorState description="We couldn't load your data sources." onRetry={() => refetch()} />
      ) : isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-36 w-full" />
          ))}
        </div>
      ) : dataSources.length === 0 ? (
        <EmptyState
          icon={<Database className="h-5 w-5" />}
          title="Connect your first data source"
          description="Avenor needs access to your metadata before it can investigate data incidents."
          action={<Button onClick={() => setWizardOpen(true)}>Connect Data Source</Button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {dataSources.map((ds) => (
            <Card key={ds.id}>
              <CardContent className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-text-tertiary" />
                    <p className="text-sm font-medium text-text-primary">{ds.name}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      className="rounded p-1 text-text-tertiary hover:bg-surface-elevated hover:text-text-primary disabled:opacity-50"
                      title="Sync schema now"
                      disabled={syncMutation.isPending && syncMutation.variables === ds.id}
                      onClick={() => syncMutation.mutate(ds.id)}
                    >
                      <RefreshCw className={cn("h-4 w-4", syncMutation.isPending && syncMutation.variables === ds.id && "animate-spin")} />
                    </button>
                    <Dropdown>
                      <DropdownTrigger asChild>
                        <button className="rounded p-1 text-text-tertiary hover:bg-surface-elevated hover:text-text-primary">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </DropdownTrigger>
                      <DropdownContent>
                        <DropdownItem onSelect={() => setDeleteTarget(ds.id)} className="text-danger hover:text-danger">
                          <Trash2 className="h-3.5 w-3.5" /> Disconnect
                        </DropdownItem>
                      </DropdownContent>
                    </Dropdown>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1.5 font-medium text-text-secondary">
                    <span className={cn("h-1.5 w-1.5 rounded-full", ds.status === "ACTIVE" ? "bg-success" : ds.status === "ERROR" ? "bg-danger" : "bg-text-tertiary")} />
                    {STATUS_LABEL[ds.status]}
                  </span>
                  <Badge tone="neutral">{ds.provider}</Badge>
                </div>
                <p className="font-mono text-xs text-text-tertiary">
                  {ds.host}:{ds.port}/{ds.database}
                </p>
                <p className="text-xs text-text-tertiary">{ds.lastSyncedAt ? `Last synced ${formatRelativeTime(ds.lastSyncedAt)}` : "Never synced"}</p>
                {ds.status === "ERROR" && ds.lastError && (
                  <p className="text-xs text-danger" title={ds.lastError}>
                    {ds.lastError}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ConnectWizard open={wizardOpen} onClose={() => setWizardOpen(false)} onCreated={() => queryClient.invalidateQueries({ queryKey: ["datasources"] })} />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Disconnect this data source?"
        description="Metadata already synced from it will remain in the catalog."
        confirmLabel="Disconnect"
        variant="danger"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
      />
    </div>
  );
}
