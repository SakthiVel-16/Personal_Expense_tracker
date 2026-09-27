import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2, Check, AlertTriangle, Target, Pencil, PieChart } from 'lucide-react'
import api from '../lib/api.js'
import Modal from '../components/Modal.jsx'
import { useDateRange } from '../context/DateContext.jsx'

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`

function BudgetCard({ budget, onEdit, onDelete, onCategoryClick }) {
  const pct = Math.min(budget.percentage, 100)
  const isOver = budget.is_over
  const isWarning = budget.percentage >= budget.alert_threshold && !isOver

  const barColor = isOver ? '#fb7185' : isWarning ? '#fbbf24' : '#2dd4bf'
  const statusText = isOver
    ? `Over by ${fmt(Math.abs(budget.remaining))}`
    : `${fmt(budget.remaining)} remaining`

  return (
    <div 
      onClick={() => onCategoryClick(budget.category_name)}
      className={`bg-white/[0.02] backdrop-blur-2xl border rounded-[32px] p-6 sm:p-8 transition-all duration-500 cursor-pointer group relative overflow-hidden ${
      isOver ? 'border-rose-500/20 hover:border-rose-500/40' : isWarning ? 'border-amber-500/20 hover:border-amber-500/40' : 'border-white/5 hover:border-white/10 hover:-translate-y-1'
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-inner group-hover:scale-110 transition-transform duration-500 border border-white/5"
            style={{ background: `${budget.category_color}20`, color: budget.category_color }}>
            {budget.category_icon || '📦'}
          </div>
          <div>
            <p className="text-white/90 text-base font-bold group-hover:text-white transition-colors tracking-wide">{budget.category_name}</p>
            <p className="text-white/40 text-[10px] uppercase tracking-[0.2em] font-bold mt-1">{budget.period}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {(isOver || isWarning) && (
            <AlertTriangle className={`w-5 h-5 ${isOver ? 'text-rose-400' : 'text-amber-400'}`} />
          )}
          <button onClick={(e) => { e.stopPropagation(); onEdit(budget); }}
            className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center
            text-white/40 hover:text-white hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100">
            <Pencil className="w-4 h-4" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(budget.id); }}
            className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center
            text-white/40 hover:text-rose-400 hover:bg-rose-500/20 transition-all opacity-0 group-hover:opacity-100">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Amounts */}
      <div className="flex items-end justify-between mb-4">
        <div>
          <p className="text-white/40 text-[11px] tracking-[0.2em] font-bold uppercase mb-1.5">Consumed</p>
          <p className={`text-3xl font-black tracking-tighter ${isOver ? 'text-rose-400' : 'text-white'}`}>
            {fmt(budget.spent)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-white/40 text-[11px] tracking-[0.2em] font-bold uppercase mb-1.5">Limit</p>
          <p className="text-white/60 text-base font-bold">{fmt(budget.amount)}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-5">
        <div className="h-3 bg-white/[0.08] border border-white/10 rounded-full overflow-hidden shadow-inner">
          <div className="h-full rounded-full transition-all duration-1000 shadow-[0_0_15px_currentColor]"
            style={{ width: `${pct}%`, background: barColor }} />
        </div>
        <p className="text-white/30 text-[10px] uppercase tracking-[0.15em] font-bold mt-2.5">{fmt(budget.spent)} / {fmt(budget.amount)}</p>
      </div>

      {/* Status */}
      <div className="flex items-center justify-between">
        <p className={`text-xs font-bold tracking-wide ${isOver ? 'text-rose-400' : isWarning ? 'text-amber-400' : 'text-white/50'}`}>
          {statusText}
        </p>
        <p className={`text-sm font-black tracking-tight ${isOver ? 'text-rose-400' : 'text-white'}`}>
          {budget.percentage}%
        </p>
      </div>
    </div>
  )
}

