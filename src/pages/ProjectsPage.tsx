import { useState } from 'react'
import { Plus, GripVertical, CheckCircle, AlertTriangle, User, Terminal, Megaphone, DollarSign, Users } from 'lucide-react'

type Column = {
  id: string
  label: string
  color: string
  badge: string
  badgeBg: string
  count: number
}

type Task = {
  id: string
  columnId: string
  category: string
  categoryColor: string
  categoryBg: string
  title: string
  agent: string
  agentColor: string
  agentBg: string
  progress: number
  progressColor: string
  critical?: boolean
}

const columns: Column[] = [
  { id: 'backlog', label: 'Backlog', color: 'bg-[#958ea0]', badge: 'text-[#cbc3d7]', badgeBg: 'bg-[#2d3449]', count: 4 },
  { id: 'in-progress', label: 'In Progress', color: 'bg-[#0566d9]', badge: 'text-[#0566d9]', badgeBg: 'bg-[#0566d9]/20', count: 2 },
  { id: 'review', label: 'Review', color: 'bg-[#4cd7f6]', badge: 'text-[#4cd7f6]', badgeBg: 'bg-[#4cd7f6]/20', count: 1 },
  { id: 'completed', label: 'Completed', color: 'bg-emerald-400', badge: 'text-emerald-400', badgeBg: 'bg-emerald-400/20', count: 8 },
]

const tasks: Task[] = [
  { id: '1', columnId: 'backlog', category: 'DESIGN', categoryColor: 'text-[#d0bcff]', categoryBg: 'bg-[#d0bcff]/10', title: 'Q3 UI Design Overhaul', agent: 'AI Agent: Designer-1', agentColor: 'text-[#4cd7f6]', agentBg: 'bg-[#4cd7f6]/20', progress: 0, progressColor: 'bg-[#d0bcff]' },
  { id: '2', columnId: 'backlog', category: 'MARKETING', categoryColor: 'text-[#0566d9]', categoryBg: 'bg-[#0566d9]/10', title: 'Global Brand Refresh', agent: 'AI Agent: Marketing-Lead', agentColor: 'text-[#d0bcff]', agentBg: 'bg-[#d0bcff]/20', progress: 15, progressColor: 'bg-[#0566d9]' },
  { id: '3', columnId: 'in-progress', category: 'CRITICAL', categoryColor: 'text-rose-400', categoryBg: 'bg-rose-500/10', title: 'API Gateway Migration', agent: 'AI Agent: CTO-Copilot', agentColor: 'text-rose-400', agentBg: 'bg-rose-500/20', progress: 65, progressColor: 'bg-rose-400', critical: true },
  { id: '4', columnId: 'in-progress', category: 'STRATEGY', categoryColor: 'text-[#d0bcff]', categoryBg: 'bg-[#d0bcff]/10', title: 'Market Penetration Plan', agent: 'AI Agent: CEO-Assistant', agentColor: 'text-[#d0bcff]', agentBg: 'bg-[#d0bcff]/20', progress: 42, progressColor: 'bg-[#d0bcff]' },
  { id: '5', columnId: 'review', category: 'FINANCE', categoryColor: 'text-[#4cd7f6]', categoryBg: 'bg-[#4cd7f6]/10', title: 'Fiscal Year Forecast', agent: 'AI Agent: CFO-Automator', agentColor: 'text-[#4cd7f6]', agentBg: 'bg-[#4cd7f6]/20', progress: 90, progressColor: 'bg-[#4cd7f6]' },
  { id: '6', columnId: 'completed', category: 'HR', categoryColor: 'text-emerald-400', categoryBg: 'bg-emerald-400/10', title: 'Q2 Recruitment Drive', agent: 'AI Agent: Talent-Scout', agentColor: 'text-emerald-400', agentBg: 'bg-emerald-400/20', progress: 100, progressColor: 'bg-emerald-400' },
]

const tabs = ['Board', 'Timeline', 'Weekly Updates']

