import { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  Menu,
  ChevronsUpDown,
  LogOut,
  Settings,
  Check,
  PanelLeftClose,
  PanelLeft,
  Bell,
  Search as SearchIcon,
  Waypoints,
  Building2,
  X,
} from "lucide-react";
import { navigationSections, isRouteActive, allNavigationItems, type NavigationItem } from "../constants/navigation";
import { ROUTES } from "../constants/routes";
import { useAuth } from "../context/AuthContext";
import { useLogout } from "../hooks/useLogout";
import { useWorkspace } from "../context/WorkspaceContext";
import { Dropdown, DropdownContent, DropdownItem, DropdownLabel, DropdownSeparator, DropdownTrigger } from "../components/ui/Dropdown";
import { Tooltip } from "../components/ui/Tooltip";
import { BrandLogo } from "../components/BrandLogo";
import * as catalogApi from "../lib/api/catalog";
import { cn } from "../utils/cn";

const SIDEBAR_COLLAPSED_KEY = "avenor_sidebar_collapsed";

function WorkspaceSwitcher({ collapsed }: { collapsed: boolean }) {
  const { workspaces, projects, currentWorkspace, currentProject, setCurrentWorkspaceSlug, setCurrentProjectSlug, hasWorkspace, isLoading } = useWorkspace();
  const navigate = useNavigate();

  if (isLoading) {
    return <div className="skeleton h-9 w-full rounded-md" />;
  }

  if (!hasWorkspace) {
    if (collapsed) {
      return (
        <Tooltip content="Create a workspace" side="right">
          <button
            onClick={() => navigate(ROUTES.workspaces)}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-dashed border-border text-text-tertiary hover:border-border-strong hover:text-text-secondary transition-colors"
          >
            <Building2 className="h-4 w-4" />
          </button>
        </Tooltip>
      );
    }
    return (
      <button
        onClick={() => navigate(ROUTES.workspaces)}
        className="flex w-full items-center justify-between rounded-md border border-dashed border-border px-3 py-2 text-xs text-text-tertiary hover:border-border-strong hover:text-text-secondary transition-colors"
      >
        Create a workspace
      </button>
    );
  }

  const trigger = collapsed ? (
    <Tooltip content={currentWorkspace?.name ?? "Select workspace"} side="right">
      <button className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface-elevated text-xs font-semibold text-text-primary transition-colors hover:border-border-strong">
        {currentWorkspace?.name?.charAt(0).toUpperCase() ?? "?"}
      </button>
    </Tooltip>
  ) : (
    <button className="flex w-full items-center justify-between gap-2 rounded-md border border-border bg-surface-elevated px-2.5 py-2 text-left transition-colors hover:border-border-strong">
      <div className="min-w-0">
        <p className="truncate text-xs font-semibold text-text-primary">{currentWorkspace?.name ?? "Select workspace"}</p>
        <p className="truncate text-[11px] text-text-tertiary">{currentProject?.name ?? "No project"}</p>
      </div>
      <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-text-tertiary" />
    </button>
  );

  return (
    <Dropdown>
      <DropdownTrigger asChild>{trigger}</DropdownTrigger>
      <DropdownContent align="start" className="w-64">
        <DropdownLabel className="px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-text-tertiary">Workspace</DropdownLabel>
        {workspaces.map((w) => (
          <DropdownItem key={w.id} onSelect={() => setCurrentWorkspaceSlug(w.slug)}>
            <span className="flex-1 truncate">{w.name}</span>
            {w.slug === currentWorkspace?.slug && <Check className="h-3.5 w-3.5 text-accent" />}
          </DropdownItem>
        ))}
        <DropdownSeparator />
        <DropdownLabel className="px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-text-tertiary">Project</DropdownLabel>
        {projects.length === 0 && <p className="px-2.5 py-1.5 text-xs text-text-tertiary">No projects yet</p>}
        {projects.map((p) => (
          <DropdownItem key={p.id} onSelect={() => setCurrentProjectSlug(p.slug)}>
            <span className="flex-1 truncate">{p.name}</span>
            {p.slug === currentProject?.slug && <Check className="h-3.5 w-3.5 text-accent" />}
          </DropdownItem>
        ))}
        <DropdownSeparator />
        <DropdownItem onSelect={() => navigate(ROUTES.workspaces)}>
          <Building2 className="h-3.5 w-3.5" /> Manage workspaces
        </DropdownItem>
      </DropdownContent>
    </Dropdown>
  );
}

