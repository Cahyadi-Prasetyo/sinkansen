# ERD — Sistem Ketersediaan & Antrian Konsultasi Dosen

> Dokumen ini berisi Entity Relationship Diagram (ERD) lengkap untuk sistem
> antrian konsultasi dosen. Semua entitas, atribut, tipe data, constraint,
> dan relasi didokumentasikan di sini.

---

## Daftar Entitas

| # | Entitas | Deskripsi | Relasi Utama |
|---|---|---|---|
| 1 | `users` | Akun pengguna (superadmin, admin, dosen, operator) | Parent dari `dosen_profiles`, `qr_codes`, `activity_logs` |
| 2 | `dosen_profiles` | Profil khusus dosen (1:1 ke users) | Parent dari `jadwal_mengajar`, `jadwal_konsultasi`, `antrian`, `absensi_sync_logs` |
| 3 | `jadwal_mengajar` | Jadwal mengajar dosen per hari | Child dari `dosen_profiles` |
| 4 | `jadwal_konsultasi` | Jadwal konsultasi dosen per hari + kuota | Child dari `dosen_profiles` |
| 5 | `qr_codes` | QR code harian untuk akses antrian | Parent dari `antrian` |
| 6 | `antrian` | Data antrian konsultasi mahasiswa | Child dari `qr_codes` dan `dosen_profiles` |
| 7 | `fakultas` | Master data fakultas | Parent dari `program_studi` dan `users` |
| 8 | `program_studi` | Master data program studi | Child dari `fakultas`, parent dari `users` |
| 9 | `activity_logs` | Audit trail seluruh aksi sistem | Child dari `users` |
| 10 | `system_settings` | Konfigurasi sistem (key-value) | — |
| 11 | `absensi_sync_logs` | Log sinkronisasi API absensi kampus | Child dari `dosen_profiles` |

---

## Diagram ER (Mermaid)

```mermaid
erDiagram
    FAKULTAS ||--o{ PROGRAM_STUDI : "memiliki"
    FAKULTAS ||--o{ USERS : "scope"
    PROGRAM_STUDI ||--o{ USERS : "scope"
    
    USERS ||--o| DOSEN_PROFILES : "memiliki profil"
    USERS ||--o{ QR_CODES : "generate (operator)"
    USERS ||--o{ ACTIVITY_LOGS : "melakukan"
    
    DOSEN_PROFILES ||--o{ JADWAL_MENGAJAR : "punya jadwal"
    DOSEN_PROFILES ||--o{ JADWAL_KONSULTASI : "punya jadwal"
    DOSEN_PROFILES ||--o{ ANTRIAN : "tujuan konsultasi"
    DOSEN_PROFILES ||--o{ ABSENSI_SYNC_LOGS : "log sinkronisasi"
    
    QR_CODES ||--o{ ANTRIAN : "digunakan"
    
    USERS {
        uuid id PK
        varchar nama
        varchar email UK
        varchar password_hash
        enum role
        uuid fakultas_id FK
        uuid prodi_id FK
        boolean is_active
        uuid created_by FK
        timestamp created_at
        timestamp updated_at
    }
    
    DOSEN_PROFILES {
        uuid id PK
        uuid user_id FK-UK
        varchar nip UK
        char kode_antrian UK
        varchar foto_url
        enum status_ketersediaan
        boolean status_override
        boolean is_absen_masuk
        timestamp status_updated_at
    }
    
    JADWAL_MENGAJAR {
        uuid id PK
        uuid dosen_id FK
        enum hari
        time jam_mulai
        time jam_selesai
        varchar mata_kuliah
    }
    
    JADWAL_KONSULTASI {
        uuid id PK
        uuid dosen_id FK
        enum hari
        time jam_mulai
        time jam_selesai
        integer kuota_harian
    }
    
    QR_CODES {
        uuid id PK
        varchar kode_unik UK
        uuid generated_by FK
        date tanggal_berlaku
        timestamp expired_at
        enum status
        timestamp created_at
    }
    
    ANTRIAN {
        uuid id PK
        uuid qr_code_id FK
        uuid dosen_id FK
        varchar nomor_antrian
        integer urutan
        varchar nama_mahasiswa
        varchar nim
        text keperluan
        enum status
        timestamp created_at
        timestamp dipanggil_at
        timestamp selesai_at
        date tanggal
    }
    
    FAKULTAS {
        uuid id PK
        varchar nama
        varchar kode UK
    }
    
    PROGRAM_STUDI {
        uuid id PK
        varchar nama
        varchar kode UK
        uuid fakultas_id FK
    }
    
    ACTIVITY_LOGS {
        uuid id PK
        uuid user_id FK
        varchar aksi
        varchar target_entity
        varchar target_id
        jsonb detail
        varchar ip_address
        timestamp created_at
    }
    
    SYSTEM_SETTINGS {
        bigint id PK
        varchar key UK
        text value
        text description
        uuid updated_by FK
        timestamp updated_at
    }
    
    ABSENSI_SYNC_LOGS {
        uuid id PK
        uuid dosen_id FK
        enum event_type
        enum source
        jsonb raw_payload
        enum sync_status
        text error_message
        enum status_before
        enum status_after
        timestamp synced_at
    }
```

