import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Search, Waypoints, Database } from "lucide-react";
import { Input } from "../components/ui/Input";
import { Badge } from "../components/ui/Badge";
import { Skeleton } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { Card, CardContent } from "../components/ui/Card";
import * as catalogApi from "../lib/api/catalog";
import { useWorkspace } from "../context/WorkspaceContext";
import { ROUTES } from "../constants/routes";
import { formatRelativeTime } from "../utils/format";

export default function MetadataPage() {
  const { currentWorkspace, currentProject } = useWorkspace();
  const [q, setQ] = useState("");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["catalog", currentWorkspace?.id, currentProject?.id, q],
    queryFn: () =>
      q
        ? catalogApi.searchCatalog({ workspaceId: currentWorkspace?.id, projectId: currentProject?.id, q, limit: 50 })
        : catalogApi.listCatalogAssets({ workspaceId: currentWorkspace?.id, projectId: currentProject?.id, limit: 50 }),
  });

  const assets = data?.assets ?? [];

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 md:px-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary">Metadata</h1>
          <p className="mt-1 text-sm text-text-secondary">Search and browse every tracked data asset.</p>
        </div>
      </div>

      <Input placeholder="Search datasets, tables, dashboards…" icon={<Search className="h-4 w-4" />} value={q} onChange={(e) => setQ(e.target.value)} className="max-w-md" />

      {isError ? (
        <ErrorState description="We couldn't load the catalog." onRetry={() => refetch()} />
      ) : isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : assets.length === 0 ? (
        <EmptyState
          icon={<Waypoints className="h-5 w-5" />}
          title="No assets yet"
          description="Assets appear here once they're created directly or discovered from a connected data source."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {assets.map((asset) => (
            <Link key={asset.id} to={ROUTES.metadataAsset(asset.id)}>
              <Card className="h-full transition-colors hover:border-border-strong">
                <CardContent className="space-y-2.5">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 shrink-0 text-text-tertiary" />
                    <p className="truncate font-mono text-sm font-medium text-text-primary">{asset.name}</p>
                  </div>
                  <Badge tone="neutral">{asset.assetType}</Badge>
                  {asset.description && <p className="line-clamp-2 text-xs text-text-secondary">{asset.description}</p>}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {(asset.tags ?? []).slice(0, 3).map((tag) => (
                      <Badge key={tag.id} tone="accent">
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                  <p className="pt-1 text-[11px] text-text-tertiary">Updated {formatRelativeTime(asset.updatedAt)}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