function NavRow({ item, collapsed, onNavigate }: { item: NavigationItem; collapsed: boolean; onNavigate?: () => void }) {
  const location = useLocation();
  const active = isRouteActive(item, location.pathname);
  const Icon = item.icon;

  const link = (
    <NavLink
      to={item.path}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
        collapsed && "justify-center px-0",
        active ? "bg-accent-muted text-text-primary font-medium" : "text-text-secondary hover:bg-surface-elevated hover:text-text-primary"
      )}
    >
      <Icon className={cn("h-4 w-4 shrink-0", active && "text-accent")} />
      {!collapsed && item.label}
    </NavLink>
  );

  if (!collapsed) return link;
  return (
    <Tooltip content={item.label} side="right">
      {link}
    </Tooltip>
  );
}

function SidebarContent({ collapsed, onToggleCollapse, onNavigate }: { collapsed: boolean; onToggleCollapse?: () => void; onNavigate?: () => void }) {
  const { user } = useAuth();
  const logout = useLogout();
  const navigate = useNavigate();

  return (
    <div className="flex h-full flex-col">
      <div className={cn("flex px-4 py-4", collapsed && "justify-center px-2")}>
        <BrandLogo showText={!collapsed} />
      </div>

      <div className={cn("px-3 pb-3", collapsed && "px-2 flex justify-center")}>
        <WorkspaceSwitcher collapsed={collapsed} />
      </div>

      <nav className={cn("flex-1 space-y-4 overflow-y-auto px-3", collapsed && "px-2")}>
        {navigationSections.map((section) => (
          <div key={section.label} className="space-y-0.5">
            {!collapsed && (
              <p className="px-2.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-text-disabled">{section.label}</p>
            )}
            {section.items.map((item) => (
              <NavRow key={item.path} item={item} collapsed={collapsed} onNavigate={onNavigate} />
            ))}
          </div>
        ))}
      </nav>

      <div className={cn("space-y-0.5 border-t border-border-subtle px-3 py-3", collapsed && "px-2")}>
        <Dropdown>
          <DropdownTrigger asChild>
            <button className={cn("flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left transition-colors hover:bg-surface-elevated", collapsed && "justify-center px-0")}>
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-muted text-xs font-semibold text-accent-hover">
                {user?.name?.charAt(0).toUpperCase() ?? "?"}
              </div>
              {!collapsed && (
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-text-primary">{user?.name}</p>
                  <p className="truncate text-[11px] text-text-tertiary">{user?.email}</p>
                </div>
              )}
            </button>
          </DropdownTrigger>
          <DropdownContent align="start" side="top" className="w-56">
            <DropdownItem onSelect={() => navigate(ROUTES.settings)}>
              <Settings className="h-3.5 w-3.5" /> Settings
            </DropdownItem>
            <DropdownSeparator />
            <DropdownItem onSelect={logout} className="text-danger hover:text-danger">
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </DropdownItem>
          </DropdownContent>
        </Dropdown>

        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className={cn(
              "mt-1 flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-text-tertiary transition-colors hover:bg-surface-elevated hover:text-text-secondary",
              collapsed && "justify-center px-0"
            )}
          >
            {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            {!collapsed && "Collapse"}
          </button>
        )}
      </div>
    </div>
  );
}

