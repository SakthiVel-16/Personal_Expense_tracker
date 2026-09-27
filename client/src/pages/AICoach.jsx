import { useEffect, useState, useRef } from 'react'
import { Bot, Send, Sparkles, TrendingUp, AlertTriangle, Lightbulb, CheckCircle, RotateCcw, Zap, X } from 'lucide-react'
import { useDateRange } from '../context/DateContext.jsx'
import api from '../lib/api.js'

/* ── theme maps ── */
const iconMap = { warning: AlertTriangle, tip: Lightbulb, positive: CheckCircle, alert: AlertTriangle }
const colorMap = {
  warning:  { bg: 'bg-amber-500/8',  border: 'border-amber-500/25', text: 'text-amber-400',  glow: 'shadow-amber-500/5' },
  tip:      { bg: 'bg-indigo-500/8', border: 'border-indigo-500/25', text: 'text-indigo-400', glow: 'shadow-indigo-500/5' },
  positive: { bg: 'bg-emerald-500/8', border: 'border-emerald-500/25', text: 'text-emerald-400', glow: 'shadow-emerald-500/5' },
  alert:    { bg: 'bg-rose-500/8',   border: 'border-rose-500/25', text: 'text-rose-400',   glow: 'shadow-rose-500/5' },
}
const impactBadge = {
  high:   'bg-rose-500/15 text-rose-400 border-rose-500/30',
  medium: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  low:    'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
}

/* ── suggested prompts for empty state ── */
const SUGGESTIONS = [
  { icon: '💰', text: 'Where am I overspending?' },
  { icon: '📊', text: 'Analyze my savings rate' },
  { icon: '🎯', text: 'How can I save ₹5000 this month?' },
  { icon: '📈', text: 'What are my top 3 expense categories?' },
]

