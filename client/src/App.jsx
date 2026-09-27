import { useState, useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import Sidebar from './components/Sidebar.jsx'
import TopBar from './components/TopBar.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Transactions from './pages/Transactions.jsx'
import Budgets from './pages/Budgets.jsx'
import Analytics from './pages/Analytics.jsx'
import AICoach from './pages/AICoach.jsx'
import NetWorth from './pages/NetWorth.jsx'
import { DateProvider } from './context/DateContext.jsx'
import Savings from './pages/Savings.jsx'
import Login from './pages/Login.jsx'
import api from './lib/api.js'

const pageTitles = {
  '/': 'Dashboard',
  '/transactions': 'Transactions',
  '/budgets': 'Budgets',
  '/analytics': 'Analytics',
  '/savings': 'Savings',
  '/ai': 'AI Coach',
  '/networth': 'Net Worth',
}

function Layout() {
  const location = useLocation()
  const title = pageTitles[location.pathname] || 'FinanceOS'
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    setSidebarOpen(false)
    if (!sessionStorage.getItem('tabSession')) {
      // If we open a new tab, force logout to clear token
      sessionStorage.removeItem('token')
      api.post('/auth/logout').then(() => {
        if (window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
      }).catch(() => {})
    }
  }, [location.pathname])

  return (
    <div className="app-shell flex min-h-[100dvh] bg-transparent text-slate-100">
      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="mobile-menu-button md:hidden fixed z-[60] p-2.5 rounded-xl bg-slate-900/80 border border-white/10 text-white shadow-lg backdrop-blur-md"
      >
        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Sidebar */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main content */}
      <main className="app-main flex-1 min-h-[100dvh] overflow-y-auto p-3 pt-16 sm:p-4 md:ml-64 md:p-8 md:pt-8">
        <TopBar title={title} />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/budgets" element={<Budgets />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/savings" element={<Savings />} />
          <Route path="/ai" element={<AICoach />} />
          <Route path="/networth" element={<NetWorth />} />
        </Routes>
      </main>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}

export default function App() {
  return (
    <DateProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Layout />} />
      </Routes>
    </DateProvider>
  )
}
