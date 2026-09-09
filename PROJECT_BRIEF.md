# PROJECT BRIEF — Sistem Ketersediaan & Antrian Konsultasi Dosen

> Dokumen ini adalah sumber kebenaran (source of truth) untuk konteks project.
> Dibuat dan disempurnakan dari sesi brainstorming. Baca seluruh dokumen ini
> sebelum mulai mengerjakan apapun di repo ini.

---

## 1. Ringkasan Konsep

Aplikasi web mobile-friendly untuk memantau **ketersediaan dosen secara
real-time** di lingkungan kampus, sekaligus menjadi **sistem antrian
konsultasi** berbasis QR code. Mirip sistem antrian bank/rumah sakit, tapi
untuk konteks konsultasi dosen-mahasiswa.

Status ketersediaan dosen didorong oleh **integrasi API absensi kampus** —
saat dosen absen masuk, sistem otomatis menentukan statusnya berdasarkan
jadwal mengajar dan konsultasi yang sudah diinput.

Sistem ini **real-time end-to-end** menggunakan WebSocket — status dosen,
nomor antrian yang dipanggil, dan papan display semuanya update live tanpa
refresh manual.

**Deployment:** Docker / Docker Compose, self-hosted di server kampus.

---

## 2. Role & Kewenangan

| Role | Kewenangan |
|---|---|
| **Superadmin** | Kelola seluruh sistem. Tambah/kelola Admin, Dosen, Operator. Kelola master data (fakultas, prodi). Kelola system settings (termasuk konfigurasi API absensi). Lihat audit log seluruh sistem. Dashboard analitik global. |
| **Admin** | Tambah/kelola Dosen dan Operator di **fakultas sendiri** (tidak bisa kelola Admin lain, tidak lintas fakultas). Lihat laporan di scope fakultasnya. |
| **Operator** | Generate QR code harian (1 QR aktif per hari, expired otomatis). Lihat QR yang sedang aktif. |
| **Dosen** | Input jadwal mengajar & jadwal konsultasi (termasuk kuota harian opsional). Ubah status ketersediaan (manual override, prioritas di atas jadwal). Panel panggil nomor antrian (panggil, panggil ulang, lewati). Lihat history log dengan filter. |
| **Guest (Mahasiswa)** | Tanpa login/akun. Bisa lihat landing page publik (status dosen). Untuk daftar antrian: scan QR di TV kampus → isi form ringan (nama, NIM, pilih dosen, keperluan) → dapat nomor antrian. |

**Catatan penting:** Guest TIDAK bisa mendaftar antrian dari jarak jauh — wajib
scan QR fisik yang hanya tampil di layar TV kampus. Ini kontrol supaya antrian
tidak diisi orang yang belum tentu datang ke kampus.

---

## 3. Status Ketersediaan Dosen (Real-time)

4 status, masing-masing dengan warna badge:

| Status | Warna |
|---|---|
| Tersedia | Hijau |
| Sedang Mengajar | Kuning |
| Tidak Bersedia | Merah |
| Pulang | Abu-abu |

**Sumber status utama: API Absensi Kampus**

Sistem terintegrasi dengan **API absensi kampus** untuk menentukan status
dosen secara otomatis. Jadwal mengajar dan konsultasi digunakan sebagai
**referensi** penentu status spesifik setelah dosen absen masuk.

**Aturan state machine:**
- **API absensi → Masuk + ada jadwal_mengajar**: status = `Mengajar`
- **API absensi → Masuk + ada jadwal_konsultasi**: status = `Tersedia`
- **API absensi → Masuk + tidak ada jadwal**: status = `Tidak Bersedia`
- **API absensi → Pulang**: status = `Pulang`
- **Belum absen masuk**: status = `Pulang` (default)
- Dosen bisa **override manual** kapan saja (misal dari `Tidak Bersedia` ke `Tersedia` saat siap konsultasi).
- Override **tetap berlaku** sampai trigger berikutnya: pergantian slot jadwal (scheduler) ATAU event absensi baru.
- Flag `status_override` di-clear otomatis setiap kali scheduler melakukan tick pergantian slot atau menerima event absensi baru.

---

## 4. Alur QR Code & Antrian

1. Operator generate QR code (tombol "Generate QR Hari Ini"). Sistem cek: kalau QR hari ini sudah ada, tampilkan yang lama (tidak generate dobel).
2. QR **hanya tampil di Display TV Kampus** (layar fisik di lokasi kampus) — **TIDAK PERNAH** muncul di landing page publik/online.
3. QR expired otomatis di akhir hari (reset tiap hari).
4. Mahasiswa scan QR dari TV → diarahkan ke **satu form umum** (bukan form per dosen).
5. Di form: isi Nama, NIM, pilih dosen tujuan, keperluan (opsional).
   - Dosen yang bisa dipilih: **semua status KECUALI "Pulang"** (jadi Tersedia, Sedang Mengajar, dan Tidak Bersedia tetap bisa dipilih untuk antre duluan).
