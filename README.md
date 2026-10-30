# PalmVision AI Benchmark

Aplikasi benchmark untuk membandingkan output empat model object detection kematangan Tandan Buah Segar (TBS) kelapa sawit. Antarmuka utama sekarang menggunakan Streamlit dan memanggil adapter Python secara langsung; inference Streamlit tidak melewati FastAPI.

Model yang disediakan:

- Faster R-CNN Baseline dan Fine-Tuned menggunakan Torchvision.
- YOLOv11 Baseline dan Fine-Tuned menggunakan Ultralytics.

Empat kelas dataset dipertahankan terpisah: `kurang masak`, `masak`, `mentah`, dan `terlalu masak`. YOLO memakai ID 0–3; Faster R-CNN memakai ID 1–4 karena ID 0 adalah background.

## Fitur

- Ringkasan model, status checkpoint, dan metrik validasi yang tersedia pada metadata checkpoint.
- Upload satu gambar, inference satu model atau keempat model, overlay bounding box, confidence, kelas, latency, dan perangkat.
- CPU/CUDA dipilih otomatis oleh adapter.
- Hasil gambar hanya berada di sesi Streamlit dan tidak disimpan; tidak ada database atau data evaluasi simulasi.
- Model weights tidak diunduh otomatis.

## Menjalankan lokal

Aktifkan environment Python yang berisi PyTorch/Torchvision kompatibel dengan checkpoint, lalu dari root proyek jalankan:

```powershell
python -m pip install -r requirements.txt
python -m streamlit run streamlit_app.py
```

Pastikan empat checkpoint tersedia di `weights/` dengan nama:
`yolo11_baseline.pt`, `yolo11_finetuned.pt`, `faster_rcnn_baseline.pt`, dan `faster_rcnn_finetuned.pt`.

## Deployment Streamlit Community Cloud

1. Hubungkan repository GitHub dan pilih `streamlit_app.py` sebagai entry point.
2. Root `requirements.txt` mengunci dependency Streamlit serta build CPU PyTorch/Torchvision.
3. Sediakan checkpoint pada runtime secara terpisah. Folder `weights/` sengaja diabaikan Git dan berukuran sekitar 550 MB total; jangan commit bobot besar ke repository biasa.
4. Atur visibility dan akses penyimpanan model sesuai kebutuhan kelompok. Jika menggunakan token/secret untuk penyimpanan file, simpan sebagai secret platform, jangan di kode atau Git.

Streamlit Community Cloud menyediakan hosting gratis, tetapi ketersediaan resource dan waktu aktif dapat berubah. Uji model di environment target; inference CPU dapat lebih lambat. Deploy kode saja tanpa menyiapkan empat checkpoint akan menampilkan status bobot belum tersedia dan tidak dapat menjalankan inference.

## Struktur penting

```text
streamlit_app.py                 # UI utama Streamlit dan alur inference
requirements.txt                 # Dependency untuk deployment Streamlit
.streamlit/config.toml           # Tema dan batas upload gambar
backend/app/services/inference/  # Adapter Torchvision, Ultralytics, dan registry
configs/models/                  # Konfigurasi model dan class mapping
configs/evaluation/              # Metadata metrik checkpoint; nilai kosong tetap kosong
weights/                         # Checkpoint lokal; diabaikan Git
frontend/                        # Implementasi React sebelumnya, dipertahankan sementara
```

Kode React/FastAPI lama masih tersedia di folder `frontend/` dan `backend/` selama migrasi. Untuk menjalankan aplikasi utama, gunakan perintah Streamlit di atas. Evaluasi dataset bersama belum diimplementasikan; metrik checkpoint tetap diberi konteks agar tidak disalahartikan sebagai evaluasi bersama.