function TopBarSearch() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const { currentWorkspace, currentProject } = useWorkspace();
  const navigate = useNavigate();

  const { data, isFetching } = useQuery({
    queryKey: ["global-search", currentWorkspace?.id, currentProject?.id, q],
    queryFn: () => catalogApi.searchCatalog({ workspaceId: currentWorkspace?.id, projectId: currentProject?.id, q, limit: 6 }),
    enabled: q.trim().length > 1,
  });

  const results = q.trim().length > 1 ? data?.assets ?? [] : [];

  return (
    <div className="relative w-full max-w-sm">
      <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
      <input
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Search assets, tables, dashboards…"
        className="h-9 w-full rounded-md border border-border bg-surface-elevated pl-9 pr-3 text-sm text-text-primary placeholder:text-text-tertiary transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
      />
      {open && q.trim().length > 1 && (
        <div className="absolute left-0 right-0 top-full z-40 mt-1.5 max-h-72 overflow-y-auto rounded-md border border-border bg-surface-elevated py-1 shadow-elevated">
          {isFetching ? (
            <p className="px-3 py-2.5 text-xs text-text-tertiary">Searching…</p>
          ) : results.length === 0 ? (
            <p className="px-3 py-2.5 text-xs text-text-tertiary">No matching assets found.</p>
          ) : (
            results.map((asset) => (
              <button
                key={asset.id}
                onMouseDown={() => navigate(ROUTES.metadataAsset(asset.id))}
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
  );
}

function NotificationsButton() {
  return (
    <Dropdown>
      <DropdownTrigger asChild>
        <button className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-surface-elevated hover:text-text-primary" aria-label="Notifications">
          <Bell className="h-4.5 w-4.5" />
        </button>
      </DropdownTrigger>
      <DropdownContent align="end" className="w-72">
        <DropdownLabel className="px-2.5 py-1.5 text-[11px] font-medium uppercase tracking-wide text-text-tertiary">Notifications</DropdownLabel>
        <div className="px-2.5 py-6 text-center text-xs text-text-tertiary">You're all caught up. Nothing new to review.</div>
      </DropdownContent>
    </Dropdown>
  );
}

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1";
    } catch {
      return false;
    }
  });
  const location = useLocation();
  const { currentWorkspace, currentProject } = useWorkspace();
  const activeItem = allNavigationItems.find((item) => isRouteActive(item, location.pathname));

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, collapsed ? "1" : "0");
    } catch {
      // localStorage unavailable — collapse state just won't persist across reloads.
    }
  }, [collapsed]);

  const breadcrumb = useMemo(() => {
    const parts = [currentWorkspace?.name, currentProject?.name, activeItem?.label ?? "Avenor"].filter(Boolean) as string[];
    return parts;
  }, [currentWorkspace, currentProject, activeItem]);

  return (
    <div className="flex h-screen overflow-hidden bg-background text-text-primary">
      {/* Desktop sidebar */}
      <aside className={cn("hidden shrink-0 border-r border-border-subtle bg-surface md:flex transition-[width] duration-150", collapsed ? "w-[68px]" : "w-64")}>
        <SidebarContent collapsed={collapsed} onToggleCollapse={() => setCollapsed((c) => !c)} />
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-overlay md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              className="fixed inset-y-0 left-0 z-50 w-72 border-r border-border bg-surface md:hidden"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.2 }}
            >
              <div className="flex items-center justify-end px-3 pt-3">
                <button onClick={() => setMobileOpen(false)} className="rounded-md p-1.5 text-text-secondary hover:bg-surface-elevated" aria-label="Close navigation">
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>
              <SidebarContent collapsed={false} onNavigate={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border-subtle bg-surface px-4 md:px-6">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-md p-1.5 text-text-secondary hover:bg-surface-elevated md:hidden"
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </button>

          <nav aria-label="Breadcrumb" className="hidden min-w-0 items-center gap-1.5 text-sm md:flex">
            {breadcrumb.map((part, i) => (
              <span key={i} className="flex items-center gap-1.5 min-w-0">
                {i > 0 && <span className="text-text-disabled">/</span>}
                <span className={cn("truncate", i === breadcrumb.length - 1 ? "font-medium text-text-primary" : "text-text-tertiary")}>{part}</span>
              </span>
            ))}
          </nav>
          <h1 className="text-sm font-medium text-text-primary md:hidden">{activeItem?.label ?? "Avenor"}</h1>

          <div className="ml-auto flex items-center gap-2">
            <div className="hidden sm:block">
              <TopBarSearch />
            </div>
            <NotificationsButton />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
