import { useState } from 'react'
import { ShieldAlert, ArrowRight, Wallet, Lock } from 'lucide-react'
import api from '../lib/api.js'

export default function Login() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await api.post('/auth/login', { password })
      sessionStorage.setItem('token', res.data.token)
      sessionStorage.setItem('tabSession', 'active')
      window.location.href = '/'
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient lighting */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-fuchsia-600/10 rounded-full blur-[150px] pointer-events-none" />

      <div className="w-full max-w-md bg-white/[0.02] backdrop-blur-2xl border border-white/5 rounded-[35px] p-8 sm:p-10 relative z-10 shadow-2xl">
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 rounded-[24px] bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(99,102,241,0.15)]">
            <Wallet className="w-8 h-8 text-indigo-400" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight mb-2">FinanceOS</h1>
          <p className="text-white/40 text-sm font-medium tracking-wide uppercase">System Core Security</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 flex items-center gap-3 animate-in slide-in-from-bottom">
              <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
              <p className="text-rose-400 text-sm font-medium">{error}</p>
            </div>
          )}

          <div>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 group-focus-within:text-indigo-400 transition-colors" />
              <input
                type="password"
                placeholder="Enter Master Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-transparent text-white pl-12 pr-4 py-4 rounded-2xl border border-white/5 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 outline-none transition-all placeholder:text-white/20 font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white font-bold tracking-wide py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 active:scale-[0.98]"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Unlock System <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
