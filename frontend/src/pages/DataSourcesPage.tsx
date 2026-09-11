import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Database, Plus, Trash2, MoreVertical, RefreshCw } from "lucide-react";
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
import type { DataSourceProvider } from "../lib/api/types";
import { useWorkspace } from "../context/WorkspaceContext";
import { ApiError } from "../lib/api/client";
import { formatRelativeTime } from "../utils/format";

// Only PostgreSQL is actually connectable/syncable today (see
// backend/src/integrations/postgres). MySQL is left out of the picker
// rather than offering a provider the backend will reject on save.
const PROVIDERS: { value: DataSourceProvider; label: string; defaultPort: number }[] = [{ value: "POSTGRESQL", label: "PostgreSQL", defaultPort: 5432 }];

const STATUS_TONE = { ACTIVE: "success", INACTIVE: "neutral", ERROR: "danger" } as const;

export default function DataSourcesPage() {
  const { currentWorkspace, currentProject, hasWorkspace, hasProject } = useWorkspace();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", provider: "POSTGRESQL" as DataSourceProvider, host: "", port: 5432, database: "", username: "", password: "" });
  const [formError, setFormError] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["datasources", currentWorkspace?.id, currentProject?.id],
    queryFn: () => datasourcesApi.listDataSources({ workspaceId: currentWorkspace?.id, projectId: currentProject?.id, limit: 100 }),
    enabled: hasWorkspace && hasProject,
  });

  const createMutation = useMutation({
    mutationFn: () => datasourcesApi.createDataSource({ ...form, workspaceId: currentWorkspace!.id, projectId: currentProject!.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["datasources"] });
      setCreateOpen(false);
      setForm({ name: "", provider: "POSTGRESQL", host: "", port: 5432, database: "", username: "", password: "" });
      toast({ title: "Data source connected", variant: "success" });
    },
    onError: (err) => setFormError(err instanceof ApiError ? err.message : "Couldn't connect this data source."),
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
      const lineagePart = summary.lineageError ? `Lineage discovery failed: ${summary.lineageError}` : `${summary.lineageCreated} lineage edge${summary.lineageCreated === 1 ? "" : "s"} (${summary.lineageDiscovered} found, ${summary.lineageRemoved} removed).`;
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
          <p className="mt-1 text-sm text-text-secondary">Connected systems powering your metadata intelligence.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} disabled={!hasWorkspace || !hasProject}>
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
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : dataSources.length === 0 ? (
        <EmptyState
          icon={<Database className="h-5 w-5" />}
          title="No data sources connected"
          description="Connect a PostgreSQL database to start tracking real metadata."
          action={<Button onClick={() => setCreateOpen(true)}>Connect Data Source</Button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {dataSources.map((ds) => (
            <Card key={ds.id}>
              <CardContent className="space-y-2.5">
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
                      <RefreshCw className={`h-4 w-4 ${syncMutation.isPending && syncMutation.variables === ds.id ? "animate-spin" : ""}`} />
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
                <div className="flex items-center gap-2">
                  <Badge tone={STATUS_TONE[ds.status]}>{ds.status}</Badge>
                  <Badge tone="neutral">{ds.provider}</Badge>
                </div>
                <p className="font-mono text-xs text-text-tertiary">
                  {ds.host}:{ds.port}/{ds.database}
                </p>
                <p className="text-xs text-text-tertiary">{ds.lastSyncedAt ? `Synced ${formatRelativeTime(ds.lastSyncedAt)}` : "Never synced"}</p>
                {ds.status === "ERROR" && ds.lastError && <p className="text-xs text-danger" title={ds.lastError}>{ds.lastError}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal open={createOpen} onOpenChange={setCreateOpen} title="Connect a data source" size="md">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            setFormError(null);
            createMutation.mutate();
          }}
        >
          {formError && <p className="rounded-md border border-danger/30 bg-danger-muted px-3 py-2 text-sm text-danger">{formError}</p>}
          <div>
            <Label htmlFor="ds-name">Name</Label>
            <Input id="ds-name" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Production Postgres" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="ds-provider">Provider</Label>
              <Select
                id="ds-provider"
                value={form.provider}
                onChange={(e) => {
                  const provider = e.target.value as DataSourceProvider;
                  const defaultPort = PROVIDERS.find((p) => p.value === provider)?.defaultPort ?? form.port;
                  setForm((f) => ({ ...f, provider, port: defaultPort }));
                }}
              >
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
          <Button type="submit" className="w-full" loading={createMutation.isPending}>
            Connect
          </Button>
        </form>
      </Modal>

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
