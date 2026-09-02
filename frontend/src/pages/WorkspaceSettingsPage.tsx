import { useState } from 'react'

const workspaceNavItems = [
  { id: 'org', label: 'Organization' },
  { id: 'github', label: 'GitHub Integration' },
  { id: 'datahub', label: 'DataHub Connection' },
  { id: 'api', label: 'API Keys' },
  { id: 'llm', label: 'LLM Providers' },
]

const personalNavItems = [
  { id: 'profile', label: 'Profile & Bio' },
  { id: 'notifications', label: 'Notifications' },
]

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="relative inline-flex items-center cursor-pointer">
      <input checked={checked} onChange={e => onChange(e.target.checked)} className="sr-only" type="checkbox"/>
      <div className={`w-11 h-6 rounded-full transition-colors ${checked ? 'bg-primary' : 'bg-outline-variant'}`}></div>
      <div className={`absolute top-1 bg-white w-4 h-4 rounded-full shadow-sm transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`}></div>
    </label>
  )
}

export default function WorkspaceSettingsPage() {
  const [activeSection, setActiveSection] = useState('org')
  const [openAiEnabled, setOpenAiEnabled] = useState(true)
  const [anthropicEnabled, setAnthropicEnabled] = useState(true)
  const [workspaceName, setWorkspaceName] = useState('Avenor Strategic Intelligence')

  return (
    <div className="h-full overflow-y-auto bg-surface-container-lowest">
      <div className="max-w-[1440px] mx-auto px-6 py-12">
        <div className="grid grid-cols-12 gap-6">
          {/* Inner Settings Nav */}
          <aside className="col-span-3 space-y-2">
            {/* Workspace Section */}
            <h3 className="px-4 text-[11px] font-semibold text-outline uppercase tracking-wider mb-4">Workspace</h3>
            <nav className="space-y-1">
              {workspaceNavItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-r-lg text-[14px] font-medium transition-all text-left
                    ${activeSection === item.id
                      ? 'bg-primary/5 text-primary border-l-4 border-primary'
                      : 'text-on-surface-variant hover:bg-surface-container rounded-lg'
                    }
                  `}
                >
                  <span>{item.label}</span>
                  {activeSection === item.id && (
                    <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                  )}
                </button>
              ))}
            </nav>
            
            {/* Personal Section */}
            <div className="pt-8">
              <h3 className="px-4 text-[11px] font-semibold text-outline uppercase tracking-wider mb-4">Personal</h3>
              <nav className="space-y-1">
                {personalNavItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-r-lg text-[14px] font-medium transition-all text-left
                      ${activeSection === item.id
                        ? 'bg-primary/5 text-primary border-l-4 border-primary'
                        : 'text-on-surface-variant hover:bg-surface-container rounded-lg'
                      }
                    `}
                  >
                    {item.label}
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          {/* Content Area */}
          <div className="col-span-9 space-y-12">
            {/* Organization */}
            <section className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl overflow-hidden shadow-sm" id="org">
              <div className="p-6 border-b border-outline-variant/30 bg-surface">
                <h2 className="text-2xl font-medium text-on-surface">Organization Settings</h2>
                <p className="text-[14px] text-on-surface-variant">Manage your workspace identity and core identifiers.</p>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-[12px] font-medium text-on-surface">Workspace Name</label>
                    <input
                      className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-[14px]"
                      value={workspaceName}
                      onChange={e => setWorkspaceName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[12px] font-medium text-on-surface">Workspace ID</label>
                    <div className="relative">
                      <input
                        className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant rounded-lg text-on-surface-variant cursor-not-allowed text-[14px]"
                        readOnly
                        value="as-intel-990-21"
                      />
                      <button className="absolute right-3 top-3 material-symbols-outlined text-[18px] text-primary">content_copy</button>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg border border-primary/10">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined">verified</span>
                    </div>
                    <div>
                      <p className="text-[12px] font-bold">Enterprise Plan</p>
                      <p className="text-[12px] text-on-surface-variant">Active since March 2024</p>
                    </div>
                  </div>
                  <button className="px-6 py-2 bg-primary text-white text-[12px] font-medium rounded-lg hover:shadow-lg transition-all">
                    Manage Plan
                  </button>
                </div>
              </div>
            </section>

            {/* LLM Providers */}
            <section className="space-y-4" id="llm">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-medium text-on-surface">LLM Providers</h2>
                <span className="text-[11px] font-semibold text-on-surface-variant bg-surface-container-high px-2 py-1 rounded uppercase tracking-wider">2 Connected</span>
              </div>
              <div className="grid grid-cols-2 gap-6">
                {/* OpenAI */}
                <div className={`bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-6 shadow-sm hover:shadow-md transition-all relative overflow-hidden group ${!openAiEnabled ? 'opacity-60' : ''}`}>
                  <div className="absolute top-0 left-0 w-full h-1 shimmer-bar opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-black flex items-center justify-center rounded-lg">
                        <span className="material-symbols-outlined text-white text-[28px]">api</span>
                      </div>
                      <div>
                        <h4 className="text-[16px] font-bold">OpenAI</h4>
                        <p className="text-[12px] text-on-surface-variant">GPT-4o, GPT-4, Embeddings</p>
                      </div>
                    </div>
                    <Toggle checked={openAiEnabled} onChange={setOpenAiEnabled} />
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-[12px]">
                      <span className="text-on-surface-variant">Connection Status</span>
                      <span className="text-tertiary flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-tertiary rounded-full"></span>
                        Operational
                      </span>
                    </div>
                    <input className="w-full px-4 py-2 bg-surface border border-outline-variant rounded-lg font-mono text-[13px] outline-none" type="password" defaultValue="••••••••••••••••••••••••"/>
                  </div>
                </div>
                {/* Anthropic */}
                <div className={`bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-6 shadow-sm hover:shadow-md transition-all relative overflow-hidden ${!anthropicEnabled ? 'opacity-60' : ''}`}>
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-[#D97757]/10 flex items-center justify-center rounded-lg">
                        <span className="material-symbols-outlined text-[#D97757] text-[28px]">psychology</span>
                      </div>
                      <div>
                        <h4 className="text-[16px] font-bold">Anthropic</h4>
                        <p className="text-[12px] text-on-surface-variant">Claude 3.5 Sonnet, Opus</p>
                      </div>
                    </div>
                    <Toggle checked={anthropicEnabled} onChange={setAnthropicEnabled} />
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-[12px]">
                      <span className="text-on-surface-variant">Connection Status</span>
                      <span className="text-tertiary flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-tertiary rounded-full"></span>
                        Operational
                      </span>
                    </div>
                    <input className="w-full px-4 py-2 bg-surface border border-outline-variant rounded-lg font-mono text-[13px] outline-none" type="password" defaultValue="••••••••••••••••••••••••"/>
                  </div>
                </div>
              </div>
            </section>

            {/* GitHub & DataHub */}
            <div className="grid grid-cols-12 gap-6">
              {/* GitHub */}
              <div className="col-span-7 bg-white border border-outline-variant/30 rounded-xl p-6 shadow-sm flex flex-col justify-between" id="github">
                <div>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-2 bg-on-surface text-white rounded-lg">
                      <span className="material-symbols-outlined">art_track</span>
                    </div>
                    <h3 className="text-2xl font-medium text-on-surface">GitHub</h3>
                  </div>
                  <p className="text-[14px] text-on-surface-variant mb-6">
                    Connect repositories to allow Avenor OS to index codebases and automate documentation generation via Impact Studio.
                  </p>
                  <div className="space-y-2 mb-6">
                    <div className="flex items-center gap-3 p-3 bg-surface-container rounded-lg border border-outline-variant/20">
                      <div className="w-8 h-8 bg-surface-container-high rounded-md flex items-center justify-center">
                        <span className="material-symbols-outlined text-[18px]">folder</span>
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="text-[12px] font-medium truncate">avenor-core-engine</p>
                        <p className="text-[10px] text-on-surface-variant">Last synced: 2 minutes ago</p>
                      </div>
                      <span className="material-symbols-outlined text-tertiary">check_circle</span>
                    </div>
                  </div>
                </div>
                <button className="w-full py-3 border-2 border-dashed border-outline-variant rounded-xl text-on-surface-variant hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-2 text-[12px] font-medium">
                  <span className="material-symbols-outlined">add</span>
                  Add Repository
                </button>
              </div>

              {/* DataHub */}
              <div className="col-span-5 bg-white border border-outline-variant/30 rounded-xl p-6 shadow-sm relative overflow-hidden group" id="datahub">
                <div className="absolute -right-8 -top-8 w-32 h-32 bg-secondary/5 rounded-full blur-2xl group-hover:bg-secondary/10 transition-all"></div>
                <div className="relative z-10">
                  <h3 className="text-2xl font-medium text-on-surface mb-1">DataHub</h3>
                  <p className="text-[14px] text-on-surface-variant mb-6">Metadata catalog sync.</p>
                  <div className="space-y-6">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-outline uppercase tracking-wider">GMS Endpoint</label>
                      <input
                        className="w-full px-4 py-2 bg-surface-container-low border-b-2 border-transparent focus:border-primary transition-all text-[14px] outline-none"
                        defaultValue="https://datahub.internal.avenor.ai"
                      />
                    </div>
                    <div className="flex items-center gap-2 text-[12px] text-error">
                      <span className="material-symbols-outlined text-[18px]">warning</span>
                      Auth token expires in 3 days
                    </div>
                    <button className="w-full py-2 bg-secondary-container text-white rounded-lg text-[12px] font-medium">
                      Refresh Session
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-end gap-4 py-6 border-t border-outline-variant/30">
              <button className="px-6 py-2.5 text-on-surface-variant hover:bg-surface-container rounded-lg text-[12px] font-medium transition-all">
                Discard Changes
              </button>
              <button className="px-6 py-2.5 bg-primary text-white rounded-lg text-[12px] font-medium shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                Save Workspace Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
