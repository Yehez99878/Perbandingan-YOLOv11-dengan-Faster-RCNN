import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Header, Sidebar } from '../components/ui'
import { useBackendHealth } from '../hooks/useBackendHealth'

export function AppLayout() {
  const online = useBackendHealth()
  const [menuOpen, setMenuOpen] = useState(false)
  return <div className="min-h-screen bg-canvas"><Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} /><div className="min-h-screen lg:pl-[264px]"><Header online={online} onMenu={() => setMenuOpen(true)} /><main className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-7 sm:py-8 lg:px-9"><Outlet /></main><footer className="mx-auto flex max-w-[1600px] flex-col gap-1 border-t border-slate-200/70 px-4 py-4 text-[10px] text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-7 lg:px-9"><span>© {new Date().getFullYear()} PalmVision AI Benchmark <span className="mx-1 text-slate-300">·</span> Local research workspace</span><span>Evaluation results appear only after a recorded backend run.</span></footer></div></div>
}
