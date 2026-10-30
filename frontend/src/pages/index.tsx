import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, BarChart3, Boxes, Check, Plus, Sparkles } from 'lucide-react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { MODELS } from '../constants'
import { getCheckpointMetrics } from '../services/api'
import { ImageInferencePanel } from '../components/ImageInferencePanel'
import { ChartCard, ModelCard, PageIntro, Panel, SectionHeading } from '../components/ui'
import type { ModelId, ModelInferenceResponse, ModelMetricSnapshots } from '../types'

function NoDataLine({ height = 190 }: { height?: number }) {
  return <div className="relative" style={{ height }}><ResponsiveContainer width="100%" height="100%"><LineChart data={[]} margin={{ top: 10, right: 12, left: -18, bottom: 0 }}><CartesianGrid stroke="#edf1f5" strokeDasharray="3 5" vertical={false} /><XAxis dataKey="model" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} /><YAxis tickLine={false} axisLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} /><Tooltip /><Line dataKey="value" stroke="#15803d" /></LineChart></ResponsiveContainer><div className="absolute inset-0 flex items-center justify-center"><div className="rounded-xl border border-slate-100 bg-white/95 px-4 py-3 text-center shadow-sm"><p className="text-[11px] font-bold text-slate-600">Belum ada data untuk divisualisasikan</p><p className="mt-1 text-[10px] text-slate-400">Tambahkan dataset berlabel untuk menjalankan evaluasi.</p></div></div></div>
}