---

## Detail Entitas, Atribut & Constraint

### 1. `users`

Tabel utama untuk semua akun pengguna sistem. Guest (mahasiswa) **tidak memiliki akun** — mereka mengakses sistem via QR tanpa login.

| Kolom | Tipe Data | Constraint | Keterangan |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Identifier unik |
| `nama` | `VARCHAR(100)` | `NOT NULL` | Nama lengkap pengguna |
| `email` | `VARCHAR(150)` | `NOT NULL`, `UNIQUE` | Email untuk login |
| `password_hash` | `VARCHAR(255)` | `NOT NULL` | Hash bcrypt password |
| `role` | `ENUM('superadmin','admin','dosen','operator')` | `NOT NULL` | Role pengguna dalam sistem |
| `fakultas_id` | `UUID` | `FK → fakultas(id)`, `NULLABLE` | Scope fakultas (wajib untuk admin/dosen/operator) |
| `prodi_id` | `UUID` | `FK → program_studi(id)`, `NULLABLE` | Scope prodi (opsional) |
| `is_active` | `BOOLEAN` | `NOT NULL`, `DEFAULT true` | Soft disable — false = akun nonaktif |
| `created_by` | `UUID` | `FK → users(id)`, `NULLABLE` | Self-referencing: siapa yang membuat akun ini. NULL untuk superadmin pertama (seed) |
| `created_at` | `TIMESTAMP` | `NOT NULL`, `DEFAULT NOW()` | |
| `updated_at` | `TIMESTAMP` | `NOT NULL`, `DEFAULT NOW()` | Auto-update via trigger |

**Index:**
- `idx_users_email` — UNIQUE index pada `email`
- `idx_users_role` — Index pada `role` (untuk filter dashboard)
- `idx_users_fakultas` — Index pada `fakultas_id` (untuk scope admin)

**Business Rules:**
- Superadmin bisa membuat Admin, Dosen, Operator (semua fakultas)
- Admin hanya bisa membuat Dosen dan Operator **di fakultas yang sama**
- `fakultas_id` wajib diisi untuk role selain superadmin

---

### 2. `dosen_profiles`

Profil tambahan khusus untuk user dengan `role = 'dosen'`. Relasi 1:1 dengan `users`.

| Kolom | Tipe Data | Constraint | Keterangan |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | |
| `user_id` | `UUID` | `FK → users(id)`, `NOT NULL`, `UNIQUE` | Relasi 1:1 ke users |
| `nip` | `VARCHAR(30)` | `NOT NULL`, `UNIQUE` | Nomor Induk Pegawai |
| `kode_antrian` | `CHAR(3)` | `NOT NULL`, `UNIQUE` | Kode unik untuk format nomor antrian, misal `A`, `B`, `AA` |
| `foto_url` | `VARCHAR(500)` | `NULLABLE` | URL foto profil dosen |
| `status_ketersediaan` | `ENUM('tersedia','mengajar','tidak_bersedia','pulang')` | `NOT NULL`, `DEFAULT 'pulang'` | Status real-time dosen |
| `status_override` | `BOOLEAN` | `NOT NULL`, `DEFAULT false` | True = status saat ini adalah override manual |
| `is_absen_masuk` | `BOOLEAN` | `NOT NULL`, `DEFAULT false` | True = dosen sudah absen masuk hari ini (dari API kampus) |
| `status_updated_at` | `TIMESTAMP` | `NOT NULL`, `DEFAULT NOW()` | Terakhir kali status berubah |

