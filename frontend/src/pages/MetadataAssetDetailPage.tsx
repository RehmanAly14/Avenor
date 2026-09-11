import { useParams, Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Database, User, Tag as TagIcon } from "lucide-react";
import { Badge } from "../components/ui/Badge";
import { Card, CardContent } from "../components/ui/Card";
import { Skeleton } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/Tabs";
import { Table, TableContainer, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../components/ui/Table";
import { LineageGraph } from "../components/shared/LineageGraph";
import * as metadataApi from "../lib/api/metadata";
import { ROUTES } from "../constants/routes";

const TABS = ["overview", "schema", "owners", "lineage", "impact"] as const;
type TabKey = (typeof TABS)[number];

export default function MetadataAssetDetailPage() {
  const { id = "" } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (TABS.includes(searchParams.get("tab") as TabKey) ? searchParams.get("tab") : "overview") as TabKey;
  const setActiveTab = (tab: string) => setSearchParams((prev) => ({ ...Object.fromEntries(prev), tab }), { replace: true });

  const assetQuery = useQuery({ queryKey: ["metadata-asset", id], queryFn: () => metadataApi.getAsset(id), enabled: Boolean(id) });
  // Fetched eagerly (not gated on the lineage tab) so the Overview tab can
  // show upstream/downstream counts without a second round trip.
  const lineageQuery = useQuery({ queryKey: ["metadata-asset", id, "lineage"], queryFn: () => metadataApi.getLineageGraph(id), enabled: Boolean(id) });
  const upstreamCount = lineageQuery.data?.nodes.filter((n) => n.data.depth < 0).length ?? 0;
  const downstreamCount = lineageQuery.data?.nodes.filter((n) => n.data.depth > 0).length ?? 0;
  const impactQuery = useQuery({ queryKey: ["metadata-asset", id, "impact"], queryFn: () => metadataApi.getImpact(id), enabled: activeTab === "impact" });

  if (assetQuery.isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 md:px-8">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (assetQuery.isError || !assetQuery.data) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 md:px-8">
        <ErrorState description="We couldn't load this asset." onRetry={() => assetQuery.refetch()} />
      </div>
    );
  }

  const asset = assetQuery.data;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-8">
      <Link to={ROUTES.metadata} className="mb-4 inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary">
        <ArrowLeft className="h-3.5 w-3.5" /> Metadata
      </Link>

      <div className="flex items-center gap-2.5">
        <Database className="h-5 w-5 text-text-tertiary" />
        <h1 className="font-mono text-xl font-semibold text-text-primary">{asset.name}</h1>
      </div>
      {asset.qualifiedName && <p className="mt-1 font-mono text-xs text-text-tertiary">{asset.qualifiedName}</p>}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-7">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="schema">Schema</TabsTrigger>
          <TabsTrigger value="owners">Owners</TabsTrigger>
          <TabsTrigger value="lineage">Lineage</TabsTrigger>
          <TabsTrigger value="impact">Impact</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent>
                <p className="text-xs text-text-tertiary">Upstream sources</p>
                <p className="mt-1 text-2xl font-semibold text-text-primary">{upstreamCount}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <p className="text-xs text-text-tertiary">Downstream dependents</p>
                <p className="mt-1 text-2xl font-semibold text-text-primary">{downstreamCount}</p>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-text-tertiary">Type</p>
                <Badge tone="neutral" className="mt-1">
                  {asset.assetType}
                </Badge>
              </div>
              {asset.description && (
                <div>
                  <p className="text-xs text-text-tertiary">Description</p>
                  <p className="mt-1 text-sm text-text-secondary">{asset.description}</p>
                </div>
              )}
              {asset.domain && (
                <div>
                  <p className="text-xs text-text-tertiary">Domain</p>
                  <p className="mt-1 text-sm text-text-primary">{asset.domain.name}</p>
                </div>
              )}
              {asset.dataSource && (
                <div>
                  <p className="text-xs text-text-tertiary">Data source</p>
                  <p className="mt-1 text-sm text-text-primary">
                    {asset.dataSource.name} <span className="text-text-tertiary">· {asset.dataSource.provider}</span>
                  </p>
                </div>
              )}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {(asset.tags ?? []).map((tag) => (
                  <Badge key={tag.id} tone="accent">
                    <TagIcon className="h-3 w-3" /> {tag.name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schema" className="mt-6 space-y-5">
          {!asset.schemas || asset.schemas.length === 0 ? (
            <EmptyState icon={<Database className="h-5 w-5" />} title="No schema recorded" />
          ) : (
            asset.schemas.map((schema) => (
              <Card key={schema.name}>
                <CardContent className="p-0">
                  <p className="border-b border-border-subtle px-4 py-3 font-mono text-sm font-medium text-text-primary">{schema.name}</p>
                  <TableContainer className="rounded-none border-none">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Column</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Nullable</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {schema.columns.map((col) => (
                          <TableRow key={col.name}>
                            <TableCell className="font-mono">{col.name}</TableCell>
                            <TableCell className="font-mono text-text-secondary">{col.dataType}</TableCell>
                            <TableCell className="text-text-secondary">{col.isNullable === false ? "No" : "Yes"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="owners" className="mt-6">
          {!asset.owners || asset.owners.length === 0 ? (
            <EmptyState icon={<User className="h-5 w-5" />} title="No owners assigned" />
          ) : (
            <div className="space-y-2.5">
              {asset.owners.map((owner) => (
                <Card key={owner.id}>
                  <CardContent className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-muted text-xs font-semibold text-accent-hover">
                      {owner.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">{owner.name}</p>
                      {owner.email && <p className="text-xs text-text-tertiary">{owner.email}</p>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="lineage" className="mt-6">
          {lineageQuery.isLoading ? (
            <Skeleton className="h-[420px] w-full" />
          ) : lineageQuery.isError ? (
            <ErrorState description="We couldn't load lineage for this asset." onRetry={() => lineageQuery.refetch()} />
          ) : !lineageQuery.data || lineageQuery.data.nodes.length === 0 ? (
            <EmptyState icon={<Database className="h-5 w-5" />} title="No lineage recorded" description="Connect this asset to others to see upstream and downstream dependencies." />
          ) : (
            <Card>
              <CardContent className="p-2">
                <LineageGraph nodes={lineageQuery.data.nodes} edges={lineageQuery.data.edges} rootCauseNodeId={id} />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="impact" className="mt-6 space-y-4">
          {impactQuery.isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : impactQuery.isError ? (
            <ErrorState description="We couldn't load impact analysis." onRetry={() => impactQuery.refetch()} />
          ) : !impactQuery.data ? (
            <EmptyState icon={<Database className="h-5 w-5" />} title="No impact data" />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <Card>
                  <CardContent>
                    <p className="text-xs text-text-tertiary">Total affected</p>
                    <p className="mt-1 text-2xl font-semibold text-text-primary">{impactQuery.data.totalImpact}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent>
                    <p className="text-xs text-text-tertiary">Dashboards</p>
                    <p className="mt-1 text-2xl font-semibold text-text-primary">{impactQuery.data.affectedDashboards.length}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent>
                    <p className="text-xs text-text-tertiary">ML models</p>
                    <p className="mt-1 text-2xl font-semibold text-text-primary">{impactQuery.data.affectedModels.length}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent>
                    <p className="text-xs text-text-tertiary">Pipelines</p>
                    <p className="mt-1 text-2xl font-semibold text-text-primary">{impactQuery.data.affectedPipelines.length}</p>
                  </CardContent>
                </Card>
              </div>
              {impactQuery.data.affectedAssets.length > 0 && (
                <TableContainer>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Asset</TableHead>
                        <TableHead>Depth</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {impactQuery.data.affectedAssets.map((a) => (
                        <TableRow key={a.id}>
                          <TableCell className="font-mono">{a.name}</TableCell>
                          <TableCell className="text-text-secondary">{a.depth}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
