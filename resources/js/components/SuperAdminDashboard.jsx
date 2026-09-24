import React from 'react';
import { 
  LogOut, 
  RefreshCw, 
  Copy, 
  Edit, 
  Key, 
  Trash2, 
  QrCode, 
  Users, 
  CheckCircle,
  XCircle
} from 'lucide-react';

export default function SuperAdminDashboard() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <nav className="bg-[#1a202c] text-white flex items-center justify-between px-6 py-4">
        <div className="font-bold text-2xl tracking-widest">SINKANSEN</div>
        <div className="flex items-center gap-4 text-sm">
          <span className="font-medium text-slate-300">SuperAdmin Utama</span>
          <button className="flex items-center gap-2 border border-slate-600 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors">
            <LogOut size={16} />
            Keluar
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold text-blue-600 mb-1">9</span>
            <span className="text-xs text-slate-500 font-medium uppercase">Total Dosen</span>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold text-emerald-500 mb-1">6</span>
            <span className="text-xs text-slate-500 font-medium uppercase">Dosen Aktif Hari Ini</span>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold text-orange-500 mb-1">42</span>
            <span className="text-xs text-slate-500 font-medium uppercase">Antrian Hari ini</span>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold text-purple-500 mb-1">3</span>
            <span className="text-xs text-slate-500 font-medium uppercase">Operator Aktif</span>
          </div>
        </div>

        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1.5 h-4 bg-blue-600 rounded-full"></div>
            <h2 className="text-sm font-bold text-blue-600 uppercase tracking-wide">QR Code Generator</h2>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
              <div className="flex-shrink-0 bg-slate-50 p-4 border border-slate-200 rounded-xl">
                <QrCode size={96} className="text-slate-800" />
              </div>
              <div className="flex-grow space-y-2">
                <h3 className="text-2xl font-bold text-blue-700 tracking-wide">UTN-2025-0124</h3>
                <p className="text-sm text-slate-500">Berlaku s.d. 23:59 WIB</p>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Aktif
                </span>
                
                <div className="flex gap-4 mt-6 pt-4 border-t border-slate-100">
                  <div className="flex flex-col">
                    <span className="text-xl font-bold text-blue-600">42</span>
                    <span className="text-[10px] uppercase text-slate-500 font-semibold leading-tight">Total Scan<br/>Hari Ini</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xl font-bold text-emerald-500">8</span>
                    <span className="text-[10px] uppercase text-slate-500 font-semibold leading-tight">Antrian<br/>Aktif</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-3 min-w-[200px]">
                <button className="flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm">
                  <RefreshCw size={16} />
                  Generate QR Baru
                </button>
                <button className="flex justify-center items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm">
                  <Copy size={16} />
                  Salin URL
                </button>
                <div className="text-[10px] text-slate-400 text-center mt-2 leading-tight">
                  QR Code di-generate oleh Superadmin. Berlaku untuk seluruh sistem antrian.
                </div>
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1.5 h-4 bg-blue-600 rounded-full"></div>
            <h2 className="text-sm font-bold text-blue-600 uppercase tracking-wide">Manajemen User</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <h3 className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-5 pb-3 border-b border-slate-100">
                <Users size={16} className="text-blue-500"/> Form Tambah User / Dosen
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Nama Lengkap</label>
                  <input type="text" placeholder="Nama lengkap + gelar" className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Email Kampus</label>
                  <input type="email" placeholder="nama@kampus.ac.id" className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Role / Akses</label>
                    <select className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white">
                      <option>Dosen</option>
                      <option>Operator</option>
                      <option>Superadmin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Password</label>
                    <input type="password" placeholder="Min. 8 karakter" className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">NIP (Jika Dosen)</label>
                  <input type="text" placeholder="18 digit NIP" className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>
                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors mt-2 shadow-sm">
                  Simpan User Baru
                </button>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h3 className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-5 pb-3 border-b border-slate-100">
                  <Edit size={16} className="text-blue-500"/> Form Edit Data / Role
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Pilih User</label>
                    <select className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white">
                      <option>-- Pilih User --</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Ganti Role</label>
                    <select className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white">
                      <option>Dosen</option>
                      <option>Operator</option>
                      <option>Superadmin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Status Akun</label>
                    <div className="flex gap-6">
                      <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 cursor-pointer">
                        <input type="radio" name="status" defaultChecked className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500" />
                        AKTIF
                      </label>
                      <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 cursor-pointer">
                        <input type="radio" name="status" className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500" />
                        NONAKTIF
                      </label>
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button className="flex-1 bg-white hover:bg-blue-50 text-blue-600 border border-blue-600 font-semibold py-2.5 rounded-lg text-sm transition-colors">
                      Update Data
                    </button>
                    <button className="bg-red-50 hover:bg-red-100 text-red-600 font-semibold py-2.5 px-6 rounded-lg text-sm transition-colors">
                      Hapus
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex justify-center">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 w-full max-w-xl">
               <h3 className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-5 pb-3 border-b border-slate-100">
                  <Key size={16} className="text-orange-500"/> Ubah Password User
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Pilih User</label>
                    <select className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white">
                      <option>-- Pilih User --</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Password Baru</label>
                      <input type="password" placeholder="Min. 8 karakter" className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Konfirmasi Password</label>
                      <input type="password" placeholder="Ulangi password" className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500" />
                    </div>
                  </div>
                  <button className="w-full flex justify-center items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors mt-2 shadow-sm">
                    <Key size={16} />
                    Simpan Password
                  </button>
                </div>
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-center gap-2 mb-4 mt-8">
            <div className="w-1.5 h-4 bg-blue-600 rounded-full"></div>
            <h2 className="text-sm font-bold text-blue-600 uppercase tracking-wide">Tabel Daftar User & Role System</h2>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-4 font-bold text-xs text-blue-700 uppercase tracking-wider">No</th>
                    <th className="px-6 py-4 font-bold text-xs text-blue-700 uppercase tracking-wider">Nama</th>
                    <th className="px-6 py-4 font-bold text-xs text-blue-700 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-4 font-bold text-xs text-blue-700 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-4 font-bold text-xs text-blue-700 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 font-bold text-xs text-blue-700 uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 text-slate-500 font-semibold">1</td>
                    <td className="px-6 py-4 font-bold text-slate-800">Dr. Budi Santoso, M.Kom</td>
                    <td className="px-6 py-4 text-slate-600">budi@kampus.ac.id</td>
                    <td className="px-6 py-4">
                      <span className="inline-block px-2 py-1 rounded bg-blue-100 text-blue-700 text-[10px] font-bold uppercase">Dosen</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-block px-2 py-1 rounded bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase">Aktif</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button className="flex items-center gap-1.5 px-2 py-1 bg-white border border-slate-200 text-slate-600 text-xs font-semibold rounded hover:bg-slate-50 transition-colors">
                          <Edit size={12} /> Edit
                        </button>
                        <button className="flex items-center gap-1.5 px-2 py-1 bg-white border border-slate-200 text-orange-500 text-xs font-semibold rounded hover:bg-orange-50 transition-colors">
                          <Key size={12} /> Sandi
                        </button>
                        <button className="flex items-center gap-1.5 px-2 py-1 bg-white border border-red-200 text-red-500 text-xs font-semibold rounded hover:bg-red-50 transition-colors">
                          <Trash2 size={12} /> Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                  
                  <tr className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 text-slate-500 font-semibold">2</td>
                    <td className="px-6 py-4 font-bold text-slate-800">Ahmad Operator</td>
                    <td className="px-6 py-4 text-slate-600">op1@kampus.ac.id</td>
                    <td className="px-6 py-4">
                      <span className="inline-block px-2 py-1 rounded bg-yellow-100 text-yellow-700 text-[10px] font-bold uppercase">Operator</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-block px-2 py-1 rounded bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase">Aktif</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button className="flex items-center gap-1.5 px-2 py-1 bg-white border border-slate-200 text-slate-600 text-xs font-semibold rounded hover:bg-slate-50 transition-colors">
                          <Edit size={12} /> Edit
                        </button>
                        <button className="flex items-center gap-1.5 px-2 py-1 bg-white border border-slate-200 text-orange-500 text-xs font-semibold rounded hover:bg-orange-50 transition-colors">
                          <Key size={12} /> Sandi
                        </button>
                        <button className="flex items-center gap-1.5 px-2 py-1 bg-white border border-red-200 text-red-500 text-xs font-semibold rounded hover:bg-red-50 transition-colors">
                          <Trash2 size={12} /> Hapus
                        </button>
                      </div>
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 text-slate-500 font-semibold">3</td>
                    <td className="px-6 py-4 font-bold text-slate-800">SuperAdmin Utama</td>
                    <td className="px-6 py-4 text-slate-600">admin@kampus.ac.id</td>
                    <td className="px-6 py-4">
                      <span className="inline-block px-2 py-1 rounded bg-purple-100 text-purple-700 text-[10px] font-bold uppercase">Superadmin</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-block px-2 py-1 rounded bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase">Aktif</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button className="flex items-center gap-1.5 px-2 py-1 bg-white border border-slate-200 text-slate-600 text-xs font-semibold rounded hover:bg-slate-50 transition-colors">
                          <Edit size={12} /> Edit
                        </button>
                        <button className="flex items-center gap-1.5 px-2 py-1 bg-white border border-slate-200 text-orange-500 text-xs font-semibold rounded hover:bg-orange-50 transition-colors">
                          <Key size={12} /> Sandi
                        </button>
                        <button className="flex items-center gap-1.5 px-2 py-1 bg-white border border-red-200 text-red-500 text-xs font-semibold rounded hover:bg-red-50 transition-colors">
                          <Trash2 size={12} /> Hapus
                        </button>
                      </div>
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 text-slate-500 font-semibold">4</td>
                    <td className="px-6 py-4 font-bold text-slate-800">Prof. Sari Dewi, Ph.D</td>
                    <td className="px-6 py-4 text-slate-600">sari@kampus.ac.id</td>
                    <td className="px-6 py-4">
                      <span className="inline-block px-2 py-1 rounded bg-blue-100 text-blue-700 text-[10px] font-bold uppercase">Dosen</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-block px-2 py-1 rounded bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase">Aktif</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button className="flex items-center gap-1.5 px-2 py-1 bg-white border border-slate-200 text-slate-600 text-xs font-semibold rounded hover:bg-slate-50 transition-colors">
                          <Edit size={12} /> Edit
                        </button>
                        <button className="flex items-center gap-1.5 px-2 py-1 bg-white border border-slate-200 text-orange-500 text-xs font-semibold rounded hover:bg-orange-50 transition-colors">
                          <Key size={12} /> Sandi
                        </button>
                        <button className="flex items-center gap-1.5 px-2 py-1 bg-white border border-red-200 text-red-500 text-xs font-semibold rounded hover:bg-red-50 transition-colors">
                          <Trash2 size={12} /> Hapus
                        </button>
                      </div>
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 text-slate-500 font-semibold">5</td>
                    <td className="px-6 py-4 font-bold text-slate-800">Dr. Ahmad Fauzi, M.T</td>
                    <td className="px-6 py-4 text-slate-600">ahmad@kampus.ac.id</td>
                    <td className="px-6 py-4">
                      <span className="inline-block px-2 py-1 rounded bg-blue-100 text-blue-700 text-[10px] font-bold uppercase">Dosen</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-block px-2 py-1 rounded bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase">Aktif</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button className="flex items-center gap-1.5 px-2 py-1 bg-white border border-slate-200 text-slate-600 text-xs font-semibold rounded hover:bg-slate-50 transition-colors">
                          <Edit size={12} /> Edit
                        </button>
                        <button className="flex items-center gap-1.5 px-2 py-1 bg-white border border-slate-200 text-orange-500 text-xs font-semibold rounded hover:bg-orange-50 transition-colors">
                          <Key size={12} /> Sandi
                        </button>
                        <button className="flex items-center gap-1.5 px-2 py-1 bg-white border border-red-200 text-red-500 text-xs font-semibold rounded hover:bg-red-50 transition-colors">
                          <Trash2 size={12} /> Hapus
                        </button>
                      </div>
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 text-slate-500 font-semibold">6</td>
                    <td className="px-6 py-4 font-bold text-slate-800">Bety Operator</td>
                    <td className="px-6 py-4 text-slate-600">op2@kampus.ac.id</td>
                    <td className="px-6 py-4">
                      <span className="inline-block px-2 py-1 rounded bg-yellow-100 text-yellow-700 text-[10px] font-bold uppercase">Operator</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-block px-2 py-1 rounded bg-slate-100 text-slate-500 text-[10px] font-bold uppercase">Nonaktif</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button className="flex items-center gap-1.5 px-2 py-1 bg-white border border-slate-200 text-slate-600 text-xs font-semibold rounded hover:bg-slate-50 transition-colors">
                          <Edit size={12} /> Edit
                        </button>
                        <button className="flex items-center gap-1.5 px-2 py-1 bg-white border border-slate-200 text-orange-500 text-xs font-semibold rounded hover:bg-orange-50 transition-colors">
                          <Key size={12} /> Sandi
                        </button>
                        <button className="flex items-center gap-1.5 px-2 py-1 bg-white border border-red-200 text-red-500 text-xs font-semibold rounded hover:bg-red-50 transition-colors">
                          <Trash2 size={12} /> Hapus
                        </button>
                      </div>
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 text-slate-500 font-semibold">7</td>
                    <td className="px-6 py-4 font-bold text-slate-800">Dr. Rina Wulandari, M.Kom</td>
                    <td className="px-6 py-4 text-slate-600">rina@kampus.ac.id</td>
                    <td className="px-6 py-4">
                      <span className="inline-block px-2 py-1 rounded bg-blue-100 text-blue-700 text-[10px] font-bold uppercase">Dosen</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-block px-2 py-1 rounded bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase">Aktif</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button className="flex items-center gap-1.5 px-2 py-1 bg-white border border-slate-200 text-slate-600 text-xs font-semibold rounded hover:bg-slate-50 transition-colors">
                          <Edit size={12} /> Edit
                        </button>
                        <button className="flex items-center gap-1.5 px-2 py-1 bg-white border border-slate-200 text-orange-500 text-xs font-semibold rounded hover:bg-orange-50 transition-colors">
                          <Key size={12} /> Sandi
                        </button>
                        <button className="flex items-center gap-1.5 px-2 py-1 bg-white border border-red-200 text-red-500 text-xs font-semibold rounded hover:bg-red-50 transition-colors">
                          <Trash2 size={12} /> Hapus
                        </button>
                      </div>
                    </td>
                  </tr>

                </tbody>
              </table>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
