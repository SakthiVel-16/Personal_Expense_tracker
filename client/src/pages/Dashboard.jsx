import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, Wallet, HeartPulse, AlertTriangle, ShieldAlert, Activity, Zap, Sparkles, Info } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Link, useNavigate } from 'react-router-dom'
import { useDateRange } from '../context/DateContext.jsx'
import api from '../lib/api.js'

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`

function KPICard({ label, value, sub, icon: Icon, color, trend }) {
  return (
    <div className="bg-white/[0.02] backdrop-blur-2xl border border-white/5 rounded-[32px] px-6 py-6 hover:bg-white/[0.04] hover:border-white/10 hover:-translate-y-1 transition-all duration-500 group relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-[50px] rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color} bg-white/[0.03] border border-white/5 shadow-inner group-hover:scale-110 transition-transform duration-500`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend !== undefined && (
          <span className={`text-[11px] font-bold tracking-wide px-2.5 py-1 rounded-full border ${trend >= 0 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
            {trend >= 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <p className="text-white/40 text-[11px] tracking-[0.2em] uppercase font-bold mb-2">{label}</p>
      <p className="text-white text-4xl font-black tracking-tighter">{value}</p>
      {sub && <p className="text-white/30 text-xs tracking-wide mt-2 font-medium">{sub}</p>}
    </div>
  )
}

function HealthScore({ score }) {
  const [showTooltip, setShowTooltip] = useState(false)
  const color = score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444'
  const label = score >= 70 ? 'Excellent' : score >= 40 ? 'Fair' : 'Needs Work'
  const r = 50
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ

  const scoreBreakdown = [
    { label: 'Base Score', points: 50, description: 'Starting point for all users' },
    { label: 'Savings Rate', points: '±25', description: 'Based on income vs expenses ratio' },
    { label: 'Budget Adherence', points: '±25', description: 'How well you stick to budgets' },
    { label: 'Spending Consistency', points: '±30', description: 'Stability of spending patterns' }
  ]

  const scoreRanges = [
    { min: 85, max: 100, label: 'Wealth Builder', emoji: '🟢' },
    { min: 70, max: 84, label: 'Excellent', emoji: '🟢' },
    { min: 55, max: 69, label: 'Strong', emoji: '🟡' },
    { min: 40, max: 54, label: 'Stable', emoji: '🟡' },
    { min: 25, max: 39, label: 'Weak', emoji: '🔴' },
    { min: 0, max: 24, label: 'Critical', emoji: '🔴' }
  ]

  return (
    <div className="bg-white/[0.02] backdrop-blur-2xl border border-white/5 rounded-[32px] p-8 flex flex-col items-center justify-center relative overflow-visible group hover:border-white/10 transition-colors duration-500">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      <div className="relative w-full mb-8">
        <div className="flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <p className="text-white/40 text-[11px] uppercase tracking-[0.2em] font-bold">AI Wealth Score</p>
          <div 
            className="relative group/info"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <button className="p-1 hover:bg-white/10 rounded-full transition-colors duration-300 cursor-help">
              <Info className="w-4 h-4 text-white/40 hover:text-white/60" />
            </button>
            
            {showTooltip && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-[280px] sm:w-80 bg-[#0a0e27]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl shadow-black/70 z-[9999]">
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-[#0a0e27]/95 border-b border-r border-white/10 rotate-45"></div>
                
                <p className="text-white font-bold text-base mb-3 pb-3 border-b border-white/10">What is AI Wealth Score?</p>
                
                <p className="text-white/70 text-sm mb-4 leading-relaxed">
                  A comprehensive financial health metric (0-100) that combines savings rate, budget adherence, and spending consistency to show your overall financial well-being.
                </p>

                <p className="text-white/50 text-xs uppercase tracking-widest font-bold mb-2">Score Breakdown:</p>
                <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                  {scoreBreakdown.map((item, idx) => (
                    <div key={idx} className="bg-white/5 border border-white/5 rounded-lg p-3">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-white/80 text-sm font-semibold">{item.label}</span>
                        <span className="text-indigo-400 text-sm font-bold">{item.points} pts</span>
                      </div>
                      <p className="text-white/40 text-xs">{item.description}</p>
                    </div>
                  ))}
                </div>

                <p className="text-white/50 text-xs uppercase tracking-widest font-bold mb-2">Score Ranges:</p>
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {scoreRanges.map((range, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <span className="text-white/70">{range.emoji} {range.label}</span>
                      <span className="text-white/40">{range.min}-{range.max}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="relative w-40 h-40">
        {/* Outer ambient glow */}
        <div className="absolute inset-0 rounded-full opacity-20 blur-xl" style={{ backgroundColor: color }} />
        <svg className="w-full h-full -rotate-90 relative z-10" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={r} fill="none" stroke="#ffffff05" strokeWidth="6" />
          <circle cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="6"
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 1.5s ease-out' }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
          <span className="text-white text-5xl font-black tracking-tighter">{score}</span>
        </div>
      </div>
      <p className="text-[11px] uppercase tracking-[0.2em] mt-8 font-bold" style={{ color }}>{label}</p>
    </div>
  )
}

const COLORS = ['#6366f1','#f59e0b','#10b981','#ef4444','#8b5cf6','#ec4899','#14b8a6','#f97316']

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-transparent/90 backdrop-blur-xl border border-white/10 rounded-2xl p-4 text-sm shadow-2xl shadow-black/50">
      <p className="text-white/50 mb-3 font-semibold tracking-wide uppercase text-[10px]">{label}</p>
      <div className="space-y-2">
        {payload.map(p => (
          <div key={p.name} className="flex items-center justify-between gap-6">
            <span className="text-white/80 font-medium">{p.name}</span>
            <span className="font-bold tracking-tight" style={{ color: p.color }}>{fmt(p.value)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { range } = useDateRange()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!range.start || !range.end) return
    setLoading(true)
    api.get('/analytics/summary', { params: { start: range.start, end: range.end } })
      .then(r => { setData(r.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [range.start, range.end])

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="w-6 h-6 border-2 border-white/10 border-t-white rounded-full animate-spin" />
    </div>
  )

  const {
    income=0, expense=0, savings=0, savingsRate=0,
    byCategory=[], daily=[], topExpenses=[],
    anomalies=[], healthScore=0
  } = data || {}

  const chartMap = {}
  daily.forEach(d => {
    if (!chartMap[d.date]) chartMap[d.date] = { date: d.date, income: 0, expense: 0 }
    chartMap[d.date][d.type] = d.total
  })
  const chartData = Object.values(chartMap)

  return (
    <div className="page-shell relative min-h-screen bg-transparent overflow-hidden p-2 sm:p-4 md:p-0">
      {/* Cinematic Ambient Lighting System */}
      <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-fuchsia-600/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute top-[40%] left-[50%] -translate-x-1/2 w-[800px] h-[400px] bg-cyan-500/5 rounded-full blur-[150px] pointer-events-none" />
      
      <div className="relative z-10 space-y-8 pb-12 max-w-[1700px] mx-auto">

      {/* Hero OS Header */}
      <div className="flex flex-col items-center justify-center py-10 mb-4">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/10 mb-6 backdrop-blur-md">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-white/60 text-[10px] font-bold tracking-[0.2em] uppercase">System Active</span>
        </div>
        <p className="text-white/40 text-xs uppercase tracking-[0.3em] font-bold mb-4">Net Wealth</p>
        <h1 className="text-7xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-white/90 to-white/40 tracking-tighter drop-shadow-2xl">
          {fmt(savings)}
        </h1>
      </div>

      {/* Empty state */}
      {income === 0 && expense === 0 && (
        <div className="bg-white/[0.02] backdrop-blur-xl border border-white/5 rounded-[32px] p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/40 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-white/90 font-bold tracking-wide">No system data available</p>
            <p className="text-white/40 text-sm mt-1">Awaiting transaction logs for the selected timeframe.</p>
          </div>
        </div>
      )}

      {/* Anomaly banner */}
      {anomalies.length > 0 && (
        <div className="bg-amber-500/10 backdrop-blur-xl border border-amber-500/20 rounded-[32px] p-6 flex items-center gap-5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-transparent pointer-events-none" />
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-400 shrink-0 relative z-10 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div className="flex-1 relative z-10">
            <p className="text-amber-400 font-bold tracking-wide">{anomalies.length} unusual transaction{anomalies.length > 1 ? 's' : ''} detected</p>
            <p className="text-amber-400/70 text-sm mt-1 font-medium">
              {anomalies[0]?.description} ({fmt(anomalies[0]?.amount)}) is significantly higher than your average.
            </p>
          </div>
          <Link to="/analytics" className="relative z-10 text-amber-950 bg-amber-400 hover:bg-amber-300 px-5 py-2.5 text-sm font-bold tracking-wide transition-colors rounded-xl shadow-lg shadow-amber-500/20">
            View Details
          </Link>
        </div>
      )}

      {/* KPI row */}
      <div className="dashboard-kpis grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <KPICard label="Total Income" value={fmt(income)} icon={TrendingUp}
          color="text-teal-400" sub="Inflow this period" />
        <KPICard label="Total Expenses" value={fmt(expense)} icon={TrendingDown}
          color="text-rose-400" sub="Outflow this period" />
        <KPICard label="Net Savings" value={fmt(savings)} icon={Wallet}
          color="text-indigo-400" 
          sub="System generated net"
          trend={savingsRate} />
        <KPICard label="Top Expense" value={topExpenses[0] ? fmt(topExpenses[0].amount) : '—'}
          icon={Activity} color="text-fuchsia-400"
          sub={topExpenses[0]?.description || 'No expenses yet'} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="col-span-2 bg-white/[0.02] backdrop-blur-2xl border border-white/5 rounded-[32px] p-8 hover:border-white/10 transition-colors duration-500">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40">
              <Activity className="w-4 h-4" />
            </div>
            <p className="text-white/80 text-sm font-bold tracking-widest uppercase">System Cash Flow</p>
          </div>
          {chartData.length === 0 ? (
            <div className="h-72 flex items-center justify-center text-white/30 text-sm border border-dashed border-white/5 rounded-2xl font-medium tracking-wide">
              No transaction data for this month
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="gIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fb7185" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fill: '#ffffff40', fontSize: 11, fontWeight: 600 }}
                  tickFormatter={d => d.slice(5)} axisLine={false} tickLine={false} dy={10} />
                <YAxis tick={{ fill: '#ffffff40', fontSize: 11, fontWeight: 600 }} axisLine={false}
                  tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} dx={-10} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2, strokeDasharray: '4 4' }} />
                <Area type="monotone" dataKey="income" stroke="#2dd4bf" strokeWidth={3}
                  fill="url(#gIncome)" name="Income" />
                <Area type="monotone" dataKey="expense" stroke="#fb7185" strokeWidth={3}
                  fill="url(#gExpense)" name="Expense" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
        <HealthScore score={healthScore} />
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Spending by category */}
        <div className="bg-white/[0.02] backdrop-blur-2xl border border-white/5 rounded-[32px] p-8 hover:border-white/10 transition-colors duration-500">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40">
                <Zap className="w-4 h-4" />
              </div>
              <p className="text-white/80 text-sm font-bold tracking-widest uppercase">Spending Matrix</p>
            </div>
            <span className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em] bg-white/5 px-3 py-1 rounded-full">{byCategory.length} Nodes</span>
          </div>
          {byCategory.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-white/30 text-sm font-medium tracking-wide text-center border border-dashed border-white/5 rounded-2xl">
              No expense data yet
            </div>
          ) : (
            <div className="space-y-6 max-h-[350px] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              {byCategory.map((cat, i) => {
                const pct = Math.round((cat.total / byCategory[0].total) * 100)
                const totalPct = Math.round((cat.total / expense) * 100)
                return (
                  <div
                    key={i}
                    onClick={() => navigate(`/transactions?category=${encodeURIComponent(cat.name)}`)}
                    className="cursor-pointer group relative"
                  >
                    {/* Label row */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-white/[0.05] border border-white/5 flex items-center justify-center text-xs shadow-inner group-hover:bg-white/10 transition-colors">
                          {cat.icon}
                        </div>
                        <span className="text-white/70 text-sm font-semibold group-hover:text-white transition-colors tracking-wide">
                          {cat.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-white/40 text-[11px] font-bold">{totalPct}%</span>
                        <span className="text-white/90 text-sm font-black tracking-tight w-20 text-right">{fmt(cat.total)}</span>
                      </div>
                    </div>
                    {/* Bar */}
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_currentColor]"
                        style={{
                          width: `${pct}%`,
                          background: cat.color || COLORS[i % COLORS.length]
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Top expenses */}
        <div className="bg-white/[0.02] backdrop-blur-2xl border border-white/5 rounded-[32px] p-8 hover:border-white/10 transition-colors duration-500">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40">
              <HeartPulse className="w-4 h-4" />
            </div>
            <p className="text-white/80 text-sm font-bold tracking-widest uppercase">Major Outflows</p>
          </div>
          {topExpenses.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-white/30 text-sm font-medium tracking-wide text-center border border-dashed border-white/5 rounded-2xl">
              No expenses yet
            </div>
          ) : (
            <div className="space-y-2">
              {topExpenses.map((t, i) => (
                <div key={i} className="flex items-center justify-between group hover:bg-white/[0.04] p-4 rounded-2xl transition-all duration-300 border border-transparent hover:border-white/10 hover:shadow-lg hover:shadow-black/20">
                  <div className="flex items-center gap-5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/5 flex items-center justify-center text-sm shrink-0 shadow-inner group-hover:scale-110 transition-transform duration-300">
                      {t.category_icon || '💸'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-white/90 text-sm font-bold truncate tracking-wide">{t.description || 'No description'}</p>
                      <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">{t.category_name}</p>
                    </div>
                  </div>
                  <span className="text-white text-lg font-black tracking-tighter shrink-0 ml-4 group-hover:text-rose-400 transition-colors">{fmt(t.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  )
}
