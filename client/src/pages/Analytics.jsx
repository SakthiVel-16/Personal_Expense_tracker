import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, TrendingDown, Minus, AlertTriangle, ArrowUpRight, Repeat, Smartphone, Zap, ShieldAlert, Activity } from 'lucide-react'
import { useDateRange } from '../context/DateContext.jsx'
import api from '../lib/api.js'

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`
const COLORS = ['#2dd4bf','#fb7185','#818cf8','#f472b6','#fbbf24','#34d399','#a78bfa','#22d3ee','#f87171','#e879f9']

const Tip = ({ active, payload, label }) => active && payload?.length ? (
  <div className="bg-[#050816]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-4 text-sm shadow-2xl shadow-black/50">
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
) : null

// Velocity badge component
function VelocityBadge({ value }) {
  if (value === null || value === undefined) return (
    <span className="text-white/30 text-[10px] uppercase font-bold tracking-widest">no prev data</span>
  )
  const color = value <= 0 ? 'text-teal-400 bg-teal-500/10 border-teal-500/20'
    : value <= 15 ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
    : 'text-rose-400 bg-rose-500/10 border-rose-500/20'
  const Icon = value < 0 ? TrendingDown : value === 0 ? Minus : TrendingUp
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide border ${color}`}>
      <Icon className="w-3.5 h-3.5"/>
      {value > 0 ? '+' : ''}{value}%
    </span>
  )
}

