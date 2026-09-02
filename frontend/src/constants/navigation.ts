import {
  LayoutDashboard,
  MessageSquare,
  GitBranch,
  FileText,
  BarChart3,
  Settings,
  type LucideIcon,
} from "lucide-react";

// Type definitions
export interface NavigationItem {
  label: string;
  path: string;
  icon: LucideIcon;
  badge?: string;
  badgeColor?: "violet" | "emerald" | "blue" | "amber" | "rose";
  disabled?: boolean;
  children?: NavigationItem[];
  divider?: boolean;
}

export const navigation: NavigationItem[] = [
  {
    label: "Overview",
    path: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "AI Chat",
    path: "/chat",
    icon: MessageSquare,
    badge: "3",
    badgeColor: "violet",
  },
  {
    label: "Projects",
    path: "/projects",
    icon: GitBranch,
    badge: "12",
    badgeColor: "emerald",
  },
  {
    label: "Executive Reports",
    path: "/reports",
    icon: FileText,
  },
  {
    label: "Analytics",
    path: "/analytics",
    icon: BarChart3,
    badge: "New",
    badgeColor: "blue",
  },
  {
    label: "Settings",
    path: "/settings",
    icon: Settings,
  },
];

// Route titles mapping
export const routeTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/chat": "AI Chat",
  "/projects": "Projects",
  "/reports": "Executive Reports",
  "/analytics": "Analytics",
  "/settings": "Settings",
};

// Badge color mapping
export const badgeColors = {
  violet: "bg-violet-500/20 text-violet-300 ring-1 ring-violet-500/30",
  emerald: "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30",
  blue: "bg-blue-500/20 text-blue-300 ring-1 ring-blue-500/30",
  amber: "bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/30",
  rose: "bg-rose-500/20 text-rose-300 ring-1 ring-rose-500/30",
};

// Helper functions
export function getRouteTitle(path: string): string {
  return routeTitles[path] || path.replace("/", "").charAt(0).toUpperCase() + path.slice(1);
}

export function isActiveRoute(path: string, currentPath: string): boolean {
  if (path === "/") return currentPath === "/";
  return currentPath.startsWith(path);
}

export function getActiveNavigation(currentPath: string): NavigationItem | undefined {
  return navigation.find((item) => isActiveRoute(item.path, currentPath));
}

export function getNavigationWithActive(currentPath: string): NavigationItem[] {
  return navigation.map((item) => ({
    ...item,
    active: isActiveRoute(item.path, currentPath),
  }));
}

// Navigation groups for better organization
export const navigationGroups = {
  main: navigation.slice(0, 5),
  settings: navigation.slice(5),
};

// Navigation items with dividers
export const navigationWithDividers: (NavigationItem | { divider: true })[] = [
  ...navigation.slice(0, 5),
  { divider: true },
  ...navigation.slice(5),
];

// Navigation items with icons only (for collapsed sidebar)
export const navigationCompact = navigation.map((item) => ({
  ...item,
  label: item.label.charAt(0), // First letter for collapsed mode
}));

// Get navigation item by path
export function getNavigationItemByPath(path: string): NavigationItem | undefined {
  return navigation.find((item) => item.path === path);
}

// Check if navigation has any child items
export function hasChildren(item: NavigationItem): boolean {
  return Boolean(item.children && item.children.length > 0);
}