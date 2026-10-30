from __future__ import annotations

from typing import Annotated

import cv2
import numpy as np
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from starlette.concurrency import run_in_threadpool

from app.api.dependencies import predict_all, predict_one, registry

router = APIRouter(tags=["inference"])
MAX_IMAGE_BYTES = 20 * 1024 * 1024
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}


@router.post("/detect")
async def detect_image(
    image: Annotated[UploadFile, File(...)],
    model_id: Annotated[str, Form(...)],
    confidence_threshold: Annotated[float, Form(...)],
) -> dict:
    """Run one selected model or all four configured models on one uploaded image."""
    if image.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=415, detail="Upload a JPEG, PNG, or WebP image.")

    content = await image.read(MAX_IMAGE_BYTES + 1)
    if len(content) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=413, detail="Image exceeds the 20 MB limit.")
    if not content:
        raise HTTPException(status_code=400, detail="The uploaded image is empty.")

    encoded = np.frombuffer(content, dtype=np.uint8)
    decoded = cv2.imdecode(encoded, cv2.IMREAD_COLOR)
    if decoded is None:
        raise HTTPException(status_code=400, detail="The uploaded file is not a readable image.")

    if model_id == "all":
        results = await run_in_threadpool(
            predict_all,
            decoded,
            confidence_threshold=confidence_threshold,
        )
    elif model_id in registry.adapters:
        result = await run_in_threadpool(
            predict_one,
            model_id,
            decoded,
            confidence_threshold=confidence_threshold,
        )
        results = [result]
    else:
        raise HTTPException(status_code=404, detail=f"Unknown model_id: {model_id}")

    return {"results": results}



