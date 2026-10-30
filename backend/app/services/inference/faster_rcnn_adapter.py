from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from time import perf_counter
from typing import Any

import yaml

from app.core.model_config import ClassMap, ModelConfigurationError, PROJECT_ROOT


@dataclass(frozen=True)
class FasterRCNNConfig:
    model_id: str
    model_name: str
    checkpoint_path: Path
    class_mapping: tuple[ClassMap, ...]
    image_size: int
    confidence_threshold: float
    device: str
    architecture: str


def load_faster_rcnn_config(path: str | Path, project_root: str | Path = PROJECT_ROOT) -> FasterRCNNConfig:
    config_path = Path(path)
    if not config_path.is_absolute():
        config_path = Path(project_root) / config_path
    raw: Any = yaml.safe_load(config_path.read_text(encoding="utf-8"))
    if not isinstance(raw, dict) or raw.get("framework") != "torchvision":
        raise ModelConfigurationError(f"Invalid Torchvision model config: {config_path}")
    if raw.get("architecture") != "fasterrcnn_resnet50_fpn":
        raise ModelConfigurationError("Only the verified fasterrcnn_resnet50_fpn architecture is supported")

    checkpoint_path = Path(str(raw["checkpoint_path"]))
    if not checkpoint_path.is_absolute():
        checkpoint_path = Path(project_root) / checkpoint_path
    mapping = tuple(
        ClassMap(
            yolo_class_id=int(row["yolo_class_id"]),
            faster_rcnn_class_id=int(row["faster_rcnn_class_id"]),
            class_name=str(row["class_name"]),
        )
        for row in raw["class_mapping"]
    )
    if len(mapping) != 4 or [item.yolo_class_id for item in mapping] != list(range(4)):
        raise ModelConfigurationError("Faster R-CNN config must map the four canonical YOLO IDs 0 through 3")
    if any(item.faster_rcnn_class_id != item.yolo_class_id + 1 for item in mapping):
        raise ModelConfigurationError("Faster R-CNN class IDs must be YOLO IDs + 1; ID 0 is background")
    if [item.class_name for item in mapping] != ["kurang masak", "masak", "mentah", "terlalu masak"]:
        raise ModelConfigurationError("Faster R-CNN class names or order do not match the dataset mapping")

    image_size = int(raw["image_size"])
    confidence = float(raw["confidence_threshold"])
    device = str(raw.get("device", "auto")).lower()
    if image_size <= 0 or not 0 <= confidence <= 1 or device not in {"auto", "cpu", "cuda"}:
        raise ModelConfigurationError("Invalid image size, confidence threshold, or device in model config")
    return FasterRCNNConfig(
        model_id=str(raw["model_id"]),
        model_name=str(raw["model_name"]),
        checkpoint_path=checkpoint_path,
        class_mapping=mapping,
        image_size=image_size,
        confidence_threshold=confidence,
        device=device,
        architecture=str(raw["architecture"]),
    )


