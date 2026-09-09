# DFD — Sistem Ketersediaan & Antrian Konsultasi Dosen

> Dokumen ini berisi Data Flow Diagram (DFD) Level 0 (Context Diagram)
> dan Level 1 untuk sistem antrian konsultasi dosen.

---

## DFD Level 0 — Context Diagram

Menunjukkan batasan sistem dan interaksi dengan **5 entitas eksternal**.

```mermaid
flowchart LR
    MHS["👨‍🎓 Mahasiswa\n(Guest — tanpa login)"]
    DSN["👨‍🏫 Dosen"]
    OPR["🧑‍💼 Operator"]
    ADM["🔧 Admin /\nSuperadmin"]
    API["🏫 API Absensi\nKampus"]
    
    MHS -->|"scan QR,\nisi form antrian"| SYS(["🖥️ SISTEM KETERSEDIAAN\n& ANTRIAN KONSULTASI\nDOSEN"])
    SYS -->|"nomor antrian,\nstatus dosen\n(real-time)"| MHS
    
    DSN -->|"input jadwal,\noverride status,\npanggil antrian"| SYS
    SYS -->|"panel antrian,\nhistory log,\nstatus terkini"| DSN
    
    OPR -->|"generate QR code"| SYS
    SYS -->|"QR code aktif,\nstatus QR"| OPR
    
    ADM -->|"kelola user,\nmaster data,\nsystem settings"| SYS
    SYS -->|"laporan, analitik,\naudit log"| ADM
    
    API -->|"data absensi dosen\n(masuk / pulang)"| SYS
    SYS -->|"polling request /\nwebhook acknowledgment"| API
```

### Entitas Eksternal

| # | Entitas | Deskripsi | Autentikasi |
|---|---|---|---|
| 1 | **Mahasiswa (Guest)** | Pengguna akhir yang mendaftar antrian konsultasi | Tanpa login — akses via QR |
| 2 | **Dosen** | Pengajar yang mengelola status & antrian konsultasinya | Login (email + password) |
| 3 | **Operator** | Staf yang mengelola QR code harian | Login (email + password) |
| 4 | **Admin / Superadmin** | Pengelola sistem dan master data | Login (email + password) |
| 5 | **API Absensi Kampus** | Sistem eksternal kampus yang menyediakan data absensi dosen | API token |

---

## DFD Level 1

Dekomposisi sistem menjadi **10 proses utama** dengan data store dan aliran data yang jelas.

```mermaid
flowchart TD
    %% External Entities
    MHS["👨‍🎓 Mahasiswa"]
    DSN["👨‍🏫 Dosen"]
    OPR["🧑‍💼 Operator"]
    ADM["🔧 Admin/Superadmin"]
    API_ABS["🏫 API Absensi\nKampus"]
    
    %% Data Stores
    DS_USR[("D1\nusers +\ndosen_profiles")]
    DS_JDW[("D2\njadwal_mengajar +\njadwal_konsultasi")]
    DS_QR[("D3\nqr_codes")]
    DS_ANT[("D4\nantrian")]
    DS_LOG[("D5\nactivity_logs")]
    DS_SET[("D6\nsystem_settings")]
    DS_CACHE[("D7\nRedis Cache\n+ Pub/Sub")]
    DS_SYNC[("D8\nabsensi_sync_logs")]
    
    %% Process 1.0: Manajemen User
    ADM -->|"data user baru /\nupdate / nonaktifkan"| P1["1.0\nManajemen\nUser"]
    P1 -->|"simpan/update\nuser + profil"| DS_USR
    P1 -->|"log aksi"| DS_LOG
    DS_USR -->|"data user existing"| P1
    
    %% Process 2.0: Manajemen Jadwal
    DSN -->|"input/update\njadwal"| P2["2.0\nManajemen\nJadwal"]
    P2 -->|"simpan jadwal"| DS_JDW
    P2 -->|"log aksi"| DS_LOG
    
    %% Process 3.0: Sinkronisasi Absensi
    API_ABS -->|"event absensi\n(masuk/pulang)"| P3["3.0\nSinkronisasi\nAbsensi"]
    P3 -->|"polling request"| API_ABS
    DS_SET -->|"API URL,\ntoken, interval"| P3
    P3 -->|"update\nis_absen_masuk"| DS_USR
    P3 -->|"log sync"| DS_SYNC
    P3 -->|"trigger evaluasi"| P4
    
    %% Process 4.0: Evaluasi Status Dosen
    P4["4.0\nEvaluasi\nStatus Dosen"]
    DS_JDW -->|"jadwal aktif\n(hari + jam)"| P4
    DS_USR -->|"data dosen\n+ is_absen_masuk"| P4
    P4 -->|"update status\nketersediaan"| DS_USR
    P4 -->|"publish event\nstatus berubah"| DS_CACHE
    P4 -->|"log aksi"| DS_LOG
    
    %% Process 5.0: Override Status Manual
    DSN -->|"override\nstatus manual"| P5["5.0\nOverride\nStatus Manual"]
    P5 -->|"update status\n+ override flag"| DS_USR
    P5 -->|"publish event\nstatus berubah"| DS_CACHE
    P5 -->|"log aksi"| DS_LOG
    
    %% Process 6.0: Generate QR
    OPR -->|"request\ngenerate QR"| P6["6.0\nGenerate\nQR Code"]
    DS_QR -->|"cek QR existing\nhari ini"| P6
    P6 -->|"simpan QR baru /\nreturn existing"| DS_QR
    P6 -->|"log aksi"| DS_LOG
    P6 -->|"QR code aktif"| OPR
    DS_SET -->|"jam expire QR"| P6
    
    %% Process 7.0: Registrasi Antrian
    MHS -->|"scan QR +\nisi form antrian"| P7["7.0\nRegistrasi\nAntrian"]
    DS_QR -->|"validasi\nQR aktif"| P7
    DS_USR -->|"daftar dosen\n+ status + kuota"| P7
    DS_JDW -->|"kuota harian"| P7
    DS_ANT -->|"hitung urutan\nexisting"| P7
    P7 -->|"simpan antrian\nbaru"| DS_ANT
    P7 -->|"nomor antrian"| MHS
    P7 -->|"log aksi"| DS_LOG
    P7 -->|"publish event\nantrian baru"| DS_CACHE
    
    %% Process 8.0: Panggilan Antrian
    DSN -->|"panggil / lewati /\nselesai / panggil ulang"| P8["8.0\nPanggilan\nAntrian"]
    DS_ANT -->|"antrian\nmenunggu"| P8
    P8 -->|"update status\nantrian"| DS_ANT
    P8 -->|"publish event\nnomor dipanggil"| DS_CACHE
    P8 -->|"log aksi"| DS_LOG
    
    %% Process 9.0: Broadcast Real-time
    DS_CACHE -->|"subscribe\nevents"| P9["9.0\nBroadcast\nReal-time"]
    P9 -->|"WebSocket:\nstatus dosen +\nnomor antrian\ndipanggil"| MHS
    P9 -->|"WebSocket:\nantrian update"| DSN
    
    %% Process 10.0: Audit Trail & Laporan
    DS_LOG -->|"query log"| P10["10.0\nAudit Trail\n& Laporan"]
    DS_ANT -->|"query antrian\nhistoris"| P10
    DS_SYNC -->|"query sync\nlogs"| P10
    P10 -->|"laporan,\nanalitik,\naudit log"| ADM
    P10 -->|"history\nkonsultasi"| DSN
```

