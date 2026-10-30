from __future__ import annotations

from pathlib import Path
from typing import Any

from app.core.model_config import PROJECT_ROOT, load_ultralytics_config
from app.services.inference.faster_rcnn_adapter import FasterRCNNAdapter, load_faster_rcnn_config
from app.services.inference.ultralytics_adapter import UltralyticsAdapter


DEFAULT_CONFIGS = (
    "configs/models/yolo11_baseline.yaml",
    "configs/models/yolo11_finetuned.yaml",
    "configs/models/faster_rcnn_baseline.yaml",
    "configs/models/faster_rcnn_finetuned.yaml",
)


class YoloRegistry:
    """Independent local model adapters; a failure does not block other models."""

    def __init__(self, project_root: str | Path = PROJECT_ROOT):
        self.project_root = Path(project_root)
        self.adapters: dict[str, Any] = {}
        for relative_path in DEFAULT_CONFIGS:
            if "faster_rcnn" in relative_path:
                config = load_faster_rcnn_config(relative_path, self.project_root)
                self.adapters[config.model_id] = FasterRCNNAdapter(config)
            else:
                config = load_ultralytics_config(relative_path, self.project_root)
                self.adapters[config.model_id] = UltralyticsAdapter(config)

    def load_all(self) -> list[dict[str, Any]]:
        statuses = []
        for adapter in self.adapters.values():
            try:
                statuses.append(adapter.load())
            except Exception as exc:
                statuses.append({
                    "model_id": adapter.config.model_id,
                    "model_name": adapter.config.model_name,
                    "status": "error",
                    "checkpoint_path": str(adapter.config.checkpoint_path),
                    "error": f"{type(exc).__name__}: {exc}",
                })
        return statuses

    def predict_one(self, model_id: str, source: Any, confidence_threshold: float | None = None) -> dict[str, Any]:
        adapter = self.adapters.get(model_id)
        if adapter is None:
            return {
                "model_id": model_id,
                "model_name": model_id,
                "status": "error",
                "inference": {"time_ms": None, "device": None},
                "summary": {"total_detections": 0},
                "predictions": [],
                "error": {"code": "MODEL_NOT_FOUND", "message": f"Unknown model_id: {model_id}"},
            }
        return adapter.predict(source, confidence_threshold)

    def predict_all(self, source: Any, confidence_threshold: float | None = None) -> list[dict[str, Any]]:
        return [adapter.predict(source, confidence_threshold) for adapter in self.adapters.values()]
