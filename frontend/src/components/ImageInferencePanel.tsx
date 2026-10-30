import { useState } from 'react'
import { Cpu, FileImage, LoaderCircle, ScanLine, Target } from 'lucide-react'
import type { ModelId, ModelInferenceResponse } from '../types'
import { MODELS } from '../constants'
import { detectImage } from '../services/api'
import { DetectionOverlay, DetectionResult, EmptyState, ImageUploader, LoadingState, ModelSelect, Panel, SectionHeading } from './ui'

export function ImageInferencePanel({ title = 'Uji gambar dan bandingkan output', subtitle = 'Kirim satu gambar ke model terpilih atau jalankan keempat model untuk membandingkan hasil deteksinya.', onResponses }: { title?: string; subtitle?: string; onResponses?: (responses: ModelInferenceResponse[]) => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [model, setModel] = useState<ModelId | 'all'>('all')
  const [confidence, setConfidence] = useState(0.25)
  const [responses, setResponses] = useState<ModelInferenceResponse[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const selection = model === 'all' ? 'keempat model' : MODELS.find((item) => item.id === model)?.name ?? 'model terpilih'

  const run = async () => {
    if (!file) return
    setBusy(true)
    setError(null)
    setResponses([])
    onResponses?.([])
    try {
      const results = await detectImage(file, model, confidence)
      setResponses(results)
      onResponses?.(results)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Inference gagal karena kesalahan yang tidak diketahui.')
    } finally {
      setBusy(false)
    }
  }

  return <Panel className="p-5 sm:p-6">
    <SectionHeading title={title} subtitle={subtitle} />
    <div className="mb-4 flex items-start gap-3 rounded-xl border border-sky-100 bg-sky-50/70 p-3"><Cpu size={15} className="mt-0.5 shrink-0 text-sky-700" /><p className="text-[10px] leading-relaxed text-sky-900">Inference berjalan lokal melalui FastAPI. Hasil hanya ditampilkan pada sesi ini dan tidak disimpan sebagai riwayat.</p></div>
    <div className="grid items-start gap-5 xl:grid-cols-[0.85fr_1.15fr]">
      <div>
        <ImageUploader file={file} onFile={(next) => { setFile(next); setResponses([]); onResponses?.([]); setError(null) }} />
        {file && <div className="mt-4 space-y-4">
          <div><p className="mb-2 text-[10px] font-bold text-slate-600">Model</p><ModelSelect value={model} onChange={(next) => { setModel(next); setResponses([]); onResponses?.([]) }} allOption /></div>
          <div><div className="mb-2 flex items-center justify-between"><label htmlFor="confidence-threshold" className="text-[10px] font-bold text-slate-600">Confidence threshold</label><span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-[10px] font-semibold text-slate-600">{confidence.toFixed(2)}</span></div><input id="confidence-threshold" type="range" min="0" max="1" step="0.05" value={confidence} onChange={(event) => setConfidence(Number(event.target.value))} className="w-full accent-emerald-700" /><div className="mt-1 flex justify-between text-[9px] text-slate-400"><span>0.00</span><span>Ambang inferensi</span><span>1.00</span></div></div>
          <div className="rounded-xl bg-slate-50 px-3 py-2 text-[10px] text-slate-500">Akan menguji: <b className="text-slate-700">{selection}</b></div>
          <button onClick={() => void run()} disabled={busy} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-[11px] font-bold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-65">{busy ? <><LoaderCircle size={15} className="animate-spin" /> Menjalankan model…</> : <><ScanLine size={15} /> Jalankan inference</>}</button>
        </div>}
        {error && <div role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-[11px] leading-relaxed text-rose-800">{error}</div>}
        <p className="mt-4 text-[9px] leading-relaxed text-slate-400">JPEG, PNG, atau WebP; ukuran maksimum 20 MB.</p>
      </div>
      <div className="space-y-4">
        <Panel className="p-4"><SectionHeading title="Gambar dan hasil deteksi" subtitle={file ? 'Prediksi ditampilkan pada koordinat gambar asli' : 'Unggah gambar untuk menampilkan output model'} />{file ? <DetectionResult file={file} onRemove={() => { setFile(null); setResponses([]); setError(null) }} /> : <EmptyState title="Belum ada gambar" description="Pilih gambar TBS untuk mulai membandingkan output." icon={FileImage} compact />}</Panel>
        {busy && <Panel className="p-4"><LoadingState label="Model sedang menganalisis gambar…" /></Panel>}
        {responses.map((response) => <Panel key={response.model_id} className="p-4">
          <SectionHeading title={response.model_name} subtitle={response.status === 'success' ? `${response.summary.total_detections} deteksi · ${response.inference.time_ms?.toFixed(1)} ms · ${response.inference.device}` : 'Inference gagal untuk model ini'} />
          {response.status === 'error' ? <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-[11px] text-rose-800">{response.error?.message ?? 'Model mengembalikan error.'}</div> : <>
            {file && <DetectionOverlay file={file} predictions={response.predictions} />}
            {response.predictions.length > 0 ? <div className="mt-3 flex flex-wrap gap-2">{response.predictions.map((prediction, index) => <span key={`${prediction.class_id}-${index}`} className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-semibold text-slate-600">{prediction.class_name} · {prediction.confidence.toFixed(3)} · Class {prediction.class_id} / Faster R-CNN {prediction.faster_rcnn_class_id}</span>)}</div> : <EmptyState title="Tidak ada deteksi pada threshold ini" description="Turunkan confidence threshold untuk memeriksa deteksi dengan skor lebih rendah." icon={Target} compact />}
          </>}
        </Panel>)}
      </div>
    </div>
  </Panel>
}
