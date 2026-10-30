from threading import Lock
from typing import Any

from app.services.inference.yolo_registry import YoloRegistry

# One registry for this Python process: each checkpoint is loaded once and reused.
registry = YoloRegistry()
inference_lock = Lock()


def predict_one(model_id: str, source: Any, confidence_threshold: float) -> dict[str, Any]:
    with inference_lock:
        return registry.predict_one(model_id, source, confidence_threshold)


def predict_all(source: Any, confidence_threshold: float) -> list[dict[str, Any]]:
    with inference_lock:
        return registry.predict_all(source, confidence_threshold)
