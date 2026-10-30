from __future__ import annotations

import io
import hashlib
import sys
import threading
from pathlib import Path
from typing import Any

import numpy as np
import streamlit as st
import torch
import yaml
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent
BACKEND_ROOT = ROOT / "backend"
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.services.inference.yolo_registry import YoloRegistry  # noqa: E402


st.set_page_config(
    page_title="PalmVision AI Benchmark",
    page_icon="🌴",
    layout="wide",
    initial_sidebar_state="expanded",
)

MODEL_ORDER = (
    "faster_rcnn_baseline",
    "faster_rcnn_finetuned",
    "yolo11_baseline",
    "yolo11_finetuned",
)
MODEL_NAMES = {
    "faster_rcnn_baseline": "Faster R-CNN Baseline",
    "faster_rcnn_finetuned": "Faster R-CNN Fine-Tuned",
    "yolo11_baseline": "YOLOv11 Baseline",
    "yolo11_finetuned": "YOLOv11 Fine-Tuned",
}
MODEL_DETAILS = {
    "faster_rcnn_baseline": ("Faster R-CNN", "Baseline", "Torchvision", "#15803D"),
    "faster_rcnn_finetuned": ("Faster R-CNN", "Fine-Tuned", "Torchvision", "#0E7490"),
    "yolo11_baseline": ("YOLOv11", "Baseline", "Ultralytics", "#D97706"),
    "yolo11_finetuned": ("YOLOv11", "Fine-Tuned", "Ultralytics", "#7C3AED"),
}
CLASS_COLORS = {
    "kurang masak": "#0284c7",
    "masak": "#16a34a",
    "mentah": "#7c3aed",
    "terlalu masak": "#ea580c",
}
METRIC_COLUMNS = (
    ("precision", "Precision"),
    ("recall", "Recall"),
    ("f1", "F1-Score"),
    ("map50", "mAP@0.5"),
    ("map5095", "mAP@0.5:0.95"),
)


@st.cache_resource(show_spinner=False)
def get_runtime() -> tuple[YoloRegistry, threading.Lock]:
    return YoloRegistry(project_root=ROOT), threading.Lock()


@st.cache_data(show_spinner=False)
def read_checkpoint_metrics() -> dict[str, Any]:
    metrics_path = ROOT / "configs" / "evaluation" / "checkpoint_metrics.yaml"
    content = yaml.safe_load(metrics_path.read_text(encoding="utf-8"))
    return content.get("models", {}) if isinstance(content, dict) else {}


def checkpoint_status(registry: YoloRegistry, model_id: str) -> tuple[str, str]:
    adapter = registry.adapters[model_id]
    path = adapter.config.checkpoint_path
    relative_path = str(path.relative_to(ROOT) if path.is_relative_to(ROOT) else path)
    if not path.is_file():
        return "Belum tersedia", relative_path
    with path.open("rb") as checkpoint_file:
        is_lfs_pointer = checkpoint_file.read(128).startswith(b"version https://git-lfs.github.com/spec/v1")
    return ("Pointer Git LFS" if is_lfs_pointer else "Tersedia"), relative_path


def display_metric(value: Any) -> str:
    return "—" if value is None else f"{float(value):.2f}%"


def draw_predictions(image: Image.Image, predictions: list[dict[str, Any]]) -> Image.Image:
    output = image.copy()
    draw = ImageDraw.Draw(output)
    stroke = max(2, round(output.width / 450))
    for prediction in predictions:
        x1, y1, x2, y2 = prediction["bbox_xyxy"]
        color = CLASS_COLORS.get(prediction["class_name"], "#ffffff")
        draw.rectangle((x1, y1, x2, y2), outline=color, width=stroke)
        label = f"{prediction['class_name']} {prediction['confidence']:.2f}"
        bounds = draw.textbbox((0, 0), label)
        label_width = bounds[2] - bounds[0]
        label_height = bounds[3] - bounds[1]
        label_top = max(0, y1 - label_height - 8)
        draw.rectangle((x1, label_top, x1 + label_width + 8, label_top + label_height + 8), fill=color)
        draw.text((x1 + 4, label_top + 3), label, fill="white")
    return output


