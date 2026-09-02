import { 
  Building2, 
  Plus, 
  ArrowRight, 
  Users, 
  FolderOpen, 
  Sparkles,
  Briefcase,
  Calendar,
  Clock,
  FileText,
  Upload,
  ChevronRight,
  MoreVertical,
  Search,
  Filter
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

const businesses = [
  {
    id: 1,
    name: "Acme Corp - Tech Division",
    description: "Software development and AI solutions",
    workspace: "Acme Corporation",
    members: 8,
    documents: 24,
    status: "active",
    created: "2024-01-15",
    lastActivity: "2 hours ago",
  },
  {
    id: 2,
    name: "Acme Corp - Marketing",
    description: "Digital marketing and brand strategy",
    workspace: "Acme Corporation",
    members: 5,
    documents: 12,
    status: "active",
    created: "2024-02-01",
    lastActivity: "1 day ago",
  },
  {
    id: 3,
    name: "Startup Lab - Product",
    description: "AI product development and research",
    workspace: "Startup Lab",
    members: 3,
    documents: 8,
    status: "archived",
    created: "2024-03-10",
    lastActivity: "5 days ago",
  },
];

const statusColors = {
  active: "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/20",
  archived: "bg-slate-500/15 text-slate-400 ring-1 ring-slate-500/20",
  pending: "bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/20",
};

export default function BusinessPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredBusiness, setHoveredBusiness] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filteredBusinesses = businesses.filter(business =>
    business.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    business.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    business.workspace.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 pb-20">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-sm text-[#cbc3d7] mb-6">
        <Link to="/dashboard" className="hover:text-white transition-colors">
          Dashboard
        </Link>
        <ChevronRight size={14} />
        <Link to="/workspace" className="hover:text-white transition-colors">
          Workspace
        </Link>
        <ChevronRight size={14} />
        <span className="text-white font-medium">Businesses</span>
      </nav>

      {/* Header */}
      <div className="mb-8 md:mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-8 w-1 rounded-full bg-gradient-to-b from-violet-400 to-cyan-400" />
          <p className="text-xs md:text-sm font-semibold uppercase tracking-widest text-violet-300">
            Businesses
          </p>
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
              Your Businesses
            </h1>
            <p className="text-[#cbc3d7] mt-2 text-sm md:text-base">
              Manage all your business entities within workspaces.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* View Toggle */}
            <div className="flex rounded-xl border border-white/10 bg-white/5 p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  viewMode === "grid"
                    ? "bg-violet-500/20 text-violet-300"
                    : "text-[#cbc3d7] hover:text-white"
                }`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  viewMode === "list"
                    ? "bg-violet-500/20 text-violet-300"
                    : "text-[#cbc3d7] hover:text-white"
                }`}
              >
                List
              </button>
            </div>

            <button className="inline-flex items-center justify-center gap-2 font-semibold text-[#340080] bg-gradient-to-r from-violet-300 via-violet-400 to-cyan-400 transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(208,188,255,0.35)] active:scale-[0.98] px-6 py-2.5 text-sm rounded-xl whitespace-nowrap">
              <Plus size={18} />
              New Business
            </button>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#958ea0]" />
          <input
            type="text"
            placeholder="Search businesses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-9 pr-4 text-sm text-white placeholder-[#958ea0] outline-none transition-all duration-300 focus:border-violet-400/30 focus:bg-white/10 focus:ring-1 focus:ring-violet-400/30"
          />
        </div>
        
        <button className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-[#cbc3d7] transition hover:bg-white/10 hover:text-white">
          <Filter size={16} />
          Filter
        </button>
      </div>

      {/* Business Cards - Grid View */}
      {viewMode === "grid" && (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
          {filteredBusinesses.map((business) => {
            const isHovered = hoveredBusiness === business.id;
            
            return (
              <div
                key={business.id}
                className="rounded-3xl border border-white/8 bg-[rgba(23,31,51,0.72)] backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.25)] p-6 transition-all duration-300 hover:border-violet-400/20 hover:shadow-[0_15px_50px_rgba(0,0,0,0.35)] cursor-pointer hover:scale-[1.01] active:scale-[0.99] group"
                onMouseEnter={() => setHoveredBusiness(business.id)}
                onMouseLeave={() => setHoveredBusiness(null)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="h-14 w-14 rounded-2xl bg-violet-500/10 flex items-center justify-center transition-colors duration-300 group-hover:bg-violet-500/20">
                    <Briefcase className="text-violet-300" size={26} />
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[business.status as keyof typeof statusColors]}`}>
                      {business.status.charAt(0).toUpperCase() + business.status.slice(1)}
                    </span>
                    <button className="p-1.5 rounded-lg hover:bg-white/5 transition">
                      <MoreVertical size={16} className="text-[#cbc3d7]" />
                    </button>
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-white group-hover:text-violet-300 transition-colors">
                  {business.name}
                </h3>

                <p className="text-[#cbc3d7] mt-1.5 text-sm line-clamp-2">
                  {business.description}
                </p>

                <div className="flex items-center gap-2 mt-3 text-xs text-[#958ea0]">
                  <Building2 size={14} />
                  <span>{business.workspace}</span>
                </div>

                <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-white/5">
                  <div className="flex items-center gap-2 text-[#cbc3d7] text-xs">
                    <Users size={14} className="text-[#958ea0]" />
                    <span>{business.members} Members</span>
                  </div>

                  <div className="flex items-center gap-2 text-[#cbc3d7] text-xs">
                    <FileText size={14} className="text-[#958ea0]" />
                    <span>{business.documents} Docs</span>
                  </div>

                  <div className="flex items-center gap-2 text-[#cbc3d7] text-xs">
                    <Clock size={14} className="text-[#958ea0]" />
                    <span>{business.lastActivity}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mt-4">
                  <Link
                    to={`/business/${business.id}/documents`}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-violet-500/10 px-4 py-2 text-sm font-medium text-violet-300 transition hover:bg-violet-500/20 hover:text-violet-200"
                  >
                    <Upload size={14} />
                    Upload Docs
                  </Link>
                  
                  <Link
                    to={`/business/${business.id}/chat`}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-white/5 px-4 py-2 text-sm font-medium text-[#cbc3d7] transition hover:bg-white/10 hover:text-white"
                  >
                    Open Chat
                    <ArrowRight size={14} className={`transition-transform duration-300 ${isHovered ? "translate-x-0.5" : ""}`} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Business Cards - List View */}
      {viewMode === "list" && (
        <div className="rounded-3xl border border-white/8 bg-[rgba(23,31,51,0.72)] backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.25)] overflow-hidden">
          <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-white/5 text-xs font-semibold uppercase tracking-wider text-[#958ea0]">
            <div className="col-span-4">Business</div>
            <div className="col-span-2">Workspace</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Members</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          {filteredBusinesses.map((business) => (
            <div
              key={business.id}
              className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/5 last:border-0 items-center transition hover:bg-white/5"
            >
              <div className="col-span-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                  <Briefcase className="text-violet-300" size={18} />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{business.name}</p>
                  <p className="text-xs text-[#cbc3d7] line-clamp-1">{business.description}</p>
                </div>
              </div>

              <div className="col-span-2 text-sm text-[#cbc3d7] flex items-center gap-1.5">
                <Building2 size={14} className="text-[#958ea0]" />
                {business.workspace}
              </div>

              <div className="col-span-2">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[business.status as keyof typeof statusColors]}`}>
                  {business.status}
                </span>
              </div>

              <div className="col-span-2 flex items-center gap-3 text-sm text-[#cbc3d7]">
                <Users size={14} className="text-[#958ea0]" />
                {business.members}
                <span className="text-xs text-[#958ea0]">members</span>
              </div>

              <div className="col-span-2 flex items-center justify-end gap-2">
                <Link
                  to={`/business/${business.id}/documents`}
                  className="rounded-lg bg-violet-500/10 px-3 py-1.5 text-xs font-medium text-violet-300 transition hover:bg-violet-500/20"
                >
                  Upload
                </Link>
                <Link
                  to={`/business/${business.id}/chat`}
                  className="rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium text-[#cbc3d7] transition hover:bg-white/10"
                >
                  Chat
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {filteredBusinesses.length === 0 && (
        <div className="text-center py-16">
          <div className="h-20 w-20 rounded-full bg-violet-500/10 flex items-center justify-center mx-auto mb-4">
            <Briefcase className="text-violet-300" size={32} />
          </div>
          <h3 className="text-xl font-semibold text-white">No Businesses Found</h3>
          <p className="text-[#cbc3d7] mt-2">
            {searchQuery ? "Try adjusting your search terms" : "Create your first business to get started."}
          </p>
          {!searchQuery && (
            <button className="mt-6 inline-flex items-center gap-2 font-semibold text-[#340080] bg-gradient-to-r from-violet-300 via-violet-400 to-cyan-400 transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(208,188,255,0.35)] active:scale-[0.98] px-6 py-3 text-sm rounded-xl">
              <Plus size={18} />
              Create Business
            </button>
          )}
        </div>
      )}
    </div>
  );
}