---

## Detail Proses Level 1

### Proses 1.0 — Manajemen User

| Aspek | Detail |
|---|---|
| **Input** | Data user baru (nama, email, password, role, fakultas, prodi). Untuk dosen: NIP, kode_antrian, foto |
| **Output** | User tersimpan. Untuk dosen: profil dosen tersimpan |
| **Data Store** | `D1: users + dosen_profiles` (read/write), `D5: activity_logs` (write) |
| **Logic** | Validasi scope admin (hanya fakultas sendiri). Superadmin bisa semua fakultas. Generate password hash. Simpan activity log |

---

### Proses 2.0 — Manajemen Jadwal

| Aspek | Detail |
|---|---|
| **Input** | Data jadwal dari dosen (hari, jam mulai, jam selesai, mata kuliah/kuota) |
| **Output** | Jadwal tersimpan |
| **Data Store** | `D2: jadwal_mengajar + jadwal_konsultasi` (read/write), `D5: activity_logs` (write) |
| **Logic** | Validasi tidak overlap. Validasi `jam_selesai > jam_mulai`. Validasi `kuota_harian > 0` jika diisi |

---

### Proses 3.0 — Sinkronisasi Absensi

| Aspek | Detail |
|---|---|
| **Input** | Event absensi dari API kampus (masuk/pulang), konfigurasi API dari `system_settings` |
| **Output** | Flag `is_absen_masuk` updated, trigger evaluasi status |
| **Data Store** | `D1: dosen_profiles` (write), `D6: system_settings` (read), `D8: absensi_sync_logs` (write) |
| **Logic** | Dua mode: polling (tiap N menit) dan webhook (event-driven). Mapping NIP dosen dari API ke dosen_profiles. Log setiap sync (success/failed/ignored) |

**Aliran detail:**
```
API kampus → raw payload
  → Parse & identifikasi dosen (by NIP)
    → Dosen ditemukan?
      → Ya: update is_absen_masuk → trigger P4.0 (Evaluasi Status)
      → Tidak: log sebagai 'ignored' atau 'failed'
```

---

### Proses 4.0 — Evaluasi Status Dosen

| Aspek | Detail |
|---|---|
| **Input** | Trigger dari P3.0 (sinkronisasi absensi) atau scheduler periodik |
| **Output** | Status ketersediaan dosen updated, WebSocket event broadcast |
| **Data Store** | `D1: dosen_profiles` (read/write), `D2: jadwal` (read), `D7: Redis` (publish), `D5: activity_logs` (write) |
| **Logic** | Evaluasi status berdasarkan kombinasi `is_absen_masuk` + jadwal aktif saat ini. Clear `status_override` saat dipicu oleh pergantian slot jadwal atau event absensi baru |

