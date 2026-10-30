# PalmVision AI Benchmark

Fondasi aplikasi web untuk membandingkan empat model object detection tingkat kematangan Tandan Buah Segar (TBS) kelapa sawit:

- Faster R-CNN Baseline
- Faster R-CNN Fine-Tuned
- YOLOv11 Baseline
- YOLOv11 Fine-Tuned

Kelas target dataset: **kurang masak**, **masak**, **mentah**, dan **terlalu masak**. YOLO menggunakan ID 0–3; Faster R-CNN menggunakan ID 1–4 karena ID 0 adalah background. Aplikasi membandingkan output model pada gambar individual dan menyiapkan tampilan metrik evaluasi dataset. Setiap model dapat dijalankan secara independen.

> Frontend dan backend inference lokal tersedia. Checkpoint YOLO11 dan Faster R-CNN yang diberikan disimpan di `weights/`; empat adapter bisa dijalankan terpisah atau bersama pada satu gambar. Evaluasi dataset belum tersedia dan tidak ada weights yang diunduh otomatis.

## Rancangan arsitektur

```text
Model comparison (React: image inference and metrics)
        │ HTTP multipart
        ▼
FastAPI local inference bridge
  ├── Faster R-CNN adapters (Torchvision)
  └── YOLOv11 adapters (Ultralytics)
        │
        └── hasil langsung ke frontend; tanpa persistensi database
```

Frontend mengunggah satu gambar, memilih satu atau empat model, lalu menampilkan output dan latency. Backend menjalankan checkpoint lokal secara independen pada CPU/CUDA. Kartu model membaca metrik validasi yang tertanam pada checkpoint; nilai yang tidak tersedia tetap kosong. Detail: [docs/architecture.md](docs/architecture.md).

## Teknologi yang direncanakan

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, Recharts, Lucide React
- **Backend:** Python, FastAPI, PyTorch, Torchvision, Ultralytics, OpenCV
- **Penyimpanan:** file checkpoint lokal; inference dan hasil tidak disimpan ke database

## Struktur proyek

```text
frontend/                  # Aplikasi web React
  src/components/          # Komponen reusable dan navigasi
  src/hooks/               # Hook status backend
  src/layouts/             # Layout aplikasi
  src/pages/               # Halaman dashboard dan analisis
  src/services/            # Klien API
  src/types.ts             # Tipe model, kelas, metrik, hasil deteksi
  src/constants.ts         # Registri model dan kelas
backend/                   # Adapter inference dan fondasi API Python
  app/api/routes/          # Health dan deteksi gambar lokal
  app/core/model_config.py # Loader konfigurasi model
  app/services/inference/  # Adapter Ultralytics, Torchvision, dan registry model
configs/models/            # Konfigurasi empat checkpoint model
weights/                   # Checkpoint lokal, diabaikan Git
data/                      # Dataset lokal, diabaikan Git
artifacts/                 # Hasil evaluasi lokal, diabaikan Git
docs/                      # Arsitektur dan keputusan teknis
```
## Konfigurasi awal

`.env.example` mencatat nama aplikasi, prefix API, pilihan device `auto`, direktori data/model, dan origin frontend. Tidak ada konfigurasi database. `.gitignore` mengecualikan `.env`, dataset, artifacts, serta checkpoint lokal.

Frontend sudah di-bootstrap dengan Vite, React, TypeScript, Tailwind CSS, Recharts, dan Lucide React; dependency frontend dikunci di `frontend/package-lock.json`. FastAPI lokal menjadi jembatan HTTP dari browser ke model Python; ini bukan API pihak ketiga. Pasang PyTorch dan Torchvision sebagai pasangan build CPU/CUDA yang kompatibel, lalu install paket lainnya dari `backend/requirements.txt`.

Jalankan backend dan frontend pada dua terminal dari root project.

Terminal backend:

    python -m pip install -r backend/requirements.txt
    python -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000

Terminal frontend:

    npm install --prefix frontend
    npm run dev --prefix frontend

Health service tersedia di http://127.0.0.1:8000/api/v1/health; deteksi gambar menggunakan POST /api/v1/detect. Frontend memakai VITE_API_BASE_URL dari frontend/.env.example.
Build production:

```powershell
npm run build --prefix frontend
```

## Persiapan deployment

Frontend dan API dideploy sebagai dua layanan. Build frontend dengan `VITE_API_BASE_URL` mengarah ke URL publik backend, lalu isi `FRONTEND_ORIGINS` pada backend dengan origin frontend yang persis (tanpa path). Backend menerima `PORT` dari platform hosting dan berjalan dalam mode production.

`Dockerfile.backend` menyiapkan runtime CPU. Checkpoint tidak dimasukkan ke image atau repository: mount penyimpanan model pada `/app/weights` dan tempatkan empat file `.pt` di sana. Berkas model lokal berukuran sekitar 550 MB total, jadi platform backend perlu ruang penyimpanan serta RAM yang memadai untuk inference. Tidak ada database yang dibutuhkan.

Sebelum deploy publik, pilih platform hosting yang mendukung container Python, port dinamis, penyimpanan checkpoint, dan resource yang cukup. Jangan menaruh secret atau token di repository; set sebagai environment variable pada platform. Akun dan URL repository GitHub serta platform hosting perlu dikonfigurasi sebelum layanan bisa dipublikasikan.

## Checkpoint dan inference gambar

The local baseline and fine-tuned YOLO11s checkpoints load with the installed Ultralytics runtime. Configuration files are in `configs/models/`; the inference adapters are in `backend/app/services/inference/`. Dataset classes and IDs are `kurang masak` (YOLO 0 / Faster R-CNN 1), `masak` (1 / 2), `mentah` (2 / 3), and `terlalu masak` (3 / 4; Faster R-CNN ID 0 is background).

Checkpoint Faster R-CNN berisi state dict `fasterrcnn_resnet50_fpn` dengan lima output (background + empat kelas); metadata mengonfirmasi class ID 0–4 dan image size 640. Konfigurasinya ada di `configs/models/faster_rcnn_*.yaml`. File input di ZIP dibungkus ulang ke file `.pt` lokal tanpa mengubah arsip sumber. Model memakai CPU/CUDA otomatis.

Panel inference dan metrik per model tersedia pada Model comparison. Nilai metrik berasal dari metadata validasi checkpoint lewat `GET /api/v1/model-metrics`; inference time diukur saat gambar dijalankan. Threshold berlaku saat runtime; pilihan `all` menjalankan keempat model dan menampilkan hasil/error tiap model secara terpisah. Angka checkpoint bukan hasil evaluasi ulang dengan protokol bersama.
## Rencana pengembangan

1. Konfigurasi dan adapter inference empat model tersedia.
2. Alur pengujian gambar dan metrik ringkas tersedia dalam Model comparison.
3. Tetapkan dataset, split, anotasi, serta protokol evaluasi yang sama untuk semua model.
4. Bangun evaluasi dataset dan tampilkan metrik hanya dari output evaluasi nyata.
## Data dan hasil

Repository ini tidak memuat data evaluasi atau hasil prediksi contoh. Hasil gambar hanya tampil selama sesi browser dan tidak dicatat sebagai riwayat. Metrik dataset hanya boleh ditampilkan setelah evaluasi nyata dengan dataset, konfigurasi model, threshold, dan versi kode yang diketahui.








