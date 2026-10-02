import {
  LayoutDashboard,
  Search,
  Database,
  FolderKanban,
  GitBranch,
  Settings,
  Waypoints,
  Network,
  FileText,
  type LucideIcon,
} from "lucide-react";
import { ROUTES } from "./routes";

export interface NavigationItem {
  label: string;
  path: string;
  icon: LucideIcon;
  matchPrefix?: boolean;
}

export interface NavigationSection {
  label: string;
  items: NavigationItem[];
}

export const navigationSections: NavigationSection[] = [
  {
    label: "Workspace",
    items: [
      { label: "Overview", path: ROUTES.dashboard, icon: LayoutDashboard },
      { label: "Investigations", path: ROUTES.investigations, icon: Search, matchPrefix: true },
      { label: "Metadata", path: ROUTES.metadata, icon: Waypoints, matchPrefix: true },
      { label: "Lineage", path: ROUTES.lineage, icon: Network },
      { label: "Data Sources", path: ROUTES.dataSources, icon: Database },
      { label: "Documents", path: ROUTES.documents, icon: FileText },
    ],
  },
  {
    label: "Engineering",
    items: [
      { label: "GitHub", path: ROUTES.github, icon: GitBranch },
      { label: "Projects", path: ROUTES.projects, icon: FolderKanban },
    ],
  },
  {
    label: "System",
    items: [{ label: "Settings", path: ROUTES.settings, icon: Settings }],
  },
];

export const allNavigationItems: NavigationItem[] = navigationSections.flatMap((section) => section.items);

export function isRouteActive(item: NavigationItem, pathname: string): boolean {
  return item.matchPrefix ? pathname.startsWith(item.path) : pathname === item.path;
}
