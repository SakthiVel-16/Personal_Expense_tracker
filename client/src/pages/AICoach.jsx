import { useEffect, useState, useRef } from 'react'
import { Bot, Send, Sparkles, TrendingUp, AlertTriangle, Lightbulb, CheckCircle } from 'lucide-react'
import { useDateRange } from '../context/DateContext.jsx'
import api from '../lib/api.js'

const iconMap = { warning: AlertTriangle, tip: Lightbulb, positive: CheckCircle, alert: AlertTriangle }
const colorMap = {
  warning: 'text-amber-400 bg-amber-500/10 border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.05)]',
  tip: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.05)]',
  positive: 'text-teal-400 bg-teal-500/10 border-teal-500/20 shadow-[0_0_15px_rgba(45,212,191,0.05)]',
  alert: 'text-rose-400 bg-rose-500/10 border-rose-500/20 shadow-[0_0_15px_rgba(243,113,117,0.05)]'
}
const impactColor = { high:'text-rose-400', medium:'text-amber-400', low:'text-teal-400' }

export default function AICoach() {
  const [insights, setInsights] = useState(() => {
    const saved = sessionStorage.getItem('ai_insights')
    return saved ? JSON.parse(saved) : null
  })
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState(() => {
    const saved = sessionStorage.getItem('ai_messages')
    return saved ? JSON.parse(saved) : [
      { role: 'ai', text: "Hi! I'm your AI finance coach powered by Gemini. Ask me anything about your spending, savings, or financial goals — or click **Generate insights** to get a full analysis." }
    ]
  })
  const [input, setInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const { range } = useDateRange()
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const generateInsights = async () => {
    setLoading(true)
    try {
      const r = await api.post('/ai/insights', {
        start: range.start,
        end: range.end
      })
      setInsights(r.data)
      sessionStorage.setItem('ai_insights', JSON.stringify(r.data))
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  const sendMessage = async () => {
    if (!input.trim() || chatLoading) return
    const userMsg = input.trim()
    setInput('')
    const newMessages = [...messages, { role: 'user', text: userMsg }]
    setMessages(newMessages)
    sessionStorage.setItem('ai_messages', JSON.stringify(newMessages))
    setChatLoading(true)
    try {
      const r = await api.post('/ai/chat', {
        message: userMsg,
        start: range.start,
        end: range.end
      })
      const updated = [...newMessages, { role: 'ai', text: r.data.reply }]
      setMessages(updated)
      sessionStorage.setItem('ai_messages', JSON.stringify(updated))
    } catch (e) {
      const updated = [...newMessages, { role: 'ai', text: 'Sorry, something went wrong. Try again.' }]
      setMessages(updated)
      sessionStorage.setItem('ai_messages', JSON.stringify(updated))
    }
    setChatLoading(false)
  }

  return (
    <div className="page-shell relative min-h-screen bg-transparent overflow-hidden p-2 sm:p-4 md:p-0">
      {/* Cinematic Ambient Lighting System */}
      <div className="absolute top-[-10%] right-[20%] w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[150px] pointer-events-none" />

      <div className="relative z-10 space-y-8 max-w-[1700px] mx-auto pb-12 pt-2 md:pt-4">
        
        {/* Header Actions */}
        {insights && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-3 mb-2">
            <div className="flex flex-col sm:flex-row items-stretch gap-3 w-full sm:w-auto">
              <button
                onClick={() => {
                  setInsights(null)
                  sessionStorage.removeItem('ai_insights')
                }}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white/[0.05] hover:bg-white/10 text-white/70 border border-white/5
                px-6 py-3.5 rounded-2xl text-sm font-bold tracking-wide transition-all">
                Clear Cache
              </button>
              <button onClick={generateInsights} disabled={loading}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white text-black hover:bg-white/90 disabled:opacity-50
                px-6 py-3.5 rounded-2xl text-sm font-bold tracking-wide transition-all shadow-lg shadow-white/10 group">
                {loading
                  ? <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"/>
                  : <><Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300"/> Run Diagnostics</>
                }
              </button>
            </div>
          </div>
        )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Insights panel */}
        <div className="space-y-6">
          {!insights && !loading && (
            <div className="bg-white/[0.02] backdrop-blur-2xl border border-dashed border-white/10 rounded-[32px] p-12 flex flex-col items-center justify-center text-center h-full min-h-[400px] hover:bg-white/[0.03] transition-all duration-500">
              <div className="w-20 h-20 rounded-3xl bg-white/[0.05] border border-white/5 flex items-center justify-center mb-6 shadow-inner">
                <Bot className="w-10 h-10 text-white/40"/>
              </div>
              <p className="text-white/90 text-xl font-bold tracking-wide">Awaiting Initialization</p>
              <p className="text-white/40 text-sm mt-2 mb-8 max-w-sm font-medium">
                Run diagnostics to generate a complete intelligence report on your financial patterns.
              </p>
              <button onClick={generateInsights}
                className="flex items-center justify-center gap-2 bg-white text-black hover:bg-white/90
                px-8 py-4 rounded-2xl text-base font-bold tracking-wide transition-all shadow-[0_0_40px_rgba(255,255,255,0.1)] hover:shadow-[0_0_60px_rgba(255,255,255,0.2)] group">
                <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300"/> Generate Insights
              </button>
            </div>
          )}

          {loading && (
            <div className="bg-white/[0.02] backdrop-blur-2xl border border-white/5 rounded-[32px] p-12 flex flex-col items-center justify-center min-h-[400px]">
              <div className="w-10 h-10 border-4 border-white/10 border-t-white rounded-full animate-spin mb-6"/>
              <p className="text-white/70 text-sm font-bold tracking-widest uppercase">Processing System Data...</p>
            </div>
          )}

          {insights && (
            <>
              {/* Summary */}
              <div className="bg-indigo-500/10 backdrop-blur-2xl border border-indigo-500/20 rounded-[32px] p-8 shadow-[0_0_30px_rgba(99,102,241,0.05)]">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                    <TrendingUp className="w-5 h-5 text-indigo-400"/>
                  </div>
                  <p className="text-indigo-400 text-lg font-bold tracking-wide">Executive Summary</p>
                </div>
                <p className="text-white/80 text-base leading-relaxed font-medium">{insights.summary}</p>
              </div>

              {/* Insight cards */}
              {insights.insights?.map((ins, i) => {
                const Icon = iconMap[ins.type] || Lightbulb
                const cls = colorMap[ins.type] || colorMap.tip
                return (
                  <div key={i} className={`backdrop-blur-xl border rounded-[24px] p-6 transition-all hover:-translate-y-1 duration-300 ${cls}`}>
                    <div className="flex items-start gap-4">
                      <Icon className="w-6 h-6 mt-1 shrink-0"/>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-base font-bold tracking-wide">{ins.title}</p>
                          <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-white/5 border border-white/10 ${impactColor[ins.impact]}`}>
                            {ins.impact} impact
                          </span>
                        </div>
                        <p className="text-sm opacity-90 leading-relaxed font-medium">{ins.message}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </>
          )}
        </div>

        {/* Chat panel */}
        <div className="ai-chat-panel bg-white/[0.02] backdrop-blur-2xl border border-white/5 rounded-[32px] flex flex-col h-[700px] overflow-hidden shadow-2xl">
          <div className="ai-chat-header px-8 py-6 border-b border-white/5 bg-white/[0.01] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"/>
              <p className="text-white/90 text-sm font-bold tracking-wide">Interactive Session</p>
            </div>
            <button
              onClick={() => {
                const fresh = [{ role: 'ai', text: "Hi! I'm your AI finance coach powered by Gemini. Ask me anything about your spending, savings, or financial goals — or click **Generate insights** to get a full analysis." }]
                setMessages(fresh)
                sessionStorage.removeItem('ai_messages')
              }}
              className="text-white/40 hover:text-white/80 text-[11px] font-bold uppercase tracking-widest transition-colors">
              Reset Logs
            </button>
          </div>

          {/* Messages */}
          <div className="ai-chat-messages flex-1 overflow-y-auto p-8 space-y-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.role === 'ai' && (
                  <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mr-3 shrink-0 mt-1 shadow-inner">
                    <Bot className="w-4 h-4 text-indigo-400"/>
                  </div>
                )}
                <div className={`max-w-[80%] px-5 py-4 rounded-2xl text-sm leading-relaxed font-medium shadow-lg ${
                  m.role === 'user'
                    ? 'bg-indigo-500 text-white rounded-br-sm shadow-indigo-500/20'
                    : 'bg-white/[0.03] border border-white/5 text-white/80 rounded-bl-sm backdrop-blur-md'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mr-3 shrink-0 mt-1 shadow-inner">
                  <Bot className="w-4 h-4 text-indigo-400"/>
                </div>
                <div className="bg-white/[0.03] border border-white/5 backdrop-blur-md px-5 py-4 rounded-2xl rounded-bl-sm flex items-center shadow-lg">
                  <div className="flex gap-1">
                    {[0,1,2].map(i => (
                      <div key={i} className="w-2 h-2 rounded-full bg-white/40 animate-bounce"
                        style={{animationDelay:`${i*0.15}s`}}/>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef}/>
          </div>

          {/* Input */}
          <div className="ai-chat-input p-6 border-t border-white/5 bg-white/[0.01]">
            <div className="flex gap-2">
              <input value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder="Query system — e.g., 'Where am I overspending?'"
                className="flex-1 bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4
                text-white text-sm font-medium placeholder-white/30 outline-none focus:border-indigo-500/50 focus:bg-white/[0.05] transition-all"/>
              <button onClick={sendMessage} disabled={chatLoading || !input.trim()}
                className="w-14 h-14 bg-white hover:bg-white/90 disabled:opacity-40
                rounded-2xl flex items-center justify-center transition-all shadow-lg shadow-white/10 shrink-0 group">
                <Send className="w-5 h-5 text-black group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"/>
              </button>
            </div>
            <p className="text-white/30 text-[10px] uppercase font-bold tracking-widest mt-4 text-center">
              Gemini 2.5 Flash · Free tier · Your data never leaves your machine
            </p>
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}