export default function AICoach() {
  const [insights, setInsights] = useState(() => {
    const saved = sessionStorage.getItem('ai_insights')
    return saved ? JSON.parse(saved) : null
  })
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState(() => {
    const saved = sessionStorage.getItem('ai_messages')
    return saved ? JSON.parse(saved) : []
  })
  const [input, setInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [showInsightsPanel, setShowInsightsPanel] = useState(false)
  const { range } = useDateRange()
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Auto-show insights panel when insights arrive
  useEffect(() => {
    if (insights) setShowInsightsPanel(true)
  }, [insights])

  const generateInsights = async () => {
    setLoading(true)
    try {
      const r = await api.post('/ai/insights', { start: range.start, end: range.end })
      setInsights(r.data)
      sessionStorage.setItem('ai_insights', JSON.stringify(r.data))
    } catch (e) {
      console.error(e)
      alert('AI Error: ' + (e.response?.data?.error || e.message))
    }
    setLoading(false)
  }

  const sendMessage = async (text) => {
    const msg = (text || input).trim()
    if (!msg || chatLoading) return
    setInput('')
    const newMessages = [...messages, { role: 'user', text: msg }]
    setMessages(newMessages)
    sessionStorage.setItem('ai_messages', JSON.stringify(newMessages))
    setChatLoading(true)
    try {
      const r = await api.post('/ai/chat', { message: msg, start: range.start, end: range.end })
      const updated = [...newMessages, { role: 'ai', text: r.data.reply }]
      setMessages(updated)
      sessionStorage.setItem('ai_messages', JSON.stringify(updated))
    } catch (e) {
      const updated = [...newMessages, { role: 'ai', text: 'Sorry, something went wrong. Please try again.' }]
      setMessages(updated)
      sessionStorage.setItem('ai_messages', JSON.stringify(updated))
    }
    setChatLoading(false)
  }

  const clearChat = () => {
    setMessages([])
    sessionStorage.removeItem('ai_messages')
  }

  const hasMessages = messages.length > 0

  return (
    <div className="page-shell relative bg-transparent overflow-hidden p-0" style={{ height: 'calc(100dvh - 120px)' }}>

      {/* ── Ambient glow ── */}
      <div className="absolute top-[-15%] right-[10%] w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[180px] pointer-events-none" />
      <div className="absolute bottom-[-15%] left-[-5%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[180px] pointer-events-none" />

      {/* ── Main grid: Chat + Insights ── */}
      <div className="relative z-10 h-full flex flex-col lg:flex-row gap-5">

        {/* ════════════════════════════════════════════
            LEFT: Chat Panel (primary — takes most space)
            ════════════════════════════════════════════ */}
        <div className="flex-1 min-w-0 flex flex-col h-full">
          <div className="flex flex-col h-full bg-white/[0.015] backdrop-blur-2xl border border-white/[0.06] rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl shadow-black/20">

            {/* ── Chat Header ── */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-white/[0.06] bg-white/[0.02] shrink-0">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center">
                    <Bot className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-indigo-400" />
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#0a0e1a] shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                </div>
                <div>
                  <p className="text-white/90 text-sm font-semibold tracking-wide">AI Coach</p>
                  <p className="text-white/30 text-[10px] font-medium tracking-wider hidden sm:block">Powered by Gemini · Online</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {hasMessages && (
                  <button onClick={clearChat}
                    className="flex items-center gap-1.5 text-white/30 hover:text-white/70 text-[11px] font-semibold tracking-wide px-3 py-1.5 rounded-lg hover:bg-white/[0.05] transition-all"
                    title="Clear chat">
                    <RotateCcw className="w-3 h-3" /> Clear
                  </button>
                )}
              </div>
            </div>

            {/* ── Chat Messages Area ── */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden">
              {!hasMessages ? (
                /* ── Empty state: Welcome + Suggestions ── */
                <div className="flex flex-col items-center justify-center h-full px-4 sm:px-8 py-8">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/20 flex items-center justify-center mb-5 shadow-lg shadow-indigo-500/10">
                    <Bot className="w-8 h-8 sm:w-10 sm:h-10 text-indigo-400/80" />
                  </div>
                  <h2 className="text-white/90 text-lg sm:text-xl font-bold tracking-tight mb-1.5">Your AI Finance Coach</h2>
                  <p className="text-white/35 text-xs sm:text-sm font-medium text-center max-w-md mb-8">
                    Ask me anything about your spending habits, savings goals, or financial health.
                  </p>

                  {/* Suggestion chips */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-md">
                    {SUGGESTIONS.map((s, i) => (
                      <button key={i} onClick={() => sendMessage(s.text)}
                        className="flex items-center gap-3 text-left px-4 py-3.5 rounded-xl bg-white/[0.025] border border-white/[0.06] hover:bg-white/[0.05] hover:border-white/[0.12] transition-all duration-200 group">
                        <span className="text-lg shrink-0">{s.icon}</span>
                        <span className="text-white/50 text-xs sm:text-[13px] font-medium group-hover:text-white/80 transition-colors leading-snug">{s.text}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                /* ── Message list ── */
                <div className="p-4 sm:p-6 space-y-5">
                  {messages.map((m, i) => (
                    <div key={i} className={`flex gap-2.5 sm:gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                      {m.role === 'ai' && (
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0 mt-0.5">
                          <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-400" />
                        </div>
                      )}
                      <div className={`max-w-[82%] sm:max-w-[75%] px-4 py-3 sm:px-5 sm:py-3.5 text-[13px] sm:text-sm leading-relaxed font-medium ${
                        m.role === 'user'
                          ? 'bg-indigo-500 text-white rounded-2xl rounded-tr-md shadow-lg shadow-indigo-500/15'
                          : 'bg-white/[0.035] border border-white/[0.06] text-white/80 rounded-2xl rounded-tl-md'
                      }`}>
                        {m.text}
                      </div>
                    </div>
                  ))}

                  {/* Typing indicator */}
                  {chatLoading && (
                    <div className="flex gap-2.5 sm:gap-3">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0 mt-0.5">
                        <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-400" />
                      </div>
                      <div className="bg-white/[0.035] border border-white/[0.06] px-5 py-4 rounded-2xl rounded-tl-md flex items-center gap-1.5">
                        {[0, 1, 2].map(i => (
                          <div key={i} className="w-[6px] h-[6px] rounded-full bg-white/30 animate-bounce"
                            style={{ animationDelay: `${i * 0.15}s`, animationDuration: '0.8s' }} />
                        ))}
                      </div>
                    </div>
                  )}
                  <div ref={bottomRef} />
                </div>
              )}
            </div>

            {/* ── Chat Input ── */}
            <div className="shrink-0 px-3 sm:px-5 py-3 sm:py-4 border-t border-white/[0.06] bg-white/[0.015]">
              <div className="flex items-center gap-2 sm:gap-3">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  placeholder="Ask about your finances..."
                  className="flex-1 bg-white/[0.03] border border-white/[0.08] rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3 sm:py-3.5
                    text-white text-xs sm:text-sm font-medium placeholder-white/25 outline-none
                    focus:border-indigo-500/40 focus:bg-white/[0.05] focus:shadow-[0_0_0_3px_rgba(99,102,241,0.08)] transition-all"
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={chatLoading || !input.trim()}
                  className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-30 disabled:hover:bg-indigo-500
                    rounded-xl sm:rounded-2xl flex items-center justify-center transition-all duration-200 shadow-lg shadow-indigo-500/25 shrink-0 group"
                >
                  <Send className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════
            RIGHT: Insights Panel (secondary)
            ════════════════════════════════════════════ */}
        <div className={`
          lg:w-[380px] xl:w-[420px] shrink-0 flex flex-col gap-4
          ${/* Mobile: show as overlay when insights exist */ ''}
          ${showInsightsPanel && insights ? 'fixed inset-0 z-50 bg-black/70 backdrop-blur-sm p-4 lg:relative lg:inset-auto lg:z-auto lg:bg-transparent lg:backdrop-blur-none lg:p-0' : ''}
          ${!showInsightsPanel && insights ? 'hidden lg:flex' : ''}
          ${!insights ? '' : ''}
        `}>

          {/* Close button for mobile overlay */}
          {showInsightsPanel && insights && (
            <button onClick={() => setShowInsightsPanel(false)}
              className="lg:hidden self-end w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white/70 hover:bg-white/20 transition-colors mb-1">
              <X className="w-5 h-5" />
            </button>
          )}

          {/* Generate Insights button — always visible */}
          <button
            onClick={generateInsights}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2.5
              bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400
              disabled:opacity-50 disabled:cursor-not-allowed
              text-white px-6 py-4 rounded-2xl text-sm font-bold tracking-wide
              transition-all duration-300 shadow-xl shadow-indigo-500/20
              hover:shadow-2xl hover:shadow-indigo-500/30 hover:-translate-y-0.5 group shrink-0"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Analyzing your data...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" />
                <span>Generate Insights</span>
              </>
            )}
          </button>

          {/* Clear insights button */}
          {insights && (
            <button
              onClick={() => { setInsights(null); sessionStorage.removeItem('ai_insights'); setShowInsightsPanel(false) }}
              className="w-full flex items-center justify-center gap-2 bg-white/[0.03] hover:bg-white/[0.06] text-white/50 hover:text-white/80
                border border-white/[0.06] px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all shrink-0"
            >
              <RotateCcw className="w-3 h-3" /> Clear insights
            </button>
          )}

          {/* Insights content — scrollable */}
          <div className="flex-1 overflow-y-auto space-y-4 min-h-0 pr-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            {!insights && !loading && (
              <div className="bg-white/[0.015] border border-dashed border-white/[0.08] rounded-2xl p-8 flex flex-col items-center justify-center text-center">
                <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-4">
                  <Zap className="w-7 h-7 text-white/20" />
                </div>
                <p className="text-white/50 text-sm font-semibold mb-1">No insights yet</p>
                <p className="text-white/25 text-xs font-medium max-w-[240px]">Click the button above to generate an AI-powered analysis of your finances</p>
              </div>
            )}

            {loading && (
              <div className="bg-white/[0.015] border border-white/[0.06] rounded-2xl p-8 flex flex-col items-center justify-center">
                <div className="w-8 h-8 border-[3px] border-white/10 border-t-indigo-400 rounded-full animate-spin mb-4" />
                <p className="text-white/50 text-xs font-semibold tracking-wider uppercase">Processing...</p>
              </div>
            )}

            {insights && (
              <>
                {/* Executive Summary */}
                <div className="bg-indigo-500/8 border border-indigo-500/20 rounded-2xl p-5 shadow-lg shadow-indigo-500/5">
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center border border-indigo-500/25">
                      <TrendingUp className="w-4 h-4 text-indigo-400" />
                    </div>
                    <p className="text-indigo-400 text-sm font-bold tracking-wide">Summary</p>
                  </div>
                  <p className="text-white/70 text-[13px] leading-relaxed font-medium">{insights.summary}</p>
                </div>

                {/* Individual insight cards */}
                {insights.insights?.map((ins, i) => {
                  const Icon = iconMap[ins.type] || Lightbulb
                  const theme = colorMap[ins.type] || colorMap.tip
                  const badge = impactBadge[ins.impact] || impactBadge.medium
                  return (
                    <div key={i} className={`${theme.bg} border ${theme.border} rounded-2xl p-4 sm:p-5 transition-all duration-200 hover:-translate-y-0.5 shadow-lg ${theme.glow}`}>
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-lg ${theme.bg} border ${theme.border} flex items-center justify-center shrink-0 mt-0.5`}>
                          <Icon className={`w-4 h-4 ${theme.text}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <p className={`text-sm font-bold ${theme.text} leading-snug`}>{ins.title}</p>
                            <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border shrink-0 ${badge}`}>
                              {ins.impact}
                            </span>
                          </div>
                          <p className="text-white/55 text-xs leading-relaxed font-medium">{ins.message}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </>
            )}
          </div>
        </div>

        {/* ── Mobile FAB: View Insights (only when insights exist and panel is hidden) ── */}
        {insights && !showInsightsPanel && (
          <button
            onClick={() => setShowInsightsPanel(true)}
            className="lg:hidden fixed bottom-6 right-6 z-40 w-14 h-14 bg-indigo-500 hover:bg-indigo-400 rounded-full flex items-center justify-center shadow-2xl shadow-indigo-500/40 transition-all animate-bounce"
            style={{ animationDuration: '2s', animationIterationCount: 3 }}
          >
            <Sparkles className="w-6 h-6 text-white" />
          </button>
        )}
      </div>
    </div>
  )
}