function BudgetForm({ initial, categories, onSave, onClose }) {
  const [form, setForm] = useState(initial || {
    category_id: '', amount: '', period: 'monthly', alert_threshold: 80
  })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.category_id || !form.amount) return
    setSaving(true)
    try {
      if (initial && initial.id) {
        await api.put(`/budgets/${initial.id}`, form)
      } else {
        await api.post('/budgets', form)
      }
      onSave()
    } catch (e) { console.error(e) }
    setSaving(false)
  }

  return (
    <div className="space-y-5">
      <div>
        <label className="text-white/40 text-[11px] tracking-[0.2em] font-bold uppercase mb-2 block">Category</label>
        <select value={form.category_id} onChange={e => set('category_id', e.target.value)}
          className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4
          text-white text-sm font-medium outline-none focus:border-indigo-500/50 focus:bg-white/[0.05] transition-all appearance-none">
          <option value="" className="bg-transparent">Select category...</option>
          {categories.filter(c => c.type === 'expense').map(c => (
            <option key={c.id} value={c.id} className="bg-transparent">{c.icon} {c.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-white/40 text-[11px] tracking-[0.2em] font-bold uppercase mb-2 block">Budget amount (₹)</label>
        <input type="number" value={form.amount} onChange={e => set('amount', e.target.value)}
          placeholder="e.g. 5000"
          className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4
          text-white text-2xl font-black tracking-tighter placeholder-white/20 outline-none focus:border-indigo-500/50 focus:bg-white/[0.05] transition-all" />
      </div>

      <div>
        <label className="text-white/40 text-[11px] tracking-[0.2em] font-bold uppercase mb-2 block">Period</label>
        <div className="flex gap-3">
          {['monthly', 'weekly', 'yearly'].map(p => (
            <button key={p} onClick={() => set('period', p)}
              className={`flex-1 py-3.5 rounded-2xl text-sm font-bold tracking-wide capitalize transition-all ${
                form.period === p
                  ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shadow-inner'
                  : 'bg-white/[0.03] text-white/40 border border-white/5 hover:bg-white/10 hover:text-white/80'
              }`}>
              {p}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-white/40 text-[11px] tracking-[0.2em] font-bold uppercase mb-3 flex justify-between">
          <span>Alert Threshold</span>
          <span className="text-indigo-400">{form.alert_threshold}%</span>
        </label>
        <input type="range" min="50" max="95" step="5"
          value={form.alert_threshold} onChange={e => set('alert_threshold', Number(e.target.value))}
          className="w-full accent-indigo-500 h-2 bg-white/10 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:bg-indigo-400 [&::-webkit-slider-thumb]:rounded-full cursor-pointer shadow-inner" />
        <div className="flex justify-between text-white/30 text-[10px] tracking-widest font-bold mt-4">
          <span>50%</span><span>Alert Level</span><span>95%</span>
        </div>
      </div>

      <button onClick={handleSave} disabled={saving}
        className="w-full bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 text-white
        font-bold tracking-wide py-4 rounded-2xl transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 mt-6">
        {saving
          ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          : <><Check className="w-5 h-5" /> {initial && initial.id ? 'Update Budget' : 'Create Budget'}</>
        }
      </button>
    </div>
  )
}

export default function Budgets() {
  const navigate = useNavigate()
  const { range } = useDateRange()
  const [budgets, setBudgets] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editBudget, setEditBudget] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    const [b, c] = await Promise.all([
      api.get('/budgets', { params: { start: range.start, end: range.end } }),
      api.get('/categories')
    ])
    setBudgets(b.data)
    setCategories(c.data)
    setLoading(false)
  }, [range.start, range.end])

  useEffect(() => { load() }, [load])

  const handleDelete = async (id) => {
    if (!confirm('Delete this budget?')) return
    await api.delete(`/budgets/${id}`)
    load()
  }

  const totalBudget = budgets.reduce((s, b) => s + b.amount, 0)
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0)
  const overCount = budgets.filter(b => b.is_over).length
  const healthyCount = budgets.filter(b => !b.is_over && b.percentage < b.alert_threshold).length

  return (
    <div className="page-shell relative min-h-screen bg-transparent overflow-hidden p-2 sm:p-4 md:p-0">
      {/* Cinematic Ambient Lighting System */}
      <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[150px] pointer-events-none" />

      <div className="relative z-10 space-y-8 max-w-[1700px] mx-auto pb-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-white text-4xl font-black tracking-tighter">Budgets</h1>
            <p className="text-white/40 text-sm font-medium mt-1.5 tracking-wide">System limit controls and pacing.</p>
          </div>
          <button onClick={() => { setEditBudget(null); setShowModal(true); }}
            className="flex items-center justify-center gap-2 bg-white text-black hover:bg-white/90
            px-6 py-3.5 rounded-2xl text-sm font-bold tracking-wide transition-all shadow-lg shadow-white/10 group">
            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" /> New Limit
          </button>
        </div>

        {/* Summary */}
        <div className="budget-summary grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Total Allocated', value: fmt(totalBudget), color: 'text-white', border: 'border-white/10' },
            { label: 'Total Consumed', value: fmt(totalSpent), color: 'text-rose-400', border: 'border-rose-500/20' },
            { label: 'System Remaining', value: fmt(totalBudget - totalSpent), color: 'text-teal-400', border: 'border-teal-500/20' },
            { label: 'Breach Alerts', value: `${overCount} Nodes`, color: overCount > 0 ? 'text-rose-400' : 'text-teal-400', border: overCount > 0 ? 'border-rose-500/20' : 'border-white/5' },
          ].map(s => (
            <div key={s.label} className={`bg-white/[0.02] backdrop-blur-2xl border ${s.border} rounded-[32px] px-8 py-6 hover:bg-white/[0.04] transition-colors`}>
              <p className="text-white/40 text-[11px] tracking-[0.2em] uppercase font-bold mb-2">{s.label}</p>
              <p className={`text-4xl font-black tracking-tighter ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Overall progress */}
        {budgets.length > 0 && (
          <div className="bg-white/[0.02] backdrop-blur-2xl border border-white/5 rounded-[32px] p-8 hover:border-white/10 transition-colors duration-500">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-indigo-400 border border-white/5 shadow-inner">
                  <PieChart className="w-5 h-5" />
                </div>
                <p className="text-white/90 font-bold text-lg tracking-wide">Overall System Load</p>
              </div>
              <p className="text-white/60 text-sm font-bold bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                {fmt(totalSpent)} <span className="text-white/30 mx-2">/</span> {fmt(totalBudget)}
              </p>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden shadow-inner mb-4">
              <div className="h-full rounded-full transition-all duration-1000 shadow-[0_0_15px_currentColor]"
                style={{
                  width: `${Math.min((totalSpent / totalBudget) * 100, 100)}%`,
                  background: overCount > 0 ? '#fb7185' : totalSpent / totalBudget > 0.8 ? '#fbbf24' : '#2dd4bf'
                }} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-teal-400/90 text-xs font-bold bg-teal-500/10 border border-teal-500/20 px-3 py-1.5 rounded-lg tracking-wide">{healthyCount} Safe Nodes</span>
              <span className="text-white/50 text-sm font-bold">{Math.round((totalSpent / totalBudget) * 100) || 0}% Utilized</span>
            </div>
          </div>
        )}

        {/* Budget cards */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-white/10 border-t-white rounded-full animate-spin" />
          </div>
        ) : budgets.length === 0 ? (
          <div className="bg-white/[0.02] backdrop-blur-2xl border border-dashed border-white/10 rounded-[32px] flex flex-col
            items-center justify-center h-72 text-white/30 hover:bg-white/[0.04] transition-all">
            <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center mb-6 shadow-inner">
              <Target className="w-8 h-8 text-white/40" />
            </div>
            <p className="text-xl font-bold tracking-wide text-white/90">No limits active</p>
            <p className="text-sm mt-2 text-white/50 font-medium">Initialize your first spending constraint.</p>
            <button onClick={() => { setEditBudget(null); setShowModal(true); }}
              className="mt-8 px-8 py-3.5 bg-white text-black hover:bg-white/90 rounded-2xl text-sm font-bold tracking-wide transition-all shadow-lg shadow-white/10">
              Initialize Budget
            </button>
          </div>
        ) : (
          <div className="budget-cards grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {budgets.map(b => (
              <BudgetCard key={b.id} budget={b} 
                onEdit={(budget) => { setEditBudget(budget); setShowModal(true); }}
                onDelete={handleDelete}
                onCategoryClick={(categoryName) => navigate(`/transactions?category=${encodeURIComponent(categoryName)}`)} />
            ))}
          </div>
        )}

        {showModal && (
          <Modal title={editBudget ? 'Configure Limit' : 'New Limit'} onClose={() => { setShowModal(false); setEditBudget(null); }}>
            <BudgetForm initial={editBudget} categories={categories}
              onSave={() => { setShowModal(false); setEditBudget(null); load() }}
              onClose={() => { setShowModal(false); setEditBudget(null); }} />
          </Modal>
        )}
      </div>
    </div>
  )
}
