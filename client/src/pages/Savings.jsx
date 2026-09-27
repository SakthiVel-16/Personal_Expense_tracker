import { useEffect, useState, useCallback, useMemo } from 'react'
import { Plus, Check, Target, 
  TrendingUp, RefreshCw, Pencil, Trash2, Sparkles } from 'lucide-react'
import api from '../lib/api.js'
import { useDateRange } from '../context/DateContext.jsx'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import Modal from '../components/Modal.jsx'

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`

const GOAL_ICONS = ['🎯','✈️','🚗','🏠','💻','📚','💍',
  '🎓','🏋️','🌍','💰','🎮','👜','🏖️','🛵','📷','🎸']

// ── Goal form ───────────────────────────────────────────
function GoalForm({ initial, onSave }) {
  const [form, setForm] = useState(initial || {
    name: '', icon: '🎯', target_amount: '',
    deadline: '', color: '#818cf8',
    category: 'short', notes: ''
  })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.name || !form.target_amount) return
    setSaving(true)
    const payload = { ...form }
    try {
      if (form.id) await api.put(`/savings/goals/${form.id}`, payload)
      else await api.post('/savings/goals', payload)
      onSave()
    } catch (e) { console.error(e) }
    setSaving(false)
  }

  return (
    <div className="space-y-4">
      {/* Category toggle */}
      <div className="flex bg-[#080c14] border border-white/5 rounded-xl p-1">
        {[
          { key: 'short', label: '⚡ Short term', sub: 'Under 1 year' },
          { key: 'long',  label: '🏔️ Long term',  sub: 'Over 1 year' }
        ].map(t => (
          <button key={t.key} onClick={() => set('category', t.key)}
            className={`flex-1 py-2 rounded-lg text-xs transition-all ${
              form.category === t.key
                ? 'bg-indigo-500/20 text-indigo-400 font-semibold'
                : 'text-white/40 hover:text-white/60'
            }`}>
            <p>{t.label}</p>
          </button>
        ))}
      </div>

      <div>
        <label className="text-white/40 text-xs uppercase tracking-widest font-semibold mb-2 block">Icon</label>
        <div className="flex flex-wrap gap-2">
          {GOAL_ICONS.map(ic => (
            <button key={ic} onClick={() => set('icon', ic)}
              className={`w-9 h-9 rounded-xl text-lg flex items-center
                justify-center transition-all ${
                form.icon === ic
                  ? 'bg-indigo-500/30 ring-1 ring-indigo-500/50'
                  : 'bg-[#080c14] border border-white/5 hover:bg-white/5'
              }`}>
              {ic}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-white/40 text-xs uppercase tracking-widest font-semibold mb-1.5 block">Goal name</label>
        <input value={form.name} onChange={e => set('name', e.target.value)}
          placeholder="e.g. Trip to Goa"
          className="w-full bg-[#080c14] border border-white/5 rounded-xl
          px-4 py-2.5 text-[#e8e4dc] text-sm placeholder-white/20 outline-none
          focus:border-indigo-500/50"/>
      </div>

      <div>
        <label className="text-white/40 text-xs uppercase tracking-widest font-semibold mb-1.5 block">Target amount (₹)</label>
        <input type="number" value={form.target_amount}
          onChange={e => set('target_amount', e.target.value)}
          placeholder="e.g. 50000"
          className="w-full bg-[#080c14] border border-white/5 rounded-xl
          px-4 py-3 text-[#e8e4dc] text-base font-semibold placeholder-white/20
          outline-none focus:border-indigo-500/50"/>
      </div>

      <div>
        <label className="text-white/40 text-xs uppercase tracking-widest font-semibold mb-1.5 block">
          Target date (optional)
        </label>
        <input type="date" value={form.deadline}
          onChange={e => set('deadline', e.target.value)}
          className="w-full bg-[#080c14] border border-white/5 rounded-xl
          px-4 py-2.5 text-[#e8e4dc] text-sm outline-none focus:border-indigo-500/50"/>
      </div>

      <button onClick={handleSave} disabled={saving}
        className="w-full bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50
        text-[#050816] font-bold text-xs uppercase tracking-widest py-3.5 rounded-xl transition-colors
        flex items-center justify-center gap-2 mt-2">
        {saving
          ? <div className="w-4 h-4 border-2 border-[#050816]/30
              border-t-[#050816] rounded-full animate-spin"/>
          : <><Check className="w-4 h-4"/>
              {form.id ? 'Update goal' : 'Save goal'}
            </>
        }
      </button>
    </div>
  )
}

// ── Bucket Classification Manager ───────────────────────
function ClassificationManager() {
  const [classifications, setClassifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/savings/classifications');
      // Only show expense categories that can be classified
      setClassifications(res.data.filter(c => c.type === 'expense'));
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { loadData() }, [loadData]);

  const handleUpdate = async (categoryName, bucket) => {
    setClassifications(prev => prev.map(c => 
      c.name === categoryName ? { ...c, bucket } : c
    ));
    try {
      await api.put(`/savings/classifications/${encodeURIComponent(categoryName)}`, { bucket });
    } catch (e) {
      console.error(e);
      loadData(); // Revert on error
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"/></div>;
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-white/50 pb-3 border-b border-white/5 mb-3">
        Assign each expense category to a bucket to refine your 50/30/20 allocation.
      </p>
      <div className="space-y-2 max-h-[60dvh] overflow-y-auto pr-2 -mr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {classifications.map(cat => (
          <div key={cat.id} className="bg-[#080c14] border border-white/5 rounded-xl p-3 flex items-center justify-between hover:bg-white/[0.03] transition-colors">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-sm shrink-0">{cat.icon}</div>
              <span className="text-sm font-semibold text-white/80 truncate">{cat.name}</span>
            </div>
            <div className="flex gap-1 bg-black/20 border border-white/5 p-1 rounded-lg shrink-0 ml-2">
              {['needs', 'wants', 'savings'].map(bucket => (
                <button
                  key={bucket}
                  onClick={() => handleUpdate(cat.name, bucket)}
                  className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-colors ${
                    cat.bucket === bucket
                      ? bucket === 'needs' ? 'bg-blue-500/20 text-blue-400'
                      : bucket === 'wants' ? 'bg-rose-500/20 text-rose-400'
                      : 'bg-teal-500/20 text-teal-400'
                      : 'text-white/40 hover:bg-white/10'
                  }`}
                >
                  {bucket}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Contribute form ─────────────────────────────────────
