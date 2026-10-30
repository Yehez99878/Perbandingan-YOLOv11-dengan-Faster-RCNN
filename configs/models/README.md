# YOLO11 checkpoint configurations

- `yolo11_baseline.yaml` and `yolo11_finetuned.yaml` describe the local checkpoint and verified YOLO-to-Faster R-CNN class IDs.
- Both checkpoints were identified as YOLO11s, with four class names and `image_size: 640`.
- `confidence_threshold` remains `null`: the checkpoint training arguments contain no confidence value. The adapter requires an explicit inference-time threshold and will return a configuration error until supplied.
- `iou_threshold: 0.7` is copied from checkpoint `train_args`; it is recorded as provenance, not represented as a benchmark result.
- The shown `data_colab.yaml` path points to Kaggle and is not available locally. Dataset evaluation is not configured by these model files.
