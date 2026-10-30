import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.detection import router as detection_router
from app.api.routes.health import router as health_router
from app.api.routes.model_metrics import router as model_metrics_router

app = FastAPI(
    title="PalmVision AI Benchmark Inference",
    version="0.1.0",
    description="Inference API for configured YOLO11 and Faster R-CNN checkpoints.",
)
allowed_origins = [
    origin.strip()
    for origin in os.getenv(
        "FRONTEND_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    ).split(",")
    if origin.strip()
]
development_origin_regex = (
    r"^http://(?:10(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|172\.(?:1[6-9]|2\d|3[01])(?:\.\d{1,3}){2}):5173$"
    if os.getenv("APP_ENV", "development").lower() == "development"
    else None
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=development_origin_regex,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Accept", "Content-Type"],
)
app.include_router(health_router, prefix="/api/v1")
app.include_router(detection_router, prefix="/api/v1")
app.include_router(model_metrics_router, prefix="/api/v1")
