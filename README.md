# 🏫 Sinkansen — Sistem Ketersediaan & Antrian Konsultasi Dosen

> Aplikasi web mobile-friendly untuk memantau ketersediaan dosen secara real-time dan mengelola antrian konsultasi berbasis QR code.

---

## 📋 Tentang Proyek

**Sinkansen** adalah sistem antrian konsultasi dosen-mahasiswa yang terinspirasi dari sistem antrian bank/rumah sakit, dirancang khusus untuk lingkungan kampus.

### Fitur Utama

- 🟢 **Status Real-time** — Pantau ketersediaan dosen secara live (Tersedia / Mengajar / Tidak Bersedia / Pulang)
- 📱 **QR Code Antrian** — Mahasiswa scan QR di TV kampus untuk mendaftar konsultasi
- 📺 **Display TV Kampus** — Papan informasi real-time: status dosen + nomor antrian yang dipanggil
- 🔗 **Integrasi API Absensi** — Status dosen otomatis berdasarkan data absensi kampus
- ⚡ **WebSocket End-to-End** — Semua update live tanpa refresh manual

### Cara Kerja

```
Dosen absen masuk (API kampus)
  → Sistem cek jadwal → Set status otomatis
    → Mahasiswa lihat status di Landing Page / TV
      → Scan QR di TV → Daftar antrian
        → Dosen panggil nomor → Tampil di TV
```

---

## 👥 Role Pengguna

| Role | Akses |
|---|---|
| **Superadmin** | Kelola seluruh sistem, master data, settings, audit log global |
| **Admin** | Kelola dosen & operator di fakultas sendiri |
| **Operator** | Generate QR code harian |
| **Dosen** | Input jadwal, override status, kelola antrian konsultasi |
| **Guest (Mahasiswa)** | Lihat status dosen, daftar antrian via QR (tanpa login) |

---

## 🏗️ Arsitektur

```
Frontend (Web App + Landing Page + Display TV)
    │
    │ HTTPS (REST API) + WSS (WebSocket)
    │
Backend API Server + WS Server
    │
    ├── PostgreSQL (data utama)
    ├── Redis (pub/sub + cache)
    ├── Scheduler (evaluasi status + expire QR)
    └── Attendance Sync Service (integrasi API absensi kampus)
```

**Deployment:** Docker / Docker Compose — self-hosted di server kampus.

---

## 📁 Struktur Proyek

```
sinkansen/
├── PROJECT_BRIEF.md          # Source of truth — konteks & aturan bisnis
├── README.md                 # Dokumen ini
└── docs/
    ├── erd.md                # ERD detail (11 entitas, constraint, index)
    ├── flowcharts.md         # 6 flowchart alur bisnis (Mermaid)
    └── dfd.md                # DFD Level 0 & Level 1
```

---

## 📖 Dokumentasi

| Dokumen | Deskripsi |
|---|---|
| [PROJECT_BRIEF.md](PROJECT_BRIEF.md) | Source of truth — konsep, role, aturan bisnis, arsitektur |
| [docs/erd.md](docs/erd.md) | ERD lengkap — 11 entitas, tipe data, constraint, index, enum |
| [docs/flowcharts.md](docs/flowcharts.md) | 6 flowchart — state machine, registrasi, panggilan, QR, user management |
| [docs/dfd.md](docs/dfd.md) | DFD Level 0 & 1 — 10 proses, 8 data store, WebSocket channels |

---

## 🚧 Status Proyek

Proyek saat ini berada di **fase desain**. Dokumen desain (ERD, Flowchart, DFD) sudah selesai. Tahap selanjutnya:

- [ ] Wireframe / UI flow
- [ ] Penentuan tech stack
- [ ] Roadmap development (MVP vs fitur lanjutan)
- [ ] Scaffolding project
- [ ] Development

---

## 📄 Lisensi

*Belum ditentukan.*
