import { useState, useRef, useEffect } from 'react'
import { Calendar, ChevronDown, RefreshCw } from 'lucide-react'
import { useDateRange, PRESETS } from '../context/DateContext.jsx'

export default function TopBar({ title }) {
  const { preset, range, setPresetKey, setCustomRange,
    customStart, customEnd, setCustomStart, setCustomEnd } = useDateRange()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const currentLabel = PRESETS.find(p => p.key === preset)?.label || 'Custom range'

  const fmt = (d) => {
    if (!d) return '—'
    const [y, m, day] = d.split('-')
    return `${day} ${new Date(d).toLocaleString('en-IN', { month: 'short' })} ${y}`
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 md:mb-8 relative z-50 gap-4 sm:gap-0">
      <h1 className="text-white text-3xl md:text-4xl font-black tracking-tighter">{title}</h1>

      <div className="flex items-center gap-3 self-start sm:self-auto">
        {/* Date range display - hidden on smallest screens */}
        <div className="hidden lg:flex items-center gap-3 bg-white/[0.02] backdrop-blur-md border border-white/5 rounded-2xl px-5 py-3.5 shadow-inner">
          <Calendar className="w-4 h-4 text-white/40 flex-shrink-0" />
          <span className="text-white/70 text-sm font-bold tracking-wide whitespace-nowrap">
            {fmt(range.start)} → {fmt(range.end)}
          </span>
        </div>

        {/* Preset dropdown */}
        <div className="relative" ref={ref}>
          <button onClick={() => setOpen(o => !o)}
            className="flex items-center justify-between gap-3 bg-white/[0.03] backdrop-blur-xl border border-white/10
            hover:bg-white/[0.05] hover:border-white/20 rounded-2xl px-4 py-3 md:px-5 md:py-3.5 transition-all shadow-lg min-w-[140px]">
            <span className="text-white/90 text-xs md:text-sm font-bold tracking-wide">{currentLabel}</span>
            <ChevronDown className={`w-4 h-4 text-white/50 transition-transform duration-300 flex-shrink-0 ${open ? 'rotate-180' : ''}`} />
          </button>

          {open && (
            <div className="absolute left-0 sm:left-auto sm:right-0 top-[calc(100%+8px)] w-[280px] sm:w-[320px] bg-[#0c1020]/95 backdrop-blur-3xl border border-white/10
              rounded-[24px] shadow-2xl shadow-black/80 z-50 overflow-hidden max-h-[85dvh] overflow-y-auto">

              {/* Presets */}
              <div className="p-2 sm:p-3">
                {PRESETS.filter(p => p.key !== 'custom').map(p => (
                  <button key={p.key}
                    onClick={() => { setPresetKey(p.key); setOpen(false) }}
                    className={`w-full text-left px-4 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-bold tracking-wide transition-all ${
                      preset === p.key
                        ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 shadow-inner'
                        : 'text-white/60 hover:bg-white/[0.05] hover:text-white border border-transparent'
                    }`}>
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Custom range */}
              <div className="border-t border-white/5 p-4 bg-white/[0.015] space-y-4">
                <p className="text-white/40 text-[10px] uppercase font-bold tracking-[0.2em] px-1">Custom Timeframe</p>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <label className="text-white/40 text-[10px] tracking-[0.1em] font-bold uppercase w-8">Start</label>
                    <input type="date" value={customStart}
                      onChange={e => setCustomStart(e.target.value)}
                      className="flex-1 bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2
                      text-white text-xs font-medium outline-none focus:border-indigo-500/50 focus:bg-white/[0.08] transition-all" />
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-white/40 text-[10px] tracking-[0.1em] font-bold uppercase w-8">End</label>
                    <input type="date" value={customEnd}
                      onChange={e => setCustomEnd(e.target.value)}
                      className="flex-1 bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2
                      text-white text-xs font-medium outline-none focus:border-indigo-500/50 focus:bg-white/[0.08] transition-all" />
                  </div>
                </div>
                <button
                  onClick={() => { setCustomRange(customStart, customEnd); setOpen(false) }}
                  disabled={!customStart || !customEnd}
                  className="w-full bg-indigo-500 hover:bg-indigo-400 disabled:opacity-40
                  text-white text-xs font-bold tracking-wide py-3 rounded-xl transition-all shadow-lg shadow-indigo-500/20 mt-2">
                  Initialize Range
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}