registry, inference_lock = get_runtime()
metrics_snapshot = read_checkpoint_metrics()
device_label = "CUDA" if torch.cuda.is_available() else "CPU"

st.title("🌴 PalmVision AI Benchmark")
st.caption("Bandingkan output empat model deteksi kematangan Tandan Buah Segar.")
st.markdown(
    f"<div class='status-pill'><span></span> Runtime lokal: <b>{device_label}</b> · inference dijalankan langsung melalui adapter Python</div>",
    unsafe_allow_html=True,
)

comparison_tab, image_tab = st.tabs(["Perbandingan model", "Uji gambar"])

with comparison_tab:
    st.subheader("Rancangan benchmark")
    st.write(
        "Dua keluarga detektor masing-masing memiliki versi Baseline dan Fine-Tuned. "
        "Bandingkan baseline dengan fine-tuned dalam arsitektur yang sama untuk melihat perubahan hasil setelah fine-tuning."
    )
    overview = st.columns(3)
    overview[0].metric("Arsitektur", "2", "Faster R-CNN · YOLOv11")
    overview[1].metric("Model", "4", "Baseline dan Fine-Tuned")
    overview[2].metric("Kelas", "4", "Tidak ada kelas yang digabung")

    st.subheader("Metrik yang tercatat pada checkpoint")
    st.caption(
        "Nilai di bawah berasal dari metadata checkpoint masing-masing, bukan evaluasi ulang dengan satu dataset/protokol bersama. Tanda — berarti metrik tidak tercatat."
    )
    metric_rows = []
    for model_id in MODEL_ORDER:
        details = MODEL_DETAILS[model_id]
        snapshot = metrics_snapshot.get(model_id, {})
        values = snapshot.get("metrics", {})
        checkpoint_state, _ = checkpoint_status(registry, model_id)
        metric_rows.append(
            {
                "Model": MODEL_NAMES[model_id],
                "Framework": details[2],
                "Checkpoint": checkpoint_state,
                **{label: display_metric(values.get(key)) for key, label in METRIC_COLUMNS},
            }
        )
    st.dataframe(metric_rows, width="stretch", hide_index=True)

    with st.expander("Lihat sumber metrik"):
        for model_id in MODEL_ORDER:
            note = metrics_snapshot.get(model_id, {}).get("source_note", "Metadata metrik tidak tersedia.")
            st.markdown(f"**{MODEL_NAMES[model_id]}:** {note}")

    st.subheader("Kelas dan pemetaan ID")
    class_rows = [
        {"Kelas": "kurang masak", "ID YOLOv11": 0, "ID Faster R-CNN": 1},
        {"Kelas": "masak", "ID YOLOv11": 1, "ID Faster R-CNN": 2},
        {"Kelas": "mentah", "ID YOLOv11": 2, "ID Faster R-CNN": 3},
        {"Kelas": "terlalu masak", "ID YOLOv11": 3, "ID Faster R-CNN": 4},
    ]
    st.dataframe(class_rows, width="stretch", hide_index=True)
    st.caption("Faster R-CNN memakai ID 0 untuk background; kelas objek menggunakan ID 1–4.")

    with st.expander("Tentang empat model"):
        for family, framework, description in (
            (
                "Faster R-CNN",
                "Torchvision",
                "Detektor dua tahap: mengusulkan area objek, lalu mengklasifikasikan objek dan menyempurnakan bounding box.",
            ),
            (
                "YOLOv11",
                "Ultralytics",
                "Detektor satu tahap yang memprediksi lokasi objek dan kelas secara langsung.",
            ),
        ):
            st.markdown(f"**{family} · {framework}**  \n{description}")

