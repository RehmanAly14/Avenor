import { useState, useRef, useEffect } from 'react'

const currentSql = `SELECT
  user_id,
  MIN(timestamp) as session_start,
  MAX(timestamp) as session_end,
  COUNT(*) as event_count
FROM {{ ref('stg_events') }}
GROUP BY 1
-- Missing attribution logic
-- Needs optimization for large tables`

const aiSql = [
  { text: 'WITH session_calc AS (', type: 'normal' },
  { text: '  SELECT', type: 'normal' },
  { text: '    user_id,', type: 'normal' },
  { text: '    timestamp,', type: 'normal' },
  { text: '    LAG(timestamp) OVER (', type: 'normal' },
  { text: "      PARTITION BY user_id ORDER BY timestamp", type: 'normal' },
  { text: '    ) as prev_event', type: 'normal' },
  { text: "  FROM {{ ref('stg_events') }}", type: 'normal' },
  { text: ')', type: 'normal' },
  { text: 'SELECT', type: 'added' },
  { text: '  user_id,', type: 'added' },
  { text: '  MIN(timestamp) as session_start,', type: 'added' },
  { text: '  MAX(timestamp) as session_end,', type: 'added' },
  { text: '  COUNT(*) as event_count,', type: 'added' },
  { text: '  FIRST_VALUE(utm_source) OVER (...) as source', type: 'added' },
  { text: 'FROM session_calc', type: 'normal' },
  { text: 'GROUP BY 1', type: 'normal' },
]

const openFiles = [
  { name: 'user_sessions.sql', icon: 'database', active: true },
  { name: 'schema.yml', icon: 'settings_suggest' },
  { name: 'staging_events.dbt', icon: 'table_rows' },
]

