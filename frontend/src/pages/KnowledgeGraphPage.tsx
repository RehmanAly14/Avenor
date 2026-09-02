import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'

type GraphNode = {
  id: string
  label: string
  sublabel: string
  type: string
  typeColor: string
  icon: string
  x: number
  y: number
  isPrimary?: boolean
}

const initialNodes: GraphNode[] = [
  { id: 'ltv', label: 'Customer LTV', sublabel: 'Primary Revenue Metric', type: 'ENTITY', typeColor: 'text-primary', icon: 'dataset', x: 300, y: 260, isPrimary: true },
  { id: 'sub', label: 'Subscription Data', sublabel: 'Snowflake :: RAW_DB', type: 'SOURCE', typeColor: 'text-secondary', icon: 'table_chart', x: 580, y: 110 },
  { id: 'churn', label: 'Churn Analysis', sublabel: 'DBT :: PROD_MODEL', type: 'MODEL', typeColor: 'text-tertiary', icon: 'analytics', x: 580, y: 460 },
  { id: 'mktg', label: 'Marketing Retention', sublabel: 'Campaign Activation', type: 'IMPACT', typeColor: 'text-error', icon: 'campaign', x: 870, y: 410 },
  { id: 'exec', label: 'Exec Dashboard', sublabel: 'Tableau :: FINANCE', type: 'DASHBOARD', typeColor: 'text-primary', icon: 'monitoring', x: 870, y: 510 },
]

const edges = [
  { from: { x: 448, y: 300 }, to: { x: 580, y: 150 } },
  { from: { x: 448, y: 300 }, to: { x: 580, y: 500 } },
  { from: { x: 724, y: 500 }, to: { x: 870, y: 450 } },
  { from: { x: 724, y: 500 }, to: { x: 870, y: 530 } },
]

const schemaFields = [
  { name: 'customer_id', type: 'UUID' },
  { name: 'total_revenue', type: 'DECIMAL' },
  { name: 'signup_date', type: 'TIMESTAMP' },
]

const lineageItems = [
  { color: 'bg-secondary', title: 'Snowflake', desc: 'Ingested via Airbyte Sync' },
  { color: 'bg-tertiary', title: 'dbt Transformation', desc: 'stg_payments -> fct_ltv' },
  { color: 'bg-primary', title: 'Current Asset', desc: 'Aggregated Metric', isPrimary: true },
]

