import { LayoutDashboard, Search, Database, FolderKanban, Building2, GitBranch, Settings, Waypoints, type LucideIcon } from "lucide-react";
import { ROUTES } from "./routes";

export interface NavigationItem {
  label: string;
  path: string;
  icon: LucideIcon;
  matchPrefix?: boolean;
}

export const primaryNavigation: NavigationItem[] = [
  { label: "Dashboard", path: ROUTES.dashboard, icon: LayoutDashboard },
  { label: "Investigations", path: ROUTES.investigations, icon: Search, matchPrefix: true },
  { label: "Metadata", path: ROUTES.metadata, icon: Waypoints, matchPrefix: true },
  { label: "Data Sources", path: ROUTES.dataSources, icon: Database },
  { label: "Projects", path: ROUTES.projects, icon: FolderKanban },
  { label: "Workspaces", path: ROUTES.workspaces, icon: Building2 },
  { label: "GitHub", path: ROUTES.github, icon: GitBranch },
];

export const secondaryNavigation: NavigationItem[] = [{ label: "Settings", path: ROUTES.settings, icon: Settings }];

export function isRouteActive(item: NavigationItem, pathname: string): boolean {
  return item.matchPrefix ? pathname.startsWith(item.path) : pathname === item.path;
}
