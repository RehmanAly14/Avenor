import { Link } from 'react-router-dom'
import { useState, useRef } from 'react'

// Pro version reuses same nodes but with a side drawer always open and radar minimap
const nodes = [
  { id: 'ltv', label: 'Customer LTV', sublabel: 'Primary Revenue Metric', type: 'ENTITY', typeColor: 'text-primary', icon: 'dataset', x: 200, y: 200, isPrimary: true },
  { id: 'sub', label: 'Subscription Data', sublabel: 'Snowflake :: RAW_DB', type: 'SOURCE', typeColor: 'text-secondary', icon: 'table_chart', x: 480, y: 80 },
  { id: 'churn', label: 'Churn Analysis', sublabel: 'DBT :: PROD_MODEL', type: 'MODEL', typeColor: 'text-tertiary', icon: 'analytics', x: 480, y: 360 },
  { id: 'mktg', label: 'Marketing Retention', sublabel: 'Campaign Activation', type: 'IMPACT', typeColor: 'text-error', icon: 'campaign', x: 720, y: 310 },
  { id: 'exec', label: 'Exec Dashboard', sublabel: 'Tableau :: FINANCE', type: 'DASHBOARD', typeColor: 'text-primary', icon: 'monitoring', x: 720, y: 410 },
]

const edges = [
  { from: { x: 348, y: 240 }, to: { x: 480, y: 120 } },
  { from: { x: 348, y: 240 }, to: { x: 480, y: 400 } },
  { from: { x: 624, y: 400 }, to: { x: 720, y: 350 } },
  { from: { x: 624, y: 400 }, to: { x: 720, y: 450 } },
]

