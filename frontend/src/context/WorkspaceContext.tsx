import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as workspacesApi from "../lib/api/workspaces";
import * as projectsApi from "../lib/api/projects";
import type { Project, Workspace } from "../lib/api/types";
import { useAuth } from "./AuthContext";

const WORKSPACE_KEY = "avenor_workspace_slug";
const PROJECT_KEY = "avenor_project_slug";

interface WorkspaceContextValue {
  workspaces: Workspace[];
  projects: Project[];
  currentWorkspace: Workspace | null;
  currentProject: Project | null;
  setCurrentWorkspaceSlug: (slug: string) => void;
  setCurrentProjectSlug: (slug: string) => void;
  isLoading: boolean;
  hasWorkspace: boolean;
  hasProject: boolean;
  refetch: () => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const [workspaceSlug, setWorkspaceSlug] = useState<string | null>(() => localStorage.getItem(WORKSPACE_KEY));
  const [projectSlug, setProjectSlug] = useState<string | null>(() => localStorage.getItem(PROJECT_KEY));

  const workspacesQuery = useQuery({
    queryKey: ["workspaces"],
    queryFn: () => workspacesApi.listWorkspaces({ limit: 100 }),
    enabled: isAuthenticated,
  });
  const projectsQuery = useQuery({
    queryKey: ["projects"],
    queryFn: () => projectsApi.listProjects({ limit: 100 }),
    enabled: isAuthenticated,
  });

  const workspaces = workspacesQuery.data?.workspaces ?? [];
  const projects = projectsQuery.data?.projects ?? [];

  useEffect(() => {
    if (workspaces.length === 0) return;
    if (!workspaceSlug || !workspaces.some((w) => w.slug === workspaceSlug)) {
      setWorkspaceSlug(workspaces[0].slug);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaces.length]);

  useEffect(() => {
    if (projects.length === 0) return;
    if (!projectSlug || !projects.some((p) => p.slug === projectSlug)) {
      setProjectSlug(projects[0].slug);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects.length]);

  const setCurrentWorkspaceSlug = (slug: string) => {
    setWorkspaceSlug(slug);
    localStorage.setItem(WORKSPACE_KEY, slug);
  };

  const setCurrentProjectSlug = (slug: string) => {
    setProjectSlug(slug);
    localStorage.setItem(PROJECT_KEY, slug);
  };

  const currentWorkspace = workspaces.find((w) => w.slug === workspaceSlug) ?? null;
  const currentProject = projects.find((p) => p.slug === projectSlug) ?? null;

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      workspaces,
      projects,
      currentWorkspace,
      currentProject,
      setCurrentWorkspaceSlug,
      setCurrentProjectSlug,
      isLoading: workspacesQuery.isLoading || projectsQuery.isLoading,
      hasWorkspace: workspaces.length > 0,
      hasProject: projects.length > 0,
      refetch: () => {
        queryClient.invalidateQueries({ queryKey: ["workspaces"] });
        queryClient.invalidateQueries({ queryKey: ["projects"] });
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [workspaces, projects, currentWorkspace, currentProject, workspacesQuery.isLoading, projectsQuery.isLoading]
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used within a WorkspaceProvider");
  return ctx;
}