export default function KnowledgeGraphPage() {
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const [nodes] = useState<GraphNode[]>(initialNodes)
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [isMobile, setIsMobile] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Handle zoom in/out
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

  // Open node drawer
  const handleNodeClick = (node: GraphNode) => {
    setSelectedNode(node === selectedNode ? null : node)
  }

  // Get node position with zoom & pan
  const getNodeStyle = (node: GraphNode) => ({
    left: node.x * zoom + offset.x,
    top: node.y * zoom + offset.y,
    transform: `scale(${zoom})`,
    transformOrigin: 'top left',
  })

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[calc(100vh-64px)] overflow-hidden bg-surface cursor-grab active:cursor-grabbing"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* SVG Edges */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
        {edges.map((e, i) => (
          <path
            key={i}
            d={`M${e.from.x * zoom + offset.x},${e.from.y * zoom + offset.y} C${((e.from.x + e.to.x) / 2) * zoom + offset.x},${e.from.y * zoom + offset.y} ${((e.from.x + e.to.x) / 2) * zoom + offset.x},${e.to.y * zoom + offset.y} ${e.to.x * zoom + offset.x},${e.to.y * zoom + offset.y}`}
            className="stroke-primary/30 fill-none flow-line"
            strokeWidth="2"
          />
        ))}
      </svg>

      {/* Graph Nodes - Responsive */}
      {nodes.map(node => {
        const style = getNodeStyle(node)
        const isPrimary = node.isPrimary
        return (
          <div
            key={node.id}
            className={`absolute p-3 md:p-4 rounded-xl cursor-pointer shadow-md z-10 transition-all hover:-translate-y-1 hover:shadow-lg
              ${isPrimary
                ? 'bg-surface-container-lowest border-2 border-primary w-36 md:w-48 shadow-lg glow-pulse'
                : 'bg-surface-container-lowest border border-outline-variant w-32 md:w-44'
              }
            `}
            style={{ left: style.left, top: style.top }}
            onClick={() => handleNodeClick(node)}
          >
            {isPrimary && (
              <div className="absolute top-0 left-0 w-full h-1 rounded-t-xl bg-gradient-to-r from-primary/50 via-primary to-primary/50 shimmer"></div>
            )}
            <div className="flex items-center gap-1 md:gap-2 mb-1 md:mb-2">
              <span className={`material-symbols-outlined text-[16px] md:text-[18px] ${node.typeColor}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                {node.icon}
              </span>
              <span className={`text-[9px] md:text-[11px] font-semibold tracking-wider uppercase ${node.typeColor}`}>{node.type}</span>
            </div>
            <h3 className="text-[10px] md:text-[12px] font-bold mb-0.5 md:mb-1 text-on-surface">{node.label}</h3>
            <p className="text-[8px] md:text-[10px] text-on-surface-variant leading-tight">{node.sublabel}</p>
          </div>
        )
      })}

      {/* Zoom Controls - Responsive */}
      <div className="absolute bottom-4 md:bottom-8 left-4 md:left-8 flex flex-col gap-2 z-30">
        <div className="bg-surface-container-lowest shadow-xl border border-outline-variant rounded-xl p-1 flex flex-col gap-1">
          <button onClick={handleZoomIn} className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center hover:bg-surface-container-low rounded-lg transition-colors text-on-surface-variant">
            <span className="material-symbols-outlined text-[18px] md:text-[20px]">add</span>
          </button>
          <button onClick={handleZoomOut} className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center hover:bg-surface-container-low rounded-lg transition-colors text-on-surface-variant">
            <span className="material-symbols-outlined text-[18px] md:text-[20px]">remove</span>
          </button>
          <div className="h-[1px] bg-outline-variant mx-2"></div>
          <button onClick={handleCenter} className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center hover:bg-surface-container-low rounded-lg transition-colors text-on-surface-variant">
            <span className="material-symbols-outlined text-[18px] md:text-[20px]">center_focus_strong</span>
          </button>
        </div>
        <Link
          to="/knowledge-graph/pro"
          className="bg-surface-container-lowest shadow-xl border border-outline-variant rounded-xl px-3 md:px-4 py-1.5 md:py-2 flex items-center gap-1 md:gap-2 text-[10px] md:text-[12px] text-on-surface-variant hover:bg-surface-container-low transition-colors"
        >
          <span className="material-symbols-outlined text-[14px] md:text-[18px]">auto_awesome</span>
          <span className="hidden sm:inline">Graph Pro</span>
          <span className="sm:hidden">Pro</span>
        </Link>
      </div>

      {/* Mini Map - Hidden on mobile */}
      <div className="hidden sm:block absolute bottom-4 md:bottom-8 right-4 md:right-8 w-32 md:w-48 h-20 md:h-32 bg-surface-container-lowest/90 backdrop-blur shadow-xl border border-outline-variant rounded-xl overflow-hidden pointer-events-none">
        <div className="absolute inset-0 opacity-40 bg-surface"></div>
        <div className="absolute top-2 left-2 w-3 h-1.5 md:w-4 md:h-2 bg-primary rounded-sm"></div>
        <div className="absolute top-5 left-6 md:top-6 md:left-8 w-3 h-1.5 md:w-4 md:h-2 bg-secondary rounded-sm"></div>
        <div className="absolute top-9 left-16 md:top-12 md:left-24 w-3 h-1.5 md:w-4 md:h-2 bg-tertiary rounded-sm"></div>
        <div className="absolute top-3 left-3 md:top-4 md:left-4 w-10 h-8 md:w-12 md:h-10 border-2 border-primary ring-4 ring-primary/10 rounded"></div>
      </div>

      {/* Metadata Drawer - Responsive */}
      <div className={`fixed top-16 right-0 h-[calc(100%-4rem)] w-[300px] sm:w-[360px] md:w-[400px] bg-surface-container-lowest border-l border-outline-variant shadow-2xl z-50 flex flex-col drawer-transition ${selectedNode ? 'translate-x-0' : 'translate-x-full'}`}>
        {selectedNode && (
          <>
            <div className="p-4 md:p-6 border-b border-outline-variant flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 bg-primary-fixed text-on-primary-fixed text-[9px] md:text-[10px] font-semibold rounded uppercase">Verified Asset</span>
                  <span className="text-on-surface-variant text-[10px] md:text-[12px]">• ID: 49201-B</span>
                </div>
                <h2 className="text-xl md:text-2xl font-medium text-on-surface">{selectedNode.label}</h2>
              </div>
              <button className="p-2 hover:bg-surface-container rounded-full transition-colors" onClick={() => setSelectedNode(null)}>
                <span className="material-symbols-outlined text-[18px] md:text-[20px]">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6">
              {/* Schema */}
              <section>
                <div className="flex items-center justify-between mb-3 md:mb-4">
                  <h3 className="text-[10px] md:text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Schema Structure</h3>
                  <span className="material-symbols-outlined text-primary text-[18px] md:text-[20px]">schema</span>
                </div>
                <div className="space-y-2">
                  {schemaFields.map(field => (
                    <div key={field.name} className="flex flex-wrap justify-between items-center gap-2 p-2 md:p-3 bg-surface rounded-lg border border-outline-variant">
                      <span className="text-[12px] md:text-[14px] font-medium">{field.name}</span>
                      <span className="text-[10px] md:text-[11px] px-2 py-0.5 bg-surface-container-highest rounded text-on-surface-variant">{field.type}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Lineage */}
              <section>
                <h3 className="text-[10px] md:text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-3 md:mb-4">Data Lineage</h3>
                <div className="relative pl-5 md:pl-6 space-y-4 md:space-y-6">
                  <div className="absolute left-[5px] md:left-[7px] top-2 bottom-2 w-px bg-outline-variant"></div>
                  {lineageItems.map(item => (
                    <div key={item.title} className="relative">
                      <div className={`absolute -left-[18px] md:-left-[23px] top-1 w-3 h-3 md:w-4 md:h-4 rounded-full ${item.color} border-2 border-surface-container-lowest`}></div>
                      <p className={`text-[11px] md:text-[12px] font-bold ${item.isPrimary ? 'text-primary' : 'text-on-surface'}`}>{item.title}</p>
                      <p className="text-[12px] md:text-[14px] text-on-surface-variant">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </>
        )}
      </div>
    </div>
  )
}