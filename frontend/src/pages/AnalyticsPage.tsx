import { useState } from 'react'
import { TrendingUp, TrendingDown, Users, DollarSign, Activity, Globe, BarChart3, Filter, Download } from 'lucide-react'
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

const revenueData = [
  { month: 'Jul', revenue: 820, target: 800 },
  { month: 'Aug', revenue: 932, target: 850 },
  { month: 'Sep', revenue: 901, target: 900 },
  { month: 'Oct', revenue: 1134, target: 950 },
  { month: 'Nov', revenue: 1290, target: 1000 },
  { month: 'Dec', revenue: 1330, target: 1050 },
]

const channelData = [
  { channel: 'Organic', value: 35 },
  { channel: 'Paid', value: 25 },
  { channel: 'Referral', value: 20 },
  { channel: 'Direct', value: 12 },
  { channel: 'Social', value: 8 },
]

const agentActivityData = [
  { day: 'Mon', ceo: 40, finance: 24, marketing: 67 },
  { day: 'Tue', ceo: 30, finance: 53, marketing: 37 },
  { day: 'Wed', ceo: 20, finance: 38, marketing: 53 },
  { day: 'Thu', ceo: 27, finance: 43, marketing: 30 },
  { day: 'Fri', ceo: 18, finance: 50, marketing: 40 },
  { day: 'Sat', ceo: 23, finance: 21, marketing: 10 },
  { day: 'Sun', ceo: 34, finance: 18, marketing: 24 },
]

const kpis = [
  { label: 'Total Revenue', value: '$1.33M', change: '+12.4%', positive: true, icon: DollarSign, color: 'text-[#4cd7f6]' },
  { label: 'Active Users', value: '48,290', change: '+8.1%', positive: true, icon: Users, color: 'text-[#0566d9]' },
  { label: 'Conversion Rate', value: '3.94%', change: '-0.3%', positive: false, icon: Activity, color: 'text-[#d0bcff]' },
  { label: 'Global Reach', value: '42 Markets', change: '+3 new', positive: true, icon: Globe, color: 'text-[#d0bcff]' },
]

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[rgba(23,31,51,0.72)] backdrop-blur-xl border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.25)] p-3 rounded-lg">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#cbc3d7] mb-1">{label}</p>
        {payload.map((entry: any) => (
          <p key={entry.name} className="text-sm font-bold text-[#dae2fd]" style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function AnalyticsPage() {
  const [activeRange, setActiveRange] = useState('6M')

  return (
    <div className="p-6 max-w-[1440px] mx-auto w-full pb-20 md:pb-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-4xl md:text-6xl font-bold text-[#dae2fd] mb-1">Detailed Analytics</h1>
          <p className="text-[#cbc3d7] text-base">Comprehensive performance metrics across all business units.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex p-1 bg-[#131b2e] rounded-xl border border-white/10">
            {['1M', '3M', '6M', '1Y'].map((range) => (
              <button
                key={range}
                onClick={() => setActiveRange(range)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                  activeRange === range ? 'bg-[#a078ff] text-[#340080]' : 'text-[#cbc3d7] hover:text-[#dae2fd]'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
          <button className="bg-[rgba(23,31,51,0.72)] backdrop-blur-xl border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.25)] px-3 py-2 rounded-lg text-[#cbc3d7] hover:text-[#d0bcff] transition-colors flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
            <Filter className="w-4 h-4" /> Filter
          </button>
          <button className="bg-[rgba(23,31,51,0.72)] backdrop-blur-xl border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.25)] px-3 py-2 rounded-lg text-[#cbc3d7] hover:text-[#d0bcff] transition-colors flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map((kpi, i) => (
          <div key={i} className="bg-[rgba(23,31,51,0.72)] backdrop-blur-xl border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.25)] p-5 rounded-xl">
            <div className="flex items-start justify-between mb-4">
              <div className={`p-2 rounded-lg bg-[#2d3449] ${kpi.color}`}>
                <kpi.icon className="w-5 h-5" />
              </div>
              <span className={`flex items-center gap-1 text-[11px] font-bold ${kpi.positive ? 'text-[#4cd7f6]' : 'text-rose-400'}`}>
                {kpi.positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {kpi.change}
              </span>
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#cbc3d7] mb-1">{kpi.label}</p>
            <p className="text-2xl font-bold text-[#dae2fd]">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Revenue vs Target - Wide */}
        <div className="lg:col-span-2 bg-[rgba(23,31,51,0.72)] backdrop-blur-xl border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.25)] p-6 rounded-2xl">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-semibold text-[#dae2fd]">Revenue vs Target</h3>
            <span className="text-sm text-[#958ea0]">Jul – Dec 2024</span>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#d0bcff" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#d0bcff" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorTarget" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4cd7f6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#4cd7f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(73,68,84,0.3)" />
              <XAxis dataKey="month" stroke="#958ea0" tick={{ fontSize: 11 }} />
              <YAxis stroke="#958ea0" tick={{ fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Area type="monotone" dataKey="revenue" stroke="#d0bcff" strokeWidth={2} fill="url(#colorRevenue)" name="Revenue ($k)" />
              <Area type="monotone" dataKey="target" stroke="#4cd7f6" strokeWidth={2} strokeDasharray="4 4" fill="url(#colorTarget)" name="Target ($k)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Channel Distribution */}
        <div className="bg-[rgba(23,31,51,0.72)] backdrop-blur-xl border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.25)] p-6 rounded-2xl">
          <h3 className="text-2xl font-semibold text-[#dae2fd] mb-6">Traffic Channels</h3>
          <div className="space-y-4">
            {channelData.map((ch, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[#cbc3d7]">{ch.channel}</span>
                  <span className="font-bold text-[#dae2fd]">{ch.value}%</span>
                </div>
                <div className="w-full bg-[#2d3449] h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${ch.value}%`,
                      background: ['#d0bcff', '#4cd7f6', '#adc6ff', '#a078ff', '#6d3bd7'][i]
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Agent Activity Chart */}
      <div className="bg-[rgba(23,31,51,0.72)] backdrop-blur-xl border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.25)] p-6 rounded-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-semibold text-[#dae2fd] flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#d0bcff]" />
            Agent Activity (Tasks Completed)
          </h3>
          <span className="text-sm text-[#958ea0]">This Week</span>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={agentActivityData} barSize={8} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(73,68,84,0.3)" />
            <XAxis dataKey="day" stroke="#958ea0" tick={{ fontSize: 11 }} />
            <YAxis stroke="#958ea0" tick={{ fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '11px' }} />
            <Bar dataKey="ceo" fill="#d0bcff" radius={[4, 4, 0, 0]} name="CEO Agent" />
            <Bar dataKey="finance" fill="#4cd7f6" radius={[4, 4, 0, 0]} name="Finance Agent" />
            <Bar dataKey="marketing" fill="#adc6ff" radius={[4, 4, 0, 0]} name="Marketing Agent" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}