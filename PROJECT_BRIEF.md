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
| **Superadmin** | Kelola seluruh sistem. Tambah/kelola Admin, Dosen, Operator (alur profil terlebih dahulu, baru akun auth). Kelola master data (fakultas, prodi, gedung, ruangan). Kelola system settings (termasuk konfigurasi API absensi). Lihat audit log seluruh sistem. Generate QR code alternatif. |
| **Admin** | Mirip Superadmin tetapi dengan **batasan ketat**: hanya bisa menambahkan Dosen dan Operator di **fakultas sendiri**. Dalam tabel data pengguna, Admin **hanya bisa mengedit password** (reset password) dan **menghapus data atau meng-nonaktifkan (inactivate) akun** (`is_active = false`). Tidak bisa mengedit profil dosen/operator atau master data kampus. |
| **Operator** | **Generate QR Code:** Membuat QR code harian untuk Display TV kampus.<br>**Moderasi Konten Form:** Memiliki akses ke panel moderasi untuk **menghapus data pendaftaran bermasalah** atau **mem-filter/menyensor kata-kata yang tidak pantas** pada nama, perihal, atau keterangan yang diinput mahasiswa pada form pendaftaran. |
| **Dosen** | **Edit Profil:** foto, nama lengkap, prodi, email.<br>**Status & Lokasi:** Ubah status ketersediaan + pilih lokasi di kampus via dropdown Gedung, dropdown Ruangan, dan text field Lokasi Lainnya.<br>**Jadwal:** Input slot jam mengajar & jadwal konsultasi (bisa >1 slot baris per hari).<br>**Panel Antrian:** Memanggil mahasiswa via tombol kotak panjang primer (urutan) ATAU tombol panggil di setiap card antrian mahasiswa (keperluan mendesak).<br>**Riwayat:** Panel Log History bimbingan tepat di bawah area antrian aktif. |
| **Guest (Mahasiswa)** | Tanpa login/akun. Bisa melihat **Landing Page Publik** (daftar dosen, status, lokasi, serta **nama mahasiswa yang sedang sesi konseling/aktif**). Landing page mahasiswa **TIDAK memiliki QR Code**. Mahasiswa **hanya bisa mendaftar antrian melalui monitor/Display TV fisik di kampus** (scan QR code di monitor TV → isi form nama, nim, pilih dosen, perihal, keterangan → auto-success dapat nomor antrian). Dosen berstatus "Tidak Bersedia" tetap bisa dipilih di form. |

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
- Dosen bisa **override manual** status ketersediaan dan lokasi keberadaan kapan saja.
- Override **tetap berlaku** sampai trigger berikutnya: pergantian slot jadwal (scheduler) ATAU event absensi baru.
- Flag `status_override` di-clear otomatis setiap kali scheduler melakukan tick pergantian slot atau menerima event absensi baru.

> ⚠️ **ATURAN KRUSIAL PEMBATALAN:**  
> Jika dosen mengubah statusnya menjadi **PULANG** (baik via override manual maupun tap pulang API absensi), **seluruh antrian mahasiswa yang sedang berstatus `menunggu` pada dosen tersebut OTOMATIS DIBATALKAN (`dibatalkan`)** dan notifikasi disiarkan langsung ke perangkat mahasiswa melalui WebSocket.

---

## 4. Alur QR Code & Antrian

1. Operator atau Superadmin generate QR code (tombol "Generate QR Hari Ini"). Sistem cek: kalau QR hari ini sudah ada, tampilkan yang lama (tidak generate dobel).
2. QR **hanya tampil di Display TV Kampus** (layar fisik di lokasi kampus) — **TIDAK PERNAH** muncul di landing page publik/online.
3. QR expired otomatis di akhir hari (reset tiap hari jam 23:59).
4. Mahasiswa scan QR dari TV Kampus → diarahkan ke **form pendaftaran konsultasi** di smartphone masing-masing.
5. Di form: isi **Nama**, **NIM**, pilih **Dosen tujuan**, isi **Perihal**, dan **Keterangan**.
   - Dosen yang muncul di menu dropdown form: **hanya dosen dengan status `Tersedia`, `Sedang Mengajar`, dan `Tidak Bersedia`**.
   - Dosen berstatus `Pulang` (tidak di tempat) otomatis di-filter dan **tidak muncul** di form.
   - **Mahasiswa tetap bisa memilih dosen yang berstatus `Tidak Bersedia`** untuk antre terlebih dahulu.
