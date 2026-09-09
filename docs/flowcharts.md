# Flowcharts — Sistem Ketersediaan & Antrian Konsultasi Dosen

> Dokumen ini berisi semua flowchart alur bisnis utama dalam sistem,
> divisualisasikan menggunakan diagram Mermaid.

---

## Daftar Flowchart

| # | Flowchart | Deskripsi |
|---|---|---|
| 1 | State Machine Status Dosen | Logika penentuan status dosen (API absensi + jadwal + override) |
| 2 | Scheduler Periodik | Proses cron tiap menit (evaluasi status + expire QR) |
| 3 | Registrasi Antrian | Alur mahasiswa mendaftar antrian via QR |
| 4 | Panggilan Antrian | Alur dosen memanggil & mengelola antrian |
| 5 | Generate QR Code | Alur operator generate QR harian |
| 6 | Manajemen User | Alur admin/superadmin mengelola akun pengguna |

---

## 1. State Machine Status Dosen

Sumber utama status dosen adalah **API absensi kampus**. Jadwal mengajar dan konsultasi digunakan sebagai **referensi** untuk menentukan status spesifik setelah dosen absen masuk.

```mermaid
flowchart TD
    START(("🏫 Event dari\nAPI Absensi Kampus"))
    
    START --> EVT{"Jenis event?"}
    
    EVT -->|"Absen MASUK"| MASUK["Set is_absen_masuk = true\nClear status_override = false"]
    EVT -->|"Absen PULANG"| PULANG["Set is_absen_masuk = false\nSet status = PULANG\nClear status_override = false"]
    
    MASUK --> CEK_JDW{"Cek jadwal\nsaat ini\n(hari + jam)"}
    
    CEK_JDW -->|"Ada jadwal_mengajar\n(jam_mulai ≤ now ≤ jam_selesai)"| ST_MENGAJAR["✏️ Status = MENGAJAR"]
    CEK_JDW -->|"Ada jadwal_konsultasi\n(jam_mulai ≤ now ≤ jam_selesai)"| ST_TERSEDIA["🟢 Status = TERSEDIA"]
    CEK_JDW -->|"Tidak ada jadwal\napapun saat ini"| ST_TDK["🔴 Status = TIDAK BERSEDIA"]
    
    ST_MENGAJAR --> BROADCAST["📡 Broadcast status\nvia WebSocket"]
    ST_TERSEDIA --> BROADCAST
    ST_TDK --> BROADCAST
    PULANG --> BROADCAST
    
    BROADCAST --> LOG["📝 Simpan ke\nabsensi_sync_logs"]
    LOG --> DONE(("✅ Selesai"))
    
    %% Override Manual (terpisah dari flow API)
    OVERRIDE_START(("👨‍🏫 Dosen\nOverride Manual")) --> OVR["Set status sesuai input dosen\nSet status_override = true"]
    OVR --> BROADCAST2["📡 Broadcast status\nvia WebSocket"]
    BROADCAST2 --> LOG2["📝 Simpan ke\nactivity_logs"]
    LOG2 --> DONE2(("✅ Selesai"))

    style ST_MENGAJAR fill:#ffd700,color:#000
    style ST_TERSEDIA fill:#28a745,color:#fff
    style ST_TDK fill:#dc3545,color:#fff
    style PULANG fill:#6c757d,color:#fff
```

### Aturan Override

| Aturan | Penjelasan |
|---|---|
| Override berlaku sampai trigger berikutnya | Override di-clear saat: pergantian slot jadwal (scheduler) ATAU event baru dari API absensi |
| Prioritas: API absensi > Override | Jika API mengirim event "pulang", override apapun langsung di-clear dan status = PULANG |
| Override tidak mengubah `is_absen_masuk` | Override hanya mengubah `status_ketersediaan` dan set `status_override = true` |

---

## 2. Scheduler Periodik (Cron Tiap Menit)

