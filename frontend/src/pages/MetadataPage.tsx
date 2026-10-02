import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Search, Waypoints, Database, Network } from "lucide-react";
import { Input, Select } from "../components/ui/Input";
import { Badge } from "../components/ui/Badge";
import { Skeleton } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { Table, TableContainer, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../components/ui/Table";
import * as catalogApi from "../lib/api/catalog";
import * as datasourcesApi from "../lib/api/datasources";
import { useWorkspace } from "../context/WorkspaceContext";
import { ROUTES } from "../constants/routes";
import { formatRelativeTime } from "../utils/format";

export default function MetadataPage() {
  const { currentWorkspace, currentProject, hasWorkspace, hasProject } = useWorkspace();
  const [q, setQ] = useState("");
  const [dataSourceId, setDataSourceId] = useState("");
  const [assetType, setAssetType] = useState("");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["catalog", currentWorkspace?.id, currentProject?.id, q],
    queryFn: () =>
      q
        ? catalogApi.searchCatalog({ workspaceId: currentWorkspace?.id, projectId: currentProject?.id, q, limit: 100 })
        : catalogApi.listCatalogAssets({ workspaceId: currentWorkspace?.id, projectId: currentProject?.id, limit: 100 }),
    enabled: hasWorkspace && hasProject,
  });

  const dataSourcesQuery = useQuery({
    queryKey: ["datasources", currentWorkspace?.id, currentProject?.id],
    queryFn: () => datasourcesApi.listDataSources({ workspaceId: currentWorkspace?.id, projectId: currentProject?.id, limit: 100 }),
    enabled: hasWorkspace && hasProject,
  });

  const allAssets = data?.assets ?? [];
  const dataSources = dataSourcesQuery.data?.dataSources ?? [];

  const assetTypes = useMemo(() => Array.from(new Set(allAssets.map((a) => a.assetType))).sort(), [allAssets]);

  const assets = allAssets.filter((a) => (dataSourceId ? a.dataSourceId === dataSourceId : true)).filter((a) => (assetType ? a.assetType === assetType : true));

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 md:px-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">Metadata</h1>
        <p className="mt-1 text-sm text-text-secondary">Explore the assets Avenor understands across your data infrastructure.</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input placeholder="Search datasets, tables, dashboards…" icon={<Search className="h-4 w-4" />} value={q} onChange={(e) => setQ(e.target.value)} className="sm:max-w-xs" />
        <Select value={dataSourceId} onChange={(e) => setDataSourceId(e.target.value)} className="sm:max-w-[200px]">
          <option value="">All data sources</option>
          {dataSources.map((ds) => (
            <option key={ds.id} value={ds.id}>
              {ds.name}
            </option>
          ))}
        </Select>
        <Select value={assetType} onChange={(e) => setAssetType(e.target.value)} className="sm:max-w-[180px]">
          <option value="">All types</option>
          {assetTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </Select>
      </div>

      {!hasWorkspace || !hasProject ? (
        <EmptyState icon={<Waypoints className="h-5 w-5" />} title="Select a workspace and project" description="Use the switcher in the sidebar to pick a workspace and project first." />
      ) : isError ? (
        <ErrorState description="We couldn't load the catalog." onRetry={() => refetch()} />
      ) : isLoading ? (
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : assets.length === 0 ? (
        <EmptyState
          icon={<Waypoints className="h-5 w-5" />}
          title="No assets yet"
          description="Assets appear here once they're created directly or discovered from a connected data source."
        />
      ) : (
        <TableContainer>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Data Source</TableHead>
                <TableHead>Columns</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {assets.map((asset) => (
                <TableRow key={asset.id}>
                  <TableCell>
                    <Link to={ROUTES.metadataAsset(asset.id)} className="flex items-center gap-2 font-mono text-sm font-medium text-text-primary hover:text-accent">
                      <Database className="h-3.5 w-3.5 shrink-0 text-text-tertiary" />
                      {asset.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge tone="neutral">{asset.assetType}</Badge>
                  </TableCell>
                  <TableCell className="text-text-secondary">{asset.dataSource?.name ?? "—"}</TableCell>
                  <TableCell className="text-text-secondary">{asset.schemas?.[0]?.columns.length ?? "—"}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(asset.tags ?? []).slice(0, 2).map((tag) => (
                        <Badge key={tag.id} tone="accent">
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-text-tertiary">{formatRelativeTime(asset.updatedAt)}</TableCell>
                  <TableCell>
                    <Link to={`${ROUTES.metadataAsset(asset.id)}?tab=lineage`} className="flex items-center gap-1 text-xs text-text-tertiary hover:text-accent" title="View lineage">
                      <Network className="h-3.5 w-3.5" />
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </div>
  );
}
