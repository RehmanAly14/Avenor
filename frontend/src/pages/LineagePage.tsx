import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Network, Search, Waypoints, ExternalLink, Database } from "lucide-react";
import { Card } from "../components/ui/Card";
import { Skeleton } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { Button } from "../components/ui/Button";
import { LineageGraph, LINEAGE_LEGEND_ITEMS } from "../components/shared/LineageGraph";
import * as catalogApi from "../lib/api/catalog";
import * as metadataApi from "../lib/api/metadata";
import { useWorkspace } from "../context/WorkspaceContext";
import { ROUTES } from "../constants/routes";

export default function LineagePage() {
  const { currentWorkspace, currentProject, hasWorkspace, hasProject } = useWorkspace();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [rootAssetId, setRootAssetId] = useState<string | null>(null);
  const [focusNodeId, setFocusNodeId] = useState<string | null>(null);

  const assetsQuery = useQuery({
    queryKey: ["catalog", "all", currentWorkspace?.id, currentProject?.id],
    queryFn: () => catalogApi.listCatalogAssets({ workspaceId: currentWorkspace?.id, projectId: currentProject?.id, limit: 1 }),
    enabled: hasWorkspace && hasProject,
  });

  useEffect(() => {
    if (!rootAssetId && assetsQuery.data?.assets?.[0]) {
      setRootAssetId(assetsQuery.data.assets[0].id);
      setFocusNodeId(assetsQuery.data.assets[0].id);
    }
  }, [assetsQuery.data, rootAssetId]);

  const searchQuery = useQuery({
    queryKey: ["catalog-search", currentWorkspace?.id, currentProject?.id, q],
    queryFn: () => catalogApi.searchCatalog({ workspaceId: currentWorkspace?.id, projectId: currentProject?.id, q, limit: 8 }),
    enabled: q.trim().length > 1,
  });

  const graphQuery = useQuery({
    queryKey: ["lineage-graph", rootAssetId],
    queryFn: () => metadataApi.getLineageGraph(rootAssetId!),
    enabled: Boolean(rootAssetId),
  });

  const selectAsset = (id: string) => {
    setRootAssetId(id);
    setFocusNodeId(id);
    setQ("");
    setSearchOpen(false);
  };

  const noAssetsAtAll = !assetsQuery.isLoading && (assetsQuery.data?.assets.length ?? 0) === 0;

  return (
    <div className="mx-auto flex h-full max-w-7xl flex-col gap-5 px-4 py-8 md:px-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary">Lineage</h1>
          <p className="mt-1 text-sm text-text-secondary">Trace how data flows from raw sources through transformations to dashboards.</p>
        </div>

        {!noAssetsAtAll && (
          <div className="relative w-full sm:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
              onBlur={() => setTimeout(() => setSearchOpen(false), 150)}
              placeholder="Jump to an asset…"
              className="h-9 w-full rounded-md border border-border bg-surface-elevated pl-9 pr-3 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
            {searchOpen && q.trim().length > 1 && (
              <div className="absolute left-0 right-0 top-full z-40 mt-1.5 max-h-72 overflow-y-auto rounded-md border border-border bg-surface-elevated py-1 shadow-elevated">
                {searchQuery.isFetching ? (
                  <p className="px-3 py-2.5 text-xs text-text-tertiary">Searching…</p>
                ) : (searchQuery.data?.assets.length ?? 0) === 0 ? (
                  <p className="px-3 py-2.5 text-xs text-text-tertiary">No matching assets found.</p>
                ) : (
                  searchQuery.data!.assets.map((asset) => (
                    <button
                      key={asset.id}
                      onMouseDown={() => selectAsset(asset.id)}
                      className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-text-secondary hover:bg-surface-hover hover:text-text-primary"
                    >
                      <Waypoints className="h-3.5 w-3.5 shrink-0 text-text-tertiary" />
                      <span className="min-w-0 flex-1 truncate font-mono text-xs">{asset.name}</span>
                      <span className="shrink-0 text-[10px] uppercase text-text-tertiary">{asset.assetType}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {!hasWorkspace || !hasProject ? (
        <EmptyState icon={<Network className="h-5 w-5" />} title="Select a workspace and project" description="Use the switcher in the sidebar to pick a workspace and project first." />
      ) : assetsQuery.isLoading ? (
        <Skeleton className="h-[500px] w-full" />
      ) : noAssetsAtAll ? (
        <EmptyState
          icon={<Network className="h-5 w-5" />}
          title="No lineage discovered yet"
          description="Sync a data source to discover tables, views, and the relationships between them."
          action={<Button onClick={() => navigate(ROUTES.dataSources)}>Connect Data Source</Button>}
        />
      ) : graphQuery.isError ? (
        <ErrorState description="We couldn't load this asset's lineage." onRetry={() => graphQuery.refetch()} />
      ) : (
        <Card className="flex-1 overflow-hidden p-0">
          <div className="flex flex-col gap-3 border-b border-border-subtle px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-4 text-xs text-text-tertiary">
              {LINEAGE_LEGEND_ITEMS.map(({ icon: Icon, label }) => (
                <span key={label} className="flex items-center gap-1.5">
                  <Icon className="h-3.5 w-3.5" /> {label}
                </span>
              ))}
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-px w-4 bg-border-strong" /> Dependency
              </span>
            </div>
            {focusNodeId && (
              <button
                onClick={() => navigate(ROUTES.metadataAsset(focusNodeId))}
                className="flex items-center gap-1.5 text-xs font-medium text-accent hover:underline"
              >
                View asset details <ExternalLink className="h-3 w-3" />
              </button>
            )}
          </div>

          {graphQuery.isLoading ? (
            <Skeleton className="h-[500px] w-full rounded-none" />
          ) : !graphQuery.data || graphQuery.data.nodes.length === 0 ? (
            <div className="p-6">
              <EmptyState icon={<Database className="h-5 w-5" />} title="No lineage recorded for this asset" description="This asset has no upstream or downstream relationships yet." />
            </div>
          ) : (
            <LineageGraph
              nodes={graphQuery.data.nodes}
              edges={graphQuery.data.edges}
              focusNodeId={focusNodeId ?? undefined}
              autoLayout
              minimap
              height={560}
              onNodeClick={(id) => navigate(ROUTES.metadataAsset(id))}
            />
          )}
        </Card>
      )}
    </div>
  );
}