export default function CodeStudioPage() {
  const [showAssistant, setShowAssistant] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const [activeFile, setActiveFile] = useState(openFiles[0])
  const [lineCount, setLineCount] = useState(currentSql.split('\n').length)
  const assistantRef = useRef<HTMLDivElement>(null)
  const [isMobile, setIsMobile] = useState(false)

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Handle tab click
  const handleTabClick = (file: typeof openFiles[0]) => {
    setActiveFile(file)
    const newFiles = openFiles.map(f => ({ ...f, active: f.name === file.name }))
    // Update active state
    openFiles.forEach(f => f.active = f.name === file.name)
  }

  // Close assistant
  const closeAssistant = () => setShowAssistant(false)

  // Send chat message
  const handleSendChat = () => {
    if (!chatInput.trim()) return
    // In a real app, this would send to AI
    setChatInput('')
  }

  // Handle Enter key for chat
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendChat()
    }
  }

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col relative overflow-hidden">
      {/* File Path / Context Bar - Responsive */}
      <div className="h-8 md:h-10 border-b border-outline-variant flex flex-wrap items-center gap-2 md:gap-6 px-3 md:px-4 bg-surface-container-low shrink-0">
        <div className="flex items-center gap-1 md:gap-2 text-on-surface-variant text-[10px] md:text-[12px] min-w-0">
          <span className="material-symbols-outlined text-[14px] md:text-[18px]">folder_open</span>
          <span className="font-medium truncate">projects / avenor-analytics / models</span>
        </div>
        <div className="h-3 md:h-4 w-[1px] bg-outline-variant hidden sm:block"></div>
        <div className="flex items-center gap-1 md:gap-2">
          <span className="text-[9px] md:text-[11px] font-semibold px-1.5 md:px-2 py-0.5 rounded bg-tertiary-container text-on-tertiary-container">Main</span>
          <span className="material-symbols-outlined text-[12px] md:text-[16px] text-outline">sync</span>
        </div>
      </div>

      {/* Tab Bar - Responsive */}
      <div className="h-8 md:h-10 border-b border-outline-variant flex items-center bg-surface-container-low px-2 md:px-4 gap-0.5 md:gap-1 shrink-0 overflow-x-auto">
        {openFiles.map(file => (
          <div
            key={file.name}
            onClick={() => handleTabClick(file)}
            className={`px-2 md:px-4 h-full flex items-center gap-1 md:gap-2 rounded-t-sm text-[10px] md:text-[11px] cursor-pointer transition-colors whitespace-nowrap
              ${file.active
                ? 'bg-surface-container-lowest border-x border-t border-outline-variant border-b-2 border-b-primary font-medium text-on-surface'
                : 'text-on-surface-variant hover:bg-surface-container'
              }
            `}
          >
            <span className={`material-symbols-outlined text-[12px] md:text-[14px] ${file.active ? 'text-primary' : ''}`}>{file.icon}</span>
            <span className="hidden sm:inline">{file.name}</span>
            <span className="sm:hidden">{file.name.split('.')[0]}</span>
            <span className="material-symbols-outlined text-[12px] md:text-[14px] opacity-40 hover:opacity-80">close</span>
          </div>
        ))}
      </div>

      {/* Editor Surface */}
      <section className="flex-1 flex overflow-hidden bg-surface-container-lowest">
        {/* Left: Current Production */}
        <div className="flex-1 flex flex-col border-r border-outline-variant min-w-0">
          <div className="h-6 md:h-8 flex items-center px-2 md:px-4 bg-surface-dim/30 text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-outline">
            Current Production
          </div>
          <div className="flex-1 overflow-auto p-3 md:p-6 font-mono text-[11px] md:text-[13px] leading-relaxed bg-white">
            <div className="flex gap-2 md:gap-4">
              <div className="text-outline text-right select-none w-6 md:w-8 space-y-0 text-[10px] md:text-[13px]">
                {currentSql.split('\n').map((_, i) => (
                  <div key={i} className="leading-relaxed">{i + 1}</div>
                ))}
              </div>
              <div className="flex-1 overflow-x-auto">
                {currentSql.split('\n').map((line, i) => {
                  const isComment = line.trim().startsWith('--')
                  const isKeyword = /^(SELECT|FROM|GROUP BY|WHERE|WITH|PARTITION BY|ORDER BY|AS)/i.test(line.trim())
                  return (
                    <div key={i} className="leading-relaxed whitespace-pre-wrap break-words">
                      <span className={isComment ? 'syntax-comment' : isKeyword ? 'syntax-keyword' : 'text-on-surface'}>
                        {line || ' '}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right: AI Generated Solution */}
        <div className={`flex-1 flex flex-col relative transition-all duration-300 min-w-0 ${showAssistant ? (isMobile ? 'hidden' : 'mr-80') : ''}`}>
          <div className="h-6 md:h-8 flex items-center px-2 md:px-4 bg-primary-container/10 text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-primary justify-between shrink-0">
            <span className="truncate">AI Generated Solution</span>
            <div className="flex items-center gap-1 md:gap-2">
              <span className="w-1 md:w-1.5 h-1 md:h-1.5 bg-primary rounded-full animate-pulse"></span>
              <span className="hidden sm:inline">Refined by Avenor AI</span>
              <span className="sm:hidden">AI</span>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-3 md:p-6 font-mono text-[11px] md:text-[13px] leading-relaxed bg-white relative">
            <div className="flex gap-2 md:gap-4 relative z-10">
              <div className="text-outline text-right select-none w-6 md:w-8 text-[10px] md:text-[13px]">
                {aiSql.map((_, i) => (
                  <div key={i} className="leading-relaxed">{i + 1}</div>
                ))}
              </div>
              <div className="flex-1 overflow-x-auto">
                {aiSql.map((line, i) => (
                  <div
                    key={i}
                    className={`leading-relaxed whitespace-pre-wrap break-words ${line.type === 'added' ? 'diff-added pl-1 md:pl-2' : ''}`}
                  >
                    {line.type === 'added' && (
                      <span className="text-tertiary mr-1 md:mr-2">+</span>
                    )}
                    <span className={/^(WITH|SELECT|FROM|GROUP BY|PARTITION BY|ORDER BY|OVER|AS)\b/.test(line.text.trim()) ? 'syntax-keyword' : 'text-on-surface'}>
                      {line.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Assistant Slide Panel - Responsive */}
        <div 
          ref={assistantRef}
          className={`absolute top-0 right-0 h-full w-72 md:w-80 bg-surface border-l border-outline-variant flex flex-col drawer-transition z-20 ${
            showAssistant ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="p-3 md:p-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-low">
            <h3 className="text-[12px] md:text-[14px] font-bold">Avenor Assistant</h3>
            <button className="p-1 hover:bg-surface-container-highest rounded" onClick={closeAssistant}>
              <span className="material-symbols-outlined text-[16px] md:text-[18px]">close</span>
            </button>
          </div>
          <div className="flex-1 p-3 md:p-4 overflow-y-auto space-y-3 md:space-y-4">
            <div className="bg-surface-container p-2 md:p-3 rounded-lg text-[12px] md:text-[14px]">
              Can you optimize the join on the events table?
            </div>
            <div className="bg-primary/5 p-2 md:p-3 rounded-lg text-[12px] md:text-[14px] border border-primary/10">
              I've already applied a cluster key optimization in the generated solution to ensure partition pruning.
            </div>
          </div>
          <div className="p-3 md:p-4 border-t border-outline-variant">
            <div className="relative">
              <input
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-1.5 md:py-2 pl-2 md:pl-3 pr-8 md:pr-10 text-[12px] md:text-[14px] focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all"
                placeholder="Ask Avenor..."
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button 
                onClick={handleSendChat}
                className="absolute right-1.5 md:right-2.5 top-1/2 -translate-y-1/2 text-primary hover:opacity-80 transition-opacity"
              >
                <span className="material-symbols-outlined text-[16px] md:text-[18px]">auto_awesome</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Floating Actions - Responsive */}
      <div className="fixed bottom-4 md:bottom-10 right-4 md:right-10 flex flex-col items-end gap-3 md:gap-4 z-50 w-[calc(100%-2rem)] md:w-auto">
        {/* AI Explanation Card */}
        <div className="bg-surface-container-lowest border border-outline-variant p-3 md:p-4 rounded-xl shadow-lg max-w-[280px] md:max-w-sm hover:scale-[1.02] cursor-default transition-all w-full md:w-auto">
          <div className="flex items-center gap-1.5 md:gap-2 mb-1 md:mb-2">
            <span className="material-symbols-outlined text-primary text-[16px] md:text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
            <span className="font-bold text-[12px] md:text-[14px]">Context Intelligence</span>
          </div>
          <p className="text-[12px] md:text-[14px] text-on-surface-variant leading-snug">
            I've refactored this query to include window-based sessionization. This reduces compute costs by{' '}
            <span className="text-tertiary font-bold">14%</span> and adds multi-touch attribution logic requested in ticket{' '}
            <span className="underline text-primary">#AV-892</span>.
          </p>
        </div>

        {/* Open PR Button */}
        <button className="bg-primary-container text-on-primary-container flex items-center gap-2 md:gap-3 px-4 md:px-8 py-2.5 md:py-4 rounded-full font-bold shadow-xl hover:scale-[1.05] active:scale-[0.98] transition-all group text-[12px] md:text-[14px] w-full md:w-auto justify-center">
          <span className="material-symbols-outlined group-hover:rotate-12 transition-transform text-[18px] md:text-[20px]">merge</span>
          <span className="hidden sm:inline">Open Pull Request</span>
          <span className="sm:hidden">Open PR</span>
          <span className="material-symbols-outlined text-sm opacity-50">arrow_forward</span>
        </button>
      </div>

      {/* Assistant Panel Toggle */}
      <button
        className="fixed top-1/2 right-0 -translate-y-1/2 bg-white border border-outline-variant border-r-0 rounded-l-xl p-1.5 md:p-2 shadow-md hover:bg-surface-container-low transition-colors z-40"
        onClick={() => setShowAssistant(v => !v)}
      >
        <span className="material-symbols-outlined text-primary text-[18px] md:text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
      </button>
    </div>
  )
}