6. Submit form → **Auto-Success**: data langsung tersimpan dan sistem otomatis menerbitkan tiket antrian per dosen (format `[KODE_DOSEN]-[URUTAN]`, misal `A-01`, `B-03`). Counter urutan reset tiap hari per dosen.
7. **Moderasi oleh Operator**: Operator dapat memantau data pendaftaran masuk, mem-filter kata-kata tidak pantas, atau menghapus submission yang melanggar etika.
8. **Dashboard Dosen**:
   - **Tombol Kotak Panjang:** Tombol primer di atas antrian untuk memanggil mahasiswa nomor urut berikutnya secara berurutan.
   - **Card Antrian Mahasiswa:** Setiap mahasiswa yang menunggu ditampilkan dalam Card berisi Nama, NIM, Nomor Antrian, Perihal, Keterangan, dan tombol **"Panggil"** untuk pemanggilan selektif berdasarkan keperluan mendesak.
   - **Aksi Lanjutan:** Tombol "Panggil Ulang (Recall)", "Lewati (Skip)", dan "Selesai".
   - **Panel Log History Bimbingan:** Terletak tepat di bawah antrian aktif, menampilkan riwayat mahasiswa yang telah selesai bimbingan maupun yang dibatalkan hari ini.
9. Nomor yang dipanggil ditampilkan **real-time di Display TV Kampus** dan ter-update di layar status antrian mahasiswa.
10. **Tidak hadir saat dipanggil**: dosen panggil nomor selanjutnya, nomor yang terlewat tetap tercatat (status `tidak_hadir`), TIDAK hilang dari antrian. Configurable via `system_settings.allow_recall_no_show`.
11. **Kuota harian**: diatur oleh masing-masing dosen sendiri (opsional, nullable = unlimited). Kalau kuota tercapai, form menandai dosen tsb "Kuota Penuh" untuk hari itu.

---

## 5. Dua Jenis "Landing Page" (Penting — Jangan Tertukar)

| | Landing Page Publik | Display TV Kampus |
|---|---|---|
| Diakses dari | Device masing-masing mahasiswa (HP/laptop, dari mana saja) | Layar fisik/monitor yang di-mount di lorong/ruang kampus |
| Isi | • Daftar dosen & status ketersediaan real-time (warna badge)<br>• Lokasi dosen (gedung, ruangan, lokasi lainnya)<br>• **Daftar nama mahasiswa yang sedang aktif dalam sesi konseling/bimbingan dengan dosen** | • Daftar dosen & status ketersediaan real-time<br>• Lokasi dosen<br>• **QR code aktif hari ini** (untuk pendaftaran antrian)<br>• Papan nomor antrian yang sedang dipanggil |
| QR Code tampil? | **TIDAK ADA** | **YA (Wajib)** |
| Bisa daftar antrian dari sini? | **TIDAK BISA** | **YA** (hanya dengan scan QR di TV monitor kampus) |

Keduanya subscribe ke WebSocket yang sama untuk data status dosen & antrian real-time,
tetapi merupakan route/tampilan frontend yang berbeda.

---

## 6. Struktur Data Awal (Draft ERD)

> **ERD detail lengkap** (termasuk tipe data, constraint, index, dan business
> rules) tersedia di [`docs/erd.md`](docs/erd.md).