function ContributeForm({ goal, onSave }) {
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!amount) return
    setSaving(true)
    try {
      await api.post(`/savings/goals/${goal.id}/contribute`,
        { amount, note, date })
      onSave()
    } catch (e) { console.error(e) }
    setSaving(false)
  }

  const remaining = goal.target_amount - goal.contributed
  const quick = [500,1000,2000,5000].filter(a => a <= remaining + 1)

  return (
    <div className="space-y-5">
      <div className="bg-[#080c14] border border-white/5 rounded-2xl p-6 text-center">
        <p className="text-white/40 text-xs tracking-widest font-bold uppercase mb-2">Remaining</p>
        <p className="text-white/90 text-3xl font-serif tracking-tight">{fmt(remaining)}</p>
      </div>

      {quick.length > 0 && (
        <div>
          <label className="text-white/40 text-xs tracking-widest font-semibold uppercase mb-3 block">Quick add</label>
          <div className="flex gap-2">
            {quick.map(a => (
              <button key={a} onClick={() => setAmount(String(a))}
                className={`flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                  amount === String(a)
                    ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                    : 'bg-[#080c14] text-white/50 hover:text-white/80 border border-white/5'
                }`}>
                {fmt(a)}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <label className="text-white/40 text-xs tracking-widest font-semibold uppercase mb-2 block">Amount (₹)</label>
        <input type="number" value={amount}
          onChange={e => setAmount(e.target.value)}
          placeholder="0"
          className="w-full bg-[#080c14] border border-white/5 rounded-xl
          px-4 py-3 text-[#e8e4dc] text-xl font-semibold placeholder-white/20
          outline-none focus:border-indigo-500/50"/>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-white/40 text-xs tracking-widest font-semibold uppercase mb-2 block">Date</label>
          <input type="date" value={date}
            onChange={e => setDate(e.target.value)}
            className="w-full bg-[#080c14] border border-white/5 rounded-xl
            px-4 py-2.5 text-[#e8e4dc] text-sm outline-none focus:border-indigo-500/50"/>
        </div>
        <div>
          <label className="text-white/40 text-xs tracking-widest font-semibold uppercase mb-2 block">Note</label>
          <input value={note} onChange={e => setNote(e.target.value)}
            placeholder="Optional note"
            className="w-full bg-[#080c14] border border-white/5 rounded-xl
            px-4 py-2.5 text-[#e8e4dc] text-sm placeholder-white/20 outline-none focus:border-indigo-500/50"/>
        </div>
      </div>

      <button onClick={handleSave} disabled={saving}
        className="w-full bg-teal-500 hover:bg-teal-400
        disabled:opacity-50 text-[#050816] font-bold text-xs uppercase tracking-widest py-3.5 rounded-xl
        transition-all flex items-center justify-center gap-2 mt-2">
        {saving
          ? <div className="w-4 h-4 border-2 border-[#050816]/30
              border-t-[#050816] rounded-full animate-spin"/>
          : <><Plus className="w-4 h-4"/> Add Funds</>
        }
      </button>
    </div>
  )
}

// ── Shared progress components ─────────────────────────
function CircularProgress({ pct, colorClass, baseColorClass }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;
  
  return (
    <div className="relative shrink-0 w-[84px] h-[84px] group-hover:scale-105 transition-transform duration-500">
      <svg width="84" height="84" viewBox="0 0 84 84" className="-rotate-90 absolute inset-0 drop-shadow-md">
        <circle cx="42" cy="42" r={radius} fill="none" className={`stroke-current ${baseColorClass}`} strokeWidth="6"/>
        <circle cx="42" cy="42" r={radius} fill="none" className={`stroke-current ${colorClass}`} strokeWidth="6" 
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease-out' }}/>
      </svg>
      {/* Glassmorphic Inner */}
      <div className="absolute inset-0 m-2.5 rounded-full flex flex-col items-center justify-center bg-white/[0.03] backdrop-blur-md border border-white/10 shadow-[0_4px_12px_rgba(0,0,0,0.3)]">
        <span className={`text-xl font-black tracking-tighter ${colorClass} drop-shadow-lg`}>{pct}%</span>
      </div>
    </div>
  )
}

function JourneyTrack({ pct, colorClass }) {
  const milestones = [0, 25, 50, 75, 100];
  const activeMilestone = milestones.slice().reverse().find(m => pct >= m) || 0;
  
  return (
    <div className="mb-3.5">
      <div className="flex justify-between items-center text-[11px] tracking-[0.1em] uppercase text-[#3d4660] mb-2">
        <span>Journey to goal</span>
        <span className={`font-semibold ${colorClass}`}>{`${pct}% there`}</span>
      </div>
      <div className="relative h-7 flex items-center">
        <div className="absolute left-0 right-0 h-[1px] bg-white/5" />
        <div className={`absolute left-0 h-[1px] transition-all bg-current ${colorClass}`} style={{ width: `${pct}%` }} />
        
        <div className="relative z-10 w-full flex justify-between items-center">
          {milestones.map(m => {
            const reached = pct >= m;
            const isCurrent = activeMilestone === m && pct < 100;
            return (
              <div key={m} className="flex flex-col items-center gap-[3px]">
                <div className={`w-2.5 h-2.5 rounded-full border-[1.5px] transition-all
                  ${reached ? `bg-current border-current ${colorClass}` : 'bg-[#080c14] border-white/10'}
                  ${isCurrent ? `w-[13px] h-[13px] ring-[3px] ring-current/20 ${colorClass}` : ''}`} />
                <span className={`text-[10px] whitespace-nowrap tracking-wider
                  ${reached ? colorClass : 'text-[#3d4660]'}`}>
                  {m === 0 ? 'Start' : m === 100 ? 'Done!' : `${m}%`}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Goal Card New Design ────────────────────────────────
function GoalCard({ goal, onEdit, onDelete, onContribute, onHistory, challenge }) {
  const pct = Math.min(goal.pct || 0, 100)
  const isLong = goal.category === 'long'

  // Colors mapping based on the mockups
  const theme = isLong ? {
    card: 'bg-[#130a1a] border-fuchsia-500/20',
    icon: 'bg-[#1a1025] border-fuchsia-500/20',
    primary: 'text-fuchsia-400',
    baseStroke: 'text-[#1a1025]',
    pillBg: 'bg-[#1a1025] border-fuchsia-600/40 text-fuchsia-400',
    pillText: 'Long-term',
    btnAdd: 'bg-fuchsia-500 text-[#130a1a]',
    chBg: 'bg-[#150d1e] border-[#3a1d4d]',
    chIcon: 'bg-[#1a1025] border-[#4a2565] text-fuchsia-400'
  } : {
    card: 'bg-[#0e1320] border-white/10 hover:border-white/20 transition-colors',
    icon: 'bg-white/5 border-white/10',
    primary: 'text-indigo-400',
    baseStroke: 'text-[#1a1f2e]',
    pillBg: pct > 75 ? 'bg-indigo-950/50 border-indigo-500/40 text-indigo-400' : pct > 40 ? 'bg-teal-950/50 border-teal-500/40 text-teal-400' : 'bg-blue-950/50 border-blue-500/40 text-blue-400',
    pillText: pct > 75 ? 'Almost there' : pct > 40 ? 'Halfway' : 'Started',
    btnAdd: 'bg-indigo-400 text-[#0d0a1a] hover:opacity-85',
    chBg: 'bg-[#110a1a] border-[#2d1f40]',
    chIcon: 'bg-[#1e1230] border-[#3d2260] text-purple-400'
  };

  return (
    <div className={`rounded-[20px] p-5 relative group ${theme.card}`}>
      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1.5">
        <button onClick={() => onEdit(goal)} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 transition-colors">
          <Pencil className="w-3.5 h-3.5"/>
        </button>
        <button onClick={() => onDelete(goal.id)} className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors">
          <Trash2 className="w-3.5 h-3.5"/>
        </button>
      </div>

      {/* Top Row */}
      <div className="flex items-center gap-3 mb-4 pr-16">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 border ${theme.icon}`}>
          {goal.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-base font-semibold text-[#e8e4dc] truncate">{goal.name}</div>
          <div className="text-xs text-[#3d4660] mt-0.5 tracking-wide">
            {goal.deadline && goal.monthlyNeeded !== null
              ? <>
                  <span className={`font-bold ${theme.primary}`}>{goal.deadline}</span>
                  <span className="text-white/30 mx-1">•</span>
                  Save <span className={`font-bold ${theme.primary}`}>{fmt(goal.monthlyNeeded)}/mo</span>
                </>
              : goal.target_amount ? 'No deadline set' : 'Steady wins'
            }
          </div>
        </div>
        <div className={`text-[11px] font-bold px-2 py-1 rounded-full whitespace-nowrap shrink-0 tracking-wider uppercase border ${theme.pillBg}`}>
          {theme.pillText}
        </div>
      </div>

      {/* Orbit & Amounts */}
      <div className="flex items-center gap-5 mb-6">
        <CircularProgress pct={pct} colorClass={theme.primary} baseColorClass={theme.baseStroke}/>
        <div className="flex-1">
          <div className="font-serif text-[24px] text-[#f5f0e8] leading-tight">{fmt(goal.contributed)}</div>
          <div className="text-xs text-[#5a6480] uppercase tracking-wider font-bold mt-1">of {fmt(goal.target_amount)} goal</div>
          <div className="text-sm text-[#8a94a6] mt-1.5 font-medium">{fmt(goal.target_amount - goal.contributed)} still to go</div>
        </div>
      </div>

      {/* Journey Track */}
      <JourneyTrack pct={pct} colorClass={theme.primary}/>

      {/* Projection Section */}
      {pct < 100 && goal.avgMonthlyContribution > 0 && (
        <div className="mt-4 mb-4 bg-white/[0.02] border border-white/5 rounded-xl p-4 text-center shadow-inner space-y-2">
          <p className="text-xs text-white/50 font-semibold tracking-wide">
            At your average pace of <span className={`font-bold ${theme.primary}`}>{fmt(goal.avgMonthlyContribution)}/mo</span>
          </p>
          {goal.projectedMonths !== null && goal.projectedMonths > 0 ? (
            <p className="text-sm text-white/80 font-bold">
              You're on track to finish in ~<span className={`font-bold ${theme.primary}`}>{goal.projectedMonths} month{goal.projectedMonths > 1 ? 's' : ''}</span>.
            </p>
          ) : (
             <p className="text-sm text-white/80 font-bold">
              Almost there! Keep up the momentum!
            </p>
          )}
        </div>
      )}

      {/* Challenge Link (If any assigned or mocked) */}
      {pct < 100 && challenge && (
        <div className={`border rounded-[10px] p-2.5 mb-3.5 flex items-center gap-2 ${theme.chBg}`}>
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${theme.chIcon}`}>
            {challenge.icon || <Target className="w-3.5 h-3.5"/>}
          </div>
          <div className="flex-1 min-w-0">
            <div className={`text-sm font-semibold mb-0.5 truncate ${theme.primary}`}>{challenge.title}</div>
            <div className="text-xs text-white/30 truncate">{challenge.duration}</div>
          </div>
          <div className={`text-xs font-bold shrink-0 ${theme.primary}`}>+{fmt(challenge.potential_saving)}</div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button onClick={() => onContribute(goal)} 
          className={`flex-1 text-sm font-bold rounded-[10px] py-2.5 tracking-wide transition-opacity ${theme.btnAdd}`}>
          + Add funds
        </button>
        <button onClick={() => onHistory(goal)} 
          className={`flex-1 bg-transparent border border-white/10 text-white/40 hover:bg-[#0e1320] hover:text-white/60 text-sm font-medium rounded-[10px] py-2.5 transition-colors`}>
          History
        </button>
      </div>
    </div>
  )
}

// ── 50/30/20 Rule Component ──────────────────────────────
function Rule503020({ data }) {
  const { income, needs, wants, savings, needsPct, wantsPct, savingsPct } = data

  if (!income) return ( // Increased height and font size for empty state
    <div className="h-40 flex items-center justify-center text-[#3d4660] text-base">
      Add income to see 50/30/20 breakdown
    </div>
  )

  const pieData = [
    { name: 'Needs', value: Math.max(needsPct, 1), actual: needsPct, target: 50, color: '#3b82f6', amount: needs, overMsg: v => `Trimming needs by ${fmt(Math.round((v-50)/100*income))} gets you to target`, underMsg: () => `Essentials are well controlled`, onMsg: () => `Perfect balance on essentials` },
    { name: 'Wants', value: Math.max(wantsPct, 1), actual: wantsPct, target: 30, color: '#fb7185', amount: wants, overMsg: v => `Trimming wants by ${fmt(Math.round((v-30)/100*income))} boosts savings`, underMsg: () => `Spending less on wants — great!`, onMsg: () => `Wants spending is right on track` },
    { name: 'Savings', value: Math.max(savingsPct, 1), actual: savingsPct, target: 20, color: '#2dd4bf', amount: savings, overMsg: () => `Excellent! Saving above 20% target`, underMsg: v => `Adding ${fmt(Math.round((20-v)/100*income))} more hits target`, onMsg: () => `Savings rate perfectly on track` },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center mt-4">
      <div className="relative h-48 flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} stroke="#0e1320" strokeWidth={4} paddingAngle={3} dataKey="value">
              {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
            </Pie>
            <Tooltip
              formatter={(val, name, props) => [fmt(props.payload.amount), name]}
              contentStyle={{ backgroundColor: '#050816', borderColor: '#1e2535', borderRadius: '16px', fontSize: '14px', color: '#e8e4dc', padding: '10px' }}
              itemStyle={{ color: '#fff', fontSize: '14px', fontWeight: 'bold' }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[#3d4660] text-xs uppercase tracking-widest font-bold mb-1">Income</span>
          <span className="text-[#e8e4dc] text-lg font-black tracking-tight">{fmt(income)}</span>
        </div>
      </div>
      <div className="space-y-4">
        {pieData.map(s => {
          const diff = s.actual - s.target
          const ok = Math.abs(diff) <= 5
          const over = diff > 5
          const msg = ok ? s.onMsg() : over ? s.overMsg(s.actual) : s.underMsg(s.actual)

          return (
            <div key={s.name} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="text-[#e8e4dc] text-base font-semibold">{s.name} <span className="text-[#3d4660] ml-0.5 text-sm">({s.target}%)</span></span>
                </div>
                <span className={`text-base font-bold ${ok ? 'text-teal-400' : over && s.name !== 'Savings' ? 'text-rose-400' : 'text-amber-400'}`}>{s.actual}%</span>
              </div>
              <span className="text-sm text-[#5a6480] leading-tight pl-4">{msg}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Main Dashboard ──────────────────────────────────────
export default function Savings() {
  const { range } = useDateRange()
  const [goals, setGoals] = useState([])
  const [overview, setOverview] = useState(null)
  const [challenges, setChallenges] = useState([])
  const [aiInsights, setAiInsights] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [loading, setLoading] = useState(true)

  const [showGoalModal, setShowGoalModal] = useState(false)
  const [showContributeModal, setShowContributeModal] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [editGoal, setEditGoal] = useState(null)
  const [activeGoal, setActiveGoal] = useState(null)
  const [showClassificationModal, setShowClassificationModal] = useState(false)
  const [defaultCategory, setDefaultCategory] = useState('short')
  const [history, setHistory] = useState([])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [g, o, c] = await Promise.all([
        api.get('/savings/goals'),
        api.get('/savings/overview', { params: { start: range.start, end: range.end } }),
        api.get('/savings/challenges'),
      ])
      setGoals(g.data)
      setOverview(o.data)
      setChallenges(c.data)
    } catch (e) { console.error(e) }
    setLoading(false)
  }, [range.start, range.end])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load() }, [load])

  const loadAI = async () => {
    setAiLoading(true)
    try {
      const r = await api.post('/savings/ai-insight')
      setAiInsights(r.data)
    } catch (e) { console.error(e) }
    setAiLoading(false)
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this goal?')) return
    await api.delete(`/savings/goals/${id}`)
    load()
  }

  const handleHistory = async (goal) => {
    setActiveGoal(goal)
    const r = await api.get(`/savings/goals/${goal.id}/history`)
    setHistory(r.data)
    setShowHistoryModal(true)
  }

  const handleNewGoal = (cat = 'short') => {
    setDefaultCategory(cat)
    setEditGoal(null)
    setShowGoalModal(true)
  }

  const latestMonth = overview?.months?.slice(-1)[0] || {}
  const totalSaved = goals.reduce((a, g) => a + (g.contributed || 0), 0)
  const shortTermGoals = goals.filter(g => g.category === 'short' || !g.category)
  const longTermGoals = goals.filter(g => g.category === 'long')
  const totalMonthlyTarget = goals
    .filter(g => g.deadline && g.monthlyNeeded > 0)
    .reduce((acc, g) => acc + g.monthlyNeeded, 0);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60dvh] bg-[#050816]">
      <div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"/>
    </div>
  )

  return (
    <div className="page-shell min-h-screen bg-[#050816] font-sans text-[#e2ddd6] -mx-3 -my-3 p-4 sm:-mx-4 sm:-my-4 md:m-0 md:p-8 rounded-[35px] selection:bg-indigo-500/30">
      
      {/* ── Header ── */}
      <div className="savings-page-header flex items-start justify-between mb-8">
        <div>
          <div className="text-xs tracking-[0.22em] text-[#4a5568] uppercase font-medium mb-2">Your wealth journey</div>
          <h1 className="font-serif text-[30px] text-[#f5f0e8] leading-[1.15] font-normal">
            Building the life<br/>
            <em className="italic text-indigo-400">you're dreaming of</em>
          </h1>
          <div className="text-sm text-[#4a5568] mt-1.5 tracking-wide">Every rupee saved is a vote for your future self.</div>
        </div>
        <button onClick={() => handleNewGoal()} 
          className="bg-[#1a1f2e] border border-[#2a3045] text-indigo-400 text-sm font-semibold px-3.5 py-2 rounded-[10px] hover:bg-[#222840] transition-colors whitespace-nowrap tracking-wider">
          + New goal
        </button>
      </div>

      {/* ── Pulse Row ── */}
      <div className="savings-pulse-row grid grid-cols-1 md:grid-cols-3 gap-3 mb-7">
        <div className="bg-[#110f1c] border border-indigo-500/20 rounded-[16px] p-4">
          <div className="text-xs tracking-[0.14em] text-[#3d4660] uppercase font-semibold mb-2">Saved this month</div>
          <div className="font-serif text-[22px] text-indigo-400 leading-none">{fmt(latestMonth?.saved || 0)}</div>
          <div className="text-xs text-[#3d4660] mt-1.5">recent rhythm check</div>
          <div className="flex items-end gap-0.5 mt-2.5 h-6">
            {(overview?.months || []).slice(-6).map((m, i) => (
              <div key={i} className={`flex-1 rounded-t-sm transition-all ${m.rate > 0 ? 'bg-indigo-500/60' : 'bg-rose-500/40'}`} 
                style={{ height: `${Math.max(m.rate || 0, 10)}%` }}>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-[#0e1320] border border-[#1e2535] rounded-[16px] p-4 flex flex-col justify-center">
          <div className="text-xs tracking-[0.14em] text-[#3d4660] uppercase font-semibold mb-2">Total saved across goals</div>
          <div className="font-serif text-[22px] text-[#f5f0e8] leading-none">{fmt(totalSaved)}</div>
          <div className="text-xs text-[#3d4660] mt-1.5">across {goals.length} active targets</div>
        </div>

        <div className="bg-[#130a1a] border border-fuchsia-500/20 rounded-[16px] p-4 flex flex-col justify-center">
          <div className="text-xs tracking-[0.14em] text-[#3d4660] uppercase font-semibold mb-2">Monthly Goal Target</div>
          <div className="font-serif text-[22px] text-fuchsia-400 leading-none">{fmt(totalMonthlyTarget)}</div>
          <div className="text-xs text-[#3d4660] mt-1.5">needed to stay on track</div>
        </div>
      </div>

      {/* ── Short Term Goals ── */}
      <div className="flex items-center gap-2 text-xs tracking-[0.2em] uppercase text-[#3d4660] font-semibold mb-4">
        <span className="w-3.5 h-[1px] bg-[#2a3045]"></span> Short-term goals · under 1 year <span className="flex-1 h-[1px] bg-[#2a3045]"></span>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {shortTermGoals.map((g, i) => (
          <GoalCard 
            key={g.id} 
            goal={g} 
            challenge={challenges[i % challenges.length]} 
            onEdit={g => { setEditGoal(g); setShowGoalModal(true) }} 
            onDelete={handleDelete}
            onContribute={g => { setActiveGoal(g); setShowContributeModal(true) }} 
            onHistory={handleHistory} 
          />
        ))}
      </div>

      <button onClick={() => handleNewGoal('short')} 
        className="w-full bg-transparent border border-dashed border-[#2a3045] hover:border-indigo-500/40 hover:bg-[#0e1320] text-[#3d4660] hover:text-indigo-400 text-sm font-medium rounded-[18px] p-4 flex items-center justify-center gap-2.5 transition-all mb-7 group">
        <div className="w-5 h-5 rounded-full bg-[#1a1f2e] group-hover:bg-[#1e1635] flex items-center justify-center text-[14px] font-light group-hover:text-indigo-400">+</div>
        Start a new short-term goal
      </button>

      {/* ── Long Term Goals ── */}
      <div className="flex items-center gap-2 text-xs tracking-[0.2em] uppercase text-[#3d4660] font-semibold mb-4">
        <span className="w-3.5 h-[1px] bg-[#2a3045]"></span> Long-term goals · over 1 year <span className="flex-1 h-[1px] bg-[#2a3045]"></span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {longTermGoals.map((g, i) => (
          <GoalCard 
            key={g.id} 
            goal={g} 
            challenge={challenges[(i + 2) % challenges.length]} 
            onEdit={g => { setEditGoal(g); setShowGoalModal(true) }} 
            onDelete={handleDelete}
            onContribute={g => { setActiveGoal(g); setShowContributeModal(true) }} 
            onHistory={handleHistory} 
          />
        ))}
      </div>

      <button onClick={() => handleNewGoal('long')} 
        className="w-full bg-transparent border border-dashed border-fuchsia-900/30 hover:border-fuchsia-500/40 hover:bg-[#130a1a] text-fuchsia-900/60 hover:text-fuchsia-400 text-sm font-medium rounded-[18px] p-4 flex items-center justify-center gap-2.5 transition-all mb-7 group">
        <div className="w-5 h-5 rounded-full bg-[#1a1025] flex items-center justify-center text-[14px] font-light text-fuchsia-900/50 group-hover:text-fuchsia-400">+</div>
        Start a new long-term goal
      </button>

      {/* ── Financial Health ── */}
      <div className="flex items-center gap-2 text-xs tracking-[0.2em] uppercase text-[#3d4660] font-semibold mb-4">
        <span className="w-3.5 h-[1px] bg-[#2a3045]"></span> Financial health <span className="flex-1 h-[1px] bg-[#2a3045]"></span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-[#0e1320] border border-[#1e2535] rounded-[24px] p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-[#3d4660] tracking-[0.14em] uppercase font-semibold">50/30/20 Allocation</div>
            <button 
              onClick={() => setShowClassificationModal(true)}
              className="text-xs font-bold text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 px-3 py-1.5 rounded-lg transition-colors border border-indigo-500/20"
            >
              Customize
            </button>
          </div>
          <Rule503020 data={overview?.breakdown503020 || { income: 0, needsPct: 0, wantsPct: 0, savingsPct: 0, needs: 0, wants: 0, savings: 0 }} />
        </div>

        <div className="bg-[#0e1320] border border-[#1e2535] rounded-[24px] p-8">
          <div className="text-sm text-[#3d4660] tracking-[0.14em] uppercase font-semibold mb-6">6-month savings rhythm</div>
          <div className="flex items-end justify-between gap-2 h-[180px] mb-4">
            {(overview?.months?.slice(-6) || []).map((m, i) => (
               <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full">
                 <div className="flex-1 w-full flex flex-col items-center justify-end gap-2">
                   <div className={`text-sm font-bold ${m.saved >= 0 ? 'text-indigo-400/80' : 'text-rose-400/80'}`}>{fmt(m.saved)}</div>
                   <div className="w-full rounded-t-[3px] min-h-[4px] transition-all" 
                     style={{ 
                       height: `${Math.max(m.rate || 0, 5)}%`, 
                       background: m.rate > 0 ? (i === 5 ? '#818cf8' : '#818cf850') : '#f8717130'
                     }}>
                   </div>
                 </div>
                 <div className="text-sm text-[#3d4660] font-medium tracking-wider uppercase">{m.label ? m.label.substring(0,3) : ''}</div>
                 <div className={`text-base font-bold ${m.rate > 0 ? (i === 5 ? 'text-indigo-400' : 'text-indigo-400/80') : 'text-rose-400'}`}>{m.rate || 0}%</div>
               </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Challenges ── */}
      <div className="flex items-center gap-2 text-xs tracking-[0.2em] uppercase text-[#3d4660] font-semibold mb-4">
        <span className="w-3.5 h-[1px] bg-[#2a3045]"></span> Savings challenges <span className="flex-1 h-[1px] bg-[#2a3045]"></span>
      </div>

      <div className="bg-[#0e1320] border border-[#1e2535] rounded-[18px] p-5 mb-7">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-[34px] h-[34px] rounded-[10px] bg-[#110f1c] border border-[#2d1f40] flex items-center justify-center text-purple-400">
            <TrendingUp className="w-4 h-4"/>
          </div>
          <div>
            <div className="text-base font-semibold text-[#e8e4dc]">Spend less, save more</div>
            <div className="text-xs text-[#3d4660] mt-0.5">Based on your recent transactions</div>
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          {challenges.map((ch, i) => {
             const dTheme = ch.difficulty === 'easy' ? 'bg-[#0a1a14] text-teal-400' : ch.difficulty === 'medium' ? 'bg-[#1a1205] text-amber-500' : 'bg-[#1a0808] text-rose-400'
             return (
               <div key={i} className="bg-[#0a0e1a] border border-[#1a1f2e] rounded-[14px] p-3.5 flex items-start gap-3">
                 <div className="flex flex-col items-center gap-1.5 shrink-0">
                   <div className="w-[36px] h-[36px] rounded-[10px] bg-[#161c2e] border border-[#1e2535] flex items-center justify-center text-base">
                     {ch.icon || '🎯'}
                   </div>
                   <div className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-[4px] ${dTheme}`}>{ch.difficulty}</div>
                 </div>
                 <div className="flex-1 min-w-0">
                   <div className="text-sm font-semibold text-[#d4d0c8] mb-1">{ch.title}</div>
                   <div className="text-sm text-[#4a5568] leading-[1.5] mb-2">{ch.description}</div>
                   <div className="flex items-center justify-between">
                     <div className="text-xs text-[#3d4660]">{ch.duration}</div>
                     <div className="text-right">
                       <div className="text-sm font-bold text-teal-400">Save up to {fmt(ch.potential_saving)}</div>
                     </div>
                   </div>
                 </div>
               </div>
             )
          })}
        </div>
      </div>

      {/* ── AI Insights ── */}
      <div className="flex items-center gap-2 text-xs tracking-[0.2em] uppercase text-[#3d4660] font-semibold mb-4">
        <span className="w-3.5 h-[1px] bg-[#2a3045]"></span> AI Savings Coach <span className="flex-1 h-[1px] bg-[#2a3045]"></span>
      </div>

      <div className="bg-[#0c0a17] border border-[#2d1f40] rounded-[18px] p-5 mb-4">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2 text-sm text-purple-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
            Personalized insights
          </div>
          <button onClick={loadAI} disabled={aiLoading} 
            className="text-xs text-indigo-400 bg-[#1e1635] border border-[#3d2a60] rounded-lg px-3 py-1.5 font-semibold tracking-wider hover:bg-[#2a1f4a] transition-colors flex items-center gap-1.5 disabled:opacity-50">
            {aiLoading ? <RefreshCw className="w-3 h-3 animate-spin"/> : 'Get insights'}
          </button>
        </div>

        <div className="flex flex-col gap-2">
          {!aiInsights && !aiLoading && (
            <div className="text-sm text-[#7b7090] bg-[#0e0a1a] border border-[#1e1630] rounded-[10px] p-3">
              Click to generate intelligent savings guidance based on your patterns.
            </div>
          )}
          
          {aiInsights?.insights?.map((ins, i) => (
            <div key={i} className="text-sm text-[#7b7090] leading-[1.6] bg-[#0e0a1a] border border-[#1e1630] rounded-[10px] p-3 flex items-start gap-2">
              <div className={`w-1 h-1 rounded-full mt-[7px] shrink-0 ${
                ins.tone === 'positive' ? 'bg-teal-400' : ins.tone === 'action' ? 'bg-indigo-400' : 'bg-amber-500'
              }`}></div>
              <div>{ins.message}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Modals ── */}
      {showGoalModal && (
        <Modal title={editGoal ? 'Edit Goal' : 'New Goal'} onClose={() => { setShowGoalModal(false); setEditGoal(null) }}>
          <GoalForm initial={editGoal || { category: defaultCategory }} onSave={() => { setShowGoalModal(false); setEditGoal(null); load() }}/>
        </Modal>
      )}

      {showContributeModal && activeGoal && (
        <Modal title={`Add Funds to ${activeGoal.name}`} onClose={() => { setShowContributeModal(false); setActiveGoal(null) }}>
          <ContributeForm goal={activeGoal} onSave={() => { setShowContributeModal(false); setActiveGoal(null); load() }}/>
        </Modal>
      )}

      {showClassificationModal && (
        <Modal title="Customize Buckets" onClose={() => { setShowClassificationModal(false); load(); }}>
          <ClassificationManager />
        </Modal>
      )}

      {showHistoryModal && activeGoal && (
        <Modal title={`${activeGoal.name} History`} onClose={() => { setShowHistoryModal(false); setActiveGoal(null) }}>
          <div className="space-y-2">
            {history.length === 0 ? (
              <p className="text-[#3d4660] text-sm text-center py-4 border border-white/5 rounded-xl">No system logs</p>
            ) : (
              history.map((h, i) => (
                <div key={i} className="flex items-center justify-between bg-[#080c14] border border-white/5 rounded-xl px-4 py-3">
                  <div>
                    <div className="text-[#e8e4dc] text-sm font-semibold">{h.note || 'Contribution'}</div>
                    <div className="text-[#3d4660] text-[11px] font-bold uppercase tracking-widest mt-0.5">{h.date}</div>
                  </div>
                  <div className="text-teal-400 text-sm font-bold">{fmt(h.amount)}</div>
                </div>
              ))
            )}
          </div>
        </Modal>
      )}
    </div>
  )
}