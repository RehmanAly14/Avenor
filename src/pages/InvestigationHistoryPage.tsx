import { useState } from 'react'

type InvestigationRow = {
  id: string
  month: string
  day: string | null
  isNow?: boolean
  severity: string
  severityColor: string
  title: string
  status: string
  statusColor: string
  statusIcon: string
  elapsed: string
  dotColor: string
  expandContent: React.ReactNode
  isRunning?: boolean
  isArchived?: boolean
}

const investigations: InvestigationRow[] = [
  {
    id: 'INV-4902', month: 'Oct', day: '24', severity: 'Critical',
    severityColor: 'bg-error/10 text-error', title: 'Unusual Authentication Spike in Node-04',
    status: 'Resolved', statusColor: 'text-tertiary', statusIcon: 'check_circle',
    elapsed: 'Elapsed: 2h 14m', dotColor: 'bg-error',
    expandContent: (
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <h4 className="text-[11px] font-semibold text-outline uppercase tracking-wider">Root Cause Analysis</h4>
          <div className="p-4 bg-white border border-outline-variant rounded-lg text-[14px] leading-relaxed">
            AI detected a credential stuffing attempt originating from a known proxy network. The target was the enterprise LDAP gateway. System automatically enacted IP-range blocking after the 500th failed attempt.
          </div>
        </div>
        <div className="space-y-2">
          <h4 className="text-[11px] font-semibold text-outline uppercase tracking-wider">Business Impact</h4>
          <div className="p-4 bg-white border border-outline-variant rounded-lg text-[14px] leading-relaxed">
            <span className="font-bold text-error">Zero breaches confirmed.</span> Minor latency observed in the authentication service for 4 minutes.
          </div>
        </div>
        <div className="col-span-full flex justify-end gap-2">
          <button className="px-4 py-2 text-[12px] font-bold border border-outline-variant rounded-lg hover:bg-surface-container transition-all">View Audit Log</button>
          <button className="px-4 py-2 text-[12px] font-bold bg-primary text-on-primary rounded-lg hover:opacity-90">Open Detailed Report</button>
        </div>
      </div>
    ),
  },
  {
    id: 'INV-4881', month: 'Oct', day: '22', severity: 'High',
    severityColor: 'bg-secondary/10 text-secondary', title: 'Data Leakage Simulation - Dev Environment',
    status: 'Resolved', statusColor: 'text-tertiary', statusIcon: 'check_circle',
    elapsed: 'Elapsed: 45m', dotColor: 'bg-secondary',
    expandContent: (
      <div className="p-4">
        <div className="flex gap-4 p-4 bg-secondary-container/5 border border-secondary/20 rounded-lg mb-4">
          <span className="material-symbols-outlined text-secondary">info</span>
          <p className="text-[14px] italic text-secondary">"Automated simulation triggered by CI/CD pipeline to test new encryption protocols."</p>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[{ label: 'Risk Score', val: '78/100', color: 'text-secondary' }, { label: 'Mitigation', val: 'Auto', color: 'text-on-surface' }, { label: 'Nodes Affected', val: '12', color: 'text-on-surface' }].map(m => (
            <div key={m.label} className="p-2 text-center bg-white rounded border border-outline-variant">
              <p className="text-[11px] font-semibold text-outline uppercase">{m.label}</p>
              <p className={`text-2xl font-bold ${m.color}`}>{m.val}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 'INV-5011', month: 'Active', day: null, isNow: true, severity: 'Medium',
    severityColor: 'bg-surface-variant text-on-surface-variant', title: 'Anomaly Detection: Latency Outlier in South-West API',
    status: 'Running', statusColor: 'text-primary', statusIcon: 'sync',
    elapsed: 'Started: 12m ago', dotColor: 'bg-primary', isRunning: true,
    expandContent: (
      <div className="p-4 bg-primary/5 border-t border-primary/10">
        <div className="flex items-center gap-4 mb-4">
          <div className="h-2 flex-1 bg-outline-variant rounded-full overflow-hidden">
            <div className="h-full bg-primary w-2/3"></div>
          </div>
          <span className="text-[12px] font-bold text-primary">Investigation 68% Complete</span>
        </div>
        <div className="flex flex-col gap-2">
          {[
            { done: true, text: 'Scanning load balancer logs...' },
            { done: true, text: 'Isolating database connection pool...' },
            { done: false, text: 'Analyzing trace IDs for SQL injection patterns...' },
          ].map(step => (
            <div key={step.text} className={`flex items-center gap-2 text-[14px] ${step.done ? 'text-on-surface-variant' : 'font-bold text-primary'}`}>
              <span className={`material-symbols-outlined text-[16px] ${step.done ? 'text-tertiary' : 'animate-pulse'}`}>
                {step.done ? 'check' : 'forward'}
              </span>
              {step.text}
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 'INV-4220', month: 'Oct', day: '18', severity: 'Low',
    severityColor: 'bg-surface-container-highest text-outline', title: 'Routine Maintenance: Certificate Rotation',
    status: 'Archived', statusColor: 'text-outline', statusIcon: 'archive',
    elapsed: 'Auto-resolved', dotColor: 'bg-outline-variant', isArchived: true,
    expandContent: (
      <div className="p-4 bg-surface-container-lowest border-t border-outline-variant">
        <p className="text-[14px] text-on-surface-variant">Standard automated maintenance task. All TLS certificates for internal services were successfully rotated. No manual intervention required.</p>
      </div>
    ),
  },
]

function InvestigationHistoryRow({ inv }: { inv: InvestigationRow }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className={`group relative rounded-xl border overflow-hidden transition-all ml-10
      ${inv.isRunning
        ? 'bg-white/50 backdrop-blur-sm border-2 border-primary/20 shadow-lg'
        : inv.isArchived
          ? 'bg-white border-outline-variant opacity-70 hover:opacity-100'
          : 'bg-white border-outline-variant hover:border-primary/30 shadow-sm'
      }
    `}>
      {/* Timeline dot */}
      <div className={`absolute left-[-26px] top-6 w-3 h-3 rounded-full border-4 border-surface ring-4 z-10
        ${inv.dotColor} ${inv.isRunning ? 'animate-pulse ring-primary/20' : 'ring-outline-variant/20'}
      `}></div>

      {/* Running shimmer bar */}
      {inv.isRunning && (
        <div className="absolute inset-x-0 top-0 h-1 overflow-hidden">
          <div className="h-full bg-primary shimmer w-1/3"></div>
        </div>
      )}

      {/* Row Header */}
      <div className="flex items-center justify-between p-4 cursor-pointer select-none" onClick={() => setExpanded(v => !v)}>
        <div className="flex items-center gap-6 flex-1">
          <div className="flex flex-col items-center justify-center min-w-[64px]">
            {inv.isNow ? (
              <>
                <span className="text-[11px] font-semibold text-primary uppercase tracking-wider">Active</span>
                <span className="text-2xl font-extrabold text-primary">Now</span>
              </>
            ) : (
              <>
                <span className="text-[11px] font-semibold text-outline uppercase">{inv.month}</span>
                <span className="text-2xl font-bold text-on-surface">{inv.day}</span>
              </>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-widest uppercase ${inv.severityColor}`}>
                {inv.severity}
              </span>
              <span className="text-[12px] text-on-surface-variant">ID: {inv.id}</span>
            </div>
            <h3 className={`text-[16px] font-semibold ${inv.isArchived ? 'text-on-surface-variant font-medium' : 'text-on-surface'}`}>
              {inv.title}
            </h3>
          </div>
          <div className="hidden md:flex flex-col items-end gap-1 px-6">
            <span className={`flex items-center gap-1 font-bold text-[12px] ${inv.statusColor}`}>
              <span className={`material-symbols-outlined text-[14px] ${inv.status === 'Running' ? 'animate-spin' : ''}`}>
                {inv.statusIcon}
              </span>
              {inv.status}
            </span>
            <span className="text-[12px] text-outline">{inv.elapsed}</span>
          </div>
        </div>
        <span className={`material-symbols-outlined text-outline transition-transform ${expanded ? 'rotate-180' : ''}`}>
          expand_more
        </span>
      </div>

      {/* Expandable Content */}
      {expanded && <div>{inv.expandContent}</div>}
    </div>
  )
}

export default function InvestigationHistoryPage() {
  return (
    <div className="flex-1 flex flex-col overflow-hidden relative">
      <div className="ambient-glow absolute bg-primary w-[400px] h-[400px] top-[-200px] right-[-100px]"></div>

      {/* Content Canvas */}
      <div className="flex-1 overflow-y-auto px-6 py-6 max-w-[1440px] mx-auto w-full">
        {/* Page Header */}
        <section className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-[30px] font-semibold leading-[38px] tracking-tight text-on-surface">Investigation History</h1>
            <p className="text-[16px] text-on-surface-variant">Review and audit all past security and data integrity investigations.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 bg-white border border-outline-variant px-3 py-1.5 rounded-lg shadow-sm">
              <span className="text-[12px] text-outline">Severity:</span>
              <select className="border-none bg-transparent p-0 text-[12px] font-bold focus:ring-0 cursor-pointer outline-none">
                <option>All</option>
                <option>Critical</option>
                <option>High</option>
                <option>Medium</option>
              </select>
            </div>
            <div className="flex items-center gap-2 bg-white border border-outline-variant px-3 py-1.5 rounded-lg shadow-sm">
              <span className="text-[12px] text-outline">Status:</span>
              <select className="border-none bg-transparent p-0 text-[12px] font-bold focus:ring-0 cursor-pointer outline-none">
                <option>All</option>
                <option>Resolved</option>
                <option>Running</option>
                <option>Archived</option>
              </select>
            </div>
            <div className="flex items-center gap-2 bg-white border border-outline-variant px-3 py-1.5 rounded-lg shadow-sm">
              <span className="text-[12px] text-outline">Date:</span>
              <span className="text-[12px] font-bold">Last 30 Days</span>
              <span className="material-symbols-outlined text-[16px]">calendar_today</span>
            </div>
          </div>
        </section>

        {/* Timeline List */}
        <div className="relative">
          <div className="absolute left-[20px] top-0 bottom-0 w-[2px] bg-surface-container-highest"></div>
          <div className="space-y-4">
            {investigations.map(inv => (
              <InvestigationHistoryRow key={inv.id} inv={inv} />
            ))}
          </div>
        </div>

        {/* Load More */}
        <div className="mt-12 flex flex-col items-center gap-4 pb-12">
          <button className="px-6 py-2 rounded-full border border-outline-variant text-[14px] font-semibold hover:bg-surface-container transition-all flex items-center gap-2">
            Load More Investigations
            <span className="material-symbols-outlined">expand_more</span>
          </button>
          <p className="text-[12px] text-outline">Showing 15 of 2,492 entries</p>
        </div>
      </div>

      {/* Footer AI Context */}
      <div className="px-6 py-2 bg-surface-container-low border-t border-outline-variant flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-tertiary rounded-full animate-pulse"></div>
          <span className="text-[11px] font-medium text-on-surface-variant uppercase tracking-wider">System Integrity: 99.8%</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[11px] text-outline">Avenor Knowledge Graph V4.2</span>
          <span className="text-[11px] text-outline">Last Sync: 2m ago</span>
        </div>
      </div>
    </div>
  )
}
