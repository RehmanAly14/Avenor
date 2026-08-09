import { Link } from 'react-router-dom'
import {
  Zap,
  TrendingUp,
  BarChart2,
  FileText,
  Users,
  Database,
  Terminal,
  Calendar,
  GitBranch,
  CheckCircle,
  Layers,
  Cpu,
  Brain,
} from 'lucide-react'

const integrations = [
  { label: 'Slack Relay', icon: Layers, color: 'text-violet-300' },
  { label: 'SQL Agents', icon: Database, color: 'text-cyan-400' },
  { label: 'CRM Auto-Sync', icon: Users, color: 'text-blue-400' },
  { label: 'DevOps Copilot', icon: Terminal, color: 'text-violet-200' },
  { label: 'Contextual Scheduling', icon: Calendar, color: 'text-violet-300' },
  { label: 'Linear Bridge', icon: GitBranch, color: 'text-cyan-400' },
]

export default function LandingPage() {
  return (
    <div className="overflow-x-hidden bg-[#0b1326] text-[#dae2fd]">
      {/* Top Nav */}
      <header className="bg-[#131b2e]/30 backdrop-blur-xl sticky top-0 z-50 border-b border-white/10 shadow-sm">
        <nav className="flex justify-between items-center w-full px-6 py-4 max-w-[1440px] mx-auto">
          <div className="flex items-center gap-12">
            <span className="text-2xl font-black tracking-tight text-violet-300">ExecOS AI</span>
            <div className="hidden md:flex gap-6 items-center">
              <a href="#features" className="text-[#cbc3d7] hover:text-violet-300 transition-colors text-base">Features</a>
              <a href="#pricing" className="text-[#cbc3d7] hover:text-violet-300 transition-colors text-base">Pricing</a>
              <a href="#integrations" className="text-[#cbc3d7] hover:text-violet-300 transition-colors text-base">Integrations</a>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/auth">
              <button className="text-[#cbc3d7] hover:text-violet-300 transition-colors text-sm font-semibold">
                Sign In
              </button>
            </Link>
            <Link to="/auth">
              <button className="bg-[#a078ff] text-[#340080] px-4 py-2 rounded-lg text-xs font-bold hover:brightness-110 active:scale-95 transition-all">
                Start Free
              </button>
            </Link>
          </div>
        </nav>
      </header>

      <main className="relative">
        {/* Hero Section */}
        <section className="relative pt-24 pb-32 overflow-hidden">
          {/* Background orbs */}
          <div className="absolute top-[-10%] left-[-5%] w-[45%] h-[60%] bg-violet-500/20 rounded-full pointer-events-none blur-[80px] opacity-50" />
          <div className="absolute bottom-[-10%] right-[-5%] w-[35%] h-[40%] bg-cyan-500/10 rounded-full pointer-events-none blur-[80px] opacity-50" />

          <div className="max-w-[1440px] mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center relative z-10">
            {/* Hero Content */}
            <div className="space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 px-4 py-1.5 rounded-full text-violet-300 text-xs font-semibold uppercase tracking-wider">
                <Zap className="w-3.5 h-3.5" />
                Enterprise Intelligence Reimagined
              </div>

              <h1 className="text-4xl md:text-6xl font-bold text-[#dae2fd] leading-tight">
                Your AI{' '}
                <span className="bg-gradient-to-r from-violet-300 to-cyan-400 bg-clip-text text-transparent">
                  Executive Team
                </span>
                .{' '}
                <br />
                One Workspace.
              </h1>

              <p className="text-[#cbc3d7] text-base md:text-xl max-w-xl mx-auto lg:mx-0">
                Run your entire business with collaborative AI executives that analyze, plan and recommend actions automatically.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
                <Link to="/auth">
                  <button 
                    className="px-8 py-4 rounded-lg font-semibold text-white shadow-xl hover:scale-105 transition-transform active:scale-95 text-base"
                    style={{ 
                      background: 'linear-gradient(135deg, #a078ff 0%, #6d3bd7 100%)',
                      boxShadow: '0 0 30px rgba(160,120,255,0.3)'
                    }}
                  >
                    Start Workspace
                  </button>
                </Link>
                <button className="bg-[#171f33]/50 border border-white/20 text-[#dae2fd] px-8 py-4 rounded-lg font-semibold backdrop-blur hover:bg-[#171f33] transition-colors text-base">
                  Book Demo
                </button>
              </div>

              <div className="pt-6 flex items-center justify-center lg:justify-start gap-4">
                <div className="flex -space-x-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-[#0b1326] bg-[#222a3d]" />
                  ))}
                </div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#958ea0]">Trusted by 500+ Agile Orgs</p>
              </div>
            </div>

            {/* Hero Visual */}
            <div className="relative mt-12 lg:mt-0">
              <div 
                className="bg-[rgba(23,31,51,0.72)] backdrop-blur-xl border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.25)] rounded-[32px] p-6 relative overflow-hidden aspect-square flex items-center justify-center"
                style={{ animation: 'float 6s ease-in-out infinite' }}
              >
                <style>{`
                  @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-10px); }
                  }
                `}</style>
                {/* Background Grid */}
                <div className="absolute inset-0 rounded-[32px] overflow-hidden" style={{
                  backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(160,120,255,0.05) 1px, transparent 0)',
                  backgroundSize: '24px 24px'
                }} />

                {/* Center Orb */}
                <div className="w-48 h-48 rounded-full flex items-center justify-center relative">
                  <div className="absolute inset-0 rounded-full bg-violet-500/10 animate-pulse" />
                  <div className="absolute inset-4 rounded-full bg-violet-500/20 animate-pulse" style={{ animationDelay: '0.5s' }} />
                  <Cpu className="w-16 h-16 text-violet-300 relative z-10" />
                </div>

                {/* Floating UI Elements */}
                <div className="absolute top-8 right-8 bg-[rgba(23,31,51,0.72)] backdrop-blur-xl border border-violet-500/20 p-4 rounded-xl shadow-2xl z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#494454]">REVENUE FORECAST</p>
                      <p className="text-base font-bold text-cyan-400">+24.2%</p>
                    </div>
                  </div>
                </div>

                <div className="absolute bottom-12 left-8 bg-[rgba(23,31,51,0.72)] backdrop-blur-xl border border-violet-500/20 p-4 rounded-xl shadow-2xl z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center">
                      <Brain className="w-4 h-4 text-violet-300" />
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#494454]">ACTIVE AGENTS</p>
                      <p className="text-base font-bold text-violet-300">Chief Strategy</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Multi-Agent Advantage Bento Grid */}
        <section id="features" className="py-24 bg-[#060e20]/50">
          <div className="max-w-[1440px] mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-6xl font-bold text-[#dae2fd] mb-4">The Multi-Agent Advantage</h2>
              <p className="text-[#cbc3d7] text-base max-w-2xl mx-auto">
                Specialized AI models that communicate, peer-review, and execute business goals without manual prompting.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Agent Collaboration - Wide */}
              <div className="md:col-span-2 bg-[rgba(23,31,51,0.72)] backdrop-blur-xl border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.25)] rounded-2xl p-8 flex flex-col justify-between overflow-hidden group min-h-[300px]">
                <div>
                  <Users className="w-8 h-8 text-violet-300 mb-4" />
                  <h3 className="text-2xl font-semibold text-[#dae2fd] mb-3">Agent Collaboration</h3>
                  <p className="text-[#cbc3d7] text-sm max-w-md">
                    Agents debate strategy and allocate resources automatically. When the Sales Agent detects a dip, the Marketing Agent shifts focus instantly.
                  </p>
                </div>
                <div className="mt-8 relative flex-1 min-h-[160px]">
                  <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-cyan-500/5 rounded-xl border border-white/10" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="grid grid-cols-4 gap-4 opacity-50 group-hover:opacity-100 transition-opacity">
                      {[Users, GitBranch, Cpu, Brain].map((Icon, i) => (
                        <div key={i} className="w-12 h-12 rounded-lg bg-[#222a3d] border border-violet-500/20 flex items-center justify-center">
                          <Icon className="w-5 h-5 text-violet-300" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Executive Reports */}
              <div className="bg-[rgba(23,31,51,0.72)] backdrop-blur-xl border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.25)] rounded-2xl p-8 flex flex-col items-center text-center justify-center">
                <FileText className="w-8 h-8 text-cyan-400 mb-4" />
                <h3 className="text-2xl font-semibold text-[#dae2fd] mb-3">Executive Reports</h3>
                <p className="text-[#cbc3d7] text-sm">
                  Daily high-level summaries synthesized from thousands of data points across your entire stack.
                </p>
                <div className="w-full mt-6 h-32 bg-[#222a3d]/50 rounded-xl border border-white/10 flex items-center justify-center p-4">
                  <div className="space-y-2 w-full">
                    <div className="h-2 bg-white/10 rounded w-full" />
                    <div className="h-2 bg-white/10 rounded w-4/5" />
                    <div className="h-2 bg-white/10 rounded w-2/3" />
                  </div>
                </div>
              </div>

              {/* Live Analytics */}
              <div className="bg-[rgba(23,31,51,0.72)] backdrop-blur-xl border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.25)] rounded-2xl p-8 flex flex-col justify-between">
                <BarChart2 className="w-8 h-8 text-blue-400 mb-4" />
                <div>
                  <h3 className="text-2xl font-semibold text-[#dae2fd] mb-3">Live Analytics</h3>
                  <p className="text-[#cbc3d7] text-sm">
                    Real-time visualization of agent activity and business performance metrics.
                  </p>
                </div>
              </div>

              {/* Long-term Memory - Wide */}
              <div className="md:col-span-2 bg-[rgba(23,31,51,0.72)] backdrop-blur-xl border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.25)] rounded-2xl p-8 flex flex-col md:flex-row items-center gap-8">
                <div className="flex-1">
                  <Brain className="w-8 h-8 text-violet-200 mb-4" />
                  <h3 className="text-2xl font-semibold text-[#dae2fd] mb-3">Long-term Memory</h3>
                  <p className="text-[#cbc3d7] text-sm">
                    ExecOS learns your brand voice, historical preferences, and long-term objectives to provide context-aware recommendations.
                  </p>
                </div>
                <div className="flex-1 w-full h-48 bg-[#222a3d]/30 rounded-xl overflow-hidden relative">
                  <div className="absolute inset-0" style={{
                    backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(160,120,255,0.1) 1px, transparent 0)',
                    backgroundSize: '24px 24px'
                  }} />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full bg-violet-500/10 blur-2xl animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Scrolling Integrations */}
        <section id="integrations" className="py-24 overflow-hidden">
          <div className="max-w-[1440px] mx-auto px-6 mb-6">
            <h2 className="text-2xl font-semibold text-[#dae2fd]">Integrated Ecosystem</h2>
          </div>
          <div className="flex gap-6 py-4 overflow-x-auto px-6" style={{ scrollbarWidth: 'thin' }}>
            {[...integrations, ...integrations].map((item, i) => (
              <div key={i} className="flex-shrink-0 flex items-center gap-4 bg-[#222a3d]/50 border border-white/10 px-8 py-4 rounded-2xl">
                <item.icon className={`w-5 h-5 ${item.color}`} />
                <span className="font-semibold text-base whitespace-nowrap text-[#dae2fd]">{item.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-24 relative">
          <div className="max-w-[1440px] mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-6xl font-bold text-[#dae2fd] mb-4">Scalable Intelligence</h2>
              <p className="text-[#cbc3d7] text-base">Choose the tier that fits your operational complexity.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Starter */}
              <div className="bg-[rgba(23,31,51,0.72)] backdrop-blur-xl border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.25)] rounded-2xl p-8 flex flex-col hover:border-violet-500/30 transition-colors">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#494454] mb-4">Starter</h4>
                <p className="text-[#dae2fd] text-4xl font-bold mb-4">$499<span className="text-base font-normal text-[#958ea0]">/mo</span></p>
                <p className="text-[#cbc3d7] text-sm mb-8">For small teams automating core workflows.</p>
                <ul className="space-y-4 mb-auto">
                  {['3 Specialized Agents', '10 Integrations', 'Basic Memory (30 Days)', 'Email Support'].map((feat) => (
                    <li key={feat} className="flex items-center gap-2 text-sm text-[#dae2fd]">
                      <CheckCircle className="w-4 h-4 text-violet-300 flex-shrink-0" />
                      {feat}
                    </li>
                  ))}
                </ul>
                <button className="w-full mt-8 py-4 rounded-lg border border-white/20 text-[#dae2fd] hover:bg-[#222a3d] transition-colors text-base font-semibold">
                  Get Started
                </button>
              </div>

              {/* Executive */}
              <div className="bg-[rgba(23,31,51,0.72)] backdrop-blur-xl border border-violet-500/40 shadow-[0_10px_40px_rgba(0,0,0,0.25)] rounded-2xl p-8 flex flex-col relative bg-violet-500/5">
                <div className="absolute top-0 right-8 -translate-y-1/2 bg-violet-300 text-[#3c0091] px-4 py-1 rounded-full text-[10px] font-black uppercase">
                  Most Popular
                </div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-violet-300 mb-4">Executive</h4>
                <p className="text-[#dae2fd] text-4xl font-bold mb-4">$1,999<span className="text-base font-normal text-[#958ea0]">/mo</span></p>
                <p className="text-[#cbc3d7] text-sm mb-8">The full AI board of directors for scale-ups.</p>
                <ul className="space-y-4 mb-auto">
                  {['Unlimited Agents', 'Premium Integrations', 'Infinite Long-term Memory', '24/7 Priority Concierge', 'Multi-Agent Peer Review'].map((feat) => (
                    <li key={feat} className="flex items-center gap-2 text-sm text-[#dae2fd]">
                      <CheckCircle className="w-4 h-4 text-violet-300 flex-shrink-0" />
                      {feat}
                    </li>
                  ))}
                </ul>
                <Link to="/auth">
                  <button className="w-full mt-8 py-4 rounded-lg bg-[#a078ff] text-[#340080] hover:brightness-110 transition-all text-base font-semibold">
                    Start Workspace
                  </button>
                </Link>
              </div>

              {/* Enterprise */}
              <div className="bg-[rgba(23,31,51,0.72)] backdrop-blur-xl border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.25)] rounded-2xl p-8 flex flex-col hover:border-violet-500/30 transition-colors">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#494454] mb-4">Enterprise</h4>
                <p className="text-[#dae2fd] text-4xl font-bold mb-4">Custom</p>
                <p className="text-[#cbc3d7] text-sm mb-8">Bespoke autonomous systems for global scale.</p>
                <ul className="space-y-4 mb-auto">
                  {['Custom Model Training', 'On-Premise Deployment', 'Dedicated AI Architect', 'SSO & Advanced Security'].map((feat) => (
                    <li key={feat} className="flex items-center gap-2 text-sm text-[#dae2fd]">
                      <CheckCircle className="w-4 h-4 text-violet-300 flex-shrink-0" />
                      {feat}
                    </li>
                  ))}
                </ul>
                <button className="w-full mt-8 py-4 rounded-lg border border-white/20 text-[#dae2fd] hover:bg-[#222a3d] transition-colors text-base font-semibold">
                  Contact Sales
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-32 relative overflow-hidden">
          <div className="max-w-4xl mx-auto px-6 relative z-10 text-center bg-[rgba(23,31,51,0.72)] backdrop-blur-xl border border-violet-500/20 shadow-[0_10px_40px_rgba(0,0,0,0.25)] py-16 rounded-[40px]">
            <div className="absolute -top-24 -left-24 w-64 h-64 bg-violet-500/20 blur-[100px] rounded-full" />
            <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-cyan-500/20 blur-[100px] rounded-full" />
            <h2 className="text-4xl md:text-6xl font-bold text-[#dae2fd] mb-6 leading-tight relative z-10">
              Ready to activate your<br />autonomous board?
            </h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
              <Link to="/auth">
                <button className="bg-violet-300 text-[#3c0091] px-8 py-4 rounded-lg font-semibold hover:scale-105 transition-transform text-base">
                  Get Started Now
                </button>
              </Link>
              <button className="bg-transparent border border-[#958ea0] px-8 py-4 rounded-lg font-semibold text-[#dae2fd] hover:bg-white/5 transition-colors text-base">
                Talk to an Expert
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#060e20] py-12 border-t border-white/10">
        <div className="max-w-[1440px] mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-col items-center md:items-start gap-2">
            <span className="text-base font-bold text-[#dae2fd]">ExecOS AI</span>
            <p className="text-sm text-[#cbc3d7]">© 2024 ExecOS AI. Autonomous Business Operating System.</p>
          </div>
          <div className="flex gap-6">
            {['Privacy Policy', 'Terms of Service', 'Security', 'Status'].map((link) => (
              <a key={link} href="#" className="text-sm text-[#cbc3d7] hover:text-cyan-400 transition-colors opacity-80 hover:opacity-100">
                {link}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}