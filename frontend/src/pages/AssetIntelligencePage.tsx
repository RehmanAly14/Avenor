import { useState } from 'react'

const schemaColumns = [
  { name: 'order_id', type: 'UUID', icon: 'key', desc: 'Unique identifier for each transaction.', quality: '100% Valid', qualityColor: 'text-tertiary', qualityDot: 'bg-tertiary', warning: false },
  { name: 'customer_email', type: 'STRING', icon: 'alternate_email', desc: 'PII: Obfuscated in lower environments.', quality: '99.8% Valid', qualityColor: 'text-tertiary', qualityDot: 'bg-tertiary', warning: false },
  { name: 'order_total', type: 'DECIMAL', icon: 'payments', desc: 'Gross order value before tax & shipping.', quality: 'Warning', qualityColor: 'text-error', qualityDot: 'bg-error', warning: true },
  { name: 'status', type: 'ENUM', icon: 'list', desc: "Values: 'pending', 'shipped', 'cancelled'.", quality: '100% Valid', qualityColor: 'text-tertiary', qualityDot: 'bg-tertiary', warning: false },
]

const tabs = ['Overview', 'Schema', 'Lineage', 'Usage', 'Quality']

export default function AssetIntelligencePage() {
  const [activeTab, setActiveTab] = useState('Schema')

  // Handle tab click
  const handleTabClick = (tab: string) => {
    setActiveTab(tab)
  }

  return (
    <div className="p-4 md:p-6 overflow-auto min-h-full">
      <div className="max-w-[1440px] mx-auto">
        {/* Asset Header */}
        <section className="flex flex-col lg:flex-row justify-between items-start gap-4 md:gap-6 mb-8 md:mb-12">
          <div className="flex-1 w-full">
            {/* Breadcrumb - Responsive */}
            <nav className="flex items-center gap-1 md:gap-2 text-[11px] md:text-[12px] text-on-surface-variant mb-2 overflow-x-auto whitespace-nowrap">
              <span>warehouse</span>
              <span className="material-symbols-outlined text-[14px] md:text-[16px]">chevron_right</span>
              <span>e-commerce</span>
              <span className="material-symbols-outlined text-[14px] md:text-[16px]">chevron_right</span>
              <span className="text-on-surface font-medium">customer_orders</span>
            </nav>
            <div className="flex flex-wrap items-center gap-2 md:gap-4">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-on-surface tracking-tight leading-none">customer_orders</h1>
              <span className="px-2 py-1 bg-surface-container-high text-on-surface-variant text-[10px] md:text-[11px] font-semibold rounded uppercase tracking-wider">S3_BUCKET</span>
            </div>
            <p className="text-sm md:text-base text-on-surface-variant mt-2 max-w-2xl">
              Primary transactional record of completed customer orders including fulfillment status, payment details, and regional identifiers. Synchronized from Production DB every 15 minutes.
            </p>
            <div className="flex flex-wrap items-center gap-3 md:gap-6 mt-3 md:mt-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-primary-fixed overflow-hidden">
                  <img 
                    className="w-full h-full object-cover" 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBi9w2n_401chdzE5rRXQGcBMEWIoSeLNXOx9vsKnZL_Zo5RNRMQbEXPtCFdPEOdHnoQqOcL56HyVja5n15GmRhFs-46_-0fjXdh8MtrNcE4L-sAzEJLE2ZUkedx2FSWAC-NPKP8XSKzlzX_GXi7WwGMsReFBadVcayozy_fEFfWEadsj8t-4J_m0X7UWXdXsHJesgCGsqftMgvwl5fMorZHIkZYwvoyWlvVoyVxXYXpdxlazsdJMhn" 
                    alt="Sarah Chen" 
                  />
                </div>
                <span className="text-[11px] md:text-[12px] text-on-surface-variant">Owner: <strong>Sarah Chen</strong></span>
              </div>
              <div className="flex items-center gap-2 text-on-surface-variant">
                <span className="material-symbols-outlined text-[16px] md:text-[18px]">update</span>
                <span className="text-[11px] md:text-[12px]">Last updated 12m ago</span>
              </div>
            </div>
          </div>

          {/* Health Score Hero - Responsive */}
          <div className="flex items-center gap-3 md:gap-4 bg-white p-3 md:p-4 rounded-xl border border-outline-variant/30 shadow-sm pulse-glow shrink-0 w-full sm:w-auto">
            <div className="relative w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90">
                <circle className="text-surface-container-low" cx="50%" cy="50%" fill="transparent" r="42%" stroke="currentColor" strokeWidth="6"/>
                <circle className="text-primary transition-all duration-1000" cx="50%" cy="50%" fill="transparent" r="42%" stroke="currentColor" strokeDasharray="263" strokeDashoffset="26" strokeWidth="6"/>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl md:text-3xl font-extrabold text-on-surface leading-none">94</span>
                <span className="text-[8px] md:text-[10px] text-on-surface-variant uppercase tracking-wider">HEALTH</span>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] md:text-[12px] font-bold text-on-surface">Asset Integrity</span>
              <div className="flex items-center gap-1 text-tertiary mt-1">
                <span className="material-symbols-outlined text-[14px] md:text-[16px]">trending_up</span>
                <span className="text-[11px] md:text-[12px]">+2.4% vs last week</span>
              </div>
              <button className="mt-1 md:mt-2 text-primary text-[11px] md:text-[12px] hover:underline flex items-center gap-1">
                View alerts (3)
              </button>
            </div>
          </div>
        </section>

        {/* Tabs + Body */}
        <div className="flex flex-col lg:flex-row gap-4 md:gap-6">
          <div className="flex-1 min-w-0">
            {/* Tab Bar - Responsive */}
            <div className="border-b border-outline-variant/30 mb-4 md:mb-6 overflow-x-auto">
              <div className="flex gap-3 md:gap-6 min-w-max">
                {tabs.map(tab => (
                  <button
                    key={tab}
                    onClick={() => handleTabClick(tab)}
                    className={`px-1 py-2 md:py-3 text-[11px] md:text-[12px] font-medium border-b-2 transition-colors flex items-center gap-1 md:gap-2 whitespace-nowrap
                      ${activeTab === tab ? 'text-primary border-primary font-bold' : 'text-on-surface-variant border-transparent hover:text-on-surface'}
                    `}
                  >
                    {tab}
                    {tab === 'Quality' && <span className="bg-primary-container text-on-primary-container text-[9px] md:text-[10px] px-1.5 py-0.5 rounded-full">4</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* AI Insight Bar - Responsive */}
            <div className="bg-primary/5 rounded-lg p-3 md:p-4 border-l-4 border-primary mb-4 md:mb-6 relative overflow-hidden">
              <div className="flex items-start gap-2 md:gap-3 relative z-10">
                <span className="material-symbols-outlined text-primary text-[18px] md:text-[20px]">auto_awesome</span>
                <div>
                  <h4 className="text-[11px] md:text-[12px] font-bold text-on-surface">AI Schema Insight</h4>
                  <p className="text-xs md:text-sm text-on-surface-variant mt-1">
                    I've detected a mismatch between <code className="bg-surface-container px-1 rounded text-[11px] md:text-[12px]">order_total</code> and <code className="bg-surface-container px-1 rounded text-[11px] md:text-[12px]">tax_amount</code> calculations in 0.4% of rows. Recommended check on the pricing engine downstream.
                  </p>
                </div>
              </div>
            </div>

            {/* Schema Table - Fully Responsive */}
            <div className="bg-white rounded-xl border border-outline-variant/30 shadow-sm overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant/30">
                    {['COLUMN NAME', 'TYPE', 'DESCRIPTION', 'QUALITY', ''].map(h => (
                      <th key={h} className="px-3 md:px-4 py-3 md:py-4 text-[10px] md:text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {schemaColumns.map(col => (
                    <tr key={col.name} className="hover:bg-surface-container-lowest transition-colors">
                      <td className="px-3 md:px-4 py-3 md:py-4 text-[11px] md:text-[12px] font-bold text-on-surface whitespace-nowrap">{col.name}</td>
                      <td className="px-3 md:px-4 py-3 md:py-4">
                        <div className="flex items-center gap-1 md:gap-2 px-1.5 md:px-2 py-1 bg-surface-container rounded-md w-fit">
                          <span className="material-symbols-outlined text-[14px] md:text-[16px] text-on-surface-variant">{col.icon}</span>
                          <span className="text-[11px] md:text-[12px] text-on-surface-variant">{col.type}</span>
                        </div>
                      </td>
                      <td className="px-3 md:px-4 py-3 md:py-4 text-xs md:text-sm text-on-surface-variant max-w-[150px] md:max-w-none truncate md:truncate-none">{col.desc}</td>
                      <td className="px-3 md:px-4 py-3 md:py-4">
                        <div className={`flex items-center gap-1.5 ${col.qualityColor}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${col.qualityDot}`}></div>
                          <span className="text-[11px] md:text-[12px] whitespace-nowrap">{col.quality}</span>
                        </div>
                      </td>
                      <td className="px-3 md:px-4 py-3 md:py-4 text-right">
                        <button className="text-on-surface-variant hover:text-on-surface">
                          <span className="material-symbols-outlined text-[18px] md:text-[20px]">more_horiz</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="p-3 md:p-4 bg-surface-container-low/50 flex justify-center border-t border-outline-variant/30">
                <button className="text-primary text-[11px] md:text-[12px] font-bold">Show all 42 columns</button>
              </div>
            </div>
          </div>

          {/* Right Sidebar - Responsive */}
          <aside className="w-full lg:w-[280px] xl:w-[320px] space-y-3 md:space-y-4 shrink-0">
            {/* Dependencies */}
            <div className="bg-white rounded-xl border border-outline-variant/30 shadow-sm p-3 md:p-4">
              <h3 className="text-[11px] md:text-[12px] font-bold text-on-surface mb-3 md:mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] md:text-[18px]">fork_left</span>
                Dependencies
              </h3>
              <div className="space-y-2">
                {[
                  { name: 'raw_orders', type: 'SOURCE TABLE', color: 'text-secondary' },
                  { name: 'payment_transactions', type: 'LOOKUP TABLE', color: 'text-tertiary' },
                  { name: 'product_catalog', type: 'DIMENSION TABLE', color: 'text-primary' },
                ].map(dep => (
                  <div key={dep.name} className="flex items-center justify-between p-2 md:p-3 bg-surface rounded-lg border border-outline-variant hover:border-primary/30 transition-all cursor-pointer">
                    <div>
                      <p className="text-[11px] md:text-[12px] font-bold text-on-surface">{dep.name}</p>
                      <p className={`text-[9px] md:text-[10px] font-semibold uppercase tracking-wider ${dep.color}`}>{dep.type}</p>
                    </div>
                    <span className="material-symbols-outlined text-outline text-[16px] md:text-[18px]">chevron_right</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl border border-outline-variant/30 shadow-sm p-3 md:p-4">
              <h3 className="text-[11px] md:text-[12px] font-bold text-on-surface mb-3 md:mb-4">Quick Actions</h3>
              <div className="space-y-2">
                {[
                  { icon: 'search_check', label: 'Launch Investigation', primary: true },
                  { icon: 'hub', label: 'View in Knowledge Graph' },
                  { icon: 'download', label: 'Export Schema' },
                ].map(action => (
                  <button
                    key={action.label}
                    className={`w-full flex items-center justify-center sm:justify-start gap-2 px-3 md:px-4 py-2 rounded-lg text-[11px] md:text-[12px] font-medium transition-all
                      ${action.primary
                        ? 'bg-primary text-on-primary hover:opacity-90'
                        : 'border border-outline-variant hover:bg-surface-container text-on-surface'
                      }
                    `}
                  >
                    <span className="material-symbols-outlined text-[16px] md:text-[18px]">{action.icon}</span>
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}