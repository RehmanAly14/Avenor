import { useState, useEffect, useRef } from 'react'

const activityLogs = [
  { status: 'ACTIVE', time: '14:45:22', title: 'Searching enterprise metadata...', note: 'Querying ElasticSearch nodes 4-12', pct: 66 },
  { status: 'COMPLETED', time: '14:44:01', title: 'Synthesizing log patterns', note: 'Found 12 overlapping timestamp anomalies' },
  { status: 'COMPLETED', time: '14:43:45', title: 'Scanning API Gateways', note: 'Access tokens validated for 48 instances' },
  { status: 'COMPLETED', time: '14:42:12', title: 'Establishing baseline metrics', note: 'Normal drift identified as 0.4%' },
]

const initialLogLines = [
  '>> Initializing deep search agent...',
  '>> Cluster context: PROD-NORTH-02',
  '>> Entropy check: 0.1223',
  '>> Waiting for response... _',
]

const randomLogs = [
  '>> Node communication optimized',
  '>> Header validation skipped (cache hit)',
  '>> Mapping dependencies...',
  '>> Data leak check: Clear',
  '>> Querying graph DB...',
]

export default function InvestigationWorkspacePage() {
  const [logs, setLogs] = useState(initialLogLines)
  const [isMobile, setIsMobile] = useState(false)
  const logsRef = useRef<HTMLDivElement>(null)

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Logs auto-scroll
  useEffect(() => {
    const interval = setInterval(() => {
      setLogs(prev => {
        const next = [...prev, randomLogs[Math.floor(Math.random() * randomLogs.length)]]
        return next.length > 8 ? next.slice(-8) : next
      })
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  // Scroll to bottom on new logs
  useEffect(() => {
    if (logsRef.current) {
      logsRef.current.scrollTop = logsRef.current.scrollHeight
    }
  }, [logs])

  return (
    <div className="h-[calc(100vh-64px)] grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden">
      {/* Left Pane: Command + Pipeline */}
      <section className="lg:col-span-8 flex flex-col border-r border-outline-variant bg-surface-container-lowest/50 overflow-hidden">
        {/* Command Input - Responsive */}
        <div className="p-3 md:p-4 lg:p-6 z-10">
          <div className="bg-white rounded-xl shadow-sm border border-outline-variant p-3 md:p-4 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
            <div className="flex items-center gap-2 md:gap-3 mb-1 md:mb-2">
              <span className="material-symbols-outlined text-primary text-[18px] md:text-[20px]">auto_awesome</span>
              <span className="text-[10px] md:text-[11px] font-semibold text-primary tracking-widest uppercase">Agent Command Interface</span>
            </div>
            <textarea
              className="w-full border-none p-0 focus:ring-0 text-[14px] md:text-[16px] text-on-surface placeholder:text-on-surface-variant/40 resize-none h-16 md:h-20 outline-none"
              placeholder="Analyze the anomaly in the Q3 revenue stream and correlate with system log deviations..."
            />
            <div className="flex flex-wrap justify-between items-center gap-2 mt-2 pt-2 border-t border-outline-variant/30">
              <div className="flex flex-wrap gap-2">
                {['Deep Scan', 'Knowledge Graph'].map(tag => (
                  <span key={tag} className="px-2 py-1 rounded bg-surface-container text-[10px] md:text-[12px] text-on-surface-variant">{tag}</span>
                ))}
              </div>
              <button className="bg-primary text-on-primary px-4 md:px-6 py-1.5 md:py-2 rounded-lg text-[11px] md:text-[12px] font-medium hover:shadow-lg transition-all active:scale-95">
                Execute Investigation
              </button>
            </div>
          </div>
        </div>

        {/* Pipeline - Responsive */}
        <div className="flex-1 px-3 md:px-4 lg:px-6 pb-3 md:pb-4 lg:pb-6 flex flex-col md:flex-row gap-4 md:gap-6 overflow-y-auto z-10">
          {/* Pipeline Steps Track - Horizontal on mobile */}
          <div className="flex md:flex-col items-center md:items-start gap-4 md:gap-0 shrink-0">
            <div className="flex md:flex-col gap-4 md:gap-12 pt-2 md:pt-4">
              {[
                { icon: 'assignment', active: true },
                { icon: 'psychology', active: true, shimmer: true },
                { icon: 'database', active: false },
                { icon: 'troubleshoot', active: false },
                { icon: 'schema', active: false },
              ].map(({ icon, active, shimmer }, i) => (
                <div key={i} className={`relative z-10 w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center shadow-sm
                  ${active
                    ? 'bg-primary text-on-primary shadow-lg ring-4 ring-primary-fixed'
                    : 'bg-surface-container text-outline'
                  }
                  ${shimmer ? 'shimmer' : ''}
                `}>
                  <span className="material-symbols-outlined text-[16px] md:text-[20px]">{icon}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Step Details - Responsive */}
          <div className="flex-1 space-y-4 md:space-y-6 min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-lg md:text-2xl font-medium text-on-surface">Building Investigation Context</h3>
              <span className="text-[10px] md:text-[12px] text-tertiary px-2 md:px-3 py-0.5 md:py-1 bg-tertiary-container/10 rounded-full font-medium">Step 2 of 5</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              {/* Root Cause */}
              <div className="col-span-1 md:col-span-2 bg-white rounded-xl border border-outline-variant p-3 md:p-4 shadow-sm glow-pulse">
                <div className="flex items-center justify-between mb-3 md:mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 md:w-8 md:h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-[16px] md:text-[20px]">error</span>
                    </div>
                    <span className="text-[10px] md:text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">Potential Root Cause</span>
                  </div>
                  <button className="text-primary text-[11px] md:text-[12px] font-medium">View Trace</button>
                </div>
                <h4 className="text-xl md:text-2xl font-medium mb-1 md:mb-2">Unauthorized Metadata Injection</h4>
                <p className="text-[13px] md:text-[14px] text-on-surface-variant leading-relaxed">
                  Detected atypical write patterns from service account <code className="bg-surface-container px-1 rounded text-[12px] md:text-[13px]">SA-492-X</code> targeting the global ledger.
                  Anomaly detected at 14:22:04 GMT.
                </p>
              </div>

              {/* Confidence */}
              <div className="bg-white rounded-xl border border-outline-variant p-3 md:p-4 shadow-sm">
                <span className="text-[10px] md:text-[11px] font-semibold text-on-surface-variant block mb-2 md:mb-4 uppercase tracking-wider">Confidence Score</span>
                <div className="flex items-end gap-2 md:gap-3">
                  <span className="text-3xl md:text-[48px] font-semibold text-primary leading-none">94%</span>
                  <div className="h-6 md:h-8 flex-1 bg-surface-container rounded-full overflow-hidden mb-1 md:mb-2">
                    <div className="h-full bg-primary w-[94%] shimmer"></div>
                  </div>
                </div>
                <p className="text-[11px] md:text-[12px] text-on-surface-variant mt-1 md:mt-2">Correlated with 14 historical incidents</p>
              </div>

              {/* Risk Level */}
              <div className="bg-white rounded-xl border border-outline-variant p-3 md:p-4 shadow-sm">
                <span className="text-[10px] md:text-[11px] font-semibold text-on-surface-variant block mb-2 md:mb-4 uppercase tracking-wider">Risk Level</span>
                <div className="flex flex-wrap items-center gap-2 md:gap-3">
                  <span className="px-3 md:px-4 py-1.5 md:py-2 bg-error-container text-on-error-container rounded-lg font-bold text-xl md:text-2xl">CRITICAL</span>
                  <div className="flex-1 space-y-1 min-w-[60px]">
                    <div className="h-1 bg-error rounded-full"></div>
                    <div className="h-1 bg-error rounded-full"></div>
                    <div className="h-1 bg-error rounded-full"></div>
                  </div>
                </div>
                <p className="text-[11px] md:text-[12px] text-on-surface-variant mt-1 md:mt-2">Impacts: Financial Compliance</p>
              </div>

              {/* Affected Assets */}
              <div className="col-span-1 md:col-span-2 bg-white rounded-xl border border-outline-variant overflow-hidden">
                <div className="p-3 md:p-4 border-b border-outline-variant flex flex-wrap justify-between items-center bg-surface-container-low">
                  <span className="text-[10px] md:text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">Affected Assets</span>
                  <span className="text-[11px] md:text-[12px] text-on-surface-variant">3 items found</span>
                </div>
                <div className="divide-y divide-outline-variant">
                  {[
                    { icon: 'table_chart', name: 'revenue_ledger_v2', desc: 'Core Banking Database' },
                    { icon: 'api', name: 'transaction_gateway_prod', desc: 'External API Endpoint' },
                  ].map(asset => (
                    <div key={asset.name} className="p-3 md:p-4 flex flex-wrap items-center justify-between hover:bg-surface-container-lowest transition-colors cursor-pointer">
                      <div className="flex items-center gap-2 md:gap-3 min-w-0">
                        <span className="material-symbols-outlined text-on-surface-variant text-[18px] md:text-[20px]">{asset.icon}</span>
                        <div className="min-w-0">
                          <div className="text-[13px] md:text-[14px] font-medium truncate">{asset.name}</div>
                          <div className="text-[11px] md:text-[12px] text-on-surface-variant truncate">{asset.desc}</div>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Right Pane: Live Activity Feed - Hidden on mobile, visible on lg */}
      <section className="hidden lg:flex lg:col-span-4 bg-surface flex flex-col overflow-hidden">
        <div className="p-6 border-b border-outline-variant flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">monitor_heart</span>
            <h2 className="text-[16px] font-bold">Live AI Activity</h2>
          </div>
          <div className="flex gap-1">
            {[0, 200, 400].map(delay => (
              <div key={delay} className="w-1 h-1 rounded-full bg-primary animate-bounce" style={{ animationDelay: `${delay}ms` }}></div>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activityLogs.map((log, i) => (
            <div key={i} className={`rounded-lg border border-outline-variant p-4 relative overflow-hidden
              ${log.status === 'ACTIVE' ? 'bg-white shadow-sm' : 'bg-surface-container-low opacity-70'}
            `}>
              {log.status === 'ACTIVE' && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>}
              <div className="flex justify-between items-start mb-2">
                <span className={`text-[12px] font-medium ${log.status === 'ACTIVE' ? 'text-primary' : 'text-tertiary'}`}>
                  {log.status}
                </span>
                <span className="text-[10px] text-on-surface-variant uppercase">{log.time}</span>
              </div>
              <p className="text-[14px] font-medium">{log.title}</p>
              <p className="text-[12px] text-on-surface-variant mt-1 italic">{log.note}</p>
              {log.pct != null && (
                <div className="mt-3 h-1 bg-surface-container rounded-full overflow-hidden">
                  <div className="h-full bg-primary shimmer" style={{ width: `${log.pct}%` }}></div>
                </div>
              )}
            </div>
          ))}

          {/* Internal Logs Terminal */}
          <div className="bg-inverse-surface text-inverse-on-surface p-4 rounded-xl shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-primary-fixed text-[18px]">terminal</span>
              <span className="text-[11px] font-semibold text-inverse-on-surface uppercase tracking-wider">Internal Logs</span>
            </div>
            <div ref={logsRef} className="font-mono text-[11px] space-y-1 opacity-80 max-h-32 overflow-y-auto">
              {logs.map((line, i) => (
                <div key={i} className={i === logs.length - 1 ? 'text-primary-fixed-dim animate-pulse' : ''}>{line}</div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Floating Action Button - Responsive */}
      <button className="fixed bottom-4 md:bottom-6 right-4 md:right-6 w-12 h-12 md:w-14 md:h-14 bg-primary text-on-primary rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-all z-50 group">
        <span className="material-symbols-outlined transition-transform group-hover:rotate-90 text-[22px] md:text-[24px]">bolt</span>
        <div className="absolute right-14 md:right-16 bg-inverse-surface text-inverse-on-surface px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-[10px] md:text-[12px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Quick Remediation Action
        </div>
      </button>
    </div>
  )
}