class FasterRCNNAdapter:
    """Local Torchvision Faster R-CNN adapter for one independent checkpoint."""

    def __init__(self, config: FasterRCNNConfig):
        self.config = config
        self._model: Any | None = None
        self._device: Any | None = None
        self._device_label: str | None = None
        self._load_error: str | None = None

    @property
    def is_loaded(self) -> bool:
        return self._model is not None

    def _resolve_device(self, torch: Any) -> Any:
        if self.config.device == "cuda" and not torch.cuda.is_available():
            raise ModelConfigurationError("CUDA requested but unavailable in this PyTorch runtime")
        return torch.device("cuda:0" if self.config.device != "cpu" and torch.cuda.is_available() else "cpu")

    def load(self) -> dict[str, Any]:
        if self._model is not None:
            return self.status()
        if self._load_error:
            raise RuntimeError(self._load_error)
        if not self.config.checkpoint_path.is_file():
            raise FileNotFoundError(f"Local checkpoint not found: {self.config.checkpoint_path}")
        try:
            import torch
            from torchvision.models.detection import fasterrcnn_resnet50_fpn

            checkpoint = torch.load(self.config.checkpoint_path, map_location="cpu", weights_only=True)
            names = {int(key): str(value) for key, value in checkpoint.get("class_names", {}).items()}
            expected = {0: "background", **{item.faster_rcnn_class_id: item.class_name for item in self.config.class_mapping}}
            if names != expected:
                raise ModelConfigurationError(f"Checkpoint class mapping mismatch: checkpoint={names!r}, expected={expected!r}")
            if int(checkpoint.get("config", {}).get("image_size", -1)) != self.config.image_size:
                raise ModelConfigurationError("Checkpoint image_size does not match model config")
            state = checkpoint.get("model_state_dict")
            if not isinstance(state, dict):
                raise ModelConfigurationError("Checkpoint does not contain model_state_dict")
            predictor_shape = tuple(state["roi_heads.box_predictor.cls_score.weight"].shape)
            if predictor_shape != (5, 1024):
                raise ModelConfigurationError(f"Unexpected Faster R-CNN classifier shape: {predictor_shape}")

            device = self._resolve_device(torch)
            model = fasterrcnn_resnet50_fpn(
                weights=None,
                weights_backbone=None,
                num_classes=5,
                min_size=self.config.image_size,
                max_size=self.config.image_size,
            )
            # Apply the requested threshold after the forward pass so values
            # below Torchvision's default 0.05 remain selectable in the UI.
            model.roi_heads.score_thresh = 0.0
            model.load_state_dict(state, strict=True)
            model.eval()
            model.to(device)
            self._model, self._device = model, device
            self._device_label = str(device)
            return self.status()
        except Exception as exc:
            self._load_error = f"{type(exc).__name__}: {exc}"
            raise

    def status(self) -> dict[str, Any]:
        return {
            "model_id": self.config.model_id,
            "model_name": self.config.model_name,
            "status": "loaded" if self.is_loaded else "not_loaded",
            "checkpoint_path": str(self.config.checkpoint_path),
            "architecture": self.config.architecture,
            "device": self._device_label,
            "error": self._load_error,
        }

    def predict(self, source: Any, confidence_threshold: float | None = None) -> dict[str, Any]:
        confidence = self.config.confidence_threshold if confidence_threshold is None else confidence_threshold
        try:
            self.load()
            import numpy as np
            import torch

            image = np.asarray(source)
            if image.ndim != 3 or image.shape[2] != 3:
                raise ValueError("Expected an HxWx3 BGR image")
            height, width = image.shape[:2]
            rgb = np.ascontiguousarray(image[:, :, ::-1])
            tensor = torch.from_numpy(rgb).permute(2, 0, 1).to(dtype=torch.float32).div_(255.0).to(self._device)
            if self._device.type == "cuda":
                torch.cuda.synchronize(self._device)
            started = perf_counter()
            with torch.inference_mode():
                output = self._model([tensor])[0]
            if self._device.type == "cuda":
                torch.cuda.synchronize(self._device)
            elapsed_ms = (perf_counter() - started) * 1000.0

            mapping = {item.faster_rcnn_class_id: item for item in self.config.class_mapping}
            predictions = []
            for box, score, class_tensor in zip(output["boxes"], output["scores"], output["labels"]):
                class_id = int(class_tensor.item())
                score_value = float(score.item())
                if score_value < confidence:
                    continue
                if class_id not in mapping:
                    raise ModelConfigurationError(f"Prediction contains unknown Faster R-CNN class ID {class_id}")
                item = mapping[class_id]
                x1, y1, x2, y2 = (float(value) for value in box.tolist())
                predictions.append({
                    "class_id": item.yolo_class_id,
                    "class_name": item.class_name,
                    "faster_rcnn_class_id": item.faster_rcnn_class_id,
                    "confidence": score_value,
                    "bbox_xyxy": [max(0.0, min(x1, width)), max(0.0, min(y1, height)), max(0.0, min(x2, width)), max(0.0, min(y2, height))],
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
            code = "CHECKPOINT_NOT_FOUND"
            message = str(exc)
        except Exception as exc:
            code = "INFERENCE_FAILED"
            message = f"{type(exc).__name__}: {exc}"
        return {
            "model_id": self.config.model_id,
            "model_name": self.config.model_name,
            "status": "error",
            "inference": {"time_ms": None, "device": self._device_label},
            "summary": {"total_detections": 0},
            "predictions": [],
            "error": {"code": code, "message": message},
        }
