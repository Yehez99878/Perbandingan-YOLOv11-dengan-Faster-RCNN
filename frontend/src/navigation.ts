import { Grid2X2, LayoutDashboard } from 'lucide-react'

const iconMap = { overview: LayoutDashboard, comparison: Grid2X2 }
export const NAV_ITEMS = [
  { to: '/', label: 'Overview', icon: iconMap.overview, end: true },
  { to: '/comparison', label: 'Model comparison', icon: iconMap.comparison },
]