6. Submit → dapat **nomor antrian per dosen** (bukan global), format `[KODE_DOSEN]-[URUTAN]` misal `A-01`, `B-03`. Counter reset tiap hari, terpisah per dosen.
7. Dosen punya panel antrian: tombol "Panggil Selanjutnya", "Panggil Ulang", "Lewati".
8. Nomor yang dipanggil ditampilkan **real-time di Display TV Kampus** (bukan notifikasi ke HP mahasiswa).
9. **Tidak hadir saat dipanggil**: dosen panggil nomor selanjutnya, nomor yang terlewat tetap tercatat (status `tidak_hadir`), TIDAK hilang dari antrian.
   - Perilaku nomor tidak-hadir bersifat **configurable** via `system_settings` (`allow_recall_no_show`). Default: bisa dipanggil ulang manual selama hari itu masih berjalan, hangus otomatis di penghujung hari.
10. **Kuota harian**: diatur oleh masing-masing dosen sendiri (opsional, nullable = unlimited), TIDAK dibatasi oleh sistem secara default. Kalau kuota tercapai, form menandai dosen tsb "Kuota Penuh" untuk hari itu.
11. Dosen bisa lihat **history log** dengan filter (tanggal, mahasiswa, status).

---

## 5. Dua Jenis "Landing Page" (Penting — Jangan Tertukar)

| | Landing Page Publik | Display TV Kampus |
|---|---|---|
| Diakses dari | Device masing-masing mahasiswa (HP/laptop, dari mana saja) | Layar fisik yang di-mount di lokasi kampus |
| Isi | Daftar dosen + status ketersediaan real-time (warna) | Daftar dosen + status ketersediaan real-time (warna) + QR code aktif hari ini + papan nomor antrian yang sedang dipanggil |
| QR Code tampil? | **TIDAK** | **YA** |
| Bisa daftar antrian dari sini? | **TIDAK** | Ya (via scan QR) |

Keduanya subscribe ke WebSocket yang sama untuk data status dosen real-time,
tapi merupakan route/komponen frontend yang berbeda.

---

## 6. Struktur Data Awal (Draft ERD)

> **ERD detail lengkap** (termasuk tipe data, constraint, index, dan business
> rules) tersedia di [`docs/erd.md`](docs/erd.md).

```
users
├─ id, nama, email, password_hash, role (enum: superadmin/admin/dosen/operator)
├─ fakultas_id (nullable), prodi_id (nullable)
└─ created_by, is_active

dosen_profiles (1-1 ke users)
├─ id, user_id, nip, kode_antrian (unik per dosen, misal "A")
├─ foto_url
├─ status_ketersediaan (enum: tersedia/mengajar/tidak_bersedia/pulang)
├─ status_override (boolean), is_absen_masuk (boolean)
└─ status_updated_at

jadwal_mengajar
├─ id, dosen_id, hari, jam_mulai, jam_selesai
└─ mata_kuliah

jadwal_konsultasi
├─ id, dosen_id, hari, jam_mulai, jam_selesai
└─ kuota_harian (nullable = unlimited)

qr_codes
├─ id, kode_unik, generated_by (operator_id)
└─ tanggal_berlaku, expired_at, status (aktif/expired)

antrian
├─ id, qr_code_id, dosen_id, nomor_antrian (kode_antrian + urutan, mis. "A-01")
├─ urutan, nama_mahasiswa, nim, keperluan
├─ status (enum: menunggu/dipanggil/selesai/tidak_hadir/dilewati)
└─ created_at, dipanggil_at, selesai_at, tanggal

fakultas / program_studi
└─ struktur standar akademik

activity_logs (audit trail — superadmin/admin)
└─ id, user_id, aksi, target_entity, target_id, timestamp, detail (JSON)

system_settings (konfigurasi runtime)
└─ id, key, value, description, updated_by, updated_at

absensi_sync_logs (log integrasi API absensi kampus)
└─ id, dosen_id, event_type, source, raw_payload, sync_status,
   error_message, status_before, status_after, synced_at
```

---

## 7. Arsitektur Sistem (Gambaran Awal)

