import { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, ChevronsUpDown, LogOut, Settings, Check, Boxes } from "lucide-react";
import { primaryNavigation, secondaryNavigation, isRouteActive } from "../constants/navigation";
import { ROUTES } from "../constants/routes";
import { useAuth } from "../context/AuthContext";
import { useWorkspace } from "../context/WorkspaceContext";
import { Dropdown, DropdownContent, DropdownItem, DropdownLabel, DropdownSeparator, DropdownTrigger } from "../components/ui/Dropdown";
import { cn } from "../utils/cn";

function Logo() {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accent text-on-accent">
      <Boxes className="h-4.5 w-4.5" />
    </div>
  );
}

function WorkspaceSwitcher() {
  const { workspaces, projects, currentWorkspace, currentProject, setCurrentWorkspaceSlug, setCurrentProjectSlug, hasWorkspace, isLoading } = useWorkspace();
  const navigate = useNavigate();

  if (isLoading) {
    return <div className="skeleton h-13 w-full rounded-md" />;
  }

  if (!hasWorkspace) {
    return (
      <button
        onClick={() => navigate(ROUTES.workspaces)}
        className="flex w-full items-center justify-between rounded-md border border-dashed border-border px-3 py-2 text-xs text-text-tertiary hover:border-border-strong hover:text-text-secondary transition-colors"
      >
        Create a workspace
      </button>
    );
  }

  return (
    <Dropdown>
      <DropdownTrigger asChild>
        <button className="flex w-full items-center justify-between gap-2 rounded-md border border-border bg-surface-elevated px-2.5 py-2 text-left transition-colors hover:border-border-strong">
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-text-primary">{currentWorkspace?.name ?? "Select workspace"}</p>
            <p className="truncate text-[11px] text-text-tertiary">{currentProject?.name ?? "No project"}</p>
          </div>
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-text-tertiary" />
        </button>
      </DropdownTrigger>
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
      </DropdownContent>
    </Dropdown>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-4 py-4">
        <Logo />
        <span className="text-[15px] font-semibold tracking-tight text-text-primary">Avenor</span>
      </div>

      <div className="px-3 pb-3">
        <WorkspaceSwitcher />
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3">
        {primaryNavigation.map((item) => {
          const active = isRouteActive(item, location.pathname);
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
                active ? "bg-accent-muted text-text-primary font-medium" : "text-text-secondary hover:bg-surface-elevated hover:text-text-primary"
              )}
            >
              <Icon className={cn("h-4 w-4 shrink-0", active && "text-accent")} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="space-y-0.5 border-t border-border-subtle px-3 py-3">
        {secondaryNavigation.map((item) => {
          const active = isRouteActive(item, location.pathname);
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
                active ? "bg-accent-muted text-text-primary font-medium" : "text-text-secondary hover:bg-surface-elevated hover:text-text-primary"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </NavLink>
          );
        })}

        <Dropdown>
          <DropdownTrigger asChild>
            <button className="mt-1 flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left transition-colors hover:bg-surface-elevated">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-muted text-xs font-semibold text-accent-hover">
                {user?.name?.charAt(0).toUpperCase() ?? "?"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-text-primary">{user?.name}</p>
                <p className="truncate text-[11px] text-text-tertiary">{user?.email}</p>
              </div>
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
      </div>
    </div>
  );
}

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const activeLabel = [...primaryNavigation, ...secondaryNavigation].find((item) => isRouteActive(item, location.pathname))?.label ?? "Avenor";

  return (
    <div className="flex h-screen overflow-hidden bg-background text-text-primary">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-border-subtle md:flex">
        <SidebarContent />
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
              <SidebarContent onNavigate={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border-subtle px-4 md:px-6">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-md p-1.5 text-text-secondary hover:bg-surface-elevated md:hidden"
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="text-sm font-medium text-text-primary">{activeLabel}</h1>
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