Scheduler berjalan sebagai background job, mengecek apakah ada **pergantian slot jadwal** untuk dosen yang sudah absen masuk, dan meng-expire QR code yang sudah melewati batas waktu.

```mermaid
flowchart TD
    TICK(("⏰ Scheduler Tick\ntiap 1 menit"))
    
    TICK --> FETCH["Ambil semua dosen\nWHERE is_absen_masuk = true"]
    
    FETCH --> LOOP{"Untuk setiap dosen:"}
    
    LOOP --> CEK_SLOT{"Apakah ada\npergantian slot\njadwal di menit ini?"}
    
    CEK_SLOT -->|"Ya — slot jadwal\nbaru dimulai/berakhir"| CLEAR["Clear status_override = false"]
    
    CLEAR --> EVAL{"Jadwal yang aktif\nsaat ini?"}
    
    EVAL -->|"jadwal_mengajar"| SET_M["Status = MENGAJAR"]
    EVAL -->|"jadwal_konsultasi"| SET_T["Status = TERSEDIA"]
    EVAL -->|"tidak ada jadwal"| SET_TB["Status = TIDAK BERSEDIA"]
    
    SET_M --> WS["📡 Broadcast WS\n+ Activity Log"]
    SET_T --> WS
    SET_TB --> WS
    
    CEK_SLOT -->|"Tidak — masih\nslot yang sama"| SKIP["⏭️ Skip\ntidak ada perubahan"]
    
    WS --> NEXT["Dosen berikutnya"]
    SKIP --> NEXT
    NEXT --> LOOP
    
    TICK --> QR_CHECK["Cek QR codes"]
    QR_CHECK --> QR_EXP{"Ada QR yang\nmelewati expired_at?"}
    
    QR_EXP -->|Ya| QR_UPD["Set status = 'expired'\n+ Activity Log"]
    QR_EXP -->|Tidak| QR_SKIP["⏭️ Skip"]
```

### Prioritas Jadwal

Jika jadwal mengajar dan jadwal konsultasi **overlap** di waktu yang sama:

| Prioritas | Alasan |
|---|---|
| `jadwal_mengajar` lebih tinggi | Mengajar adalah aktivitas utama yang tidak bisa diinterupsi |

---

## 3. Alur Registrasi Antrian (Mahasiswa / Guest)

Mahasiswa **tidak perlu login**. Akses antrian hanya via scan QR fisik di Display TV Kampus.

```mermaid
flowchart TD
    A(("👨‍🎓 Mahasiswa\ndi kampus")) --> B["Lihat Display TV\ndi area kampus"]
    B --> C["📱 Scan QR Code\ndari layar TV"]
    C --> D["Redirect ke form\npendaftaran antrian"]
    
    D --> E["Isi form:\n• Nama\n• NIM\n• Pilih Dosen tujuan\n• Keperluan (opsional)"]
    
    E --> V{"Validasi"}
    
    V --> V1{"QR masih aktif?\n(belum expired)"}
    V1 -->|Tidak| ERR1["❌ Error:\nQR code sudah expired"]
    
    V1 -->|Ya| V2{"Dosen yang dipilih\nstatus ≠ Pulang?"}
    V2 -->|Tidak| ERR2["❌ Error:\nDosen sudah pulang"]
    
    V2 -->|Ya| V3{"Kuota harian\ndosen tercapai?"}
    V3 -->|"Ya\n(kuota_harian ≠ NULL\ndan antrian hari ini ≥ kuota)"| ERR3["❌ Error:\nKuota penuh hari ini"]
    
    V3 -->|"Tidak\n(masih ada slot\natau unlimited)"| GEN["Generate nomor antrian:\n1. Hitung urutan = MAX+1\n   per dosen per hari\n2. Format = KODE_DOSEN-URUTAN\n   misal A-01"]
    
    GEN --> SAVE["💾 Simpan ke tabel antrian\nstatus = 'menunggu'"]
    
    SAVE --> SHOW["✅ Tampilkan nomor\nantrian ke mahasiswa\n+ estimasi posisi"]
    
    ERR1 --> END(("Selesai"))
    ERR2 --> END
    ERR3 --> END
    SHOW --> END

    style ERR1 fill:#dc3545,color:#fff
    style ERR2 fill:#dc3545,color:#fff
    style ERR3 fill:#dc3545,color:#fff
    style SHOW fill:#28a745,color:#fff
```

