import { useEffect, useState } from 'react'
import { Plus, Trash2, Pencil, Check, TrendingUp, TrendingDown, Landmark } from 'lucide-react'
import api from '../lib/api.js'
import Modal from '../components/Modal.jsx'

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`

const ASSET_CATS = ['cash', 'savings', 'investment', 'property', 'vehicle', 'other']
const LIABILITY_CATS = ['loan', 'credit card', 'mortgage', 'other']

function ItemForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial || {
    name: '', type: 'asset', amount: '',
    category: 'savings', date: new Date().toISOString().split('T')[0], notes: ''
  })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.name || !form.amount) return
    setSaving(true)
    try {
      if (form.id) await api.put(`/networth/${form.id}`, form)
      else await api.post('/networth', form)
      onSave()
    } catch (e) { console.error(e) }
    setSaving(false)
  }

  const cats = form.type === 'asset' ? ASSET_CATS : LIABILITY_CATS

  return (
    <div className="space-y-5">
      {/* Type toggle */}
      <div className="flex bg-white/5 rounded-xl p-1">
        {['asset', 'liability'].map(t => (
          <button key={t} onClick={() => { set('type', t); set('category', t === 'asset' ? 'savings' : 'loan') }}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold tracking-wide capitalize transition-all ${
              form.type === t
                ? t === 'asset' ? 'bg-teal-500/20 text-teal-400 shadow-inner' : 'bg-rose-500/20 text-rose-400 shadow-inner'
                : 'text-white/30 hover:text-white/50'
            }`}>
            {t}
          </button>
        ))}
      </div>

      <div>
        <label className="text-white/40 text-[11px] tracking-[0.2em] font-bold uppercase mb-2 block">Name</label>
        <input value={form.name} onChange={e => set('name', e.target.value)}
          placeholder={form.type === 'asset' ? 'e.g. HDFC Savings Account' : 'e.g. Car Loan'}
          className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-3.5
          text-white text-sm font-medium placeholder-white/20 outline-none focus:border-indigo-500/50 focus:bg-white/[0.05] transition-all"/>
      </div>

      <div>
        <label className="text-white/40 text-[11px] tracking-[0.2em] font-bold uppercase mb-2 block">Amount (₹)</label>
        <input type="number" value={form.amount} onChange={e => set('amount', e.target.value)}
          placeholder="0"
          className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4
          text-white text-2xl font-black tracking-tighter placeholder-white/20 outline-none focus:border-indigo-500/50 focus:bg-white/[0.05] transition-all"/>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-white/40 text-[11px] tracking-[0.2em] font-bold uppercase mb-2 block">Category</label>
          <select value={form.category} onChange={e => set('category', e.target.value)}
            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-4 py-3.5
            text-white text-sm font-medium outline-none focus:border-indigo-500/50 focus:bg-white/[0.05] transition-all capitalize appearance-none">
            {cats.map(c => <option key={c} value={c} className="bg-transparent">{c}</option>)}
          </select>
        </div>
        <div>
          <label className="text-white/40 text-[11px] tracking-[0.2em] font-bold uppercase mb-2 block">As of date</label>
          <input type="date" value={form.date} onChange={e => set('date', e.target.value)}
            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-4 py-3.5
            text-white text-sm font-medium outline-none focus:border-indigo-500/50 focus:bg-white/[0.05] transition-all"/>
        </div>
      </div>

      <div>
        <label className="text-white/40 text-[11px] tracking-[0.2em] font-bold uppercase mb-2 block">Notes (optional)</label>
        <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
          rows={2} placeholder="Any details..."
          className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-3.5
          text-white text-sm placeholder-white/20 outline-none focus:border-indigo-500/50 focus:bg-white/[0.05] transition-all resize-none"/>
      </div>

      <button onClick={handleSave} disabled={saving}
        className="w-full bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 text-white
        font-bold tracking-wide py-4 rounded-2xl transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 mt-4">
        {saving
          ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
          : <><Check className="w-5 h-5"/>{form.id ? 'Update' : 'Add item'}</>
        }
      </button>
    </div>
  )
}

