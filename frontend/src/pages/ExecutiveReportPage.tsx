import { useState } from 'react'
import { Download, Eye, Share2, FileText, BarChart2, Globe, TrendingUp, Star, ChevronRight, Zap, Calendar } from 'lucide-react'

const reports = [
  {
    id: 1,
    title: 'Q3 Operations Review',
    subtitle: 'Comprehensive overview of Q3 2024 performance metrics and strategic insights.',
    date: 'October 2024',
    size: '12MB',
    icon: BarChart2,
    color: 'text-[#d0bcff]',
    bg: 'bg-[#d0bcff]/10',
    status: 'Latest',
    statusColor: 'text-[#d0bcff] bg-[#d0bcff]/10',
    score: 94,
    scoreColor: 'text-[#4cd7f6]',
    highlights: ['Revenue exceeded target by 12.4%', 'Agent deployment efficiency at 99.2%', '3 critical risks mitigated proactively'],
  },
  {
    id: 2,
    title: 'Risk Exposure Analysis v2',
    subtitle: 'Deep-dive risk assessment across supply chain, financial, and regulatory vectors.',
    date: 'Yesterday',
    size: '4.5MB',
    icon: TrendingUp,
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
    status: 'High Priority',
    statusColor: 'text-rose-400 bg-rose-500/10',
    score: 78,
    scoreColor: 'text-[#0566d9]',
    highlights: ['Supply chain risk: Medium (2 vendors flagged)', 'Financial exposure reduced to $220k', 'Regulatory compliance: 98% across all markets'],
  },
  {
    id: 3,
    title: 'Market Expansion AI Report',
    subtitle: 'AI-generated market entry analysis for APAC region with tactical recommendations.',
    date: 'Oct 20, 2024',
    size: '22MB',
    icon: Globe,
    color: 'text-[#4cd7f6]',
    bg: 'bg-[#4cd7f6]/10',
    status: 'Strategic',
    statusColor: 'text-[#4cd7f6] bg-[#4cd7f6]/10',
    score: 88,
    scoreColor: 'text-[#d0bcff]',
    highlights: ['3 high-opportunity markets identified', 'ROI projection: $4.2M in 18 months', 'Competitive advantage window: 6-8 months'],
  },
]

const kpiSummary = [
  { label: 'Business Health', value: 92, suffix: '/100', color: '#d0bcff', desc: 'Optimized' },
  { label: 'Revenue Growth', value: 12.4, suffix: '%', color: '#4cd7f6', desc: 'Above target' },
  { label: 'Risk Level', value: 8, suffix: '/100', color: '#ffb4ab', desc: 'Low risk' },
  { label: 'Agent Efficiency', value: 99.2, suffix: '%', color: '#adc6ff', desc: 'Fully autonomous' },
]

