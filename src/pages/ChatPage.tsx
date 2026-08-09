import { useState, useRef, useEffect } from 'react'
import { 
  Paperclip, 
  Send, 
  Share2, 
  UserCircle2, 
  MessageSquare, 
  ChevronRight, 
  Zap, 
  Bot, 
  BarChart2, 
  Megaphone, 
  Search, 
  Shield,
  Sparkles,
  CheckCircle2,
  Clock,
  Loader2
} from 'lucide-react'

// Types
interface Agent {
  name: string
  icon: React.ElementType
  color: string
  border: string
  gradient: boolean
}

interface HistoryItem {
  label: string
  active: boolean
}

interface ExecutionStep {
  label: string
  done: boolean
  active?: boolean
}

// Data
const mentionedAgents: Agent[] = [
  { name: 'CEO Agent', icon: UserCircle2, color: 'text-violet-300', border: 'border-violet-400/40', gradient: true },
  { name: 'Finance', icon: BarChart2, color: 'text-cyan-400', border: 'border-cyan-400/40', gradient: false },
  { name: 'Marketing', icon: Megaphone, color: 'text-blue-400', border: 'border-blue-400/40', gradient: false },
]

const historyItems: HistoryItem[] = [
  { label: 'Q3 Financial Audit Preparation', active: true },
  { label: 'New Market Entry Strategy - APAC', active: false },
  { label: 'Supply Chain Optimization Logs', active: false },
]

const executionSteps: ExecutionStep[] = [
  { label: 'Thinking', done: true },
  { label: 'Gathering Data', done: true },
  { label: 'Analyzing Options', done: false, active: true },
  { label: 'Verification', done: false },
]

