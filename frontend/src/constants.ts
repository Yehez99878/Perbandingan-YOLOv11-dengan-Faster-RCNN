import type { ModelDefinition, MetricKey, RipenessClass } from './types'

export const MODELS: ModelDefinition[] = [
  { id: 'faster_rcnn_baseline', name: 'Faster R-CNN Baseline', shortName: 'Faster R-CNN · Baseline', family: 'Faster R-CNN', variant: 'Baseline', framework: 'Torchvision', accent: '#15803D', configStatus: 'configured', weightsStatus: 'available' },
  { id: 'faster_rcnn_finetuned', name: 'Faster R-CNN Fine-Tuned', shortName: 'Faster R-CNN · Fine-Tuned', family: 'Faster R-CNN', variant: 'Fine-Tuned', framework: 'Torchvision', accent: '#0E7490', configStatus: 'configured', weightsStatus: 'available' },
  { id: 'yolo11_baseline', name: 'YOLOv11 Baseline', shortName: 'YOLOv11 · Baseline', family: 'YOLOv11', variant: 'Baseline', framework: 'Ultralytics', accent: '#D97706', configStatus: 'configured', weightsStatus: 'available' },
  { id: 'yolo11_finetuned', name: 'YOLOv11 Fine-Tuned', shortName: 'YOLOv11 · Fine-Tuned', family: 'YOLOv11', variant: 'Fine-Tuned', framework: 'Ultralytics', accent: '#7C3AED', configStatus: 'configured', weightsStatus: 'available' },
]

export const METRICS: { key: MetricKey; label: string; shortLabel: string; unit: string; hint: string }[] = [
  { key: 'precision', label: 'Precision', shortLabel: 'Precision', unit: '%', hint: 'Ketepatan prediksi positif' },
  { key: 'recall', label: 'Recall', shortLabel: 'Recall', unit: '%', hint: 'Cakupan objek yang terdeteksi' },
  { key: 'f1', label: 'F1-Score', shortLabel: 'F1-Score', unit: '%', hint: 'Harmonic mean precision dan recall' },
  { key: 'map50', label: 'mAP@0.5', shortLabel: 'mAP@0.5', unit: '%', hint: 'Mean AP pada IoU 0.5' },
  { key: 'map5095', label: 'mAP@0.5:0.95', shortLabel: 'mAP@0.5:0.95', unit: '%', hint: 'Mean AP pada rentang IoU 0.5–0.95' },
  { key: 'inferenceTime', label: 'Inference time', shortLabel: 'Latency', unit: 'ms', hint: 'Waktu inferensi rata-rata per gambar' },
]

export const CLASSES: RipenessClass[] = ['kurang masak', 'masak', 'mentah', 'terlalu masak']
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1').replace(/\/$/, '')




