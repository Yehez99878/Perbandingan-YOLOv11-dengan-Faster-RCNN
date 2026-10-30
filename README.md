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

Repository GitHub: <https://github.com/Yehez99878/Perbandingan-YOLOv11-dengan-Faster-RCNN>

Pengaturan saat membuat aplikasi di Streamlit Community Cloud:

| Pengaturan | Nilai |
| --- | --- |
| Repository | `Yehez99878/Perbandingan-YOLOv11-dengan-Faster-RCNN` |
| Branch | `main` |
| Main file path | `streamlit_app.py` |
| Python dependency file | `requirements.txt` di root proyek |
| System packages | `packages.txt` di root proyek (`libgl1`, `libglib2.0-0`) |

Keempat checkpoint (`weights/*.pt`, sekitar 550 MB total) sudah dilacak dengan Git LFS dan objek LFS-nya sudah diunggah ke repository publik. Karena repository publik, siapa pun dapat mengunduh bobot tersebut. Clone/deploy perlu mengambil objek LFS, bukan hanya file pointer kecil. Aplikasi memberi status `Pointer Git LFS` jika yang terbaca masih pointer; inference tidak dapat dijalankan sampai file checkpoint sebenarnya tersedia.

Root `requirements.txt` mengunci Streamlit dan build CPU PyTorch/Torchvision. `packages.txt` memasang pustaka sistem OpenGL dan GLib yang dibutuhkan OpenCV saat Ultralytics diimpor pada Linux. Tidak diperlukan FastAPI, database, atau secret untuk menjalankan konfigurasi ini. Jangan menambahkan token GitHub ke source code. Pengambilan checkpoint oleh runtime memakai bandwidth Git LFS; pantau kuota pemilik repository jika aplikasi sering dibuka.

Setelah membuat aplikasi, tunggu proses instalasi dependency selesai. Buka log deployment jika build gagal; jika aplikasi hidup tetapi checkpoint menunjukkan `Pointer Git LFS` atau `Belum tersedia`, periksa pengambilan LFS dan log checkout sebelum mencoba inference. Streamlit Community Cloud menyediakan hosting gratis, tetapi resource, waktu aktif, dan batas penggunaan dapat berubah. Inference CPU kemungkinan lebih lambat daripada lokal/CUDA.

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
