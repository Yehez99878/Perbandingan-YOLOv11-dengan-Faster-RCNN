from pathlib import Path
from typing import Any

import yaml
from fastapi import APIRouter

from app.core.model_config import PROJECT_ROOT

router = APIRouter(tags=["model metrics"])
METRICS_SNAPSHOT = PROJECT_ROOT / "configs" / "evaluation" / "checkpoint_metrics.yaml"


@router.get("/model-metrics")
def model_metrics() -> dict[str, Any]:
    """Return only validation metrics recorded in the supplied checkpoints."""
    snapshot = yaml.safe_load(METRICS_SNAPSHOT.read_text(encoding="utf-8"))
    return snapshot
