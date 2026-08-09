import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useState } from 'react'

interface NavItem {
  to: string
  label: string
  icon: string
  activePattern?: RegExp
}

const mainNavItems: NavItem[] = [
  { to: '/dashboard', label: 'Mission Control', icon: 'dashboard' },
  { to: '/investigations/workspace', label: 'Investigations', icon: 'search_check', activePattern: /^\/investigations/ },
  { to: '/knowledge-graph', label: 'Knowledge Graph', icon: 'hub', activePattern: /^\/knowledge-graph/ },
  { to: '/assets', label: 'Assets', icon: 'inventory_2' },
  { to: '/impact-studio', label: 'Impact Studio', icon: 'insights' },
  { to: '/code-studio', label: 'Code Studio', icon: 'terminal' },
  { to: '/settings', label: 'Workspace', icon: 'work' },
]

export default function AppLayout() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const location = useLocation()

  const isItemActive = (item: NavItem) => {
    if (item.activePattern) return item.activePattern.test(location.pathname)
    return location.pathname === item.to
  }

  const activeMainItem = mainNavItems.find(isItemActive)
  const headerSubtitle = activeMainItem ? activeMainItem.label : 'Workspace Config'

  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans">
      {/* Mobile Overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={[
          'fixed md:relative h-screen z-50 flex flex-col',
          'bg-surface border-r border-[#c3c6d7]/30 shadow-sm',
          'transition-transform duration-300 ease-in-out w-[280px]',
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        ].join(' ')}
      >
        {/* Brand */}
        <div className="px-6 py-5 border-b border-[#c3c6d7]/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#2563eb] rounded-xl flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                dataset
              </span>
            </div>
            <div>
              <h1 className="font-bold text-[24px] leading-[32px] tracking-tight text-on-surface">Avenor OS</h1>
              <p className="text-[12px] text-on-surface-variant opacity-70">Enterprise Data AI</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {mainNavItems.map((item) => {
            const active = isItemActive(item)
            return (
              <NavLink
                key={item.label}
                to={item.to}
                onClick={() => setMobileSidebarOpen(false)}
                className={[
                  'flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200',
                  active
                    ? 'text-[#004ac6] font-bold border-r-2 border-[#004ac6] bg-[#f1f3ff]'
                    : 'text-[#434655] hover:bg-[#e9edff]',
                ].join(' ')}
              >
                <span
                  className="material-symbols-outlined text-[20px]"
                  style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  {item.icon}
                </span>
                <span className="text-[14px] leading-[20px]">{item.label}</span>
              </NavLink>
            )
          })}
        </nav>

        {/* Bottom */}
        <div className="p-3 border-t border-[#c3c6d7]/20 space-y-1 mt-auto">
          <a
            href="#"
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-[#434655] hover:bg-[#e9edff] transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">settings</span>
            <span className="text-[14px]">Settings</span>
          </a>
          <a
            href="#"
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-[#434655] hover:bg-[#e9edff] transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">help</span>
            <span className="text-[14px]">Support</span>
          </a>

          {/* User Profile */}
          <div className="p-3 flex items-center gap-3 bg-[#f1f3ff] rounded-xl border border-[#c3c6d7]/30 mt-2">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-[#c3c6d7] shrink-0">
              <img
                className="w-full h-full object-cover"
                alt="Alex Chen"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDhEha_AzE7GYRpAtAHUBdypSvB7Cy4AMsGx4ijzvwdBwRpdPuwlXTvAohHP_fDTePhqsJXOdJ_eux6pd1Psci831eIOqCAs3uOsPfy1JAhf1jHrQphfM_QLVFXmzmZJMMW4BNgO9tSJ4gFoKVEDg4UpKsCQ4NCjXkyfsw0y0dFP1pIekT6G77AE1VqGWV5NeL56ov8y-m3kHNuD22qBFqju16v3KAjYJPgp6eb4JJMr4F72_YPZYGC"
              />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-[12px] font-semibold text-on-surface truncate">Alex Chen</p>
              <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">Administrator</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main panel */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Nav Bar */}
        <header className="h-16 flex justify-between items-center px-6 bg-surface/80 backdrop-blur-md border-b border-[#c3c6d7]/30 shrink-0 z-30">
          <div className="flex items-center gap-4">
            {/* Mobile toggle */}
            <button
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              className="md:hidden p-2 text-on-surface-variant hover:bg-[#e9edff] rounded-full transition-all"
            >
              <span className="material-symbols-outlined text-[24px]">menu</span>
            </button>

            {/* Breadcrumb */}
            <div className="hidden sm:flex items-center gap-3">
              <span className="font-black text-[24px] leading-[32px] tracking-tight text-on-surface">Avenor</span>
              <div className="h-4 w-[1px] bg-[#c3c6d7]"></div>
              <span className="text-[12px] text-on-surface-variant">{headerSubtitle}</span>
            </div>

            {/* Search */}
            <div className="flex bg-[#f1f3ff] px-3 py-1.5 rounded-lg border border-[#c3c6d7]/50 w-64 md:w-80 items-center gap-2">
              <span className="material-symbols-outlined text-on-surface-variant text-[20px]">search</span>
              <input
                className="bg-transparent border-none focus:ring-0 text-[12px] w-full ml-1 outline-none text-on-surface placeholder:text-on-surface-variant/50"
                placeholder="Search assets, lineage, logs..."
                type="text"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* AI Status pill */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#7ffc97]/30 text-[#005320] text-[12px] font-semibold border border-[#7ffc97]/20">
              <span className="w-2 h-2 rounded-full bg-[#006329] animate-pulse"></span>
              AI Optimal
            </div>

            {/* Icon buttons */}
            <div className="flex gap-1">
              <button className="p-2 text-on-surface-variant hover:bg-[#e9edff] rounded-full transition-colors relative">
                <span className="material-symbols-outlined">notifications</span>
                <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full animate-ping"></span>
              </button>
              <button className="p-2 text-on-surface-variant hover:bg-[#e9edff] rounded-full transition-colors">
                <span className="material-symbols-outlined">apps</span>
              </button>
            </div>
          </div>
        </header>

        {/* Page View */}
        <div className="flex-1 overflow-auto relative">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
