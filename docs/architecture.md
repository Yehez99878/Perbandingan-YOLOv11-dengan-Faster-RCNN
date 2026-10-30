# Arsitektur PalmVision untuk FGD

## Tujuan

PalmVision membandingkan output empat model deteksi TBS pada gambar yang sama. Fokus aplikasi adalah bounding box, kelas, confidence, dan waktu inference per model, serta metrik evaluasi setelah dataset berlabel tersedia.

## Komponen

- **Frontend:** React, TypeScript, dan Vite. Halaman Model comparison memuat alur unggah gambar, visualisasi output, dan metrik.
- **Backend lokal:** FastAPI menerima gambar dan menjalankan adapter model Python. Tidak ada layanan database atau penyimpanan riwayat.
- **YOLOv11:** Ultralytics dengan konfigurasi dan checkpoint masing-masing.
- **Faster R-CNN:** Torchvision `fasterrcnn_resnet50_fpn` dengan konfigurasi dan checkpoint masing-masing.

## Alur inference gambar

1. Pengguna memilih satu gambar dan satu model atau keempat model.
2. Frontend mengirim gambar dan confidence threshold ke `POST /api/v1/detect`.
3. Backend menjalankan setiap model secara independen pada CPU atau CUDA otomatis.
4. Hasil dikembalikan langsung ke browser: class, confidence, bounding box xyxy, waktu, device, dan status per model.
5. Gambar dan hasil tidak disimpan sebagai riwayat. Checkpoint tetap sebagai file lokal di `weights/`.

Endpoint `GET /api/v1/model-metrics` menyajikan snapshot metrik validasi yang benar-benar tersimpan pada checkpoint. Nilai yang tidak ada atau tidak dapat dipetakan dengan pasti dikembalikan sebagai kosong; waktu inference diukur dari permintaan gambar terbaru di sesi frontend.

## Pemetaan kelas

Kelas kanonis: `kurang masak`, `masak`, `mentah`, dan `terlalu masak`. ID kanonis/YOLO adalah 0–3. ID Faster R-CNN adalah 1–4 karena ID 0 dipakai background. Setiap adapter mempertahankan mapping eksplisit; kelas tidak digabung.

## Metrik

Metrik validasi checkpoint dapat berasal dari konfigurasi evaluasi berbeda, sehingga ditandai sumbernya dan tidak dianggap perbandingan final. Inference time hanya mengukur gambar yang baru dijalankan, bukan rata-rata dataset. Metrik yang tidak tercatat dalam checkpoint tetap kosong sampai tersedia evaluasi baru pada dataset/protokol bersama.

## Batasan

- Tidak ada database, job queue, sinkronisasi cloud, atau riwayat eksperimen.
- Checkpoint tidak diunduh otomatis dan tidak disimpan di Git.
- API diperlukan sebagai jembatan dari browser ke runtime Python; UI tidak memuat checkpoint langsung.
- Backend dapat tetap stateless sehingga setiap hasil inference langsung dikembalikan ke frontend.