### Catatan Penting

> **Dosen yang bisa dipilih di form:** Semua status KECUALI "Pulang"
> - ✅ Tersedia — bisa langsung dilayani
> - ✅ Mengajar — mahasiswa antre dulu, nanti dipanggil setelah selesai mengajar
> - ✅ Tidak Bersedia — mahasiswa antre dulu
> - ❌ Pulang — tidak muncul di pilihan

---

## 4. Alur Panggilan Antrian (Dosen)

Dosen mengelola antrian konsultasi dari panel khusus setelah login.

```mermaid
flowchart TD
    A(("👨‍🏫 Dosen Login")) --> B["📋 Panel Antrian"]
    
    B --> C["Lihat daftar antrian hari ini\nstatus = 'menunggu'\ndiurutkan berdasarkan urutan"]
    
    C --> D{"Jumlah menunggu > 0?"}
    
    D -->|Tidak| EMPTY["📭 Tidak ada antrian\nmenunggu"]
    
    D -->|Ya| AKSI{"Pilih aksi:"}
    
    AKSI -->|"▶️ Panggil\nSelanjutnya"| NEXT["Ambil antrian 'menunggu'\ndengan urutan terkecil"]
    
    NEXT --> CALL["Set status = 'dipanggil'\nSet dipanggil_at = NOW()"]
    
    CALL --> WS_CALL["📡 Broadcast ke Display TV:\n'Nomor A-01 silakan\nmenuju dosen X'"]
    
    WS_CALL --> HADIR{"Mahasiswa\nhadir?"}
    
    HADIR -->|"✅ Hadir"| KONSUL["Konsultasi berlangsung..."]
    KONSUL --> SELESAI["Set status = 'selesai'\nSet selesai_at = NOW()"]
    SELESAI --> B
    
    HADIR -->|"❌ Tidak hadir"| TDK_HADIR{"Aksi dosen:"}
    
    TDK_HADIR -->|"🔄 Panggil\nUlang"| CALL
    TDK_HADIR -->|"⏭️ Lewati"| LEWATI["Set status = 'tidak_hadir'"]
    LEWATI --> B
    
    AKSI -->|"🔄 Panggil Ulang\n(nomor lama)"| RECALL["Pilih dari daftar\nstatus = 'tidak_hadir'\ndi hari ini"]
    RECALL --> CALL
    
    EMPTY --> WAIT["Menunggu antrian baru..."]
    WAIT -.->|"WS: antrian baru masuk"| C

    style SELESAI fill:#28a745,color:#fff
    style LEWATI fill:#ffc107,color:#000
    style EMPTY fill:#6c757d,color:#fff
```

### Status Transition Antrian

```mermaid
stateDiagram-v2
    [*] --> menunggu : Mahasiswa daftar
    menunggu --> dipanggil : Dosen panggil
    dipanggil --> selesai : Konsultasi selesai
    dipanggil --> tidak_hadir : Tidak hadir, dilewati
    tidak_hadir --> dipanggil : Panggil ulang (configurable)
    selesai --> [*]
    tidak_hadir --> [*] : Hangus akhir hari
```

---

## 5. Alur Generate QR Code (Operator)

Operator meng-generate satu QR code per hari untuk ditampilkan di Display TV Kampus.

