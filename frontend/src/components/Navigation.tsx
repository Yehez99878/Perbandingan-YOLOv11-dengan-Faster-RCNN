import { NavLink } from 'react-router-dom'
import { NAV_ITEMS } from '../navigation'

export function Navigation({ onNavigate }: { onNavigate: () => void }) {
  return <nav className="space-y-1">
    {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end} onClick={onNavigate} className={({ isActive }) => `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition ${isActive ? 'bg-emerald-50 text-emerald-800' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}><Icon size={17} strokeWidth={1.8} /><span>{label}</span></NavLink>)}
  </nav>
}


