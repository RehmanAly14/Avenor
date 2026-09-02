import {
  TrendingUp,
  ShieldCheck,
  BarChart2,
  Bot,
  Eye,
  CalendarDays,
  Zap,
  ArrowRight,
  CheckCircle,
  ChevronDown,
} from "lucide-react";
import {
  Bot as SmartToy,
  Cloud,
  MousePointer2,
} from 'lucide-react'

const timelineItems = [
  {
    agent: 'CEO Agent',
    desc: 'Synthesizing market trend data for expansion decision.',
    status: 'COMPUTING',
    statusColor: 'text-cyan-400',
    statusBg: 'bg-[#2d3449]',
    time: '2m ago',
    active: true,
  },
  {
    agent: 'Finance Agent',
    desc: 'Rebalancing budget allocation for high-ROI channels.',
    status: 'IDLE',
    statusColor: 'text-violet-300',
    statusBg: 'bg-violet-500/10',
    time: '15m ago',
    active: false,
  },
  {
    agent: 'Marketing Agent',
    desc: 'Generated 12 ad variations for segment Alpha test.',
    status: 'UPLOADED',
    statusColor: 'text-cyan-400',
    statusBg: 'bg-[#2d3449]',
    time: '45m ago',
    active: true,
  },
]

const recentReports = [
  { title: 'Monthly Ops Review', meta: 'October 2024 • 12MB', icon: BarChart2 },
  { title: 'Risk Exposure v2', meta: 'Yesterday • 4.5MB', icon: TrendingUp },
  { title: 'Market Expansion AI', meta: 'Oct 20, 2024 • 22MB', icon: Bot },
]

const activeProjects = [
  { name: 'Market Expansion', phase: 'Phase 2', progress: 65, badge: 'bg-violet-500/20 text-violet-300', color: 'bg-violet-500' },
  { name: 'Product Launch', phase: 'Planning', progress: 20, badge: 'bg-cyan-500/20 text-cyan-400', color: 'bg-cyan-400' },
]

const recommendations = [
  {
    title: 'Optimize Cloud Spend',
    desc: 'Identified $12.4k/mo leakage in redundant AWS instances. Automation ready to terminate unused nodes.',
    action: 'EXECUTE ACTION',
    color: 'border-l-violet-500',
    iconBg: 'bg-violet-500/10',
    iconColor: 'text-violet-300',
    textColor: 'text-violet-300',
    icon: Cloud,
  },
  {
    title: 'Increase Ad Budget',
    desc: 'High-ROI detected in "Mid-Market Enterprise" segments. Suggested 15% shift from Brand to Performance.',
    action: 'REVIEW ALLOCATION',
    color: 'border-l-cyan-400',
    iconBg: 'bg-cyan-500/10',
    iconColor: 'text-cyan-400',
    textColor: 'text-cyan-400',
    icon: MousePointer2,
  },
]

