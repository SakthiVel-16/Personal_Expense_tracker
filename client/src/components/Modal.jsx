import { X } from 'lucide-react'

export default function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-[#050816]/80 backdrop-blur-xl z-50 flex items-end md:items-center justify-center p-0 md:p-4 sm:p-6">
      <div className="bg-[#050816]/90 backdrop-blur-3xl border border-white/10 rounded-t-[32px] md:rounded-[32px] w-full md:max-w-md shadow-2xl shadow-black overflow-hidden relative max-h-[85vh] md:max-h-[90vh] flex flex-col animate-in slide-in-from-bottom md:slide-in-from-center">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 opacity-50" />
        
        {/* Mobile drag handle */}
        <div className="md:hidden h-1.5 flex justify-center items-center pt-2 pb-1">
          <div className="w-12 h-1 bg-white/30 rounded-full" />
        </div>
        
        <div className="flex items-center justify-between px-5 md:px-8 py-4 md:py-6 border-b border-white/5 flex-shrink-0">
          <h2 className="text-white font-bold tracking-wide text-base md:text-lg">{title}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-5 md:px-8 py-4 md:py-8 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  )
}