export type ModelId = 'faster_rcnn_baseline' | 'faster_rcnn_finetuned' | 'yolo11_baseline' | 'yolo11_finetuned'
export type MetricKey = 'precision' | 'recall' | 'f1' | 'map50' | 'map5095' | 'inferenceTime'
export type RipenessClass = 'kurang masak' | 'masak' | 'mentah' | 'terlalu masak'

export interface ModelDefinition {
  id: ModelId
  name: string
  shortName: string
  family: 'Faster R-CNN' | 'YOLOv11'
  variant: 'Baseline' | 'Fine-Tuned'
  framework: 'Torchvision' | 'Ultralytics'
  accent: string
  configStatus: 'not-configured' | 'incomplete' | 'configured'
  weightsStatus: 'missing' | 'available'
}

export interface EvaluationMetrics {
  precision?: number | null
  recall?: number | null
  f1?: number | null
  map50?: number | null
  map5095?: number | null
  inferenceTime?: number | null
}

export interface ModelMetricSnapshot {
  source: string
  source_note: string
  checkpoint_date?: string
  metrics: EvaluationMetrics
}

export type ModelMetricSnapshots = Partial<Record<ModelId, ModelMetricSnapshot>>

export interface Detection {
  classId: number
  className: RipenessClass
  confidence: number
  box: [number, number, number, number]
}

export interface DetectionPrediction {
  class_id: number
  class_name: RipenessClass
  faster_rcnn_class_id: number
  confidence: number
  bbox_xyxy: [number, number, number, number]
}

export interface ModelInferenceResponse {
  model_id: ModelId
  model_name: string
  status: 'success' | 'error'
  inference: { time_ms: number | null; device: string | null }
  summary: { total_detections: number }
  predictions: DetectionPrediction[]
  error?: { code: string; message: string }
}

export interface ExperimentRecord {
  id: string
  name: string
  modelIds: ModelId[]
  createdAt: string
  status: 'queued' | 'running' | 'completed' | 'failed'
  metrics?: EvaluationMetrics
}

export interface ApiHealth {
  online: boolean
  checkedAt?: string
}