**Index:**
- `idx_dosen_user_id` — UNIQUE index pada `user_id`
- `idx_dosen_nip` — UNIQUE index pada `nip`
- `idx_dosen_kode_antrian` — UNIQUE index pada `kode_antrian`
- `idx_dosen_status` — Index pada `status_ketersediaan` (untuk filter landing page)

**Status State Machine:**
| Trigger | Kondisi | Status Hasil |
|---|---|---|
| API absensi: masuk | Jam mengajar aktif | `mengajar` |
| API absensi: masuk | Jam konsultasi aktif | `tersedia` |
| API absensi: masuk | Tidak ada jadwal | `tidak_bersedia` |
| API absensi: pulang | — | `pulang` |
| Scheduler tick | Pergantian slot jadwal + `is_absen_masuk = true` | Re-evaluate berdasarkan jadwal |
| Override manual | Dosen ubah sendiri | Sesuai input dosen |

---

### 3. `jadwal_mengajar`

Jadwal mengajar mingguan dosen. Digunakan sebagai **referensi** untuk menentukan status dosen saat sudah absen masuk.

| Kolom | Tipe Data | Constraint | Keterangan |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | |
| `dosen_id` | `UUID` | `FK → dosen_profiles(id)`, `NOT NULL` | |
| `hari` | `ENUM('senin','selasa','rabu','kamis','jumat','sabtu','minggu')` | `NOT NULL` | |
| `jam_mulai` | `TIME` | `NOT NULL` | |
| `jam_selesai` | `TIME` | `NOT NULL` | Harus > `jam_mulai` |
| `mata_kuliah` | `VARCHAR(100)` | `NOT NULL` | Nama mata kuliah |

**Index:**
- `idx_jadwal_mengajar_dosen_hari` — Composite index pada `(dosen_id, hari)` (untuk query scheduler)

**Constraint:**
- `CHECK (jam_selesai > jam_mulai)`
- Tidak boleh overlap: jadwal mengajar untuk dosen yang sama di hari yang sama tidak boleh tumpang tindih waktunya

---

### 4. `jadwal_konsultasi`

Jadwal konsultasi mingguan dosen. Menentukan kapan dosen statusnya `tersedia` dan mengatur kuota harian.

| Kolom | Tipe Data | Constraint | Keterangan |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | |
| `dosen_id` | `UUID` | `FK → dosen_profiles(id)`, `NOT NULL` | |
| `hari` | `ENUM('senin','selasa','rabu','kamis','jumat','sabtu','minggu')` | `NOT NULL` | |
| `jam_mulai` | `TIME` | `NOT NULL` | |
| `jam_selesai` | `TIME` | `NOT NULL` | Harus > `jam_mulai` |
| `kuota_harian` | `INTEGER` | `NULLABLE` | NULL = unlimited. Jika diisi, form antrian akan blokir jika kuota tercapai |

**Index:**
- `idx_jadwal_konsultasi_dosen_hari` — Composite index pada `(dosen_id, hari)`

**Constraint:**
- `CHECK (jam_selesai > jam_mulai)`
- `CHECK (kuota_harian IS NULL OR kuota_harian > 0)`

---

### 5. `qr_codes`

QR code harian yang di-generate oleh operator. Hanya **1 QR aktif per hari**. QR hanya ditampilkan di Display TV Kampus, **TIDAK** di landing page publik.

| Kolom | Tipe Data | Constraint | Keterangan |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | |
| `kode_unik` | `VARCHAR(64)` | `NOT NULL`, `UNIQUE` | Random string untuk URL QR |
| `generated_by` | `UUID` | `FK → users(id)`, `NOT NULL` | Operator yang generate |
| `tanggal_berlaku` | `DATE` | `NOT NULL` | Tanggal aktif QR |
| `expired_at` | `TIMESTAMP` | `NOT NULL` | Waktu expired (jam configurable via `system_settings`) |
| `status` | `ENUM('aktif','expired')` | `NOT NULL`, `DEFAULT 'aktif'` | |
| `created_at` | `TIMESTAMP` | `NOT NULL`, `DEFAULT NOW()` | |