```
users (kredensial autentikasi login)
├─ id, email, password_hash, role (superadmin/admin/dosen/operator)
└─ is_active, created_by, created_at, updated_at

superadmin_profiles / admin_profiles / operator_profiles
├─ profil dibuat terlebih dahulu sebelum akun autentikasi (users) di-generate
├─ superadmin_profiles: id, user_id (nullable), nama_lengkap, no_telepon, foto_url
├─ admin_profiles: id, user_id (nullable), nama_lengkap, nip, fakultas_id, no_telepon, foto_url
└─ operator_profiles: id, user_id (nullable), nama_lengkap, nomor_identitas, fakultas_id, no_telepon

dosen_profiles (profil dosen, status ketersediaan & lokasi)
├─ id, user_id (nullable), nama_lengkap, nip, kode_antrian
├─ fakultas_id, prodi_id (program studi homebase dosen)
├─ gedung_id (nullable, dropdown), ruangan_id (nullable, dropdown), lokasi_lainnya (nullable, text)
├─ foto_url, status_ketersediaan (tersedia/mengajar/tidak_bersedia/pulang)
├─ status_override (boolean), is_absen_masuk (boolean)
└─ status_updated_at

jadwal_mengajar (bisa >1 slot per hari)
└─ id, dosen_id, hari, jam_mulai, jam_selesai, mata_kuliah (opsional)

jadwal_konsultasi (bisa >1 slot per hari)
├─ id, dosen_id, hari, jam_mulai, jam_selesai, kuota_harian
└─ history_perubahan (JSONB log audit histori perubahan jadwal/kuota), is_active

qr_codes (terhubung ke operator dan superadmin)
├─ id, kode_unik, generated_by_role (operator/superadmin)
├─ operator_id (nullable, FK), superadmin_id (nullable, FK)
└─ tanggal_berlaku, expired_at, status (aktif/expired)

form_pendaftaran_konsultasi (input form guest/mahasiswa sebelum nomor antrian)
├─ id, qr_code_id, dosen_id
├─ nama, nim, perihal, keterangan
└─ created_at (auto-success: submit langsung generate tiket antrian)

antrian (tiket antrian terverifikasi dari form pendaftaran)
├─ id, form_pendaftaran_id (FK unik 1:1), qr_code_id, dosen_id
├─ nomor_antrian (mis. "A-01"), urutan
├─ status (menunggu/dipanggil/selesai/tidak_hadir/dilewati/dibatalkan)
└─ tanggal, created_at, dipanggil_at, selesai_at

gedung / ruangan
└─ master data lokasi kampus untuk dropdown lokasi dosen

fakultas / program_studi
└─ struktur master data akademik kampus

activity_logs (audit trail sistem)
└─ id, user_id, aksi, target_entity, target_id, detail (JSON), ip_address, created_at

system_settings (konfigurasi runtime)
└─ id, key, value, description, updated_by, updated_at

absensi_sync_logs (log integrasi API absensi kampus)
└─ id, dosen_id, event_type, source, raw_payload, sync_status, error_message, status_before, status_after, synced_at
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
| 4 | Master Gedung & Ruangan | **Diimplementasikan** — Disediakan master `gedung` dan `ruangan` untuk dropdown lokasi fisik dosen + text field `lokasi_lainnya` | ✅ Final (Revisi Dosen) |
| 5 | Sumber status dosen | **API absensi kampus** + jadwal sebagai referensi | ✅ Final |
| 6 | Integrasi API absensi | Dua arah: polling + webhook (belum ada detail API dari kampus) | ⏳ Menunggu arahan |
| 7 | Deployment | Docker / Docker Compose (self-hosted di server kampus) | ✅ Final |
| 8 | Profil Terpisah per Role | Tabel `superadmin_profiles`, `admin_profiles`, `operator_profiles`, `dosen_profiles`. Profil dibuat terlebih dahulu, baru akun auth dibuat | ✅ Final (Revisi Dosen) |
| 9 | Kolom Prodi di Dosen | `prodi_id` ditambahkan di `dosen_profiles` sebagai relasi ke master data prodi | ✅ Final (Revisi Dosen) |
| 10 | History Jadwal Konsultasi | Kolom `history_perubahan` (JSONB) pada `jadwal_konsultasi` untuk audit trail modifikasi | ✅ Final (Revisi Dosen) |
| 11 | Form Input Mahasiswa/Guest | Tabel `form_pendaftaran_konsultasi` (nama, nim, dosen_id, perihal, keterangan). Dropdown hanya memunculkan dosen `tersedia`, `mengajar`, `tidak_bersedia` (status `pulang` di-filter). Pendaftaran selalu auto-success langsung menerbitkan antrian | ✅ Final (Revisi Dosen) |
| 12 | Generator QR Code | Tabel `qr_codes` terhubung langsung ke `operator_profiles` dan `superadmin_profiles` | ✅ Final (Revisi Dosen) |
| 13 | Auto-Cancel Antrian saat Pulang | Jika dosen ubah status jadi `pulang`, seluruh antrian menunggu otomatis `dibatalkan` | ✅ Final (Revisi Dosen) |
| 14 | UI Dashboard Dosen | Tombol kotak panjang (panggil urutan) + Card panggil selektif per mahasiswa + panel Log History bimbingan | ✅ Final (Revisi Dosen) |

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
| [`docs/prd.md`](docs/prd.md) | Product Requirement Document (PRD) — visi, personas, user stories, functional & non-functional requirements |
| [`docs/erd.md`](docs/erd.md) | ERD lengkap — 17 entitas, tipe data, constraint, index, enum, business rules |
| [`docs/flowcharts.md`](docs/flowcharts.md) | 6 flowchart alur bisnis (Mermaid) — state machine, registrasi, panggilan, QR, user management |
| [`docs/dfd.md`](docs/dfd.md) | DFD Level 0 & Level 1 — 10 proses, 8 data store, WebSocket channels |

---