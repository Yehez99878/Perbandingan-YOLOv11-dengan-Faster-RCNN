import { useEffect, useState, type ChangeEvent, type ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Activity, BarChart3, Bell, ChevronDown, Gauge, ImageUp, Leaf, Menu, Microscope, Settings2, X } from 'lucide-react'
import type { DetectionPrediction, EvaluationMetrics, ModelDefinition, ModelId, RipenessClass } from '../types'
import { METRICS, MODELS } from '../constants'
import { Navigation } from './Navigation'

export function ModelStatusBadge({ configured = false, label }: { configured?: boolean; label?: string }) {
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${configured ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}><span className={`h-1.5 w-1.5 rounded-full ${configured ? 'bg-emerald-500' : 'bg-slate-400'}`} />{label ?? (configured ? 'Configured' : 'Belum tersedia')}</span>
}

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  return <>
    {open && <button aria-label="Close menu" onClick={onClose} className="fixed inset-0 z-40 bg-slate-950/35 lg:hidden" />}
    <aside className={`fixed inset-y-0 left-0 z-50 flex w-[264px] flex-col border-r border-slate-200/80 bg-white transition-transform lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex h-[76px] items-center justify-between border-b border-slate-100 px-6">
        <NavLink to="/" onClick={onClose} className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-700 text-white shadow-sm"><Leaf size={21} /></span>
          <span><span className="block font-heading text-[15px] font-bold tracking-tight text-ink">PalmVision <span className="text-palm">AI</span></span><span className="block text-[10px] font-semibold uppercase tracking-[.16em] text-slate-400">Benchmark Studio</span></span>
        </NavLink>
        <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 lg:hidden"><X size={18} /></button>
      </div>
      <div className="px-4 pt-6"><p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[.18em] text-slate-400">Workspace</p><Navigation onNavigate={onClose} /></div>
      <div className="mt-auto p-4">
        <div className="mt-3 flex items-center gap-3 border-t border-slate-100 px-2 pt-4"><div className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-slate-500"><Microscope size={16} /></div><div><p className="text-[12px] font-bold text-slate-700">Research workspace</p><p className="text-[10px] text-slate-400">Local development</p></div><Settings2 size={15} className="ml-auto text-slate-400" /></div>
      </div>
    </aside>
  </>
}

const PAGE_TITLES: Record<string, { title: string; eyebrow: string }> = {
  '/': { title: 'Dashboard overview', eyebrow: 'WORKSPACE / OVERVIEW' },
  '/comparison': { title: 'Model comparison', eyebrow: 'ANALYSIS / COMPARISON' },
}

export function Header({ online, onMenu }: { online: boolean | null; onMenu: () => void }) {
  const { pathname } = useLocation()
  const page = pathname.startsWith('/models/') ? { title: 'Detailed model analysis', eyebrow: 'ANALYSIS / MODEL DETAILS' } : PAGE_TITLES[pathname] ?? PAGE_TITLES['/']
  return <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-xl sm:px-7 lg:px-9">
    <div className="flex min-w-0 items-center gap-3"><button onClick={onMenu} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"><Menu size={19} /></button><div className="min-w-0"><p className="hidden text-[9px] font-bold uppercase tracking-[.18em] text-slate-400 sm:block">{page.eyebrow}</p><h1 className="truncate font-heading text-[17px] font-bold tracking-tight text-ink sm:mt-0.5 sm:text-[20px]">{page.title}</h1></div></div>
    <div className="flex items-center gap-2 sm:gap-4"><div className={`hidden items-center gap-2 rounded-full border px-3 py-1.5 sm:flex ${online ? 'border-emerald-100 bg-emerald-50/70' : 'border-slate-200 bg-slate-50'}`}><span className={`h-1.5 w-1.5 rounded-full ${online ? 'bg-emerald-500' : 'bg-slate-400'}`} /><span className={`text-[10px] font-semibold ${online ? 'text-emerald-700' : 'text-slate-500'}`}>{online ? 'Backend connected' : online === null ? 'Checking backend…' : 'Backend offline'}</span></div><button onClick={() => window.alert('Notifikasi akan muncul saat backend terhubung.')} aria-label="Notifications" className="relative rounded-xl p-2 text-slate-400 hover:bg-slate-100"><Bell size={18} /><span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-amber-500 ring-2 ring-white" /></button><button onClick={() => window.alert('Pengaturan proyek lokal belum tersedia.')} className="flex items-center gap-2 rounded-xl border border-slate-200 px-2 py-1.5 text-left"><span className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-100 text-[11px] font-bold text-emerald-800">PV</span><span className="hidden text-[11px] font-semibold text-slate-700 md:block">Local project</span><ChevronDown size={13} className="hidden text-slate-400 md:block" /></button></div>
  </header>
}

export function PageIntro({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="mb-1 text-[10px] font-bold uppercase tracking-[.17em] text-emerald-700">Palm ripeness benchmark</p><h2 className="font-heading text-[24px] font-bold tracking-tight text-ink sm:text-[28px]">{title}</h2><p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-slate-500">{description}</p></div>{action}</div>
}

export function SectionHeading({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return <div className="mb-4 flex items-center justify-between gap-3"><div><h3 className="font-heading text-[15px] font-bold tracking-tight text-slate-800">{title}</h3>{subtitle && <p className="mt-0.5 text-[11px] text-slate-400">{subtitle}</p>}</div>{action}</div>
}

export function Panel({ children, className = '' }: { children: ReactNode; className?: string }) { return <section className={`rounded-2xl border border-slate-200/80 bg-white shadow-[0_2px_8px_rgba(15,23,42,.025)] ${className}`}>{children}</section> }

export function EmptyState({ title, description, icon: Icon = Activity, compact = false }: { title: string; description: string; icon?: typeof Activity; compact?: boolean }) {
  return <div className={`flex flex-col items-center justify-center text-center ${compact ? 'px-4 py-8' : 'px-5 py-14'}`}><div className="mb-3 grid h-11 w-11 place-items-center rounded-2xl bg-slate-50 text-slate-400"><Icon size={20} strokeWidth={1.7} /></div><p className="text-[13px] font-bold text-slate-700">{title}</p><p className="mt-1 max-w-sm text-[11px] leading-relaxed text-slate-400">{description}</p></div>
}
export function LoadingState({ label = 'Memuat data…' }: { label?: string }) { return <div className="flex items-center justify-center gap-2 py-8 text-xs text-slate-400"><span className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />{label}</div> }

export function MetricCard({ label, value, unit = '%', hint, icon: Icon, accent = 'emerald' }: { label: string; value?: number | null; unit?: string; hint: string; icon: typeof Gauge; accent?: string }) {
  const valueText = value == null ? '—' : value.toLocaleString('id-ID', { maximumFractionDigits: 2 })
  const toneClass = accent === 'emerald' ? 'bg-emerald-50 text-emerald-700' : accent === 'amber' ? 'bg-amber-50 text-amber-700' : 'bg-slate-50 text-slate-700'
  return <Panel className="p-4 sm:p-5"><div className="flex items-start justify-between"><span className="text-[11px] font-semibold text-slate-500">{label}</span><span className={`grid h-8 w-8 place-items-center rounded-xl ${toneClass}`}><Icon size={16} /></span></div><div className="mt-3 flex items-baseline gap-1.5"><span className="font-mono text-[25px] font-semibold tracking-tight text-ink">{valueText}</span>{value != null && <span className="font-mono text-[10px] text-slate-400">{unit}</span>}</div><p className="mt-1 text-[10px] text-slate-400">{value == null ? 'Belum tersedia' : hint}</p></Panel>
}

export function ModelCard({ model, metrics, inferenceTimeMs, metricsSource }: { model: ModelDefinition; metrics?: EvaluationMetrics; inferenceTimeMs?: number; metricsSource?: string }) {
  const metricCards = METRICS.slice(0, 5)
  return <Panel className="group relative overflow-hidden p-5 transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"><span className="absolute inset-y-0 left-0 w-[3px]" style={{ background: model.accent }} /><div className="pl-1"><div className="flex items-start justify-between gap-2"><div><p className="font-heading text-[14px] font-bold text-slate-800">{model.name}</p><p className="mt-1 text-[10px] text-slate-400">{model.framework} <span className="mx-1 text-slate-300">/</span> Object detection</p></div><span className="rounded-lg bg-slate-50 px-2 py-1 font-mono text-[9px] font-semibold text-slate-500">{model.variant}</span></div><div className="mt-4 flex flex-wrap gap-2"><ModelStatusBadge label={model.configStatus === 'configured' ? 'Configured' : model.configStatus === 'incomplete' ? 'Config incomplete' : 'Config belum ada'} configured={model.configStatus === 'configured'} /><ModelStatusBadge label={model.weightsStatus === 'available' ? 'Checkpoint present' : 'Checkpoint missing'} configured={model.weightsStatus === 'available'} /></div><div className="my-4 grid grid-cols-3 gap-y-3 border-y border-slate-100 py-3 sm:grid-cols-5">{metricCards.map((metric) => { const value = metrics?.[metric.key]; return <div key={metric.key}><p className="text-[9px] font-medium text-slate-400">{metric.shortLabel}</p><p className="mt-1 font-mono text-[11px] font-semibold text-slate-700">{value == null ? '—' : value.toLocaleString('id-ID', { maximumFractionDigits: 2 })}{value != null && <span className="ml-0.5 text-[8px] text-slate-400">%</span>}</p></div> })}</div><div className="text-[10px] text-slate-400">Inference time <b className="ml-1 font-mono font-medium text-slate-700">{inferenceTimeMs === undefined ? 'Jalankan inference' : `${inferenceTimeMs.toFixed(1)} ms`}</b></div>{metricsSource && <p className="mt-2 text-[9px] leading-relaxed text-slate-400">Sumber: {metricsSource}</p>}</div></Panel>
}

export function ChartCard({ title, description, children, action }: { title: string; description?: string; children?: ReactNode; action?: ReactNode }) {
  return <Panel><div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4"><div><h3 className="font-heading text-[13px] font-bold text-slate-800">{title}</h3>{description && <p className="mt-0.5 text-[10px] text-slate-400">{description}</p>}</div>{action}</div>{children ?? <EmptyState title="Belum ada hasil evaluasi" description="Grafik akan terisi setelah evaluasi dataset tersedia." icon={BarChart3} compact />}</Panel>
}

export function ImageUploader({ file, onFile }: { file: File | null; onFile: (file: File | null) => void }) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => { onFile(event.target.files?.[0] ?? null); event.target.value = '' }
  return <label className="group flex min-h-[210px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 px-5 py-8 text-center transition hover:border-emerald-400 hover:bg-emerald-50/30"><input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={handleChange} /><span className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-white text-emerald-700 shadow-sm ring-1 ring-slate-100 group-hover:bg-emerald-50"><ImageUp size={21} /></span><span className="text-[13px] font-bold text-slate-700">{file ? file.name : 'Drop gambar TBS di sini'}</span><span className="mt-1 text-[11px] text-slate-400">atau klik untuk memilih · JPG, PNG, WEBP</span><span className="mt-4 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-bold text-slate-600 shadow-sm">Pilih gambar</span></label>
}

export function DetectionResult({ file, onRemove }: { file: File; onRemove: () => void }) {
  const [src, setSrc] = useState('')
  useEffect(() => { const url = URL.createObjectURL(file); setSrc(url); return () => URL.revokeObjectURL(url) }, [file])
  return <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50"><button onClick={onRemove} aria-label="Remove image" className="absolute right-3 top-3 z-10 rounded-lg bg-white/90 p-2 text-slate-500 shadow hover:text-rose-600"><X size={15} /></button>{src && <img src={src} alt="Preview gambar TBS yang diunggah" className="max-h-[420px] w-full object-contain" />}<div className="border-t border-slate-200 bg-white px-3 py-2 text-[10px] text-slate-500"><span className="font-semibold text-slate-700">Original image</span> · {file.name} · {(file.size / 1024 / 1024).toFixed(2)} MB</div></div>
}

const detectionColors: Record<RipenessClass, string> = { 'kurang masak': '#0284c7', masak: '#16a34a', mentah: '#7c3aed', 'terlalu masak': '#ea580c' }

export function DetectionOverlay({ file, predictions }: { file: File; predictions: DetectionPrediction[] }) {
  const [src, setSrc] = useState('')
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null)
  useEffect(() => { const url = URL.createObjectURL(file); setSrc(url); setDimensions(null); return () => URL.revokeObjectURL(url) }, [file])
  return <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
    <div className="relative w-full">
      {src && <img src={src} alt="Gambar TBS dengan overlay hasil deteksi model" className="block h-auto w-full" onLoad={(event) => setDimensions({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight })} />}
      {dimensions && <svg className="absolute inset-0 h-full w-full" viewBox={'0 0 ' + dimensions.width + ' ' + dimensions.height} preserveAspectRatio="none" role="img" aria-label="Bounding boxes hasil deteksi">
        {predictions.map((prediction, index) => {
          const [x1, y1, x2, y2] = prediction.bbox_xyxy
          const color = detectionColors[prediction.class_name]
          const fontSize = Math.max(18, dimensions.width * 0.009)
          const labelHeight = fontSize * 1.55
          const labelWidth = (prediction.class_name.length + 7) * fontSize * 0.57
          const labelY = Math.min(Math.max(0, y1 + index * (labelHeight + 5)), dimensions.height - labelHeight)
          return <g key={prediction.class_id + '-' + index}>
            <rect x={x1} y={y1} width={Math.max(0, x2 - x1)} height={Math.max(0, y2 - y1)} fill="none" stroke={color} strokeWidth={Math.max(3, dimensions.width * 0.002)} />
            <rect x={x1} y={labelY} width={labelWidth} height={labelHeight} rx={4} fill={color} opacity={0.95} />
            <text x={x1 + fontSize * 0.35} y={labelY + fontSize * 1.08} fill="white" fontSize={fontSize} fontWeight="700">{prediction.class_name} {prediction.confidence.toFixed(3)}</text>
          </g>
        })}
      </svg>}
    </div>
    <div className="border-t border-slate-200 bg-white px-3 py-2 text-[10px] text-slate-500">Bounding box memakai koordinat gambar asli.</div>
  </div>
}
export function ModelSelect({ value, onChange, allOption = false }: { value: ModelId | 'all'; onChange: (value: ModelId | 'all') => void; allOption?: boolean }) {
  return <select value={value} onChange={(event) => onChange(event.target.value as ModelId | 'all')} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[12px] font-semibold text-slate-700 outline-none focus:border-emerald-400">{allOption && <option value="all">Bandingkan keempat model</option>}{MODELS.map((model) => <option key={model.id} value={model.id}>{model.name}</option>)}</select>
}


