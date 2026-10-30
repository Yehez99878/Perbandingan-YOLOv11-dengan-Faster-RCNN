import { API_BASE_URL } from '../constants'
import type { ApiHealth, ModelId, ModelInferenceResponse, ModelMetricSnapshots } from '../types'

export async function checkBackendHealth(signal?: AbortSignal): Promise<ApiHealth> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, { signal, headers: { Accept: 'application/json' } })
    return { online: response.ok, checkedAt: new Date().toISOString() }
  } catch {
    return { online: false, checkedAt: new Date().toISOString() }
  }
}

export async function detectImage(
  image: File,
  modelId: ModelId | 'all',
  confidenceThreshold: number,
): Promise<ModelInferenceResponse[]> {
  const body = new FormData()
  body.append('image', image)
  body.append('model_id', modelId)
  body.append('confidence_threshold', String(confidenceThreshold))

  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}/detect`, { method: 'POST', body })
  } catch {
    throw new Error(`Backend lokal belum terhubung. Jalankan FastAPI di ${API_BASE_URL}.`)
  }

  const payload = await response.json().catch(() => ({})) as { detail?: string; results?: ModelInferenceResponse[] }
  if (!response.ok) throw new Error(payload.detail || `Backend mengembalikan HTTP ${response.status}.`)
  if (!Array.isArray(payload.results)) throw new Error('Format respons inference dari backend tidak dikenali.')
  return payload.results
}

export async function getCheckpointMetrics(signal?: AbortSignal): Promise<ModelMetricSnapshots> {
  const response = await fetch(`${API_BASE_URL}/model-metrics`, {
    signal,
    headers: { Accept: 'application/json' },
  })
  if (!response.ok) throw new Error(`Backend mengembalikan HTTP ${response.status} saat membaca metrik checkpoint.`)
  const payload = await response.json() as { models?: ModelMetricSnapshots }
  return payload.models ?? {}
}
