from fastapi import APIRouter

from app.api.dependencies import registry

router = APIRouter(tags=["health"])


@router.get("/health")
def health() -> dict:
    """Health probe for the local Python inference service (does not load checkpoints)."""
    return {
        "status": "ok",
        "service": "PalmVision inference",
        "models": [
            {
                "model_id": adapter.config.model_id,
                "model_name": adapter.config.model_name,
                "status": "loaded" if adapter.is_loaded else "not_loaded",
                "checkpoint_available": adapter.config.checkpoint_path.is_file(),
                "confidence_threshold_configured": getattr(adapter.config, "confidence_threshold", None) is not None,
            }
            for adapter in registry.adapters.values()
        ],
    }


