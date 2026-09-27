import { useEffect, useState } from 'react'
import { Plus, Search, Trash2, Pencil, Check, Filter, X } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { useDateRange } from '../context/DateContext.jsx'
import api from '../lib/api.js'
import Modal from '../components/Modal.jsx'

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`

const PAYMENT_METHODS = ['cash', 'upi', 'credit card', 'debit card', 'net banking', 'other']

function TransactionForm({ initial, categories, onSave, onClose }) {
  const [form, setForm] = useState(() => {
    if (initial) {
      return {
        ...initial,
        category_id: initial.category_id ?? '',
        payment_method: initial.payment_method || 'upi',
        tags: initial.tags || [],
        notes: initial.notes || '',
        is_recurring: initial.is_recurring === 1 || initial.is_recurring === true,
        recurring_interval: initial.recurring_interval || '',
      }
    }
    return {
      amount: '',
      type: 'expense',
      category_id: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      payment_method: 'upi',
      tags: [],
      notes: '',
      is_recurring: false,
      recurring_interval: '',
    }
  })
  const [saving, setSaving] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.amount || !form.date) return
    setSaving(true)
    try {
      const payload = {
        ...form,
        amount: Number(form.amount),
        category_id: form.category_id === '' ? null : Number(form.category_id),
        is_recurring: form.is_recurring ? 1 : 0,
      }
      if (form.id) {
        await api.put(`/transactions/${form.id}`, payload)
      } else {
        await api.post('/transactions', payload)
      }
      onSave()
    } catch (e) {
      console.error(e)
    }
    setSaving(false)
  }

  const filteredCats = categories.filter(c => c.type === form.type || c.type === 'both')

  return (
    <div className="space-y-5">
      {/* Type toggle */}
      <div className="flex bg-white/5 rounded-xl p-1">
        {['expense', 'income'].map(t => (
          <button key={t} onClick={() => set('type', t)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold tracking-wide capitalize transition-all ${
              form.type === t
                ? t === 'expense' ? 'bg-rose-500/20 text-rose-400 shadow-inner' : 'bg-teal-500/20 text-teal-400 shadow-inner'
                : 'text-white/30 hover:text-white/50'
            }`}>
            {t}
          </button>
        ))}
      </div>

      {/* Amount */}
      <div>
        <label className="text-white/40 text-[11px] tracking-[0.2em] font-bold uppercase mb-2 block">Amount (₹)</label>
        <input type="number" value={form.amount} onChange={e => set('amount', e.target.value)}
          placeholder="0.00" className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4
          text-white text-2xl font-black tracking-tighter placeholder-white/20 outline-none focus:border-indigo-500/50 focus:bg-white/[0.05] transition-all" />
      </div>

      {/* Description */}
      <div>
        <label className="text-white/40 text-[11px] tracking-[0.2em] font-bold uppercase mb-2 block">Description</label>
        <input type="text" value={form.description} onChange={e => set('description', e.target.value)}
          placeholder="What was this for?" className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-3.5
          text-white text-sm font-medium placeholder-white/20 outline-none focus:border-indigo-500/50 focus:bg-white/[0.05] transition-all" />
      </div>

      {/* Category & Date */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-white/40 text-[11px] tracking-[0.2em] font-bold uppercase mb-2 block">Category</label>
          <select
            value={form.category_id ?? ''}
            onChange={e => set('category_id', e.target.value)}
            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-4 py-3.5
            text-white text-sm font-medium outline-none focus:border-indigo-500/50 focus:bg-white/[0.05] transition-all appearance-none">
            <option value="">Select...</option>
            {filteredCats.map(c => (
              <option key={c.id} value={c.id} className="bg-[#050816]">{c.icon} {c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-white/40 text-[11px] tracking-[0.2em] font-bold uppercase mb-2 block">Date</label>
          <input type="date" value={form.date} onChange={e => set('date', e.target.value)}
            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-4 py-3.5
            text-white text-sm font-medium outline-none focus:border-indigo-500/50 focus:bg-white/[0.05] transition-all" />
        </div>
      </div>

      {/* Payment method */}
      <div>
        <label className="text-white/40 text-[11px] tracking-[0.2em] font-bold uppercase mb-2 block">Payment method</label>
        <div className="flex flex-wrap gap-2">
          {PAYMENT_METHODS.map(m => (
            <button key={m} onClick={() => set('payment_method', m)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize transition-all ${
                form.payment_method === m
                  ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                  : 'bg-white/[0.03] text-white/40 border border-white/5 hover:bg-white/10 hover:text-white/80'
              }`}>
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="text-white/40 text-[11px] tracking-[0.2em] font-bold uppercase mb-2 block">Notes (optional)</label>
        <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
          placeholder="Any extra details..." rows={2}
          className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-3.5
          text-white text-sm placeholder-white/20 outline-none focus:border-indigo-500/50 focus:bg-white/[0.05] transition-all resize-none" />
      </div>

      {/* Recurring toggle */}
      <label className="flex items-center gap-3 cursor-pointer select-none bg-white/[0.02] p-4 rounded-2xl border border-white/5">
        <div
          onClick={() => set('is_recurring', !form.is_recurring)}
          className={`w-12 h-6 rounded-full transition-all flex items-center px-1 cursor-pointer ${
            form.is_recurring ? 'bg-indigo-500' : 'bg-white/10'
          }`}>
          <div className={`w-4 h-4 rounded-full bg-white shadow-md transition-transform duration-300 ${
            form.is_recurring ? 'translate-x-6' : 'translate-x-0'
          }`} />
        </div>
        <div className="flex flex-col">
          <span className="text-white/90 text-sm font-semibold">Recurring Transaction</span>
          <span className="text-white/40 text-[10px] uppercase tracking-wider mt-0.5">Automate this log</span>
        </div>
      </label>

      {/* Save button */}
      <button onClick={handleSave} disabled={saving}
        className="w-full bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 text-white
        font-bold tracking-wide py-4 rounded-2xl transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 mt-4">
        {saving ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <><Check className="w-5 h-5" /> {form.id ? 'Update transaction' : 'Add transaction'}</>
        )}
      </button>
    </div>
  )
}

export default function Transactions() {
  const location = useLocation()
  const { range } = useDateRange()
  const [transactions, setTransactions] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterCat, setFilterCat] = useState(() => {
    const params = new URLSearchParams(location.search)
    return params.get('category') || ''
  })

  const load = async () => {
    setLoading(true);
    const params = {};
    if (range.start) params.start = range.start;
    if (range.end) params.end = range.end;
    if (search) params.search = search;
    if (filterType) params.type = filterType;

    // Fetch categories first to resolve name-based filters if needed
    const c = await api.get('/categories');
    const cats = c.data;
    setCategories(cats);

    if (filterCat) {
      const isNumericId = /^\d+$/.test(filterCat);
      if (isNumericId) {
        params.category = filterCat;
      } else {
        const matchedCat = cats.find(c => c.name === filterCat);
        if (matchedCat) {
          params.category = matchedCat.id;
          setFilterCat(String(matchedCat.id)); // Update state to use ID
        } else {
          setTransactions([]); // Invalid category name, show nothing
          setLoading(false);
          return;
        }
      }
    }
    const t = await api.get('/transactions', { params });
    setTransactions(t.data.transactions);
    setLoading(false);
  };

  useEffect(() => { load() }, [search, filterType, filterCat, range.start, range.end])

  const handleDelete = async (id) => {
    if (!confirm('Delete this transaction?')) return
    await api.delete(`/transactions/${id}`)
    load()
  }

  const handleSave = () => {
    setShowModal(false)
    setEditItem(null)
    load()
  }

  const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

  return (
    <div className="page-shell relative min-h-screen bg-[#050816] overflow-hidden -mx-3 -my-3 p-4 sm:-mx-4 sm:-my-4 md:m-0 md:p-8 rounded-[35px]">
      {/* Cinematic Ambient Lighting System */}
      <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-teal-600/10 rounded-full blur-[150px] pointer-events-none" />

      <div className="relative z-10 space-y-8 max-w-[1700px] mx-auto pb-12">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-white text-4xl font-black tracking-tighter">Ledger</h1>
            <p className="text-white/40 text-sm font-medium mt-1.5 tracking-wide">System logs • {transactions.length} entries</p>
          </div>
          <button onClick={() => { setEditItem(null); setShowModal(true) }}
            className="flex items-center justify-center gap-2 bg-white text-black hover:bg-white/90
            px-6 py-3.5 rounded-2xl text-sm font-bold tracking-wide transition-all shadow-lg shadow-white/10 group">
            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" /> New Entry
          </button>
        </div>

        {/* Summary strip */}
        <div className="transaction-summary grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: 'Total Inflow', value: fmt(income), color: 'text-teal-400', border: 'border-teal-500/20' },
            { label: 'Total Outflow', value: fmt(expense), color: 'text-rose-400', border: 'border-rose-500/20' },
            { label: 'Net Delta', value: fmt(income - expense), color: income - expense >= 0 ? 'text-indigo-400' : 'text-amber-400', border: 'border-white/10' },
          ].map(s => (
            <div key={s.label} className={`bg-white/[0.02] backdrop-blur-2xl border ${s.border} rounded-[32px] px-8 py-6 hover:bg-white/[0.04] transition-colors`}>
              <p className="text-white/40 text-[11px] tracking-[0.2em] font-bold uppercase mb-2">{s.label}</p>
              <p className={`text-4xl font-black tracking-tighter ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filters Panel */}
        <div className="bg-white/[0.02] backdrop-blur-xl border border-white/5 rounded-[24px] p-3 flex flex-col md:flex-row items-center gap-3">
          <div className="flex-1 relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search ledger..."
              className="w-full bg-white/[0.03] border border-white/5 rounded-xl pl-11 pr-4 py-3.5
              text-white text-sm font-medium placeholder-white/30 outline-none focus:border-white/20 focus:bg-white/[0.06] transition-all" />
          </div>
          <div className="flex w-full md:w-auto gap-3">
            <select value={filterType} onChange={e => setFilterType(e.target.value)}
              className="flex-1 md:flex-none bg-white/[0.03] border border-white/5 rounded-xl px-4 py-3.5 text-white/70
              text-sm font-medium outline-none focus:border-white/20 transition-all appearance-none cursor-pointer">
              <option value="" className="bg-[#050816]">All flows</option>
              <option value="income" className="bg-[#050816]">Inflow (Income)</option>
              <option value="expense" className="bg-[#050816]">Outflow (Expense)</option>
            </select>
            <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
              className="flex-1 md:flex-none bg-white/[0.03] border border-white/5 rounded-xl px-4 py-3.5 text-white/70
              text-sm font-medium outline-none focus:border-white/20 transition-all appearance-none cursor-pointer max-w-[180px] truncate">
              <option value="" className="bg-[#050816]">All categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.id} className="bg-[#050816]">{c.icon} {c.name}</option>
              ))}
            </select>
            {(filterType || filterCat || search) && (
              <button onClick={() => { setSearch(''); setFilterType(''); setFilterCat('') }}
                className="w-12 shrink-0 flex items-center justify-center rounded-xl bg-white/[0.05] hover:bg-white/10 text-white/50 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Transaction list */}
        <div className="bg-white/[0.02] backdrop-blur-2xl border border-white/5 rounded-[32px] overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-2 border-white/10 border-t-white rounded-full animate-spin" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-white/30">
              <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center mb-4">
                <Filter className="w-6 h-6 opacity-50" />
              </div>
              <p className="text-sm font-bold tracking-wide">No ledger entries found</p>
              <p className="text-xs mt-1 font-medium opacity-60">Adjust filters or create a new entry.</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {transactions.map(t => (
                <div key={t.id} className="transaction-row flex items-center gap-5 px-8 py-5 hover:bg-white/[0.04] transition-all duration-300 group">
                  {/* Icon */}
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0 shadow-inner group-hover:scale-110 transition-transform duration-300"
                    style={{ background: `${t.category_color}15`, color: t.category_color }}>
                    {t.category_icon || '💸'}
                  </div>

                  {/* Info */}
                  <div className="transaction-info flex-1 min-w-0">
                    <p className="text-white/90 text-base font-bold truncate tracking-wide">
                      {t.description || 'No description'}
                      {t.is_recurring ? <span className="ml-2 text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full uppercase tracking-wider">↻ Auto</span> : null}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-white/40 text-[11px] uppercase tracking-[0.15em] font-bold">{t.category_name || 'Uncategorized'}</span>
                      <span className="w-1 h-1 rounded-full bg-white/10" />
                      <span className="text-white/40 text-[11px] uppercase tracking-[0.15em] font-bold">{t.payment_method}</span>
                      <span className="w-1 h-1 rounded-full bg-white/10" />
                      <span className="text-white/40 text-[11px] uppercase tracking-[0.15em] font-bold">{t.date}</span>
                    </div>
                  </div>

                  {/* Amount */}
                  <p className={`transaction-amount text-xl font-black tracking-tighter shrink-0 ${
                    t.type === 'income' ? 'text-teal-400' : 'text-white'
                  }`}>
                    {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
                  </p>

                  {/* Actions */}
                  <div className="transaction-actions flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity ml-4">
                    <button onClick={() => { setEditItem(t); setShowModal(true) }}
                      className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center
                      text-white/40 hover:bg-white/10 hover:text-white transition-all">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(t.id)}
                      className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center
                      text-white/40 hover:bg-rose-500/20 hover:text-rose-400 transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <Modal title={editItem ? 'Edit Entry' : 'New Entry'}
            onClose={() => { setShowModal(false); setEditItem(null) }}>
            <TransactionForm
              initial={editItem}
              categories={categories}
              onSave={handleSave}
              onClose={() => { setShowModal(false); setEditItem(null) }}
            />
          </Modal>
        )}
      </div>
    </div>
  )
}