**Index:**
- `idx_qr_kode_unik` — UNIQUE index pada `kode_unik`
- `idx_qr_tanggal_status` — Partial UNIQUE index: `UNIQUE (tanggal_berlaku) WHERE status = 'aktif'` — memastikan **hanya 1 QR aktif per hari**

**Business Rules:**
- Operator klik "Generate QR Hari Ini" → sistem cek apakah sudah ada QR aktif hari ini
  - Sudah ada → tampilkan yang lama
  - Belum ada → generate baru
- Scheduler auto-expire QR di jam yang dikonfigurasi (`system_settings.qr_expire_hour`)

---

### 6. `antrian`

Data antrian konsultasi mahasiswa. Nomor antrian **per dosen** (bukan global), reset tiap hari.

| Kolom | Tipe Data | Constraint | Keterangan |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | |
| `qr_code_id` | `UUID` | `FK → qr_codes(id)`, `NOT NULL` | QR yang digunakan saat daftar |
| `dosen_id` | `UUID` | `FK → dosen_profiles(id)`, `NOT NULL` | Dosen tujuan konsultasi |
| `nomor_antrian` | `VARCHAR(10)` | `NOT NULL` | Format: `[KODE_DOSEN]-[URUTAN]`, misal `A-01`, `B-03` |
| `urutan` | `INTEGER` | `NOT NULL` | Nomor urut (reset tiap hari per dosen) |
| `nama_mahasiswa` | `VARCHAR(100)` | `NOT NULL` | |
| `nim` | `VARCHAR(20)` | `NOT NULL` | |
| `keperluan` | `TEXT` | `NULLABLE` | Keperluan konsultasi (opsional) |
| `status` | `ENUM('menunggu','dipanggil','selesai','tidak_hadir','dilewati')` | `NOT NULL`, `DEFAULT 'menunggu'` | |
| `created_at` | `TIMESTAMP` | `NOT NULL`, `DEFAULT NOW()` | Waktu daftar |
| `dipanggil_at` | `TIMESTAMP` | `NULLABLE` | Waktu pertama kali dipanggil |
| `selesai_at` | `TIMESTAMP` | `NULLABLE` | Waktu selesai konsultasi |
| `tanggal` | `DATE` | `NOT NULL`, `DEFAULT CURRENT_DATE` | Denormalized dari qr_codes untuk partisi/query cepat |

**Index:**
- `idx_antrian_dosen_tanggal` — Composite index pada `(dosen_id, tanggal)` (query antrian hari ini)
- `idx_antrian_dosen_tanggal_status` — Composite index pada `(dosen_id, tanggal, status)` (filter menunggu)
- `idx_antrian_dosen_tanggal_urutan` — UNIQUE index pada `(dosen_id, tanggal, urutan)` (mencegah duplikat nomor)

**Business Rules:**
- `urutan` di-generate atomik: `MAX(urutan) + 1 WHERE dosen_id = X AND tanggal = today`
- Dosen yang bisa dipilih: semua status **KECUALI** `pulang`
- Jika dosen punya `kuota_harian` dan jumlah antrian hari ini ≥ kuota → form menandai "Kuota Penuh"
- Nomor `tidak_hadir` bisa dipanggil ulang manual (configurable via `system_settings.allow_recall_no_show`)

---

### 7. `fakultas`

Master data fakultas.

| Kolom | Tipe Data | Constraint | Keterangan |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | |
| `nama` | `VARCHAR(100)` | `NOT NULL` | Nama fakultas |
| `kode` | `VARCHAR(10)` | `NOT NULL`, `UNIQUE` | Kode singkat fakultas |

---

### 8. `program_studi`

Master data program studi. Child dari `fakultas`.

| Kolom | Tipe Data | Constraint | Keterangan |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | |
| `nama` | `VARCHAR(100)` | `NOT NULL` | Nama program studi |
| `kode` | `VARCHAR(10)` | `NOT NULL`, `UNIQUE` | Kode singkat prodi |
| `fakultas_id` | `UUID` | `FK → fakultas(id)`, `NOT NULL` | |

