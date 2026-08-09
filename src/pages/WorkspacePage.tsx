import { Building2, Plus, ArrowRight, Users, FolderOpen, Sparkles } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

// Mock data - Replace with real data later
const workspaces = [
  {
    id: 1,
    name: "Acme Corporation",
    description: "Enterprise Workspace",
    businesses: 4,
    members: 12,
    active: true,
    created: "2024-01-15",
  },
  {
    id: 2,
    name: "Startup Lab",
    description: "AI Product Team",
    businesses: 2,
    members: 5,
    active: false,
    created: "2024-02-01",
  },
];

export default function WorkspacePage() {
  const [hoveredWorkspace, setHoveredWorkspace] = useState<number | null>(null);

  return (
    <div className="w-full max-w-7xl mx-auto px-3 xs:px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 pb-20">
      {/* Header */}
      <div className="mb-6 sm:mb-8 lg:mb-10">
        <div className="flex items-center gap-2 sm:gap-3 mb-2">
          <div className="h-6 sm:h-8 w-1 rounded-full bg-gradient-to-b from-primary to-primary-container" />
          <p className="text-[10px] xs:text-xs sm:text-sm font-semibold uppercase tracking-widest text-primary">
            Workspace
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-2xl xs:text-3xl sm:text-4xl font-bold text-on-surface tracking-tight">
              Manage Your Workspaces
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-on-surface-variant mt-1 sm:mt-2">
              Organize your businesses into dedicated workspaces.
            </p>
          </div>

          <button 
            className="inline-flex items-center justify-center gap-1.5 sm:gap-2 font-semibold text-on-primary bg-primary hover:opacity-90 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm rounded-xl whitespace-nowrap shadow-lg shadow-primary/20 w-full sm:w-auto"
            onClick={() => {/* Open create workspace modal */}}
          >
            <Plus size={16} className="sm:size-18" />
            <span className="hidden xs:inline">Create Workspace</span>
            <span className="xs:hidden">New</span>
          </button>
        </div>
      </div>

      {/* Workspace Stats - Responsive Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 xs:gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div className="rounded-xl sm:rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-3 sm:p-4 text-center shadow-sm">
          <p className="text-xl sm:text-2xl font-bold text-on-surface">{workspaces.length}</p>
          <p className="text-[10px] xs:text-xs text-on-surface-variant">Total</p>
        </div>
        <div className="rounded-xl sm:rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-3 sm:p-4 text-center shadow-sm">
          <p className="text-xl sm:text-2xl font-bold text-tertiary">
            {workspaces.filter(w => w.active).length}
          </p>
          <p className="text-[10px] xs:text-xs text-on-surface-variant">Active</p>
        </div>
        <div className="rounded-xl sm:rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-3 sm:p-4 text-center shadow-sm">
          <p className="text-xl sm:text-2xl font-bold text-primary">
            {workspaces.reduce((sum, w) => sum + w.businesses, 0)}
          </p>
          <p className="text-[10px] xs:text-xs text-on-surface-variant">Businesses</p>
        </div>
        <div className="rounded-xl sm:rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-3 sm:p-4 text-center shadow-sm">
          <p className="text-xl sm:text-2xl font-bold text-secondary">
            {workspaces.reduce((sum, w) => sum + w.members, 0)}
          </p>
          <p className="text-[10px] xs:text-xs text-on-surface-variant">Members</p>
        </div>
      </div>

      {/* Workspace Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 xs:gap-4 sm:gap-5 md:gap-6">
        {workspaces.map((workspace) => {
          const isHovered = hoveredWorkspace === workspace.id;
          
          return (
            <div
              key={workspace.id}
              className="rounded-xl sm:rounded-2xl border border-outline-variant/30 bg-surface-container-lowest shadow-sm p-4 xs:p-5 sm:p-6 md:p-8 transition-all duration-300 hover:border-primary/40 hover:shadow-md cursor-pointer hover:scale-[1.01] active:scale-[0.99] group"
              onMouseEnter={() => setHoveredWorkspace(workspace.id)}
              onMouseLeave={() => setHoveredWorkspace(null)}
            >
              <div className="flex justify-between items-start mb-4 sm:mb-6">
                <div className="h-11 xs:h-12 sm:h-14 w-11 xs:w-12 sm:w-14 rounded-2xl bg-primary/10 flex items-center justify-center transition-colors duration-300 group-hover:bg-primary/20">
                  <Building2 className="text-primary xs:size-24 sm:size-26" size={22} />
                </div>

                {workspace.active ? (
                  <span className="inline-flex items-center gap-1.5 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-tertiary/15 text-tertiary text-[9px] xs:text-xs font-medium ring-1 ring-tertiary/20">
                    <span className="h-1.5 w-1.5 rounded-full bg-tertiary animate-pulse" />
                    <span className="hidden xs:inline">Active</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-surface-container text-on-surface-variant text-[9px] xs:text-xs font-medium ring-1 ring-outline-variant/30">
                    Inactive
                  </span>
                )}
              </div>

              <h3 className="text-base xs:text-lg sm:text-xl font-semibold text-on-surface group-hover:text-primary transition-colors">
                {workspace.name}
              </h3>

              <p className="text-on-surface-variant mt-1 sm:mt-2 text-xs sm:text-sm">
                {workspace.description}
              </p>

              <div className="flex flex-wrap gap-3 xs:gap-4 md:gap-6 mt-4 sm:mt-6">
                <div className="flex items-center gap-1.5 sm:gap-2 text-on-surface-variant text-xs sm:text-sm">
                  <FolderOpen size={15} className="sm:size-18 text-outline" />
                  <span>{workspace.businesses} Businesses</span>
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2 text-on-surface-variant text-xs sm:text-sm">
                  <Users size={15} className="sm:size-18 text-outline" />
                  <span>{workspace.members} Members</span>
                </div>
              </div>

              <Link
                to={`/business?workspace=${workspace.id}`}
                className={`
                  mt-4 sm:mt-6 md:mt-8 flex items-center gap-1.5 sm:gap-2 text-primary font-medium 
                  transition-all duration-300
                  hover:text-primary/80
                  ${isHovered ? "gap-2 sm:gap-3" : "gap-1.5 sm:gap-2"}
                  text-sm sm:text-base
                `}
              >
                Open Workspace
                <ArrowRight 
                  size={16} 
                  className={`transition-transform duration-300 sm:size-18 ${
                    isHovered ? "translate-x-1" : ""
                  }`}
                />
              </Link>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {workspaces.length === 0 && (
        <div className="text-center py-12 sm:py-16">
          <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <Sparkles className="text-primary sm:size-32" size={28} />
          </div>
          <h3 className="text-lg sm:text-xl font-semibold text-on-surface">No Workspaces Yet</h3>
          <p className="text-on-surface-variant mt-1 sm:mt-2 text-sm sm:text-base">Create your first workspace to get started.</p>
          <button 
            className="mt-4 sm:mt-6 inline-flex items-center justify-center gap-2 font-semibold text-on-primary bg-primary hover:opacity-90 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm rounded-xl shadow-lg shadow-primary/20"
            onClick={() => {/* Open create workspace modal */}}
          >
            <Plus size={16} className="sm:size-18" />
            Create Workspace
          </button>
        </div>
      )}
    </div>
  );
}