export default function ChatPage() {
  const [message, setMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleInput = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }

  const handleSend = () => {
    if (!message.trim()) return
    setIsTyping(true)
    setTimeout(() => {
      setIsTyping(false)
      setMessage('')
    }, 1000)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex h-full bg-[#0b1326] overflow-hidden">
      {/* Chat History & Agents Panel */}
      <aside className="w-80 border-r border-white/10 bg-[rgba(23,31,51,0.72)] backdrop-blur-xl flex-shrink-0 flex-col hidden lg:flex">
        {/* Mentioned Agents */}
        <div className="p-6 border-b border-white/10">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[#cbc3d7] mb-4">
            Mentioned Agents
          </h2>
          <div className="flex gap-3">
            {mentionedAgents.map((agent) => (
              <div key={agent.name} className="group relative">
                <div className={`
                  w-10 h-10 rounded-full p-[2px] cursor-pointer transition-all duration-300
                  ${agent.gradient 
                    ? 'bg-gradient-to-r from-violet-400 to-cyan-400' 
                    : `border ${agent.border}`
                  }
                  hover:scale-110
                `}>
                  <div className="w-full h-full bg-[#171f33] rounded-full flex items-center justify-center">
                    <agent.icon className={`w-5 h-5 ${agent.color}`} />
                  </div>
                </div>
                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-[#2d3449] px-2 py-1 rounded text-[10px] text-[#cbc3d7] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                  {agent.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* History */}
        <div className="flex-1 overflow-y-auto p-4" style={{ scrollbarWidth: 'thin' }}>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[#cbc3d7] mb-4 px-2">
            History
          </h2>
          <div className="space-y-1">
            {historyItems.map((item, i) => (
              <button
                key={i}
                className={`w-full text-left px-3 py-3 rounded-xl flex items-start gap-3 transition-all duration-200 ${
                  item.active
                    ? 'bg-violet-500/10 text-violet-300 border border-violet-400/20'
                    : 'text-[#cbc3d7] hover:bg-white/5'
                }`}
              >
                <MessageSquare className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span className="text-sm line-clamp-1">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Chat Main Window */}
      <main className="flex-1 flex flex-col relative bg-[#0b1326] min-w-0">
        {/* Top bar */}
        <header className="h-16 flex-shrink-0 flex items-center justify-between px-6 border-b border-white/10 bg-[#0b1326]/80 backdrop-blur-xl z-20">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-semibold text-[#dae2fd]">
              Q3 Financial Audit Preparation
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider bg-violet-500/20 text-violet-300 ring-1 ring-violet-400/30">
              Autonomous
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/5 transition-colors">
              <Share2 className="w-5 h-5 text-[#cbc3d7]" />
            </button>
            <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center border border-violet-400/20">
              <UserCircle2 className="w-5 h-5 text-violet-300" />
            </div>
          </div>
        </header>

        {/* Chat Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-12" style={{ scrollbarWidth: 'thin' }}>
          {/* User Message */}
          <div className="max-w-4xl mx-auto flex gap-6 px-4">
            <div className="w-10 h-10 rounded-full bg-[#2d3449] flex-shrink-0 flex items-center justify-center">
              <UserCircle2 className="w-5 h-5 text-[#cbc3d7]" />
            </div>
            <div className="space-y-2 flex-1">
              <p className="text-base text-[#dae2fd] leading-relaxed">
                Can you analyze our current burn rate against the Q3 revenue projections and suggest three cost-cutting measures that won't impact our R&D roadmap?
              </p>
            </div>
          </div>

          {/* Execution Timeline */}
          <div className="max-w-4xl mx-auto px-4">
            <div className="bg-[rgba(23,31,51,0.72)] backdrop-blur-xl border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.25)] p-6 rounded-3xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xs font-semibold text-violet-300 flex items-center gap-2 uppercase tracking-wider">
                  <Search className="w-4 h-4" />
                  Execution Timeline
                </h3>
                <span className="text-[10px] text-[#cbc3d7] font-mono">Process ID: EX-992-CHAT</span>
              </div>
              <div className="relative flex justify-between items-center px-4">
                <div className="absolute top-4 left-8 right-8 h-[2px] bg-slate-700/30 -z-10" />
                {executionSteps.map((step, i) => (
                  <div key={i} className={`flex flex-col items-center gap-2 ${!step.done && !step.active ? 'opacity-30' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${
                      step.done
                        ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/20'
                        : step.active
                        ? 'bg-[#2d3449] border-2 border-cyan-400 animate-pulse'
                        : 'bg-[#2d3449] border border-slate-700'
                    }`}>
                      {step.done ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : step.active ? (
                        <div className="w-2 h-2 rounded-full bg-cyan-400" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-slate-600" />
                      )}
                    </div>
                    <span className={`text-[10px] font-semibold uppercase tracking-wider ${
                      step.done ? 'text-violet-300' : step.active ? 'text-cyan-400' : 'text-[#cbc3d7]'
                    }`}>
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* AI Response */}
          <div className="max-w-4xl mx-auto flex gap-6 px-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-violet-400 to-cyan-400 p-[1px] flex-shrink-0">
              <div className="w-full h-full bg-[#0b1326] rounded-full flex items-center justify-center">
                <Zap className="w-5 h-5 text-violet-300" />
              </div>
            </div>
            <div className="space-y-6 flex-1">
              <div className="text-base text-[#dae2fd] leading-relaxed">
                I've collaborated with the <strong className="text-cyan-400">Finance Agent</strong> to cross-reference your Ledger (ERP) with the current Salesforce projections. Here is the executive breakdown:
              </div>

              {/* Finance Agent Card */}
              <div className="bg-[rgba(23,31,51,0.72)] backdrop-blur-xl border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.25)] p-6 rounded-3xl overflow-hidden relative group">
                <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-400/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-cyan-400/10 transition-colors" />
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-cyan-400/20 flex items-center justify-center">
                    <BarChart2 className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-[#dae2fd]">Finance Audit Report</h4>
                    <p className="text-[10px] text-[#cbc3d7] font-mono">Generated by Finance-Core v4.2</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[#cbc3d7] mb-1">
                      Current Burn Rate
                    </p>
                    <p className="text-2xl font-bold text-rose-400">
                      $142,500<span className="text-xs font-normal opacity-50 ml-1">/mo</span>
                    </p>
                  </div>
                  <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[#cbc3d7] mb-1">
                      Runway (Est.)
                    </p>
                    <p className="text-2xl font-bold text-cyan-400">
                      14.2<span className="text-xs font-normal opacity-50 ml-1">Months</span>
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#cbc3d7] border-b border-white/10 pb-2">
                    Proposed Optimization Measures
                  </p>
                  <ul className="space-y-4">
                    {[
                      { title: 'Cloud Infrastructure:', detail: 'Downsize idle dev environments in AWS region us-east-1.', saving: '$12k/mo' },
                      { title: 'SaaS Consolidation:', detail: '14 duplicate licenses found across Figma/Adobe Creative Cloud.', saving: '$4k/mo' },
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="mt-1.5 w-2 h-2 rounded-full bg-violet-400 flex-shrink-0 shadow-lg shadow-violet-400/40" />
                        <p className="text-sm text-[#dae2fd] leading-normal">
                          <span className="font-bold">{item.title}</span> {item.detail}<br />
                          <span className="text-cyan-400 font-bold">Estimated Savings: {item.saving}.</span>
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="text-base text-[#dae2fd]">
                Would you like me to initiate the{' '}
                <span className="text-violet-300 underline cursor-pointer hover:text-violet-200 transition-colors">
                  AWS Auto-Scale workflow
                </span>{' '}
                or draft an email to the Creative team regarding SaaS consolidation?
              </div>
            </div>
          </div>

          {/* Typing Indicator */}
          {isTyping && (
            <div className="max-w-4xl mx-auto flex gap-6 px-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-violet-400 to-cyan-400 p-[1px] flex-shrink-0">
                <div className="w-full h-full bg-[#0b1326] rounded-full flex items-center justify-center">
                  <Loader2 className="w-5 h-5 text-violet-300 animate-spin" />
                </div>
              </div>
              <div className="flex items-center gap-1 text-[#cbc3d7]">
                <span className="animate-pulse">•</span>
                <span className="animate-pulse delay-100">•</span>
                <span className="animate-pulse delay-200">•</span>
              </div>
            </div>
          )}

          <div className="h-40" />
        </div>

        {/* Input Area */}
        <div className="flex-shrink-0 p-6 border-t border-white/10 bg-[#0b1326]/95 backdrop-blur-2xl z-30 shadow-[0_-10px_30px_rgba(0,0,0,0.3)]">
          <div className="max-w-4xl mx-auto relative px-4">
            {/* Agent Tooltip Bar */}
            <div className="absolute -top-12 left-4 flex gap-2">
              <div className="px-3 py-1 bg-[#2d3449] border border-white/20 rounded-full text-[10px] text-[#cbc3d7] flex items-center gap-2 hover:bg-white/5 transition-colors cursor-pointer">
                <Search className="w-3 h-3" /> Search Agents
              </div>
              <div className="px-3 py-1 bg-violet-500/10 border border-violet-400/20 rounded-full text-[10px] text-violet-300 flex items-center gap-2">
                <Zap className="w-3 h-3" /> Auto-Agent Select: ON
              </div>
            </div>

            {/* Main Input */}
            <div className="bg-[rgba(23,31,51,0.72)] backdrop-blur-xl border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.25)] p-3 rounded-3xl focus-within:border-violet-400/50 transition-all">
              <div className="flex items-end gap-3">
                <button className="w-12 h-12 flex items-center justify-center rounded-xl bg-[#2d3449] text-[#cbc3d7] hover:text-violet-300 transition-colors hover:bg-violet-500/10">
                  <Paperclip className="w-5 h-5" />
                </button>
                <textarea
                  ref={textareaRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onInput={handleInput}
                  onKeyDown={handleKeyDown}
                  placeholder="Message ExecOS AI or mention an @agent..."
                  rows={1}
                  className="flex-1 bg-transparent border-none focus:outline-none text-[#dae2fd] placeholder:text-[#958ea0] text-base py-3 resize-none"
                  style={{ maxHeight: '200px', scrollbarWidth: 'thin' }}
                />
                <button
                  onClick={handleSend}
                  disabled={!message.trim()}
                  className="w-12 h-12 flex items-center justify-center rounded-xl bg-gradient-to-r from-violet-300 via-violet-400 to-cyan-400 text-[#340080] hover:scale-[1.05] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Status Bar */}
            <div className="mt-4 flex items-center justify-between px-2">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-lg shadow-cyan-400/50" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#cbc3d7]">
                    Live Audit Stream Active
                  </span>
                </div>
                <div className="h-3 w-[1px] bg-white/10" />
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[#cbc3d7]" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#cbc3d7]">
                    Enterprise Secured
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-[#cbc3d7]">
                <span className="text-[10px] font-semibold uppercase tracking-wider">⌘K for Commands</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}