export default function ExecutiveReportPage() {
  const [selectedReport, setSelectedReport] = useState(reports[0])

  return (
    <div className="p-6 max-w-[1440px] mx-auto w-full pb-20 md:pb-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-4xl md:text-6xl font-bold text-[#dae2fd] mb-1">Executive Reports</h1>
          <p className="text-[#cbc3d7] text-base">AI-synthesized intelligence briefings for leadership decisions.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[rgba(23,31,51,0.72)] backdrop-blur-xl border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.25)] px-4 py-2 rounded-xl">
            <Calendar className="w-4 h-4 text-[#d0bcff]" />
            <span className="text-sm font-mono text-[#dae2fd]">Oct 2024</span>
          </div>
          <button className="bg-[#a078ff] text-[#340080] px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 hover:brightness-110 transition-all">
            <Zap className="w-4 h-4" />
            Generate New Report
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpiSummary.map((kpi, i) => (
          <div key={i} className="bg-[rgba(23,31,51,0.72)] backdrop-blur-xl border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.25)] p-5 rounded-xl">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#cbc3d7] mb-2">{kpi.label}</p>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-2xl font-bold" style={{ color: kpi.color }}>{kpi.value}</span>
              <span className="text-sm text-[#958ea0]">{kpi.suffix}</span>
            </div>
            <p className="text-[10px] text-[#cbc3d7]">{kpi.desc}</p>
            <div className="mt-3 h-1 w-full bg-[#2d3449] rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${Math.min(kpi.value, 100)}%`, background: kpi.color }} />
            </div>
          </div>
        ))}
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Report List */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-[#dae2fd] mb-2">Available Reports</h2>
          {reports.map((report) => (
            <button
              key={report.id}
              onClick={() => setSelectedReport(report)}
              className={`w-full text-left bg-[rgba(23,31,51,0.72)] backdrop-blur-xl border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.25)] p-4 rounded-xl transition-all ${
                selectedReport.id === report.id ? 'ring-2 ring-[#d0bcff]/50 bg-[#d0bcff]/5' : ''
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-lg ${report.bg} flex items-center justify-center flex-shrink-0`}>
                  <report.icon className={`w-5 h-5 ${report.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-bold text-[#dae2fd] truncate">{report.title}</p>
                  <p className="text-xs text-[#958ea0]">{report.date} · {report.size}</p>
                </div>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${report.statusColor} uppercase tracking-wider`}>
                {report.status}
              </span>
            </button>
          ))}
        </div>

        {/* Report Detail */}
        <div className="lg:col-span-2 bg-[rgba(23,31,51,0.72)] backdrop-blur-xl border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.25)] p-6 rounded-2xl">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl ${selectedReport.bg} flex items-center justify-center`}>
                <selectedReport.icon className={`w-6 h-6 ${selectedReport.color}`} />
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-[#dae2fd]">{selectedReport.title}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${selectedReport.statusColor} uppercase tracking-wider`}>
                    {selectedReport.status}
                  </span>
                  <span className="text-xs text-[#958ea0]">{selectedReport.date}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="p-2 hover:bg-white/5 rounded-lg text-[#cbc3d7] hover:text-[#d0bcff] transition-colors">
                <Share2 className="w-4 h-4" />
              </button>
              <button className="p-2 hover:bg-white/5 rounded-lg text-[#cbc3d7] hover:text-[#d0bcff] transition-colors">
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>

          <p className="text-base text-[#cbc3d7] mb-6">{selectedReport.subtitle}</p>

          {/* AI Score */}
          <div className="bg-[rgba(23,31,51,0.72)] backdrop-blur-xl border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.25)] p-4 rounded-xl mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#cbc3d7]">AI Confidence Score</span>
              <span className={`text-2xl font-bold ${selectedReport.scoreColor}`}>{selectedReport.score}/100</span>
            </div>
            <div className="w-full bg-[#2d3449] h-2 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${selectedReport.score}%`, background: 'linear-gradient(90deg, #d0bcff, #4cd7f6)' }}
              />
            </div>
          </div>

          {/* Key Highlights */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#cbc3d7] mb-4 flex items-center gap-2">
              <Star className="w-4 h-4" />
              KEY HIGHLIGHTS
            </h4>
            <div className="space-y-3">
              {selectedReport.highlights.map((highlight, i) => (
                <div key={i} className="flex items-start gap-3 bg-[rgba(23,31,51,0.72)] backdrop-blur-xl border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.25)] p-3 rounded-lg">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#d0bcff] mt-1.5 flex-shrink-0" />
                  <p className="text-sm text-[#dae2fd]">{highlight}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <button className="flex-1 py-3 bg-[#a078ff] text-[#340080] rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:brightness-110 transition-all">
              <Eye className="w-4 h-4" /> View Full Report
            </button>
            <button className="flex-1 py-3 bg-[rgba(23,31,51,0.72)] backdrop-blur-xl border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.25)] rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:border-[#d0bcff]/30 transition-all text-[#cbc3d7]">
              <Download className="w-4 h-4" /> Download PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}