export default function ProjectsPage() {
  const [activeTab, setActiveTab] = useState('Board')

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Project Header & Tabs */}
      <div className="px-6 pt-8 pb-4 max-w-[1440px] w-full mx-auto flex-shrink-0">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-[#cbc3d7] mb-2 text-sm">
              <span className="text-xs font-semibold uppercase tracking-wider">Home</span>
              <span>›</span>
              <span className="text-xs font-semibold uppercase tracking-wider">Workspace</span>
              <span>›</span>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#d0bcff]">Strategic Initiatives</span>
            </div>
            <h1 className="text-2xl font-semibold text-[#dae2fd] font-black">Project Board</h1>
          </div>
          <div className="flex p-1 bg-[#131b2e] rounded-xl border border-white/10">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                  activeTab === tab
                    ? 'bg-[#a078ff] text-[#340080] shadow-sm'
                    : 'text-[#cbc3d7] hover:text-[#dae2fd]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 px-6 overflow-x-auto pb-8" style={{ scrollbarWidth: 'thin' }}>
        <div className="flex gap-6 min-w-[1200px] h-full">
          {columns.map((col) => {
            const colTasks = tasks.filter((t) => t.columnId === col.id)
            return (
              <div key={col.id} className="flex-1 flex flex-col min-w-[280px]">
                {/* Column Header */}
                <div className="flex items-center justify-between mb-4 px-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${col.color}`} />
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-[#dae2fd]">{col.label}</h3>
                    <span className={`px-2 py-0.5 rounded-md ${col.badgeBg} ${col.badge} text-[10px] font-bold`}>{col.count}</span>
                  </div>
                  <button className="text-[#cbc3d7] hover:text-[#d0bcff] transition-colors">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Tasks */}
                <div className={`space-y-4 overflow-y-auto flex-1 p-2 ${col.id === 'completed' ? 'opacity-60 grayscale-[0.5]' : ''}`} style={{ scrollbarWidth: 'thin' }}>
                  {colTasks.map((task) => (
                    <div
                      key={task.id}
                      className={`bg-[rgba(23,31,51,0.72)] backdrop-blur-xl border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.25)] p-4 rounded-xl cursor-pointer hover:ring-2 hover:ring-[#d0bcff]/30 transition-all relative ${task.critical ? 'border-l-4 border-rose-500/50' : ''}`}
                    >
                      {task.critical && (
                        <div className="absolute top-2 right-2">
                          <div className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
                        </div>
                      )}

                      <div className="flex justify-between items-start mb-3">
                        <div className="flex gap-2 flex-wrap">
                          <span className={`${task.categoryBg} ${task.categoryColor} text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider`}>
                            {task.category}
                          </span>
                          {task.critical && (
                            <span className="bg-[#2d3449] text-[#cbc3d7] text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider">
                              CORE
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {col.id === 'completed' && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                          {task.critical && <AlertTriangle className="w-4 h-4 text-rose-400 ml-auto" />}
                          <GripVertical className="w-4 h-4 text-[#cbc3d7] cursor-grab" />
                        </div>
                      </div>

                      <h4 className="text-base text-[#dae2fd] font-semibold mb-4 leading-snug">{task.title}</h4>

                      <div className="flex items-center gap-2 mb-4">
                        <div className={`w-6 h-6 rounded-md ${task.agentBg} flex items-center justify-center`}>
                          <User className={`w-3 h-3 ${task.agentColor}`} />
                        </div>
                        <span className="text-[11px] font-mono text-[#cbc3d7]">{task.agent}</span>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px] text-[#cbc3d7]">
                          <span>Progress</span>
                          <span>{task.progress}%</span>
                        </div>
                        <div className="w-full bg-[#2d3449] h-1 rounded-full overflow-hidden">
                          <div
                            className={`${task.progressColor} h-full rounded-full transition-all`}
                            style={{ width: `${task.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Add Card Button */}
                  <button className="w-full py-3 border border-dashed border-white/10 rounded-xl text-[#cbc3d7] hover:border-[#d0bcff]/30 hover:text-[#d0bcff] transition-colors text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2">
                    <Plus className="w-4 h-4" />
                    Add Task
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}