import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, ArrowLeftRight, Target,
  BarChart3, Bot, TrendingUp, Wallet,PiggyBank } from 'lucide-react'


const links = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/transactions', icon: ArrowLeftRight, label: 'Transactions' },
  { to: '/budgets', icon: Target, label: 'Budgets' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/savings', icon: PiggyBank, label: 'Savings' },
  { to: '/ai', icon: Bot, label: 'AI Coach' },
  { to: '/networth', icon: TrendingUp, label: 'Net Worth' },
]

export default function Sidebar({ sidebarOpen, setSidebarOpen }) {
  return (
    <aside className={`fixed top-0 left-0 h-[100dvh] w-[82vw] max-w-[18rem] bg-[#050816]/85 backdrop-blur-3xl border-r border-white/5 flex flex-col z-50 shadow-[4px_0_24px_rgba(0,0,0,0.5)] transition-transform duration-300 md:translate-x-0 md:w-64 ${
      sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
    }`}>
      {/* Logo */}
      <div className="px-5 py-6 md:px-8 md:py-8 border-b border-white/5 bg-white/[0.01]">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="w-9 h-9 md:w-10 md:h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.2)]">
            <Wallet className="w-4 h-4 md:w-5 md:h-5 text-indigo-400" />
          </div>
          <div>
            <p className="text-white font-black tracking-wide text-base md:text-lg">FinanceOS</p>
            <p className="text-white/40 text-[9px] md:text-[10px] uppercase tracking-[0.2em] font-bold mt-0.5">System Core</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 md:px-4 md:py-6 space-y-2 overflow-y-auto">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 md:gap-4 px-3.5 md:px-4 py-3 md:py-3.5 rounded-2xl text-sm font-bold tracking-wide transition-all duration-300 group ${
                isActive
                  ? 'bg-white/[0.05] text-white border border-white/10 shadow-inner'
                  : 'text-white/40 hover:text-white/90 hover:bg-white/[0.02] border border-transparent'
              }`
            }
          >
            <Icon className="w-4 h-4 md:w-5 md:h-5 transition-transform duration-300 group-hover:scale-110" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-5 py-5 md:px-8 md:py-6 border-t border-white/5 bg-white/[0.01]">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"/>
          <p className="text-white/30 text-[9px] md:text-[10px] uppercase font-bold tracking-widest">Built for Sakthi</p>
        </div>
      </div>
    </aside>
  )
}