```mermaid
flowchart TD
    A(("🧑‍💼 Operator Login")) --> B["Halaman QR Management"]
    
    B --> C["Klik 'Generate QR Hari Ini'"]
    
    C --> D{"QR untuk hari ini\nsudah ada di database?"}
    
    D -->|"Ya — sudah ada\nstatus = 'aktif'"| E["📋 Tampilkan QR\nyang sudah ada\n(tidak generate baru)"]
    
    D -->|"Belum ada"| F["🔑 Generate kode_unik\n(random 64-char string)"]
    
    F --> G["💾 Simpan ke tabel qr_codes:\n• kode_unik = random string\n• tanggal_berlaku = hari ini\n• expired_at = jam dari settings\n• status = 'aktif'"]
    
    G --> H["📝 Activity Log:\nGENERATE_QR"]
    
    H --> I["✅ QR code siap"]
    E --> I
    
    I --> J["📺 QR ditampilkan di\nDisplay TV Kampus"]
    
    J --> K["⏰ Auto-expire di jam\nyang dikonfigurasi\n(system_settings.qr_expire_hour)"]
    
    K --> L["Scheduler set\nstatus = 'expired'"]

    style I fill:#28a745,color:#fff
    style L fill:#6c757d,color:#fff
```

### Catatan QR Code

| Aturan | Penjelasan |
|---|---|
| 1 QR per hari | Enforced via database constraint |
| QR hanya di TV | **TIDAK PERNAH** tampil di landing page publik/online |
| Expired otomatis | Scheduler cek tiap menit, expire jika `NOW() > expired_at` |
| URL format | `https://[domain]/antrian?qr=[kode_unik]` |

---

## 6. Alur Manajemen User (Superadmin / Admin)

```mermaid
flowchart TD
    A(("🔧 Login")) --> B{"Role user?"}
    
    B -->|Superadmin| C["Scope: SEMUA fakultas\nBisa kelola: Admin, Dosen, Operator"]
    B -->|Admin| D["Scope: fakultas SENDIRI saja\nBisa kelola: Dosen, Operator"]
    
    C --> E["📋 Menu Kelola User"]
    D --> E
    
    E --> F{"Aksi?"}
    
    F -->|"➕ Tambah User"| G["Form Tambah User:\n• Nama, Email, Password\n• Role\n• Fakultas, Prodi"]
    
    G --> H{"Role = Dosen?"}
    H -->|Ya| I["+ Form Profil Dosen:\n• NIP\n• Kode Antrian\n• Foto (opsional)"]
    H -->|Tidak| J["Langsung simpan"]
    I --> J
    
    J --> K{"Validasi"}
    K -->|"Admin menambah\ndi luar fakultasnya?"| ERR["❌ Error:\nDi luar scope Anda"]
    K -->|"Admin menambah\nrole Admin?"| ERR2["❌ Error:\nTidak bisa menambah Admin"]
    K -->|"Valid ✅"| SAVE["💾 Simpan user\n+ Activity Log"]
    
    F -->|"✏️ Edit User"| EDIT["Update data user\n+ Activity Log"]
    
    F -->|"🚫 Nonaktifkan"| DEACT["Set is_active = false\n+ Activity Log"]
    
    SAVE --> DONE(("✅ Selesai"))
    EDIT --> DONE
    DEACT --> DONE

    style ERR fill:#dc3545,color:#fff
    style ERR2 fill:#dc3545,color:#fff
    style SAVE fill:#28a745,color:#fff
```

### Matriks Kewenangan

| Aksi | Superadmin | Admin |
|---|---|---|
| Tambah Admin | ✅ | ❌ |
| Tambah Dosen | ✅ Semua fakultas | ✅ Fakultas sendiri |
| Tambah Operator | ✅ Semua fakultas | ✅ Fakultas sendiri |
| Edit user | ✅ Semua | ✅ Fakultas sendiri |
| Nonaktifkan user | ✅ Semua | ✅ Fakultas sendiri |
| Lihat audit log | ✅ Global | ✅ Scope fakultas |
