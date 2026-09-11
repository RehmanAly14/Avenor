import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { GitBranch, Lock, Unlock, ExternalLink, Link2, Check, AlertTriangle } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Card, CardContent } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Skeleton } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { useToast } from "../components/ui/Toast";
import * as githubApi from "../lib/api/github";
import { useWorkspace } from "../context/WorkspaceContext";
import { ApiError } from "../lib/api/client";
import { formatRelativeTime } from "../utils/format";

export default function GitHubPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { currentProject } = useWorkspace();

  const statusQuery = useQuery({ queryKey: ["github", "status"], queryFn: githubApi.getStatus });
  const connected = statusQuery.data?.connected ?? false;

  const accountQuery = useQuery({ queryKey: ["github", "account"], queryFn: githubApi.getAccount, enabled: connected });
  const reposQuery = useQuery({ queryKey: ["github", "repositories"], queryFn: githubApi.listRepositories, enabled: connected });

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") queryClient.invalidateQueries({ queryKey: ["github"] });
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [queryClient]);

  const connectMutation = useMutation({
    mutationFn: githubApi.getConnectUrl,
    onSuccess: (url) => window.open(url, "_blank", "noopener,noreferrer"),
    onError: (err) => toast({ title: "Couldn't start GitHub connection", description: err instanceof ApiError ? err.message : undefined, variant: "error" }),
  });

  const disconnectMutation = useMutation({
    mutationFn: githubApi.disconnect,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["github"] });
      toast({ title: "GitHub disconnected", variant: "info" });
    },
  });

  const selectMutation = useMutation({
    mutationFn: (repositoryId: string) => githubApi.selectRepository(repositoryId, currentProject!.id),
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast({ title: "Repository connected", description: `Linked to ${project.name}.`, variant: "success" });
    },
    onError: (err) => toast({ title: "Couldn't connect repository", description: err instanceof ApiError ? err.message : undefined, variant: "error" }),
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 md:px-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">GitHub</h1>
        <p className="mt-1 text-sm text-text-secondary">Connect your GitHub account so Avenor can open pull requests for approved fixes.</p>
      </div>

      {statusQuery.isLoading ? (
        <Skeleton className="h-24 w-full" />
      ) : statusQuery.isError ? (
        <ErrorState description="We couldn't load your GitHub connection." onRetry={() => statusQuery.refetch()} />
      ) : (
        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-surface-elevated text-text-secondary">
                <GitBranch className="h-5 w-5" />
              </div>
              <div>
                {connected ? (
                  <>
                    <p className="flex items-center gap-1.5 text-sm font-medium text-text-primary">
                      Connected <Check className="h-3.5 w-3.5 text-success" />
                    </p>
                    <p className="text-xs text-text-tertiary">
                      {statusQuery.data?.githubLogin} · since {statusQuery.data?.connectedAt && formatRelativeTime(statusQuery.data.connectedAt)}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium text-text-primary">Not connected</p>
                    <p className="text-xs text-text-tertiary">Connect a GitHub account to enable pull request automation.</p>
                  </>
                )}
              </div>
            </div>
            {connected ? (
              <Button variant="outline" onClick={() => disconnectMutation.mutate()} loading={disconnectMutation.isPending}>
                Disconnect
              </Button>
            ) : (
              <Button onClick={() => connectMutation.mutate()} loading={connectMutation.isPending}>
                <Link2 className="h-4 w-4" /> Connect GitHub
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {connected && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text-primary">Repositories</h2>
            {accountQuery.data && <p className="text-xs text-text-tertiary">{accountQuery.data.publicRepos} public repos on account</p>}
          </div>

          {reposQuery.isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : reposQuery.isError ? (
            <ErrorState description="We couldn't load your repositories." onRetry={() => reposQuery.refetch()} />
          ) : !reposQuery.data || reposQuery.data.length === 0 ? (
            <EmptyState icon={<GitBranch className="h-5 w-5" />} title="No repositories found" description="Grant Avenor access to at least one repository on GitHub." />
          ) : (
            <div className="space-y-2.5">
              {reposQuery.data.map((repo) => {
                const isLinked = currentProject?.githubRepositoryId === repo.id;
                return (
                  <Card key={repo.id}>
                    <CardContent className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {repo.private ? <Lock className="h-4 w-4 text-text-tertiary" /> : <Unlock className="h-4 w-4 text-text-tertiary" />}
                        <div>
                          <p className="text-sm font-medium text-text-primary">{repo.fullName}</p>
                          <p className="font-mono text-xs text-text-tertiary">default: {repo.defaultBranch}</p>
                        </div>
                        {repo.private && <Badge tone="neutral">Private</Badge>}
                      </div>
                      <div className="flex items-center gap-2">
                        <a href={repo.htmlUrl} target="_blank" rel="noreferrer" className="text-text-tertiary hover:text-text-primary">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                        <Button
                          size="sm"
                          variant={isLinked ? "secondary" : "outline"}
                          disabled={!currentProject || isLinked}
                          loading={selectMutation.isPending && selectMutation.variables === repo.id}
                          onClick={() => selectMutation.mutate(repo.id)}
                        >
                          {isLinked ? "Connected" : "Connect"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
          {!currentProject && (
            <p className="mt-3 flex items-center gap-1.5 text-xs text-text-tertiary">
              <AlertTriangle className="h-3.5 w-3.5" /> Select a project in the sidebar to connect a repository to it.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