```
┌─────────────┐   ┌──────────────┐   ┌──────────────┐
│  Web App    │   │  Landing     │   │  Display TV  │
│ (Admin/     │   │  Page Publik │   │  Client      │
│  Dosen/     │   │  (Guest,     │   │  (khusus     │
│  Operator)  │   │  no login)   │   │  kampus)     │
└──────┬──────┘   └──────┬───────┘   └──────┬───────┘
       │                 │                   │
       └─────────┬───────┴───────────────────┘
                  │  HTTPS (REST API) + WSS (WebSocket)
           ┌──────▼───────┐
           │   Backend    │
           │  API Server  │
           │ + WS Server  │
           └──────┬───────┘
                  │
     ┌────────────┼────────────┬────────────────┐
     │            │            │                │
┌────▼────┐  ┌────▼────┐ ┌─────▼─────┐  ┌───────▼───────┐
│PostgreSQL│  │  Redis  │ │ Scheduler │  │  Attendance   │
│(data     │  │(pub/sub │ │ (cron -   │  │  Sync Service │
│ utama)   │  │ WS +    │ │ evaluasi  │  │  (polling API │
│          │  │ cache)  │ │ status &  │  │  kampus +     │
│          │  │         │ │ expired   │  │  webhook      │
│          │  │         │ │ QR)       │  │  receiver)    │
└──────────┘  └─────────┘ └───────────┘  └───────┬───────┘
                                                 │
                                          ┌──────▼──────┐
                                          │ 🏫 API      │
                                          │ Absensi     │
                                          │ Kampus      │
                                          └─────────────┘
```

**Kenapa Redis:** pub/sub untuk menyiarkan event WebSocket lintas instance
server (kalau backend di-scale multi-instance) + cache status antrian
real-time.

**Kenapa Scheduler/Cron:** evaluasi status dosen saat pergantian slot jadwal,
auto-expire QR code harian, auto-reset counter nomor antrian tiap hari.

**Kenapa Attendance Sync Service:** integrasi dua arah dengan API absensi
kampus — polling tiap N menit (configurable) + webhook receiver untuk
menerima push event dari sistem kampus. Setiap event absensi trigger
evaluasi ulang status dosen.

---

## 8. Keputusan yang Sudah Dibuat

| # | Keputusan | Hasil | Catatan |
|---|---|---|---|
| 1 | Scope Admin | **Per fakultas** — hanya kelola dosen/operator di fakultas sendiri | ✅ Final |
| 2 | Nomor tidak hadir | **Configurable** via `system_settings` — rekomendasi: bisa dipanggil ulang, hangus akhir hari | ⏳ Configurable |
| 3 | Jam expire QR | **Configurable** via `system_settings` (default 23:59) | ⏳ Configurable |
| 4 | Tabel ruangan | **Dihapus** — sistem tidak perlu tracking ruangan | ✅ Final |
| 5 | Sumber status dosen | **API absensi kampus** + jadwal sebagai referensi | ✅ Final |
| 6 | Integrasi API absensi | Dua arah: polling + webhook (belum ada detail API dari kampus) | ⏳ Menunggu arahan |
| 7 | Deployment | Docker / Docker Compose (self-hosted di server kampus) | ✅ Final |

---

## 9. Yang BELUM Dibahas (Tahap Selanjutnya)

- Wireframe / UI flow detail tiap halaman
- Rekomendasi tech stack (bahasa, framework, library WebSocket)
- Rencana pengerjaan / roadmap development (MVP vs fitur lanjutan)

---

## 10. Dokumen Desain (Referensi)

Dokumen desain detail tersedia di folder `docs/`:

| Dokumen | Isi |
|---|---|
| [`docs/erd.md`](docs/erd.md) | ERD lengkap — 11 entitas, tipe data, constraint, index, enum, business rules |
| [`docs/flowcharts.md`](docs/flowcharts.md) | 6 flowchart alur bisnis (Mermaid) — state machine, registrasi, panggilan, QR, user management |
| [`docs/dfd.md`](docs/dfd.md) | DFD Level 0 & Level 1 — 10 proses, 8 data store, WebSocket channels |

---

## 11. Instruksi untuk AI Agent

Jika Anda (AI agent) membaca dokumen ini:

1. Baca juga dokumen desain di `docs/` (ERD, Flowcharts, DFD) untuk konteks
   teknis yang lebih lengkap.
2. Ikuti semua aturan bisnis di atas sebagai kebenaran utama — jangan
   berasumsi sendiri di luar yang tertulis di sini.
3. Lihat Bagian 8 untuk daftar keputusan yang sudah dibuat. Untuk item
   yang masih bertanda ⏳, konfirmasi ke user sebelum mengimplementasikan.
4. Prioritaskan desain mobile-friendly (responsive) di semua interface
   kecuali Display TV Kampus (yang didesain untuk layar besar/landscape).
5. Status dosen didorong oleh **API absensi kampus** — bukan jadwal saja.
   Pastikan arsitektur mendukung integrasi dua arah (polling + webhook).
6. Tech stack belum ditentukan. Konfirmasi dulu ke user sebelum scaffolding.
