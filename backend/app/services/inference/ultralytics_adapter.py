from __future__ import annotations

from pathlib import Path
from time import perf_counter
from typing import Any

from app.core.model_config import ModelConfigurationError, UltralyticsModelConfig


class UltralyticsAdapter:
    """Lazy, local-only YOLO inference adapter. Each instance owns one model."""

    def __init__(self, config: UltralyticsModelConfig):
        self.config = config
        self._model: Any | None = None
        self._load_error: str | None = None
        self._device_label: str | None = None
        self._ultralytics_device: str | int | None = None

    @property
    def is_loaded(self) -> bool:
        return self._model is not None

    def _resolve_device(self) -> tuple[str, str | int]:
        import torch

        if self.config.device == "auto":
            use_cuda = torch.cuda.is_available()
        elif self.config.device == "cuda":
            use_cuda = torch.cuda.is_available()
            if not use_cuda:
                raise ModelConfigurationError("CUDA requested but unavailable in this PyTorch runtime")
        else:
            use_cuda = False

        return ("cuda:0", 0) if use_cuda else ("cpu", "cpu")

    def load(self) -> dict[str, Any]:
        """Load checkpoint once and validate architecture and class names."""
        if self._model is not None:
            return self.status()
        if self._load_error is not None:
            raise RuntimeError(self._load_error)
        if not self.config.checkpoint_path.is_file():
            raise FileNotFoundError(f"Local checkpoint not found: {self.config.checkpoint_path}")

        try:
            from ultralytics import YOLO

            model = YOLO(str(self.config.checkpoint_path), task="detect")
            names = {int(class_id): str(name) for class_id, name in model.names.items()}
            if names != self.config.yolo_names:
                raise ModelConfigurationError(
                    f"Checkpoint class names do not match config. checkpoint={names!r}, config={self.config.yolo_names!r}"
                )
            yaml_file = getattr(model.model, "yaml", {}).get("yaml_file")
            if yaml_file and Path(yaml_file).stem != self.config.model_variant:
                raise ModelConfigurationError(
                    f"Checkpoint architecture {yaml_file!r} does not match configured variant {self.config.model_variant!r}"
                )
            self._device_label, self._ultralytics_device = self._resolve_device()
            self._model = model
            return self.status()
        except Exception as exc:
            self._load_error = f"{type(exc).__name__}: {exc}"
            raise

    def status(self) -> dict[str, Any]:
        return {
            "model_id": self.config.model_id,
            "model_name": self.config.model_name,
            "status": "loaded" if self._model is not None else "not_loaded",
            "checkpoint_path": str(self.config.checkpoint_path),
            "model_variant": self.config.model_variant,
            "class_mapping": self.config.yolo_names,
            "device": self._device_label,
            "error": self._load_error,
        }

    def _error_response(self, code: str, message: str) -> dict[str, Any]:
        return {
            "model_id": self.config.model_id,
            "model_name": self.config.model_name,
            "status": "error",
            "inference": {"time_ms": None, "device": self._device_label},
            "summary": {"total_detections": 0},
            "predictions": [],
            "error": {"code": code, "message": message},
        }

    def predict(self, source: Any, confidence_threshold: float | None = None) -> dict[str, Any]:
        """Run one image and return boxes in original-image xyxy coordinates."""
        confidence = confidence_threshold
        if confidence is None:
            confidence = self.config.confidence_threshold
        if confidence is None:
            return self._error_response(
                "CONFIGURATION_INCOMPLETE",
                "confidence_threshold is not present in the checkpoint/config; supply an explicit threshold.",
            )
        if not 0.0 <= confidence <= 1.0:
            return self._error_response("INVALID_CONFIGURATION", "confidence_threshold must be between 0 and 1")

        try:
            self.load()
            import torch

            started = perf_counter()
            results = self._model.predict(
                source=source,
                imgsz=self.config.image_size,
                conf=confidence,
                iou=self.config.iou_threshold,
                device=self._ultralytics_device,
                verbose=False,
                save=False,
            )
            if self._device_label and self._device_label.startswith("cuda"):
                torch.cuda.synchronize()
            elapsed_ms = (perf_counter() - started) * 1000.0
            if len(results) != 1:
                raise RuntimeError(f"Expected one image result; Ultralytics returned {len(results)}")

            result = results[0]
            predictions: list[dict[str, Any]] = []
            boxes = result.boxes
            if boxes is not None:
                for index in range(len(boxes)):
                    class_id = int(boxes.cls[index].item())
                    if class_id not in self.config.yolo_names:
                        raise ModelConfigurationError(f"Prediction contains unknown class ID {class_id}")
                    xyxy = [float(value) for value in boxes.xyxy[index].tolist()]
                    predictions.append({
                        "class_id": class_id,
                        "class_name": self.config.yolo_names[class_id],
                        "faster_rcnn_class_id": next(item.faster_rcnn_class_id for item in self.config.class_mapping if item.yolo_class_id == class_id),
                        "confidence": float(boxes.conf[index].item()),
                        "bbox_xyxy": xyxy,
                    })

            return {
                "model_id": self.config.model_id,
                "model_name": self.config.model_name,
                "status": "success",
                "inference": {"time_ms": round(elapsed_ms, 3), "device": self._device_label},
                "summary": {"total_detections": len(predictions)},
                "predictions": predictions,
            }
        except FileNotFoundError as exc:
            return self._error_response("CHECKPOINT_NOT_FOUND", str(exc))
        except Exception as exc:
            return self._error_response("INFERENCE_FAILED", f"{type(exc).__name__}: {exc}")

