import { useEffect, useRef, useState } from 'react'

function RiskGauge({ pct, label, color }: { pct: number; label: string; color: string }) {
  const pathRef = useRef<SVGPathElement>(null)
  const totalLen = 251.32

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (pathRef.current) {
        pathRef.current.style.strokeDashoffset = String(totalLen * (1 - pct / 100))
      }
    }, 600)
    return () => clearTimeout(timeout)
  }, [pct])

  return (
    <div className="relative w-28 xs:w-32 sm:w-40 md:w-48 h-18 xs:h-20 sm:h-24 mb-2 mx-auto">
      <svg className="w-full h-full overflow-visible" viewBox="0 0 100 50">
        <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#E8EDF2" strokeLinecap="round" strokeWidth="12"/>
        <path d="M 60 18 A 40 40 0 0 1 90 50" fill="none" stroke={color} opacity="0.1" strokeWidth="12"/>
        <path
          ref={pathRef}
          d="M 10 50 A 40 40 0 0 1 90 50"
          fill="none"
          stroke={color}
          strokeLinecap="round"
          strokeWidth="12"
          strokeDasharray={totalLen}
          strokeDashoffset={totalLen}
          style={{ transition: 'stroke-dashoffset 1.2s ease-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
        <span className="text-xl xs:text-2xl sm:text-[28px] font-extrabold leading-none" style={{ color }}>{pct}%</span>
        <span className="text-[9px] xs:text-[10px] sm:text-[11px] font-bold uppercase tracking-wider" style={{ color }}>{label}</span>
      </div>
    </div>
  )
}

export default function ImpactStudioPage() {
  return (
    <div className="overflow-y-auto p-3 xs:p-4 sm:p-6 min-h-full relative">
      {/* Atmospheric glows - hidden on mobile */}
      <div className="hidden sm:block fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-1/4 right-0 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-primary/5 rounded-full blur-[120px] opacity-40"></div>
        <div className="absolute bottom-0 left-1/4 w-[400px] md:w-[600px] h-[400px] md:h-[600px] bg-error/5 rounded-full blur-[160px] opacity-20"></div>
      </div>

      <div className="max-w-[1440px] mx-auto">
        {/* Header - Mobile First */}
        <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-3 xs:gap-4 mb-6 sm:mb-8 md:mb-12">
          <div>
            <h2 className="text-xl xs:text-2xl sm:text-[30px] font-semibold leading-[1.2] tracking-tight text-on-surface mb-0.5 sm:mb-1">Impact Analysis</h2>
            <p className="text-xs sm:text-sm md:text-[16px] text-on-surface-variant">
              Reviewing blast radius for <code className="bg-error-container text-on-error-container px-1.5 py-0.5 rounded font-mono text-[10px] sm:text-xs md:text-sm">customer_orders</code> deletion.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 xs:gap-3 md:gap-4 shrink-0">
            <button className="px-3 xs:px-4 md:px-6 py-1.5 xs:py-2 rounded-lg bg-surface border border-outline-variant text-on-surface text-[10px] xs:text-[11px] md:text-[12px] font-medium hover:bg-surface-container transition-all">
              Cancel
            </button>
            <button className="px-3 xs:px-4 md:px-6 py-1.5 xs:py-2 rounded-lg bg-error text-on-error text-[10px] xs:text-[11px] md:text-[12px] font-medium hover:opacity-90 transition-all shadow-lg">
              Delete
            </button>
          </div>
        </div>

        {/* Grid - Mobile First */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 xs:gap-4 md:gap-6">
          {/* Risk Meter */}
          <div className="md:col-span-4 bg-white border border-outline-variant rounded-xl p-4 xs:p-5 md:p-6 shadow-sm flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 shimmer-bar bg-gradient-to-r from-transparent via-error/30 to-transparent"></div>
            <span className="text-[9px] xs:text-[10px] md:text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-3 xs:mb-4 md:mb-6">Systemic Risk Score</span>
            <RiskGauge pct={84} label="CRITICAL" color="#ba1a1a" />
            <p className="text-center text-xs xs:text-sm md:text-[14px] text-on-surface-variant max-w-[180px] xs:max-w-[200px] mt-3 xs:mt-4">
              High probability of operational failure in 12 downstream dependencies.
            </p>
          </div>

          {/* Flow Map */}
          <div className="md:col-span-8 bg-white border border-outline-variant rounded-xl p-4 xs:p-5 md:p-6 shadow-sm flex flex-col">
            <div className="flex flex-wrap justify-between items-center gap-2 xs:gap-3 mb-3 xs:mb-4 md:mb-6">
              <span className="text-[9px] xs:text-[10px] md:text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">Impact Flow Map</span>
              <div className="flex flex-wrap gap-2 xs:gap-3 md:gap-4">
                <span className="flex items-center gap-1 text-[10px] xs:text-[11px] md:text-[12px] text-on-surface-variant">
                  <span className="w-1.5 xs:w-2 h-1.5 xs:h-2 rounded-full bg-error"></span> Broken
                </span>
                <span className="flex items-center gap-1 text-[10px] xs:text-[11px] md:text-[12px] text-on-surface-variant">
                  <span className="w-1.5 xs:w-2 h-1.5 xs:h-2 rounded-full bg-tertiary"></span> Stable
                </span>
              </div>
            </div>
            <div className="flex-1 min-h-[180px] xs:min-h-[220px] sm:min-h-[260px] md:min-h-[280px] relative overflow-x-auto">
              <svg className="w-full h-full min-w-[450px] xs:min-w-[500px] md:min-w-0" preserveAspectRatio="xMidYMid meet">
                {/* Connection Lines */}
                <path className="flow-line opacity-30" d="M 100 140 C 200 140, 250 75, 390 75" fill="none" stroke="#ba1a1a" strokeWidth="2"/>
                <path className="flow-line opacity-30" d="M 100 140 C 200 140, 250 140, 390 140" fill="none" stroke="#ba1a1a" strokeWidth="2"/>
                <path className="opacity-20" d="M 100 140 C 200 140, 250 205, 390 205" fill="none" stroke="#737686" strokeWidth="1"/>
                {/* Source Node */}
                <g transform="translate(40, 120)">
                  <rect fill="#ffdad6" height="40" rx="8" stroke="#ba1a1a" strokeWidth="1" width="120"/>
                  <text fill="#410002" fontSize="12" fontWeight="600" textAnchor="middle" x="60" y="25">customer_orders</text>
                </g>
                {/* Destination Nodes */}
                <g transform="translate(390, 55)">
                  <rect fill="#ffffff" height="40" rx="8" stroke="#ba1a1a" strokeWidth="2" width="140"/>
                  <circle cx="18" cy="20" fill="#ba1a1a" r="4"/>
                  <text fill="#141b2b" fontSize="11" textAnchor="middle" x="80" y="25">Revenue Dash v2</text>
                </g>
                <g transform="translate(390, 120)">
                  <rect fill="#ffffff" height="40" rx="8" stroke="#ba1a1a" strokeWidth="2" width="140"/>
                  <circle cx="18" cy="20" fill="#ba1a1a" r="4"/>
                  <text fill="#141b2b" fontSize="11" textAnchor="middle" x="80" y="25">Churn Predictor ML</text>
                </g>
                <g transform="translate(390, 185)">
                  <rect fill="#ffffff" height="40" rx="8" stroke="#c3c6d7" strokeWidth="1" width="140"/>
                  <circle cx="18" cy="20" fill="#737686" r="4"/>
                  <text fill="#434655" fontSize="11" textAnchor="middle" x="80" y="25">Legal Archive S3</text>
                </g>
              </svg>
            </div>
          </div>

          {/* AI Recommendations - Mobile First */}
          <div className="col-span-1 bg-white border border-outline-variant rounded-xl p-4 xs:p-5 md:p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-3 xs:mb-4 md:mb-6">
              <span className="material-symbols-outlined text-primary text-[16px] xs:text-[18px] md:text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              <span className="text-[9px] xs:text-[10px] md:text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">AI Recommendations</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 xs:gap-4 md:gap-6">
              {/* Recommended */}
              <div className="p-3 xs:p-4 rounded-xl bg-surface-container-low border border-primary/20 hover:border-primary transition-all cursor-pointer group">
                <div className="flex justify-between mb-1 xs:mb-2">
                  <span className="text-[10px] xs:text-[11px] md:text-[12px] text-primary font-bold">Recommended</span>
                  <span className="material-symbols-outlined text-primary text-[14px] xs:text-[16px] md:text-[18px]">check_circle</span>
                </div>
                <h4 className="text-[13px] xs:text-[14px] md:text-[16px] font-bold text-on-surface mb-1 xs:mb-2">Deprecate & Archive</h4>
                <p className="text-[11px] xs:text-[12px] md:text-[14px] text-on-surface-variant">Mark table as read-only. Redirect queries to <code className="bg-surface-container px-1 rounded text-[10px] xs:text-[11px] md:text-[12px]">orders_v3_master</code>.</p>
                <div className="mt-3 xs:mt-4 flex items-center justify-between text-primary text-[10px] xs:text-[11px] md:text-[12px] font-medium">
                  <span>Generate Script</span>
                  <span className="material-symbols-outlined text-[12px] xs:text-[14px] md:text-[16px]">arrow_forward</span>
                </div>
              </div>
              {/* Soft Delete */}
              <div className="p-3 xs:p-4 rounded-xl border border-outline-variant hover:border-primary/40 transition-all cursor-pointer">
                <h4 className="text-[13px] xs:text-[14px] md:text-[16px] font-bold text-on-surface mb-1 xs:mb-2">Soft Delete</h4>
                <p className="text-[11px] xs:text-[12px] md:text-[14px] text-on-surface-variant">Update with <code className="bg-surface-container px-1 rounded text-[10px] xs:text-[11px] md:text-[12px]">is_deleted=TRUE</code> flag.</p>
                <div className="mt-3 xs:mt-4 flex items-center justify-between text-on-surface-variant text-[10px] xs:text-[11px] md:text-[12px] font-medium">
                  <span>Configure</span>
                  <span className="material-symbols-outlined text-[12px] xs:text-[14px] md:text-[16px]">settings</span>
                </div>
              </div>
              {/* Force Purge */}
              <div className="p-3 xs:p-4 rounded-xl border border-dashed border-outline-variant bg-error/5 hover:bg-error/10 transition-all cursor-pointer">
                <h4 className="text-[13px] xs:text-[14px] md:text-[16px] font-bold text-error mb-1 xs:mb-2">Force Purge</h4>
                <p className="text-[11px] xs:text-[12px] md:text-[14px] text-on-surface-variant">Permanent deletion. Re-point 8 failing models.</p>
                <div className="mt-3 xs:mt-4 flex items-center justify-between text-error text-[10px] xs:text-[11px] md:text-[12px] font-medium">
                  <span>Proceed</span>
                  <span className="material-symbols-outlined text-[12px] xs:text-[14px] md:text-[16px]">warning</span>
                </div>
              </div>
            </div>
          </div>

          {/* Incident Warning - Mobile First */}
          <div className="col-span-1 bg-inverse-surface text-inverse-on-surface rounded-xl p-4 xs:p-5 md:p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 md:gap-6">
            <div className="flex items-start sm:items-center gap-3 xs:gap-4 md:gap-6">
              <div className="w-10 h-10 xs:w-12 xs:h-12 rounded-full bg-error flex items-center justify-center animate-pulse flex-shrink-0">
                <span className="material-symbols-outlined text-white text-[16px] xs:text-[18px] md:text-[24px]">priority_high</span>
              </div>
              <div>
                <h3 className="text-base xs:text-lg sm:text-xl md:text-2xl font-medium mb-0.5">Impact Warning</h3>
                <p className="text-xs xs:text-sm md:text-[16px] opacity-80">"Q4 Revenue Review" dashboard will lose 100% data.</p>
              </div>
            </div>
            <button className="px-4 xs:px-5 md:px-6 py-2 xs:py-2.5 md:py-3 rounded-xl bg-white text-on-surface font-bold hover:bg-inverse-on-surface transition-all w-full sm:w-auto text-center text-xs xs:text-sm md:text-base">
              Notify Team
            </button>
          </div>
        </div>
      </div>

      {/* Floating AI Prompt - Mobile First */}
      <div className="fixed bottom-3 xs:bottom-4 md:bottom-8 left-1/2 -translate-x-1/2 w-[calc(100%-1.5rem)] xs:w-[calc(100%-2rem)] md:w-full max-w-xl z-50">
        <div className="bg-surface shadow-2xl border border-outline-variant rounded-full py-2 xs:py-2.5 md:py-3 px-3 xs:px-4 md:px-6 flex flex-wrap items-center gap-1.5 xs:gap-2 md:gap-4 backdrop-blur-xl">
          <span className="material-symbols-outlined text-primary text-[16px] xs:text-[18px] md:text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>spark</span>
          <span className="text-[10px] xs:text-[11px] sm:text-[12px] md:text-[14px] text-on-surface-variant flex-1 min-w-[80px] xs:min-w-[100px]">Avenor AI monitoring impact.</span>
          <div className="flex items-center gap-1 xs:gap-1.5 md:gap-2">
            <button className="text-[9px] xs:text-[10px] md:text-[12px] text-primary font-bold px-1.5 xs:px-2 md:px-3 py-0.5 xs:py-1 hover:bg-primary/5 rounded-full transition-all">Fix</button>
            <div className="w-[1px] h-3 xs:h-3.5 md:h-4 bg-outline-variant"></div>
            <button className="material-symbols-outlined text-on-surface-variant text-[14px] xs:text-[16px] md:text-[20px]">close</button>
          </div>
        </div>
      </div>
    </div>
  )
}