function PageTitle({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) { return <PageIntro title={title} description={description} action={action} /> }

export function DashboardPage() {
  const navigate = useNavigate()
  return <>
    <PageTitle title="PalmVision AI Benchmark" description="Bandingkan output empat model deteksi kematangan TBS." action={<button onClick={() => navigate('/comparison')} className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-3.5 py-2.5 text-[11px] font-bold text-white shadow-sm hover:bg-emerald-800"><Plus size={15} /> Uji gambar</button>} />
    <div className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-r from-[#0b3c2b] via-[#0d5b38] to-[#0b6b44] px-5 py-6 text-white sm:px-7 sm:py-7"><div className="relative z-10 max-w-2xl"><div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[.15em] text-emerald-100"><Sparkles size={11} /> FGD workspace</div><h3 className="max-w-xl font-heading text-[22px] font-bold leading-tight tracking-tight sm:text-[27px]">Bandingkan hasil deteksi setiap model.</h3><p className="mt-2 max-w-lg text-[12px] leading-relaxed text-emerald-50/75">Jalankan inference pada gambar yang sama, lihat bounding box, kelas, confidence, dan waktu inference tiap model.</p><button onClick={() => navigate('/comparison')} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-[11px] font-bold text-emerald-900 shadow-sm transition hover:bg-emerald-50">Buka perbandingan <ArrowRight size={14} /></button></div><div className="pointer-events-none absolute -right-8 -top-14 h-64 w-64 rounded-full border border-white/10" /><div className="pointer-events-none absolute -right-1 -top-6 h-52 w-52 rounded-full border border-white/10" /><div className="pointer-events-none absolute right-16 top-10 hidden h-24 w-24 rounded-full bg-emerald-400/10 blur-2xl sm:block" /><LeafDecoration /></div>
    <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3"><SummaryTile icon={Boxes} label="Arsitektur" value="2" note="Faster R-CNN dan YOLOv11" color="emerald" /><SummaryTile icon={Check} label="Varian per arsitektur" value="2" note="Baseline dibanding Fine-Tuned" color="blue" /><SummaryTile icon={BarChart3} label="Kelas deteksi" value="4" note="Label dipertahankan terpisah" color="amber" /></div>
    <SectionHeading title="Rancangan perbandingan model" subtitle="Empat model disusun untuk melihat perbedaan arsitektur dan dampak fine-tuning." action={<button onClick={() => navigate('/comparison')} className="text-[10px] font-bold text-emerald-700">Buka pengujian <ArrowRight size={12} className="ml-1 inline" /></button>} />
    <div className="mb-5 grid gap-4 lg:grid-cols-2">
      <ArchitectureCard title="Faster R-CNN" framework="Torchvision" accent="#15803D" description="Detektor dua tahap: mengusulkan area objek, lalu mengklasifikasikan dan menyempurnakan bounding box." baseline="Faster R-CNN Baseline" finetuned="Faster R-CNN Fine-Tuned" />
      <ArchitectureCard title="YOLOv11" framework="Ultralytics" accent="#D97706" description="Detektor satu tahap yang memprediksi lokasi objek dan kelas secara langsung dalam satu proses." baseline="YOLOv11 Baseline" finetuned="YOLOv11 Fine-Tuned" />
    </div>
    <Panel className="mb-5 p-5">
      <SectionHeading title="Label yang dideteksi" subtitle="Urutan kelas sama untuk kedua keluarga model; ID mengikuti format masing-masing framework." />
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">{[
        ['0 · YOLO / 1 · Faster R-CNN', 'kurang masak'],
        ['1 · YOLO / 2 · Faster R-CNN', 'masak'],
        ['2 · YOLO / 3 · Faster R-CNN', 'mentah'],
        ['3 · YOLO / 4 · Faster R-CNN', 'terlalu masak'],
      ].map(([ids, name]) => <div key={name} className="rounded-xl border border-slate-100 bg-slate-50/70 px-3.5 py-3"><p className="text-[10px] font-semibold text-slate-700">{name}</p><p className="mt-1 font-mono text-[9px] text-slate-400">{ids}</p></div>)}</div>
      <p className="mt-3 text-[9px] text-slate-400">Faster R-CNN menggunakan ID 0 untuk background; kelas objek dimulai dari ID 1.</p>
    </Panel>
    <Panel className="p-5"><SectionHeading title="Cara membaca benchmark" subtitle="Agar perbandingan antar model tetap sepadan." /><div className="grid gap-4 md:grid-cols-3">{[
      ['01', 'Gambar yang sama', 'Jalankan model terpilih atau keempat model pada satu gambar TBS yang sama.'],
      ['02', 'Output deteksi', 'Bandingkan label kelas, bounding box, confidence, dan waktu inference.'],
      ['03', 'Baseline vs fine-tuned', 'Lihat perubahan hasil setelah fine-tuning di dalam arsitektur yang sama.'],
    ].map(([number, title, description]) => <div key={number} className="flex gap-3"><span className="font-mono text-[11px] font-bold text-emerald-700">{number}</span><div><p className="text-[11px] font-semibold text-slate-700">{title}</p><p className="mt-1 text-[10px] leading-relaxed text-slate-400">{description}</p></div></div>)}</div></Panel>
  </>
}
function LeafDecoration() { return <div className="pointer-events-none absolute -right-4 bottom-0 hidden h-full w-[35%] opacity-[.11] md:block"><div className="absolute bottom-[-22px] right-24 h-[235px] w-[95px] rotate-[34deg] rounded-[100%_0_100%_0] border border-white" /><div className="absolute bottom-[-11px] right-12 h-[205px] w-[80px] rotate-[12deg] rounded-[100%_0_100%_0] border border-white" /><div className="absolute bottom-[-30px] right-[-4px] h-[230px] w-[85px] rotate-[-16deg] rounded-[100%_0_100%_0] border border-white" /></div> }
function SummaryTile({ icon: Icon, label, value, note, color }: { icon: typeof Boxes; label: string; value: string; note: string; color: 'emerald' | 'blue' | 'amber' | 'slate' }) {
  const colors = { emerald: 'bg-emerald-50 text-emerald-700', blue: 'bg-sky-50 text-sky-700', amber: 'bg-amber-50 text-amber-700', slate: 'bg-slate-100 text-slate-600' }
  return <Panel className="p-4"><div className="flex items-start justify-between"><span className="text-[10px] font-semibold text-slate-500">{label}</span><span className={`grid h-8 w-8 place-items-center rounded-xl ${colors[color]}`}><Icon size={15} /></span></div><p className="mt-2 font-mono text-[23px] font-semibold tracking-tight text-ink">{value}</p><p className="mt-1 text-[9px] text-slate-400">{note}</p></Panel>
}

function ArchitectureCard({ title, framework, accent, description, baseline, finetuned }: { title: string; framework: string; accent: string; description: string; baseline: string; finetuned: string }) {
  return <Panel className="relative overflow-hidden p-5"><span className="absolute inset-y-0 left-0 w-1" style={{ background: accent }} /><div className="pl-1"><div className="flex items-start justify-between gap-3"><div><h4 className="font-heading text-[16px] font-bold text-slate-800">{title}</h4><p className="mt-1 text-[10px] font-medium text-slate-400">Framework: {framework}</p></div><span className="rounded-lg px-2.5 py-1 text-[9px] font-bold" style={{ color: accent, backgroundColor: `${accent}12` }}>1 arsitektur</span></div><p className="mt-4 min-h-[42px] text-[11px] leading-relaxed text-slate-500">{description}</p><div className="mt-4 grid gap-2 sm:grid-cols-2"><div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3"><p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Baseline</p><p className="mt-1 text-[10px] font-semibold text-slate-700">{baseline}</p><p className="mt-1 text-[9px] text-slate-400">Versi pembanding dasar</p></div><div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3"><p className="text-[9px] font-bold uppercase tracking-wider text-emerald-700">Fine-Tuned</p><p className="mt-1 text-[10px] font-semibold text-slate-700">{finetuned}</p><p className="mt-1 text-[9px] text-slate-400">Versi yang disesuaikan</p></div></div></div></Panel>
}

export function ComparisonPage() {
  const [checkpointMetrics, setCheckpointMetrics] = useState<ModelMetricSnapshots>({})
  const [inferenceTimes, setInferenceTimes] = useState<Partial<Record<ModelId, number>>>({})
  const [metricsLoading, setMetricsLoading] = useState(true)
  const [metricsError, setMetricsError] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    getCheckpointMetrics(controller.signal)
      .then(setCheckpointMetrics)
      .catch(() => setMetricsError(true))
      .finally(() => setMetricsLoading(false))
    return () => controller.abort()
  }, [])

  const updateInferenceTimes = (responses: ModelInferenceResponse[]) => {
    const next: Partial<Record<ModelId, number>> = {}
    for (const response of responses) {
      if (response.status === 'success' && response.inference.time_ms !== null) {
        next[response.model_id] = response.inference.time_ms
      }
    }
    setInferenceTimes(next)
  }

  return <>
    <PageTitle title="Model comparison" description="Jalankan model pada gambar yang sama untuk membandingkan label, bounding box, confidence, dan latency." />
    <ImageInferencePanel onResponses={updateInferenceTimes} />
    <div className="mb-4 mt-7"><SectionHeading title="Metrik per model" subtitle="Nilai validasi yang tercatat pada checkpoint; waktu inference diukur saat pengujian gambar." /></div>
    <div className="mb-5 rounded-xl border border-amber-100 bg-amber-50/70 px-4 py-3 text-[10px] leading-relaxed text-amber-900">
      {metricsLoading ? 'Memuat metrik dari metadata checkpoint…' : metricsError ? 'Metrik checkpoint tidak dapat dimuat dari backend.' : 'Metrik berikut berasal dari checkpoint masing-masing dan belum dievaluasi ulang dengan satu dataset/protokol bersama. Tanda — berarti nilai tersebut tidak tersedia secara eksplisit di checkpoint.'}
    </div>
    <div className="grid gap-4 md:grid-cols-2">{MODELS.map((model) => {
      const snapshot = checkpointMetrics[model.id]
      return <ModelCard key={model.id} model={model} metrics={snapshot?.metrics} inferenceTimeMs={inferenceTimes[model.id]} metricsSource={snapshot?.source_note ?? (metricsLoading ? 'Memuat metadata checkpoint…' : undefined)} />
    })}</div>
    <div className="mt-6"><ChartCard title="Perbandingan metrik dataset" description="Metrik agregat dan grafik akan terisi setelah dataset evaluasi bersama tersedia."><NoDataLine height={215} /></ChartCard></div>
  </>
}
