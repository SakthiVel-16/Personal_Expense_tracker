import { createContext, useContext, useState } from 'react'

const DateContext = createContext(null)

export function useDateRange(){
  return useContext(DateContext)
}

function getPresetRange(preset) {
  const now = new Date()
  const today = now.toISOString().split('T')[0]
  const y = now.getFullYear()
  const m = now.getMonth()

  switch (preset) {
    case 'this_week': {
      const day = now.getDay() || 7
      const mon = new Date(now)
      mon.setDate(now.getDate() - day + 1)
      return { start: mon.toISOString().split('T')[0], end: today }
    }
    case 'last_week': {
      const day = now.getDay() || 7
      const mon = new Date(now)
      mon.setDate(now.getDate() - day - 6)
      const sun = new Date(mon)
      sun.setDate(mon.getDate() + 6)
      return { start: mon.toISOString().split('T')[0], end: sun.toISOString().split('T')[0] }
    }
    case 'this_month': {
      const start = `${y}-${String(m + 1).padStart(2, '0')}-01`
      return { start, end: today }
    }
    case 'last_month': {
  const firstDay = new Date(y, m, 1)        // 1st of current month
  const lastDay = new Date(firstDay - 1)     // last day of previous month (auto-correct)
  const lmYear = lastDay.getFullYear()
  const lmMonth = lastDay.getMonth() + 1
  const lmLastDate = lastDay.getDate()       // actual last day (28/29/30/31)
  const start = `${lmYear}-${String(lmMonth).padStart(2, '0')}-01`
  const end = `${lmYear}-${String(lmMonth).padStart(2, '0')}-${String(lmLastDate).padStart(2, '0')}`
  return { start, end }
}
    case 'last_3_months': {
      const d = new Date(now)
      d.setMonth(d.getMonth() - 3)
      return { start: d.toISOString().split('T')[0], end: today }
    }
    case 'this_year': {
      return { start: `${y}-01-01`, end: today }
    }
    case 'last_year': {
      return { start: `${y - 1}-01-01`, end: `${y - 1}-12-31` }
    }
    default:
      return { start: `${y}-${String(m + 1).padStart(2, '0')}-01`, end: today }
  }
}

export const PRESETS = [
  { key: 'this_week',     label: 'This week' },
  { key: 'last_week',     label: 'Last week' },
  { key: 'this_month',    label: 'This month' },
  { key: 'last_month',    label: 'Last month' },
  { key: 'last_3_months', label: 'Last 3 months' },
  { key: 'this_year',     label: 'This year' },
  { key: 'last_year',     label: 'Last year' },
  { key: 'custom',        label: 'Custom range' },
]

export function DateProvider({ children }) {
  const [preset, setPreset] = useState('this_month')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')

  const range = preset === 'custom'
    ? { start: customStart, end: customEnd }
    : getPresetRange(preset)

  const setPresetKey = (key) => {
    setPreset(key)
  }

  const setCustomRange = (start, end) => {
    setCustomStart(start)
    setCustomEnd(end)
    setPreset('custom')
  }

  return (
    <DateContext.Provider value={{
      preset, range,
      setPresetKey, setCustomRange,
      customStart, customEnd,
      setCustomStart, setCustomEnd
    }}>
      {children}
    </DateContext.Provider>
  )
}