**Index:**
- `idx_prodi_fakultas` — Index pada `fakultas_id`

---

### 9. `activity_logs`

Audit trail untuk seluruh aksi pengguna di sistem. Digunakan oleh Superadmin dan Admin untuk monitoring.

| Kolom | Tipe Data | Constraint | Keterangan |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | |
| `user_id` | `UUID` | `FK → users(id)`, `NULLABLE` | NULL jika aksi dilakukan oleh sistem (scheduler, API sync) |
| `aksi` | `VARCHAR(50)` | `NOT NULL` | Kode aksi, misal `CREATE_USER`, `UPDATE_STATUS`, `GENERATE_QR`, `CALL_QUEUE` |
| `target_entity` | `VARCHAR(50)` | `NOT NULL` | Nama tabel target |
| `target_id` | `VARCHAR(50)` | `NOT NULL` | ID record target |
| `detail` | `JSONB` | `NULLABLE` | Detail perubahan (before/after state) |
| `ip_address` | `VARCHAR(45)` | `NULLABLE` | IPv4/IPv6 address |
| `created_at` | `TIMESTAMP` | `NOT NULL`, `DEFAULT NOW()` | |

**Index:**
- `idx_activity_user` — Index pada `user_id`
- `idx_activity_created` — Index pada `created_at` (untuk filter tanggal)
- `idx_activity_target` — Composite index pada `(target_entity, target_id)` (untuk lookup per entity)

**Daftar Aksi:**
| Aksi | Deskripsi |
|---|---|
| `CREATE_USER` | Pembuatan akun baru |
| `UPDATE_USER` | Perubahan data akun |
| `DEACTIVATE_USER` | Nonaktifkan akun |
| `UPDATE_STATUS` | Perubahan status ketersediaan dosen |
| `OVERRIDE_STATUS` | Override manual status dosen |
| `GENERATE_QR` | Generate QR code harian |
| `CREATE_JADWAL` | Pembuatan jadwal baru |
| `UPDATE_JADWAL` | Perubahan jadwal |
| `DELETE_JADWAL` | Hapus jadwal |
| `REGISTER_QUEUE` | Pendaftaran antrian oleh mahasiswa |
| `CALL_QUEUE` | Pemanggilan nomor antrian |
| `RECALL_QUEUE` | Pemanggilan ulang nomor antrian |
| `SKIP_QUEUE` | Lewati nomor antrian |
| `COMPLETE_QUEUE` | Selesai konsultasi |
| `SYNC_ABSENSI` | Sinkronisasi data absensi dari API kampus |
| `EXPIRE_QR` | Auto-expire QR oleh scheduler |
| `UPDATE_SETTINGS` | Perubahan konfigurasi sistem |

---

### 10. `system_settings`

Tabel key-value untuk konfigurasi sistem yang bisa diubah oleh Superadmin tanpa deploy ulang.

| Kolom | Tipe Data | Constraint | Keterangan |
|---|---|---|---|
| `id` | `BIGINT` | `PRIMARY KEY`, `GENERATED ALWAYS AS IDENTITY` | |
| `key` | `VARCHAR(50)` | `NOT NULL`, `UNIQUE` | Key konfigurasi |
| `value` | `TEXT` | `NOT NULL` | Value konfigurasi |
| `description` | `TEXT` | `NULLABLE` | Deskripsi setting |
| `updated_by` | `UUID` | `FK → users(id)`, `NULLABLE` | Terakhir diubah oleh siapa |
| `updated_at` | `TIMESTAMP` | `NOT NULL`, `DEFAULT NOW()` | |

**Default Seeds:**
| Key | Default Value | Deskripsi |
|---|---|---|
| `qr_expire_hour` | `23:59` | Jam expire QR harian (format HH:MM) |
| `allow_recall_no_show` | `true` | Apakah nomor tidak-hadir bisa dipanggil ulang |
| `absensi_api_url` | *(kosong)* | URL endpoint API absensi kampus |
| `absensi_api_token` | *(kosong)* | Token autentikasi API absensi |
| `absensi_sync_interval_minutes` | `5` | Interval polling API absensi (menit) |

