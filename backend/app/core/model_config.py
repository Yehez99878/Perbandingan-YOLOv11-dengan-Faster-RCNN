from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any

import yaml


class ModelConfigurationError(ValueError):
    """Raised when a model's local configuration is missing or inconsistent."""


@dataclass(frozen=True)
class ClassMap:
    yolo_class_id: int
    faster_rcnn_class_id: int
    class_name: str


@dataclass(frozen=True)
class UltralyticsModelConfig:
    model_id: str
    model_name: str
    framework: str
    model_variant: str
    checkpoint_path: Path
    class_mapping: tuple[ClassMap, ...]
    image_size: int
    confidence_threshold: float | None
    confidence_threshold_verified: bool
    iou_threshold: float
    device: str
    checkpoint_ultralytics_version: str | None = None

    @property
    def yolo_names(self) -> dict[int, str]:
        return {item.yolo_class_id: item.class_name for item in self.class_mapping}


PROJECT_ROOT = Path(__file__).resolve().parents[3]


def load_ultralytics_config(path: str | Path, project_root: str | Path = PROJECT_ROOT) -> UltralyticsModelConfig:
    config_path = Path(path)
    if not config_path.is_absolute():
        config_path = Path(project_root) / config_path
    if not config_path.is_file():
        raise ModelConfigurationError(f"Model config not found: {config_path}")

    raw: Any = yaml.safe_load(config_path.read_text(encoding="utf-8"))
    if not isinstance(raw, dict):
        raise ModelConfigurationError(f"Model config must be a YAML mapping: {config_path}")
    if raw.get("framework") != "ultralytics":
        raise ModelConfigurationError("framework must be 'ultralytics'")

    checkpoint_path = Path(str(raw.get("checkpoint_path", "")))
    if not checkpoint_path.is_absolute():
        checkpoint_path = Path(project_root) / checkpoint_path

    mapping_raw = raw.get("class_mapping")
    if not isinstance(mapping_raw, list) or not mapping_raw:
        raise ModelConfigurationError("class_mapping must be a non-empty list")
    mapping: list[ClassMap] = []
    for row in mapping_raw:
        if not isinstance(row, dict):
            raise ModelConfigurationError("Each class_mapping entry must be a mapping")
        mapping.append(ClassMap(
            yolo_class_id=int(row["yolo_class_id"]),
            faster_rcnn_class_id=int(row["faster_rcnn_class_id"]),
            class_name=str(row["class_name"]),
        ))
    mapping.sort(key=lambda item: item.yolo_class_id)
    ids = [item.yolo_class_id for item in mapping]
    if ids != list(range(len(mapping))):
        raise ModelConfigurationError("YOLO class IDs must be contiguous starting at 0")
    if len({item.faster_rcnn_class_id for item in mapping}) != len(mapping):
        raise ModelConfigurationError("Faster R-CNN class IDs must be unique")
    if any(item.faster_rcnn_class_id != item.yolo_class_id + 1 for item in mapping):
        raise ModelConfigurationError("Faster R-CNN IDs must offset YOLO IDs by one (background is ID 0)")
    if len({item.class_name for item in mapping}) != len(mapping):
        raise ModelConfigurationError("class names must be unique")

    image_size = int(raw["image_size"])
    confidence = raw.get("confidence_threshold")
    confidence = None if confidence is None else float(confidence)
    iou = float(raw["iou_threshold"])
    if image_size <= 0:
        raise ModelConfigurationError("image_size must be positive")
    if confidence is not None and not 0.0 <= confidence <= 1.0:
        raise ModelConfigurationError("confidence_threshold must be between 0 and 1")
    if not 0.0 <= iou <= 1.0:
        raise ModelConfigurationError("iou_threshold must be between 0 and 1")

    device = str(raw.get("device", "auto")).lower()
    if device not in {"auto", "cpu", "cuda"}:
        raise ModelConfigurationError("device must be one of: auto, cpu, cuda")

    return UltralyticsModelConfig(
        model_id=str(raw["model_id"]),
        model_name=str(raw["model_name"]),
        framework="ultralytics",
        model_variant=str(raw["model_variant"]),
        checkpoint_path=checkpoint_path,
        class_mapping=tuple(mapping),
        image_size=image_size,
        confidence_threshold=confidence,
        confidence_threshold_verified=bool(raw.get("confidence_threshold_verified", confidence is not None)),
        iou_threshold=iou,
        device=device,
        checkpoint_ultralytics_version=raw.get("checkpoint_ultralytics_version"),
    )