export default function Analytics() {
  const { range } = useDateRange()
  const [data, setData] = useState(null)
  const [velocity, setVelocity] = useState(null)
  const [leaks, setLeaks] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!range.start || !range.end) return
    setLoading(true)
    Promise.all([
      api.get('/analytics/summary', { params: { start: range.start, end: range.end } }),
      api.get('/analytics/velocity', { params: { start: range.start, end: range.end } }),
      api.get('/savings/leaks')
    ]).then(([summaryRes, velocityRes, leaksRes]) => {
      setData(summaryRes.data)
      setVelocity(velocityRes.data)
      setLeaks(leaksRes.data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [range.start, range.end])

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="w-8 h-8 border-2 border-white/10 border-t-white rounded-full animate-spin"/>
    </div>
  )

  const {
    income=0, expense=0, savings=0, savingsRate=0,
    byCategory=[], daily=[], anomalies=[]
  } = data || {}

  const chartMap = {}
  daily.forEach(d => {
    if (!chartMap[d.date]) chartMap[d.date] = { date: d.date.slice(5), income:0, expense:0 }
    chartMap[d.date][d.type] = d.total
  })
  const chartData = Object.values(chartMap)

  const velocityColor = !velocity?.overallVelocity ? 'text-white/40'
    : velocity.overallVelocity <= 0 ? 'text-teal-400'
    : velocity.overallVelocity <= 15 ? 'text-amber-400'
    : 'text-rose-400'

  const velocityLabel = !velocity?.overallVelocity ? 'No previous data'
    : velocity.overallVelocity <= -10 ? 'Spending slowing down 🟢'
    : velocity.overallVelocity <= 0 ? 'Spending stable 🟢'
    : velocity.overallVelocity <= 15 ? 'Slight increase 🟡'
    : velocity.overallVelocity <= 30 ? 'Accelerating 🔴'
    : 'Serious lifestyle creep 🚨'

  return (
    <div className="page-shell relative min-h-screen bg-[#050816] overflow-hidden -m-6 p-6 md:p-8 rounded-[35px]">
      {/* Cinematic Ambient Lighting System */}
      <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-rose-600/10 rounded-full blur-[150px] pointer-events-none" />

      <div className="relative z-10 space-y-8 max-w-[1700px] mx-auto pb-12">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-white text-4xl font-black tracking-tighter">System Analytics</h1>
          <p className="text-white/40 text-sm font-medium mt-1.5 tracking-wide">Deep insights, velocity tracking, and anomaly detection.</p>
        </div>
      </div>
      
      {/* SECTION 1: KPIs */}
      <div className="analytics-kpis grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label:'Total Inflow', value: fmt(income), color:'text-teal-400', border: 'border-teal-500/20' },
          { label:'Total Outflow', value: fmt(expense), color:'text-rose-400', border: 'border-rose-500/20' },
          { label:'Net Delta', value: fmt(savings), color:'text-indigo-400', border: 'border-indigo-500/20' },
          { label:'Retention Rate', value: `${savingsRate}%`,
            color: savingsRate>=20?'text-teal-400':savingsRate>=10?'text-amber-400':'text-rose-400',
            border: savingsRate>=20?'border-teal-500/20':savingsRate>=10?'border-amber-500/20':'border-rose-500/20'
          },
        ].map(k => (
          <div key={k.label} className={`bg-white/[0.02] backdrop-blur-2xl border ${k.border} rounded-[32px] px-8 py-6 hover:bg-white/[0.04] transition-colors`}>
            <p className="text-white/40 text-[11px] tracking-[0.2em] font-bold uppercase mb-2">{k.label}</p>
            <p className={`text-4xl font-black tracking-tighter ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* SECTION 2: Spending Velocity & By Category */}
      <div className="analytics-panels grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Spending Velocity */}
        <div className="bg-white/[0.02] backdrop-blur-2xl border border-white/5 rounded-[32px] p-8 hover:border-white/10 transition-colors duration-500 min-h-[500px] flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-indigo-400 border border-white/5 shadow-inner">
                  <Activity className="w-5 h-5" />
                </div>
                <p className="text-white/90 font-bold text-lg tracking-wide">Outflow Velocity</p>
              </div>
              <p className="text-white/40 text-[11px] tracking-[0.1em] font-bold uppercase mt-2 ml-[52px]">
                Compared to previous period
                {velocity?.previousPeriod && (
                  <span className="ml-1">
                    ({velocity.previousPeriod.start} → {velocity.previousPeriod.end})
                  </span>
                )}
              </p>
            </div>
            <div className="text-right bg-white/[0.03] rounded-2xl px-5 py-3 border border-white/5">
              <p className={`text-3xl font-black tracking-tighter ${velocityColor}`}>
                {velocity?.overallVelocity !== null && velocity?.overallVelocity !== undefined
                  ? `${velocity.overallVelocity > 0 ? '+' : ''}${velocity.overallVelocity}%`
                  : '—'
                }
              </p>
              <p className={`text-[10px] mt-1 font-bold tracking-widest uppercase ${velocityColor}`}>{velocityLabel}</p>
            </div>
          </div>

          {velocity?.categories?.length > 0 && (
            <div className="space-y-2">
              <div className="analytics-velocity-heading grid grid-cols-6 text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 px-4 mb-4">
                <span className="col-span-2">Category</span>
                <span className="text-right">Previous</span>
                <span className="text-right">Current</span>
                <span className="text-right">Velocity</span>
                <span className="text-right">Trend</span>
              </div>
              <div className="analytics-velocity-list space-y-2 max-h-[350px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                {velocity.categories.map((cat, i) => {
                  const previousAmount = cat.previousAmount && cat.previousAmount > 0 ? cat.previousAmount : (cat.total && cat.velocity !== null ? Math.round(cat.total / (1 + (cat.velocity || 0)/100)) : 0)
                  const currentAmount = cat.total || 0
                  return (
                    <div key={i}
                      className="analytics-velocity-row grid grid-cols-6 items-center bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-300 border border-transparent hover:border-white/10 rounded-2xl px-5 py-4 group">
                      <div className="col-span-2 flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/5 flex items-center justify-center text-sm shadow-inner shrink-0 group-hover:scale-110 transition-transform">
                          {cat.icon}
                        </div>
                        <div className="min-w-0">
                          <p className="text-white/90 text-sm font-bold truncate tracking-wide">{cat.name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-white/70 text-sm font-bold tracking-tight">{fmt(previousAmount)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-white text-sm font-bold tracking-tight">{fmt(currentAmount)}</p>
                      </div>
                      <div className="text-right">
                        <VelocityBadge value={cat.velocity} />
                      </div>
                      <div className="flex justify-end">
                        {cat.velocity > 0 ? <TrendingUp className="w-5 h-5 text-rose-400/70" /> : cat.velocity < 0 ? <TrendingDown className="w-5 h-5 text-teal-400/70" /> : <Minus className="w-5 h-5 text-white/20" />}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Spending by category */}
        <div className="bg-white/[0.02] backdrop-blur-2xl border border-white/5 rounded-[32px] p-8 hover:border-white/10 transition-colors duration-500 flex flex-col min-h-[500px]">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-amber-400 border border-white/5 shadow-inner">
              <Zap className="w-5 h-5" />
            </div>
            <p className="text-white/90 font-bold text-lg tracking-wide">Category Distribution</p>
          </div>
          {byCategory.length === 0
            ? <div className="flex-1 flex items-center justify-center text-white/30 text-sm font-medium tracking-wide">No system data available</div>
            : <div className="flex-1 flex flex-col justify-center">
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={byCategory} dataKey="total" nameKey="name"
                      cx="50%" cy="50%" innerRadius={60} outerRadius={85} stroke="rgba(255,255,255,0.05)" strokeWidth={2}>
                      {byCategory.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                    </Pie>
                    <Tooltip formatter={v=>fmt(v)} contentStyle={{ backgroundColor: 'rgba(5, 8, 22, 0.9)', backdropFilter: 'blur(16px)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '16px', fontWeight: 'bold' }} itemStyle={{ color: '#fff' }}/>
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-x-6 gap-y-4 mt-8 overflow-y-auto max-h-[150px] pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                  {byCategory.map((c,i) => (
                    <div key={i} className="flex items-center justify-between text-sm group hover:bg-white/[0.04] p-2.5 rounded-xl transition-colors">
                      <div className="flex items-center gap-2 truncate pr-2">
                        <div className="w-3 h-3 rounded-full shrink-0 shadow-[0_0_8px_currentColor]" style={{ background: COLORS[i%COLORS.length], color: COLORS[i%COLORS.length] }}/>
                        <span className="text-white/70 truncate font-semibold group-hover:text-white transition-colors">{c.name}</span>
                      </div>
                      <span className="text-white font-black tracking-tight shrink-0">{fmt(c.total)}</span>
                    </div>
                  ))}
                </div>
              </div>
          }
        </div>

      </div>

      {/* SECTION 3: Anomalies */}
      <div className="bg-amber-500/5 backdrop-blur-2xl border border-amber-500/20 rounded-[32px] p-8 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-transparent pointer-events-none" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="flex items-center gap-3 mb-8 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <p className="text-amber-400 text-lg font-bold tracking-wide">System Anomalies Detected</p>
          <span className="ml-3 text-amber-400/60 text-[10px] font-bold tracking-[0.2em] uppercase border border-amber-500/20 px-3 py-1 rounded-full bg-amber-500/10">AI Scanning Active</span>
        </div>
        
        {anomalies.length === 0
          ? <div className="flex items-center gap-4 text-teal-400 bg-teal-500/10 border border-teal-500/20 rounded-2xl p-5 relative z-10">
              <div className="w-2.5 h-2.5 rounded-full bg-teal-400 shadow-[0_0_10px_currentColor] animate-pulse"/>
              <span className="text-sm font-bold tracking-wide">All transaction flows match established patterns. No critical deviations found.</span>
            </div>
          : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
              {anomalies.map((a,i) => (
                <div key={i} className="flex items-start gap-5 bg-white/[0.02] border border-amber-500/20 rounded-2xl p-5 hover:bg-white/[0.04] hover:-translate-y-1 transition-all duration-300 group">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-400 shrink-0 border border-amber-500/20 group-hover:scale-110 transition-transform duration-300">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-white/90 text-base font-bold truncate tracking-wide">{a.description}</p>
                    <p className="text-white/40 text-[11px] font-bold tracking-[0.1em] uppercase mt-1 mb-3">{a.date} • {a.category_name}</p>
                    <p className="text-amber-400 text-2xl font-black tracking-tighter">{fmt(a.amount)}</p>
                  </div>
                </div>
              ))}
            </div>
        }
      </div>

      {/* SECTION 4: Money Leak Detector (3 Columns) */}
      <div>
        <div className="flex items-center gap-4 mb-8 px-2">
          <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-indigo-400 border border-white/10 shadow-inner">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-white text-2xl font-black tracking-tighter">Money Leak Detector</h2>
            <p className="text-white/40 text-xs font-bold tracking-wide mt-1">Identifying areas of unoptimized outflow.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Column 1: Growing categories */}
          <div className="bg-white/[0.02] backdrop-blur-2xl border border-white/5 rounded-[32px] p-8 hover:border-white/10 transition-colors duration-500 flex flex-col">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center shadow-inner">
                <ArrowUpRight className="w-4 h-4" />
              </div>
              <p className="text-white/90 font-bold text-lg tracking-wide">Surging Nodes</p>
            </div>
            
            <div className="flex-1 space-y-4">
              {leaks?.growing?.length > 0 ? leaks.growing.map((c, i) => (
                <div key={i} className="group relative bg-white/[0.02] border border-white/5 rounded-2xl p-5 hover:bg-white/[0.04] hover:border-white/10 transition-all overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-rose-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="flex justify-between items-start mb-2 relative z-10">
                    <span className="text-white/90 text-sm font-bold flex items-center gap-3 tracking-wide">
                      <span className="text-base">{c.icon}</span> {c.name}
                    </span>
                    <span className="text-rose-400 text-[11px] font-black bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-md tracking-wider">
                      +{c.growth}%
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-white/40 text-xs relative z-10 mt-3 font-medium">
                    <span className="line-through decoration-rose-500/50 opacity-60">{fmt(c.prev)}</span>
                    <ArrowUpRight className="w-4 h-4 text-white/20" />
                    <span className="text-white font-bold">{fmt(c.total)}</span>
                  </div>
                </div>
              )) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 border border-dashed border-white/5 rounded-[24px]">
                  <div className="w-12 h-12 rounded-2xl bg-teal-500/10 flex items-center justify-center mb-4">
                    <TrendingDown className="w-6 h-6 text-teal-400" />
                  </div>
                  <p className="text-teal-400/90 text-sm font-bold tracking-wide">Stable Outflows</p>
                  <p className="text-white/40 text-xs mt-2 font-medium">No alarming growth detected.</p>
                </div>
              )}
            </div>
          </div>

          {/* Column 2: High frequency */}
          <div className="bg-white/[0.02] backdrop-blur-2xl border border-white/5 rounded-[32px] p-8 hover:border-white/10 transition-colors duration-500 flex flex-col">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shadow-inner">
                <Repeat className="w-4 h-4" />
              </div>
              <p className="text-white/90 font-bold text-lg tracking-wide">High Frequency</p>
            </div>

            <div className="flex-1 space-y-4">
              {leaks?.frequent?.length > 0 ? leaks.frequent.slice(0, 4).map((f, i) => (
                <div key={i} className="group relative bg-white/[0.02] border border-white/5 rounded-2xl p-5 hover:bg-white/[0.04] hover:border-white/10 transition-all">
                  <div className="flex justify-between items-start mb-3">
                    <p className="text-white/90 text-sm font-bold capitalize truncate pr-2 tracking-wide">
                      {f.description}
                    </p>
                    <p className="text-amber-400 text-base font-black tracking-tighter shrink-0">
                      {fmt(f.total)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.1em]">
                    <span className="text-white/50 bg-white/5 px-2.5 py-1 rounded-md flex items-center gap-1.5 border border-white/5">
                      <Repeat className="w-3 h-3"/> {f.count}x
                    </span>
                    <span className="text-white/30">Avg <span className="text-white/60 ml-1">{fmt(Math.round(f.avg_amount))}</span></span>
                  </div>
                </div>
              )) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 border border-dashed border-white/5 rounded-[24px]">
                  <div className="w-12 h-12 rounded-2xl bg-teal-500/10 flex items-center justify-center mb-4">
                    <Activity className="w-6 h-6 text-teal-400" />
                  </div>
                  <p className="text-teal-400/90 text-sm font-bold tracking-wide">Low Distraction Volume</p>
                  <p className="text-white/40 text-xs mt-2 font-medium">No repetitive small leaks detected.</p>
                </div>
              )}
            </div>
          </div>

          {/* Column 3: Subscriptions */}
          <div className="bg-white/[0.02] backdrop-blur-2xl border border-white/5 rounded-[32px] p-8 hover:border-white/10 transition-colors duration-500 flex flex-col">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shadow-inner">
                <Smartphone className="w-4 h-4" />
              </div>
              <p className="text-white/90 font-bold text-lg tracking-wide">Automated Logs</p>
            </div>

            <div className="flex-1 space-y-4">
              {leaks?.subscriptions?.length > 0 ? leaks.subscriptions.slice(0, 4).map((s, i) => (
                <div key={i} className="group relative bg-white/[0.02] border border-white/5 rounded-2xl p-5 hover:bg-white/[0.04] hover:border-white/10 transition-all">
                  <div className="flex justify-between items-start mb-3">
                    <p className="text-white/90 text-sm font-bold capitalize truncate pr-2 tracking-wide">
                      {s.description}
                    </p>
                    <p className="text-purple-400 text-base font-black tracking-tighter shrink-0">
                      {fmt(s.total)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.1em]">
                    <span className="text-white/50 bg-white/5 px-2.5 py-1 rounded-md border border-white/5">
                      {s.months} months
                    </span>
                    <span className="text-white/30"><span className="text-white/60 mr-1">{fmt(Math.round(s.avg_amount))}</span> / mo</span>
                  </div>
                </div>
              )) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 border border-dashed border-white/5 rounded-[24px]">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                    <Smartphone className="w-6 h-6 text-white/30" />
                  </div>
                  <p className="text-white/80 text-sm font-bold tracking-wide">No Active Subscriptions</p>
                  <p className="text-white/40 text-xs mt-2 font-medium">Mark out-flows as recurring to track.</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* SECTION 5: Daily Chart */}
      <div className="bg-white/[0.02] backdrop-blur-2xl border border-white/5 rounded-[32px] p-8 hover:border-white/10 transition-colors duration-500 mt-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 border border-white/5 shadow-inner">
            <Activity className="w-4 h-4" />
          </div>
          <p className="text-white/90 font-bold text-lg tracking-wide">Daily Cash Flow Matrix</p>
        </div>
        
        {chartData.length === 0
          ? <div className="h-72 flex items-center justify-center text-white/30 text-sm font-medium tracking-wide border border-dashed border-white/5 rounded-[24px]">No daily transaction data available</div>
          : <ResponsiveContainer width="100%" height={320}>
              <BarChart data={chartData} barGap={4} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="date" tick={{fill:'#ffffff40',fontSize:11, fontWeight: 600}}
                  axisLine={false} tickLine={false} dy={10} />
                <YAxis tick={{fill:'#ffffff40',fontSize:11, fontWeight: 600}} axisLine={false}
                  tickLine={false} tickFormatter={v=>`₹${(v/1000).toFixed(0)}k`} dx={-10} />
                <Tooltip content={<Tip/>} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                <Bar dataKey="income" name="Inflow" fill="#2dd4bf" radius={[6,6,0,0]} maxBarSize={48} />
                <Bar dataKey="expense" name="Outflow" fill="#fb7185" radius={[6,6,0,0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
        }
      </div>

      </div>
    </div>
  )
}