with image_tab:
    st.subheader("Uji gambar dan bandingkan output")
    st.write("Unggah satu gambar TBS. Pilih satu model atau jalankan keempat model pada gambar yang sama.")

    model_options = {"all": "Bandingkan keempat model", **{key: MODEL_NAMES[key] for key in MODEL_ORDER}}
    selected_model = st.selectbox(
        "Model",
        options=list(model_options),
        format_func=lambda key: model_options[key],
    )
    confidence = st.slider("Confidence threshold", min_value=0.0, max_value=1.0, value=0.25, step=0.01)
    uploaded_image = st.file_uploader("Pilih gambar TBS", type=["jpg", "jpeg", "png", "webp"])

    if uploaded_image is not None:
        try:
            original_image = Image.open(io.BytesIO(uploaded_image.getvalue())).convert("RGB")
            st.image(original_image, caption=uploaded_image.name, width="stretch")
        except Exception as exc:
            original_image = None
            st.error(f"Gambar tidak dapat dibaca: {type(exc).__name__}: {exc}")
    else:
        original_image = None

    if st.button("Jalankan inference", type="primary", disabled=original_image is None, width="stretch"):
        rgb = np.asarray(original_image)
        bgr = np.ascontiguousarray(rgb[:, :, ::-1])
        with st.spinner("Menjalankan model yang dipilih pada CPU/CUDA..."):
            with inference_lock:
                if selected_model == "all":
                    results = registry.predict_all(bgr, confidence_threshold=confidence)
                else:
                    results = [registry.predict_one(selected_model, bgr, confidence_threshold=confidence)]
        st.session_state["last_results"] = results
        st.session_state["last_result_image"] = uploaded_image.getvalue()
        st.session_state["last_run_key"] = (
            hashlib.sha256(uploaded_image.getvalue()).hexdigest(),
            selected_model,
            confidence,
        )

    current_run_key = (
        hashlib.sha256(uploaded_image.getvalue()).hexdigest(),
        selected_model,
        confidence,
    ) if uploaded_image is not None else None
    if st.session_state.get("last_results") and st.session_state.get("last_run_key") == current_run_key:
        last_results = st.session_state["last_results"]
        result_tabs = st.tabs([result.get("model_name", "Model") for result in last_results])
        result_image = Image.open(io.BytesIO(st.session_state["last_result_image"])).convert("RGB")
        for result_tab, result in zip(result_tabs, last_results):
            with result_tab:
                if result.get("status") != "success":
                    error = result.get("error", {})
                    st.error(f"{error.get('code', 'INFERENCE_FAILED')}: {error.get('message', 'Inference gagal.')}")
                    continue
                predictions = result.get("predictions", [])
                col_image, col_details = st.columns([1.5, 1])
                with col_image:
                    st.image(draw_predictions(result_image, predictions), caption="Hasil deteksi", width="stretch")
                with col_details:
                    result_cols = st.columns(3)
                    result_cols[0].metric("Deteksi", result["summary"]["total_detections"])
                    result_cols[1].metric("Waktu", f"{result['inference']['time_ms']:.1f} ms")
                    result_cols[2].metric("Perangkat", result["inference"].get("device") or "—")
                    if predictions:
                        display_rows = [
                            {
                                "Kelas": item["class_name"],
                                "ID kelas": item["class_id"],
                                "Confidence": round(item["confidence"], 4),
                                "Bounding box (x1, y1, x2, y2)": ", ".join(f"{point:.1f}" for point in item["bbox_xyxy"]),
                            }
                            for item in predictions
                        ]
                        st.dataframe(display_rows, width="stretch", hide_index=True)
                    else:
                        st.info("Model tidak menemukan objek di atas confidence threshold ini.")
    else:
        st.info("Pilih gambar untuk memulai pengujian. Hasil hanya ditampilkan pada sesi ini dan tidak disimpan.")

st.divider()
st.caption("PalmVision AI Benchmark · tanpa database · model berjalan pada Python di perangkat hosting atau lokal.")