function ItemRow({ item, onEdit, onDelete }) {
  return (
    <div className="net-worth-item-row flex items-center justify-between py-4 px-5 rounded-2xl hover:bg-white/[0.04] border border-transparent hover:border-white/5 transition-all duration-300 group">
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold capitalize shadow-inner group-hover:scale-110 transition-transform duration-300
          ${item.type === 'asset' ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
          {item.category.slice(0, 2).toUpperCase()}
        </div>
        <div>
          <p className="text-white/90 text-sm font-bold tracking-wide">{item.name}</p>
          <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mt-0.5">{item.category} • {item.date}</p>
        </div>
      </div>
      <div className="net-worth-item-details flex items-center gap-3">
        <p className={`text-lg font-black tracking-tighter ${item.type === 'asset' ? 'text-teal-400' : 'text-rose-400'}`}>
          {item.type === 'liability' ? '-' : '+'}{fmt(item.amount)}
        </p>
        <div className="net-worth-item-actions flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
          <button onClick={() => onEdit(item)}
            className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all">
            <Pencil className="w-3.5 h-3.5"/>
          </button>
          <button onClick={() => onDelete(item.id)}
            className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40 hover:text-rose-400 hover:bg-rose-500/20 transition-all">
            <Trash2 className="w-3.5 h-3.5"/>
          </button>
        </div>
      </div>
    </div>
  )
}

export default function NetWorth() {
  const [data, setData] = useState({ items: [], assets: 0, liabilities: 0, net_worth: 0, dynamicNetWorth: 0 })
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState(null)

  const load = async () => {
    setLoading(true)
    const r = await api.get('/networth')
    setData(r.data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (id) => {
    if (!confirm('Delete this item?')) return
    await api.delete(`/networth/${id}`)
    load()
  }

  const handleSave = () => { setShowModal(false); setEditItem(null); load() }

  const assets = data.items.filter(i => i.type === 'asset')
  const liabilities = data.items.filter(i => i.type === 'liability')
  const isPositive = data.net_worth >= 0

  // Simple gauge
  const ratio = data.assets > 0 ? Math.min((data.liabilities / data.assets) * 100, 100) : 0

  return (
    <div className="page-shell relative min-h-screen bg-transparent overflow-hidden p-2 sm:p-4 md:p-0">
      {/* Cinematic Ambient Lighting System */}
      <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-teal-600/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-rose-600/10 rounded-full blur-[150px] pointer-events-none" />

      <div className="relative z-10 space-y-8 max-w-[1700px] mx-auto pb-12">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-white text-4xl font-black tracking-tighter">Net Worth</h1>
            <p className="text-white/40 text-sm font-medium mt-1.5 tracking-wide">Assets minus liabilities</p>
          </div>
          <button onClick={() => { setEditItem(null); setShowModal(true) }}
            className="flex items-center justify-center gap-2 bg-white text-black hover:bg-white/90
            px-6 py-3.5 rounded-2xl text-sm font-bold tracking-wide transition-all shadow-lg shadow-white/10 group">
            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300"/> Add item
          </button>
        </div>

        {/* Hero OS Header */}
        <div className="flex flex-col items-center justify-center py-10 mb-4">
          <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/10 mb-6 backdrop-blur-md`}>
            <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${isPositive ? 'bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.8)]' : 'bg-rose-400 shadow-[0_0_8px_rgba(243,113,117,0.8)]'}`} />
            <span className="text-white/70 text-[10px] font-bold tracking-[0.2em] uppercase">
              {isPositive ? 'Positive Equity' : 'Negative Equity'}
            </span>
          </div>
          <p className="text-white/40 text-xs uppercase tracking-[0.3em] font-bold mb-4">Total Net Worth</p>
          <h1 className={`text-7xl md:text-8xl font-black tracking-tighter drop-shadow-2xl ${isPositive ? 'text-transparent bg-clip-text bg-gradient-to-b from-white via-white/90 to-white/40' : 'text-rose-400'}`}>
            {isPositive ? '' : '-'}{fmt(Math.abs(data.net_worth))}
          </h1>
          
          {/* Breakdown text */}
          <div className="mt-8 text-center space-y-2">
            <p className="text-white/50 text-xs font-medium">
              💰 Dynamic (Savings): <span className="text-indigo-400 font-bold">{fmt(data.dynamicNetWorth)}</span>
            </p>
            {(data.manualAssets > 0 || data.manualLiabilities > 0) && (
              <p className="text-white/50 text-xs font-medium">
                🏦 Manual Assets: <span className="text-teal-400 font-bold">{fmt(data.manualAssets)}</span>
                {' | '}
                💳 Manual Liabilities: <span className="text-rose-400 font-bold">{fmt(data.manualLiabilities)}</span>
              </p>
            )}
          </div>
        </div>

        {/* KPI row */}
        <div className="net-worth-kpis grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/[0.02] backdrop-blur-2xl border border-white/5 rounded-[32px] px-8 py-6 hover:bg-white/[0.04] transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center shadow-inner">
                <TrendingUp className="w-5 h-5 text-teal-400"/>
              </div>
              <p className="text-white/40 text-[11px] tracking-[0.2em] font-bold uppercase">Total Assets</p>
            </div>
            <p className="text-teal-400 text-4xl font-black tracking-tighter">{fmt(data.assets)}</p>
            <p className="text-white/30 text-[11px] uppercase tracking-widest font-bold mt-3">{assets.length} active nodes</p>
          </div>
          
          <div className="bg-white/[0.02] backdrop-blur-2xl border border-white/5 rounded-[32px] px-8 py-6 hover:bg-white/[0.04] transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shadow-inner">
                <TrendingDown className="w-5 h-5 text-rose-400"/>
              </div>
              <p className="text-white/40 text-[11px] tracking-[0.2em] font-bold uppercase">Total Liabilities</p>
            </div>
            <p className="text-rose-400 text-4xl font-black tracking-tighter">{fmt(data.liabilities)}</p>
            <p className="text-white/30 text-[11px] uppercase tracking-widest font-bold mt-3">{liabilities.length} active nodes</p>
          </div>

          <div className="bg-white/[0.02] backdrop-blur-2xl border border-white/5 rounded-[32px] px-8 py-6 hover:bg-white/[0.04] transition-colors flex flex-col justify-center">
            <p className="text-white/40 text-[11px] tracking-[0.2em] font-bold uppercase mb-2">Debt-to-Asset Load</p>
            <p className={`text-4xl font-black tracking-tighter ${ratio < 30 ? 'text-teal-400' : ratio < 60 ? 'text-amber-400' : 'text-rose-400'}`}>
              {ratio.toFixed(1)}%
            </p>
            <div className="h-1.5 bg-white/5 rounded-full mt-4 overflow-hidden shadow-inner">
              <div className="h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_currentColor]"
                style={{ width:`${ratio}%`, background: ratio<30?'#2dd4bf':ratio<60?'#fbbf24':'#fb7185' }}/>
            </div>
          </div>
        </div>

        {/* Lists */}
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-2 border-white/10 border-t-white rounded-full animate-spin"/>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Assets */}
            <div className="bg-white/[0.02] backdrop-blur-2xl border border-white/5 rounded-[32px] p-8 hover:border-white/10 transition-colors duration-500">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center shadow-inner">
                  <div className="w-2 h-2 rounded-full bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.8)]"/>
                </div>
                <p className="text-white/90 text-lg font-bold tracking-wide">Assets</p>
              </div>
              {assets.length === 0
                ? <div className="flex flex-col items-center justify-center h-40 text-white/30 border border-dashed border-white/5 rounded-2xl">
                    <Landmark className="w-8 h-8 mb-3 opacity-50"/>
                    <p className="text-sm font-medium tracking-wide">No assets registered</p>
                  </div>
                : <div className="space-y-2">
                    {assets.map(item => (
                      <ItemRow key={item.id} item={item}
                        onEdit={i => { setEditItem(i); setShowModal(true) }}
                        onDelete={handleDelete}/>
                    ))}
                  </div>
              }
            </div>

            {/* Liabilities */}
            <div className="bg-white/[0.02] backdrop-blur-2xl border border-white/5 rounded-[32px] p-8 hover:border-white/10 transition-colors duration-500">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shadow-inner">
                  <div className="w-2 h-2 rounded-full bg-rose-400 shadow-[0_0_8px_rgba(243,113,117,0.8)]"/>
                </div>
                <p className="text-white/90 text-lg font-bold tracking-wide">Liabilities</p>
              </div>
              {liabilities.length === 0
                ? <div className="flex flex-col items-center justify-center h-40 text-white/30 border border-dashed border-white/5 rounded-2xl">
                    <Landmark className="w-8 h-8 mb-3 opacity-50"/>
                    <p className="text-sm font-medium tracking-wide">No liabilities registered</p>
                  </div>
                : <div className="space-y-2">
                    {liabilities.map(item => (
                      <ItemRow key={item.id} item={item}
                        onEdit={i => { setEditItem(i); setShowModal(true) }}
                        onDelete={handleDelete}/>
                    ))}
                  </div>
              }
            </div>
          </div>
        )}

        {showModal && (
          <Modal title={editItem ? 'Edit Entity' : 'New Entity'} onClose={() => { setShowModal(false); setEditItem(null) }}>
            <ItemForm initial={editItem} onSave={handleSave} onClose={() => { setShowModal(false); setEditItem(null) }}/>
          </Modal>
        )}
      </div>
    </div>
  )
}