**Logika evaluasi:**
```
IF is_absen_masuk = false → Status = PULANG
IF is_absen_masuk = true:
  IF ada jadwal_mengajar aktif → Status = MENGAJAR
  ELSE IF ada jadwal_konsultasi aktif → Status = TERSEDIA
  ELSE → Status = TIDAK BERSEDIA
```

---

### Proses 5.0 — Override Status Manual

| Aspek | Detail |
|---|---|
| **Input** | Input manual dari dosen (status baru) |
| **Output** | Status updated, WebSocket event broadcast |
| **Data Store** | `D1: dosen_profiles` (write), `D7: Redis` (publish), `D5: activity_logs` (write) |
| **Logic** | Set `status_ketersediaan` = input dosen. Set `status_override = true`. Tidak mengubah `is_absen_masuk`. Override berlaku sampai trigger berikutnya (scheduler tick atau event absensi) |

---

### Proses 6.0 — Generate QR Code

| Aspek | Detail |
|---|---|
| **Input** | Request dari operator |
| **Output** | QR code (baru atau existing) |
| **Data Store** | `D3: qr_codes` (read/write), `D5: activity_logs` (write), `D6: system_settings` (read) |
| **Logic** | Cek apakah QR aktif hari ini sudah ada → jika ya, return existing. Jika belum, generate `kode_unik` random, set `expired_at` dari `system_settings.qr_expire_hour` |

---

### Proses 7.0 — Registrasi Antrian

| Aspek | Detail |
|---|---|
| **Input** | Scan QR + form (nama, NIM, dosen tujuan, keperluan) |
| **Output** | Nomor antrian |
| **Data Store** | `D3: qr_codes` (read), `D1: dosen_profiles` (read), `D2: jadwal_konsultasi` (read), `D4: antrian` (read/write), `D5: activity_logs` (write), `D7: Redis` (publish) |
| **Logic** | Validasi QR aktif. Filter dosen ≠ Pulang. Cek kuota. Generate nomor atomik. Broadcast antrian baru via WS |

---

### Proses 8.0 — Panggilan Antrian

| Aspek | Detail |
|---|---|
| **Input** | Aksi dosen: panggil selanjutnya, panggil ulang, lewati, selesai |
| **Output** | Status antrian updated, nomor dipanggil di Display TV |
| **Data Store** | `D4: antrian` (read/write), `D7: Redis` (publish), `D5: activity_logs` (write) |
| **Logic** | Panggil: ambil `menunggu` urutan terkecil → `dipanggil`. Lewati: `dipanggil` → `tidak_hadir`. Selesai: `dipanggil` → `selesai`. Panggil ulang: `tidak_hadir` → `dipanggil` (configurable) |

---

### Proses 9.0 — Broadcast Real-time

| Aspek | Detail |
|---|---|
| **Input** | Events dari Redis pub/sub |
| **Output** | WebSocket messages ke semua client yang subscribe |
| **Data Store** | `D7: Redis Cache + Pub/Sub` (subscribe) |
| **Logic** | Subscribe ke channel Redis. Kirim event ke WebSocket clients berdasarkan tipe event (status dosen, nomor antrian dipanggil, antrian baru) |

**WebSocket Channels:**
| Channel | Subscribers | Event |
|---|---|---|
| `dosen:status` | Landing page, Display TV, Panel dosen | Status dosen berubah |
| `antrian:called` | Display TV | Nomor antrian dipanggil |
| `antrian:new` | Panel dosen | Antrian baru masuk |
| `antrian:update` | Panel dosen | Status antrian berubah |

---

### Proses 10.0 — Audit Trail & Laporan

| Aspek | Detail |
|---|---|
| **Input** | Query dari admin/superadmin (filter: tanggal, user, aksi) |
| **Output** | Laporan, analitik, audit log |
| **Data Store** | `D5: activity_logs` (read), `D4: antrian` (read), `D8: absensi_sync_logs` (read) |
| **Logic** | Superadmin: lihat semua log. Admin: hanya log di scope fakultas. Dosen: history konsultasi sendiri (filter tanggal, mahasiswa, status) |

---

## Data Store Summary

| # | Data Store | Entitas DB | Diakses oleh Proses |
|---|---|---|---|
| D1 | `users + dosen_profiles` | `users`, `dosen_profiles` | P1.0, P3.0, P4.0, P5.0, P7.0 |
| D2 | `jadwal_mengajar + jadwal_konsultasi` | `jadwal_mengajar`, `jadwal_konsultasi` | P2.0, P4.0, P7.0 |
| D3 | `qr_codes` | `qr_codes` | P6.0, P7.0 |
| D4 | `antrian` | `antrian` | P7.0, P8.0, P10.0 |
| D5 | `activity_logs` | `activity_logs` | P1.0–P8.0 (write), P10.0 (read) |
| D6 | `system_settings` | `system_settings` | P3.0, P6.0 |
| D7 | `Redis Cache + Pub/Sub` | *(in-memory)* | P4.0, P5.0, P7.0, P8.0 (publish), P9.0 (subscribe) |
| D8 | `absensi_sync_logs` | `absensi_sync_logs` | P3.0 (write), P10.0 (read) |