export default function KnowledgeGraphProPage() {
  const [activeTab, setActiveTab] = useState('lineage')
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  // Zoom controls
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 2))
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.5))
  const handleCenter = () => {
    setOffset({ x: 0, y: 0 })
    setZoom(1)
  }

  // Panning
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsPanning(true)
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y })
  }
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y })
    }
  }
  const handleMouseUp = () => setIsPanning(false)

  // Get node position with zoom & pan
  const getNodeStyle = (node: typeof nodes[0]) => ({
    left: node.x * zoom + offset.x,
    top: node.y * zoom + offset.y,
    transform: `scale(${zoom})`,
    transformOrigin: 'top left',
  })

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      {/* Graph Canvas */}
      <div
        ref={containerRef}
        className="flex-1 relative bg-surface overflow-hidden cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* SVG Edges */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
          {edges.map((e, i) => {
            const fromX = e.from.x * zoom + offset.x
            const fromY = e.from.y * zoom + offset.y
            const toX = e.to.x * zoom + offset.x
            const toY = e.to.y * zoom + offset.y
            const midX = (fromX + toX) / 2
            return (
              <path
                key={i}
                d={`M${fromX},${fromY} C${midX},${fromY} ${midX},${toY} ${toX},${toY}`}
                className="stroke-primary/30 fill-none flow-line"
                strokeWidth="2"
              />
            )
          })}
        </svg>

        {/* Nodes */}
        {nodes.map(node => {
          const style = getNodeStyle(node)
          return (
            <div
              key={node.id}
              className={`absolute p-4 rounded-xl cursor-pointer shadow-md z-10 transition-all hover:-translate-y-1 hover:shadow-lg
                ${node.isPrimary
                  ? 'bg-surface-container-lowest border-2 border-primary w-48 shadow-lg glow-pulse'
                  : 'bg-surface-container-lowest border border-outline-variant w-44'
                }
              `}
              style={{ left: style.left, top: style.top }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className={`material-symbols-outlined ${node.typeColor}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                  {node.icon}
                </span>
                <span className={`text-[11px] font-semibold tracking-wider uppercase ${node.typeColor}`}>{node.type}</span>
              </div>
              <h3 className="text-[12px] font-bold mb-1 text-on-surface">{node.label}</h3>
              <p className="text-[10px] text-on-surface-variant leading-tight">{node.sublabel}</p>
            </div>
          )
        })}

        {/* Bottom Controls */}
        <div className="absolute bottom-8 left-8 flex flex-col gap-2 z-30">
          <div className="bg-surface-container-lowest shadow-xl border border-outline-variant rounded-xl p-1 flex flex-col gap-1">
            <button onClick={handleZoomIn} className="w-10 h-10 flex items-center justify-center hover:bg-surface-container-low rounded-lg transition-colors text-on-surface-variant">
              <span className="material-symbols-outlined">add</span>
            </button>
            <button onClick={handleZoomOut} className="w-10 h-10 flex items-center justify-center hover:bg-surface-container-low rounded-lg transition-colors text-on-surface-variant">
              <span className="material-symbols-outlined">remove</span>
            </button>
            <div className="h-[1px] bg-outline-variant mx-2"></div>
            <button onClick={handleCenter} className="w-10 h-10 flex items-center justify-center hover:bg-surface-container-low rounded-lg transition-colors text-on-surface-variant">
              <span className="material-symbols-outlined">center_focus_strong</span>
            </button>
          </div>
        </div>

        {/* Radar Mini-Map */}
        <div className="absolute bottom-8 right-8 w-48 h-32 bg-surface-container-lowest/90 backdrop-blur shadow-xl border border-outline-variant rounded-xl overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-surface opacity-40"></div>
          <div className="absolute top-2 left-2 w-4 h-2 bg-primary rounded-sm"></div>
          <div className="absolute top-6 left-8 w-4 h-2 bg-secondary rounded-sm"></div>
          <div className="absolute top-12 left-24 w-4 h-2 bg-tertiary rounded-sm"></div>
          <div className="absolute top-4 left-4 w-16 h-12 border-2 border-primary ring-4 ring-primary/10 rounded"></div>
          <div className="absolute bottom-2 left-2 text-[9px] text-on-surface-variant font-semibold uppercase">Viewport</div>
        </div>

        {/* Link to basic */}
        <Link
          to="/knowledge-graph"
          className="absolute top-4 left-4 bg-surface-container-lowest/90 shadow border border-outline-variant rounded-xl px-4 py-2 flex items-center gap-2 text-[12px] text-on-surface-variant hover:bg-surface-container-low transition-colors z-10"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Basic View
        </Link>
      </div>

      {/* Side Metadata Drawer (always open in Pro) */}
      <div className="w-[360px] bg-surface-container-lowest border-l border-outline-variant shadow-2xl flex flex-col overflow-hidden shrink-0">
        {/* Drawer Header */}
        <div className="p-6 border-b border-outline-variant">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 bg-primary-fixed text-on-primary-fixed text-[10px] font-semibold rounded uppercase">Verified Asset</span>
            <span className="text-on-surface-variant text-[12px]">• ID: 49201-B</span>
          </div>
          <h2 className="text-2xl font-medium text-on-surface">Customer LTV</h2>
          <p className="text-[14px] text-on-surface-variant mt-1">Primary Revenue Metric</p>
        </div>

        {/* Tabs */}
        <div className="border-b border-outline-variant">
          <div className="flex">
            {['lineage', 'schema', 'usage'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 px-4 py-3 text-[12px] font-medium capitalize transition-colors
                  ${activeTab === tab ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'lineage' && (
            <>
              {/* Data Lineage */}
              <section>
                <h3 className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-4">Data Lineage</h3>
                <div className="relative pl-6 space-y-6">
                  <div className="absolute left-[7px] top-2 bottom-2 w-px bg-outline-variant"></div>
                  {[
                    { color: 'bg-secondary', title: 'Snowflake', desc: 'Ingested via Airbyte Sync' },
                    { color: 'bg-tertiary', title: 'dbt Transformation', desc: 'stg_payments -> fct_ltv' },
                    { color: 'bg-primary', title: 'Current Asset', desc: 'Aggregated Metric', primary: true },
                  ].map(item => (
                    <div key={item.title} className="relative">
                      <div className={`absolute -left-[23px] top-1 w-4 h-4 rounded-full ${item.color} border-2 border-surface-container-lowest`}></div>
                      <p className={`text-[12px] font-bold ${item.primary ? 'text-primary' : ''}`}>{item.title}</p>
                      <p className="text-[14px] text-on-surface-variant">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </section>
              {/* Impact Analysis */}
              <section>
                <h3 className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-4">Downstream Impact</h3>
                <div className="space-y-2">
                  {[
                    { name: 'Executive Dashboard', risk: 'High', color: 'text-error' },
                    { name: 'Marketing Campaigns', risk: 'Medium', color: 'text-secondary' },
                    { name: 'Churn Model V3', risk: 'Low', color: 'text-tertiary' },
                  ].map(item => (
                    <div key={item.name} className="flex items-center justify-between p-3 bg-surface rounded-lg border border-outline-variant">
                      <span className="text-[14px] text-on-surface">{item.name}</span>
                      <span className={`text-[11px] font-bold ${item.color}`}>{item.risk}</span>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}
          {activeTab === 'schema' && (
            <div className="space-y-2">
              {[
                { name: 'customer_id', type: 'UUID' },
                { name: 'total_revenue', type: 'DECIMAL' },
                { name: 'signup_date', type: 'TIMESTAMP' },
                { name: 'region', type: 'STRING' },
                { name: 'plan_tier', type: 'ENUM' },
              ].map(field => (
                <div key={field.name} className="flex justify-between items-center p-3 bg-surface rounded-lg border border-outline-variant">
                  <span className="text-[14px] font-medium">{field.name}</span>
                  <span className="text-[11px] px-2 py-0.5 bg-surface-container-highest rounded text-on-surface-variant">{field.type}</span>
                </div>
              ))}
            </div>
          )}
          {activeTab === 'usage' && (
            <div className="space-y-4">
              <div className="p-4 bg-surface rounded-lg border border-outline-variant">
                <p className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-2">Query Frequency</p>
                <p className="text-2xl font-bold text-primary">2,412</p>
                <p className="text-[12px] text-on-surface-variant">queries in last 30 days</p>
              </div>
              <div className="p-4 bg-surface rounded-lg border border-outline-variant">
                <p className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-2">Top Consumers</p>
                <div className="space-y-2 mt-2">
                  {['Tableau Prod', 'Airflow DAG #12', 'Looker Report'].map(c => (
                    <div key={c} className="flex items-center gap-2 text-[14px]">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      {c}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-outline-variant flex gap-2">
          <button className="flex-1 px-4 py-2 border border-outline-variant rounded-lg text-[12px] font-bold hover:bg-surface-container transition-all">
            View Full Lineage
          </button>
          <button className="flex-1 px-4 py-2 bg-primary text-on-primary rounded-lg text-[12px] font-bold hover:opacity-90 transition-all">
            Investigate
          </button>
        </div>
      </div>
    </div>
  )
}