---

### 11. `absensi_sync_logs`

Log khusus untuk sinkronisasi API absensi kampus. **Terpisah** dari `activity_logs` karena volume data tinggi dan menyimpan raw payload dari API eksternal.

| Kolom | Tipe Data | Constraint | Keterangan |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | |
| `dosen_id` | `UUID` | `FK → dosen_profiles(id)`, `NULLABLE` | NULL jika sync gagal sebelum identifikasi dosen |
| `event_type` | `ENUM('masuk','pulang')` | `NOT NULL` | Jenis event absensi |
| `source` | `ENUM('polling','webhook')` | `NOT NULL` | Dari mana event ini datang |
| `raw_payload` | `JSONB` | `NOT NULL` | Response mentah dari API kampus (untuk debugging) |
| `sync_status` | `ENUM('success','failed','ignored')` | `NOT NULL` | Hasil sinkronisasi |
| `error_message` | `TEXT` | `NULLABLE` | Detail error jika `sync_status = 'failed'` |
| `status_before` | `ENUM('tersedia','mengajar','tidak_bersedia','pulang')` | `NULLABLE` | Status dosen sebelum sync (NULL jika gagal) |
| `status_after` | `ENUM('tersedia','mengajar','tidak_bersedia','pulang')` | `NULLABLE` | Status dosen setelah sync (NULL jika gagal) |
| `synced_at` | `TIMESTAMP` | `NOT NULL`, `DEFAULT NOW()` | Waktu sinkronisasi dieksekusi |

**Index:**
- `idx_sync_dosen` — Index pada `dosen_id`
- `idx_sync_status` — Index pada `sync_status` (untuk monitor error)
- `idx_sync_time` — Index pada `synced_at` (untuk filter tanggal)

**Kapan `sync_status = 'ignored'`:**
- Jika API mengirim event yang sama berulang (duplikat)
- Jika status dosen sudah sesuai dengan event (tidak berubah)

---

## Ringkasan Relasi

| Parent | Child | Tipe Relasi | FK Column | On Delete |
|---|---|---|---|---|
| `fakultas` | `program_studi` | 1:N | `fakultas_id` | RESTRICT |
| `fakultas` | `users` | 1:N | `fakultas_id` | SET NULL |
| `program_studi` | `users` | 1:N | `prodi_id` | SET NULL |
| `users` | `dosen_profiles` | 1:1 | `user_id` | CASCADE |
| `users` | `qr_codes` | 1:N | `generated_by` | RESTRICT |
| `users` | `activity_logs` | 1:N | `user_id` | SET NULL |
| `users` | `users` (self) | 1:N | `created_by` | SET NULL |
| `dosen_profiles` | `jadwal_mengajar` | 1:N | `dosen_id` | CASCADE |
| `dosen_profiles` | `jadwal_konsultasi` | 1:N | `dosen_id` | CASCADE |
| `dosen_profiles` | `antrian` | 1:N | `dosen_id` | RESTRICT |
| `dosen_profiles` | `absensi_sync_logs` | 1:N | `dosen_id` | SET NULL |
| `qr_codes` | `antrian` | 1:N | `qr_code_id` | RESTRICT |

---

## Enum Definitions

```sql
-- Role pengguna
CREATE TYPE user_role AS ENUM ('superadmin', 'admin', 'dosen', 'operator');

-- Status ketersediaan dosen
CREATE TYPE status_ketersediaan AS ENUM ('tersedia', 'mengajar', 'tidak_bersedia', 'pulang');

-- Hari dalam seminggu
CREATE TYPE hari_enum AS ENUM ('senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu');

-- Status QR code
CREATE TYPE qr_status AS ENUM ('aktif', 'expired');

-- Status antrian
CREATE TYPE antrian_status AS ENUM ('menunggu', 'dipanggil', 'selesai', 'tidak_hadir', 'dilewati');

-- Event type absensi
CREATE TYPE absensi_event AS ENUM ('masuk', 'pulang');

-- Source sinkronisasi absensi
CREATE TYPE sync_source AS ENUM ('polling', 'webhook');

-- Status sinkronisasi
CREATE TYPE sync_status AS ENUM ('success', 'failed', 'ignored');
```