export default function DashboardPage() {
  return (
    <div className="p-6 max-w-[1440px] mx-auto w-full pb-20 md:pb-6">
      {/* Background Orbs */}
      <div className="fixed top-0 left-0 w-full h-full -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-violet-500/20 rounded-full blur-[80px] opacity-50" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-500/10 rounded-full blur-[80px] opacity-50" />
      </div>

      {/* Page Header */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-12">
        <div>
          <h2 className="text-4xl md:text-6xl font-bold text-[#dae2fd] mb-1">Business Overview</h2>
          <p className="text-[#cbc3d7] text-base">Autonomous intelligence insights for your global enterprise.</p>
        </div>
        <div className="flex items-center gap-2 bg-[rgba(23,31,51,0.72)] backdrop-blur-xl border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.25)] px-4 py-2 rounded-xl">
          <CalendarDays className="w-5 h-5 text-violet-300" />
          <span className="text-sm font-mono text-[#dae2fd]">Oct 01 - Oct 24, 2024</span>
          <ChevronDown className="w-4 h-4 text-[#958ea0] cursor-pointer" />
        </div>
      </section>

      {/* Top Stats Bento */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        {/* Health Score */}
        <div className="bg-[rgba(23,31,51,0.72)] backdrop-blur-xl border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.25)] p-6 rounded-xl flex items-center justify-between border-t-2 border-t-violet-500/30">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#cbc3d7] mb-2">Health Score</p>
            <h3 className="text-2xl font-bold text-[#dae2fd]">92<span className="text-sm text-[#958ea0]">/100</span></h3>
            <span className="text-cyan-400 text-[10px] font-semibold uppercase tracking-wider bg-cyan-500/10 px-2 py-0.5 rounded-full">OPTIMIZED</span>
          </div>
          <div className="relative w-16 h-16">
            <svg className="w-full h-full" viewBox="0 0 64 64">
              <circle className="text-[#2d3449]" cx="32" cy="32" fill="transparent" r="28" stroke="currentColor" strokeWidth="4" />
              <circle className="text-violet-300" cx="32" cy="32" fill="transparent" r="28" stroke="currentColor" strokeDasharray="175.9" strokeDashoffset="14" strokeWidth="4" />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-violet-300" />
            </span>
          </div>
        </div>

        {/* Revenue Trend */}
        <div className="bg-[rgba(23,31,51,0.72)] backdrop-blur-xl border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.25)] p-6 rounded-xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#cbc3d7] mb-2">Revenue Trend</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-bold text-[#dae2fd]">+12.4%</h3>
            <TrendingUp className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-4 h-8 w-full flex items-end gap-1">
            {[40, 60, 50, 80, 100].map((h, i) => (
              <div key={i} className="rounded-t-sm w-full" style={{ height: `${h}%`, background: `rgba(208, 188, 255, ${0.2 + i * 0.15})` }} />
            ))}
          </div>
        </div>

        {/* Growth Index */}
        <div className="bg-[rgba(23,31,51,0.72)] backdrop-blur-xl border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.25)] p-6 rounded-xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#cbc3d7] mb-2">Growth Index</p>
          <h3 className="text-2xl font-bold text-[#dae2fd]">8.4</h3>
          <div className="w-full bg-[#2d3449] h-1.5 rounded-full mt-4 overflow-hidden">
            <div className="bg-cyan-400 h-full" style={{ width: '84%' }} />
          </div>
          <p className="text-[10px] text-[#958ea0] mt-2">Ahead of sector average (7.1)</p>
        </div>

        {/* Risk Score */}
        <div className="bg-[rgba(23,31,51,0.72)] backdrop-blur-xl border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.25)] p-6 rounded-xl border-l-4 border-l-cyan-400">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#cbc3d7] mb-2">Risk Score</p>
          <h3 className="text-2xl font-bold text-[#dae2fd]">Low</h3>
          <div className="flex items-center gap-2 mt-4 text-cyan-400">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-sm">3 potential threats mitigated</span>
          </div>
        </div>
      </section>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Agent Activity Timeline */}
        <div className="lg:col-span-2 bg-[rgba(23,31,51,0.72)] backdrop-blur-xl border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.25)] p-6 rounded-2xl">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-semibold flex items-center gap-2 text-[#dae2fd]">
              <Bot className="w-5 h-5 text-violet-300" />
              Agent Activity
            </h3>
            <span className="text-sm text-[#958ea0]">Project: Q3 Strategy</span>
          </div>
          <div className="space-y-12 relative before:absolute before:left-6 before:top-2 before:bottom-2 before:w-[1px] before:bg-[#494454]/30">
            {timelineItems.map((item, i) => (
              <div key={i} className="relative pl-12 flex flex-col md:flex-row md:items-center justify-between gap-4 group">
                <div className={`absolute left-3 top-1 w-6 h-6 rounded-full bg-[#131b2e] border-2 ${item.active ? 'border-violet-300' : 'border-[#494454]'} flex items-center justify-center z-10 group-hover:scale-110 transition-transform`}>
                  <div className={`w-2 h-2 ${item.active ? 'bg-violet-300' : 'bg-[#494454]'} rounded-full`} />
                </div>
                <div>
                  <h4 className="text-base font-bold text-[#dae2fd]">{item.agent}</h4>
                  <p className="text-sm text-[#cbc3d7]">{item.desc}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`${item.statusBg} px-3 py-1 rounded-full text-[11px] font-mono ${item.statusColor}`}>{item.status}</span>
                  <span className="text-xs text-[#958ea0]">{item.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Reports */}
        <div className="bg-[rgba(23,31,51,0.72)] backdrop-blur-xl border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.25)] p-6 rounded-2xl flex flex-col">
          <h3 className="text-2xl font-semibold text-[#dae2fd] mb-6">Recent Reports</h3>
          <div className="space-y-4 flex-1">
            {recentReports.map((report, i) => (
              <div key={i} className="bg-[rgba(23,31,51,0.72)] backdrop-blur-xl border border-white/10 p-4 rounded-xl flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[#2d3449] flex items-center justify-center group-hover:text-violet-300 transition-colors">
                    <report.icon className="w-5 h-5 text-[#dae2fd]" />
                  </div>
                  <div>
                    <p className="text-base font-bold text-[#dae2fd]">{report.title}</p>
                    <p className="text-xs text-[#958ea0]">{report.meta}</p>
                  </div>
                </div>
                <button className="p-2 hover:bg-violet-500/10 rounded-full text-violet-300 transition-all">
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          <button className="mt-6 w-full text-center text-xs font-semibold uppercase tracking-wider text-violet-300 hover:underline transition-all">
            View All Reports
          </button>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6 mb-8">
        {/* Active Projects */}
        <div className="bg-[rgba(23,31,51,0.72)] backdrop-blur-xl border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.25)] p-6 rounded-2xl">
          <h3 className="text-2xl font-semibold text-[#dae2fd] mb-6">Active Projects</h3>
          <div className="space-y-4">
            {activeProjects.map((proj, i) => (
              <div key={i} className="bg-[rgba(23,31,51,0.72)] backdrop-blur-xl border border-white/10 p-4 rounded-xl">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-base font-bold text-[#dae2fd]">{proj.name}</h4>
                  <span className={`${proj.badge} text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wider`}>{proj.phase}</span>
                </div>
                <div className="w-full bg-[#2d3449] h-1 rounded-full mb-4 overflow-hidden">
                  <div className={`${proj.color} h-full`} style={{ width: `${proj.progress}%` }} />
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex -space-x-2">
                    <div className="w-6 h-6 rounded-full border border-[#0b1326] bg-[#2d3449]" />
                    <div className="w-6 h-6 rounded-full border border-[#0b1326] bg-[#222a3d] flex items-center justify-center text-[8px] font-bold text-[#dae2fd]">+3</div>
                  </div>
                  <span className="text-xs text-[#958ea0]">{proj.progress}% Complete</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Executive Strategy */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-5 h-5 text-violet-300 fill-current" />
            <h3 className="text-2xl font-semibold text-[#dae2fd]">AI Executive Strategy</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendations.map((rec, i) => (
              <div key={i} className={`bg-[rgba(23,31,51,0.72)] backdrop-blur-xl border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.25)] p-4 rounded-2xl border-l-4 ${rec.color} flex gap-4 items-start hover:-translate-y-1 transition-transform cursor-pointer`}>
                <div className={`p-3 ${rec.iconBg} rounded-xl ${rec.iconColor} shrink-0`}>
                  <rec.icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-[#dae2fd] mb-1">{rec.title}</h4>
                  <p className="text-sm text-[#cbc3d7]">{rec.desc}</p>
                  <button className={`mt-4 text-xs font-bold ${rec.textColor} flex items-center gap-1 group`}>
                    {rec.action}
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}