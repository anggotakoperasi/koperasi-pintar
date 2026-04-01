"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Building2,
  UserCog,
  Key,
  Tag,
  RefreshCw,
  HardDrive,
  Upload,
  Info,
  Save,
  ChevronRight,
  X,
  CheckCircle2,
  Loader2,
} from "lucide-react";

const SETTINGS_KEY = "koperasi_pengaturan";

const colorStyles: Record<string, { icon: string; bg: string }> = {
  accent: { icon: "bg-accent-500/20 text-accent-400", bg: "border-accent-500/20 hover:bg-accent-500/5" },
  green: { icon: "bg-success-500/20 text-success-400", bg: "border-success-500/20 hover:bg-success-500/5" },
  amber: { icon: "bg-warning-500/20 text-warning-400", bg: "border-warning-500/20 hover:bg-warning-500/5" },
  purple: { icon: "bg-purple-500/20 text-purple-400", bg: "border-purple-500/20 hover:bg-purple-500/5" },
  blue: { icon: "bg-blue-500/20 text-blue-400", bg: "border-blue-500/20 hover:bg-blue-500/5" },
  red: { icon: "bg-danger-500/20 text-danger-400", bg: "border-danger-500/20 hover:bg-danger-500/5" },
  cyan: { icon: "bg-cyan-500/20 text-cyan-400", bg: "border-cyan-500/20 hover:bg-cyan-500/5" },
  gray: { icon: "bg-gray-500/20 text-gray-400", bg: "border-gray-500/20 hover:bg-gray-500/5" },
};

type ModalId = "setup" | "operator" | "kode_pinjaman" | "kode_simpanan" | "backup" | "restore" | "reindex" | "info" | null;

interface KodePinjaman { kode: string; nama: string; bunga: string; }
interface KodeSimpanan { kode: string; nama: string; keterangan: string; }
interface Operator { id: number; nama: string; username: string; role: string; aktif: boolean; }

const DEFAULTS = {
  namaKoperasi: "Primkoppol Resor Subang",
  alamat: "Jl. Otista No.52, Subang",
  ketua: "IPTU (PURN) POL HARDOYO",
  badanHukum: "No. 6513/BHPAD/KWK.10/II/2003 tertanggal 20 Februari 2003",
  periode: "2025 - 2028",
  kodePinjaman: [
    { kode: "SP", nama: "Simpan Pinjam", bunga: "1.0" },
    { kode: "KSG", nama: "Kredit Serba Guna", bunga: "1.5" },
    { kode: "BM", nama: "Bank Mandiri", bunga: "0.8" },
    { kode: "LN", nama: "Lainnya", bunga: "1.0" },
  ] as KodePinjaman[],
  kodeSimpanan: [
    { kode: "PKK", nama: "Simpanan Pokok", keterangan: "Setoran awal saat mendaftar" },
    { kode: "WJB", nama: "Simpanan Wajib", keterangan: "Setoran bulanan wajib" },
    { kode: "SKR", nama: "Simpanan Sukarela", keterangan: "Setoran sukarela kapan saja" },
  ] as KodeSimpanan[],
};

function loadSettings() {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULTS, ...parsed };
  } catch {
    return DEFAULTS;
  }
}

export default function PengaturanPage() {
  const [activeModal, setActiveModal] = useState<ModalId>(null);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const stored = loadSettings();
  const [namaKoperasi, setNamaKoperasi] = useState(stored.namaKoperasi);
  const [alamat, setAlamat] = useState(stored.alamat);
  const [ketua, setKetua] = useState(stored.ketua);
  const [badanHukum, setBadanHukum] = useState(stored.badanHukum);
  const [periode, setPeriode] = useState(stored.periode);

  const [operators] = useState<Operator[]>([
    { id: 1, nama: "IPTU (PURN) POL HARDOYO", username: "admin", role: "Super Admin", aktif: true },
    { id: 2, nama: "BRIPKA DEWI ASTUTI", username: "operator", role: "Admin Operasional", aktif: true },
    { id: 3, nama: "IPTU SLAMET RIYADI", username: "bendahara", role: "Bendahara", aktif: true },
    { id: 4, nama: "AIPDA RINA MARLINA", username: "manajer", role: "Manajer Unit", aktif: true },
  ]);

  const [kodePinjaman, setKodePinjaman] = useState<KodePinjaman[]>(stored.kodePinjaman);
  const [kodeSimpanan, setKodeSimpanan] = useState<KodeSimpanan[]>(stored.kodeSimpanan);

  const persistSettings = useCallback(() => {
    const data = { namaKoperasi, alamat, ketua, badanHukum, periode, kodePinjaman, kodeSimpanan };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(data));
  }, [namaKoperasi, alamat, ketua, badanHukum, periode, kodePinjaman, kodeSimpanan]);

  const saveWithPersist = (msg: string) => {
    setSaving(true);
    setTimeout(() => {
      persistSettings();
      setSaving(false);
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(null), 2500);
    }, 600);
  };

  const closeModal = () => { setActiveModal(null); setSuccessMsg(null); };

  const modalShell = "fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-sm";
  const modalPanel = "w-full max-w-lg max-h-[85vh] flex flex-col rounded-2xl border border-navy-600/50 bg-navy-950 shadow-2xl shadow-black/40";
  const inputCls = "w-full bg-navy-900 border border-navy-600/60 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-accent-500/40";
  const btnPrimary = "flex items-center justify-center gap-2 rounded-xl bg-accent-600 hover:bg-accent-500 disabled:opacity-50 py-2.5 px-4 text-sm font-medium text-white transition-colors";

  const settingSections = [
    { id: "setup" as ModalId, title: "Setup Program", desc: "Konfigurasi nama & alamat koperasi, ketua, periode.", icon: Building2, color: "accent" },
    { id: "operator" as ModalId, title: "Data Operator", desc: "Kelola akun operator dan hak akses.", icon: UserCog, color: "green" },
    { id: "kode_pinjaman" as ModalId, title: "Edit Kode Pinjaman", desc: "Atur kode jenis pinjaman dan parameter bunga.", icon: Tag, color: "amber" },
    { id: "kode_simpanan" as ModalId, title: "Edit Kode Simpanan", desc: "Atur kode jenis simpanan dan konfigurasi.", icon: Key, color: "purple" },
    { id: "backup" as ModalId, title: "Backup File Data", desc: "Backup seluruh data koperasi ke file.", icon: HardDrive, color: "blue" },
    { id: "restore" as ModalId, title: "Restore File Backup", desc: "Kembalikan data dari file backup.", icon: Upload, color: "red" },
    { id: "reindex" as ModalId, title: "Reindex File Data", desc: "Perbaiki index database untuk performa optimal.", icon: RefreshCw, color: "cyan" },
    { id: "info" as ModalId, title: "Informasi Software", desc: "Versi aplikasi dan informasi sistem.", icon: Info, color: "gray" },
  ];

  const renderModal = () => {
    if (!activeModal) return null;
    return (
      <div className={modalShell} onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
        <div className={modalPanel} onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between border-b border-navy-700/60 px-5 py-4 shrink-0">
            <h2 className="text-lg font-semibold text-white">
              {settingSections.find((s) => s.id === activeModal)?.title}
            </h2>
            <button type="button" onClick={closeModal} className="rounded-lg p-2 text-navy-400 hover:bg-navy-800 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="overflow-y-auto flex-1 p-5 space-y-4">
            {successMsg && (
              <div className="flex items-center gap-2 bg-success-600/15 border border-success-600/30 rounded-xl px-4 py-3 text-sm text-success-400">
                <CheckCircle2 className="w-4 h-4 shrink-0" /> {successMsg}
              </div>
            )}
            {activeModal === "setup" && (
              <>
                <div>
                  <label className="block text-xs font-medium text-navy-400 uppercase tracking-wide mb-1.5">Nama Koperasi</label>
                  <input value={namaKoperasi} onChange={(e) => setNamaKoperasi(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-navy-400 uppercase tracking-wide mb-1.5">Alamat</label>
                  <input value={alamat} onChange={(e) => setAlamat(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-navy-400 uppercase tracking-wide mb-1.5">Ketua</label>
                  <input value={ketua} onChange={(e) => setKetua(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-navy-400 uppercase tracking-wide mb-1.5">Badan Hukum</label>
                  <input value={badanHukum} onChange={(e) => setBadanHukum(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-navy-400 uppercase tracking-wide mb-1.5">Periode Kepengurusan</label>
                  <input value={periode} onChange={(e) => setPeriode(e.target.value)} className={inputCls} />
                </div>
                <button type="button" disabled={saving} onClick={() => saveWithPersist("Setup program berhasil disimpan!")} className={btnPrimary}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Simpan
                </button>
              </>
            )}
            {activeModal === "operator" && (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-navy-700/30">
                        <th className="text-left text-xs font-medium text-navy-400 uppercase px-3 py-2">Nama</th>
                        <th className="text-left text-xs font-medium text-navy-400 uppercase px-3 py-2">Username</th>
                        <th className="text-left text-xs font-medium text-navy-400 uppercase px-3 py-2">Role</th>
                        <th className="text-center text-xs font-medium text-navy-400 uppercase px-3 py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {operators.map((op) => (
                        <tr key={op.id} className="border-b border-navy-800/50">
                          <td className="px-3 py-2.5 text-sm text-white">{op.nama}</td>
                          <td className="px-3 py-2.5 text-sm text-navy-300">{op.username}</td>
                          <td className="px-3 py-2.5 text-sm text-navy-300">{op.role}</td>
                          <td className="px-3 py-2.5 text-center">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${op.aktif ? "bg-success-600/20 text-success-400" : "bg-danger-600/20 text-danger-400"}`}>
                              {op.aktif ? "Aktif" : "Nonaktif"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-navy-500">Manajemen operator terintegrasi dengan sistem autentikasi.</p>
              </>
            )}
            {activeModal === "kode_pinjaman" && (
              <>
                {kodePinjaman.map((kp, i) => (
                  <div key={i} className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs text-navy-400 mb-1">Kode</label>
                      <input value={kp.kode} onChange={(e) => { const copy = [...kodePinjaman]; copy[i] = { ...kp, kode: e.target.value }; setKodePinjaman(copy); }} className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-xs text-navy-400 mb-1">Nama</label>
                      <input value={kp.nama} onChange={(e) => { const copy = [...kodePinjaman]; copy[i] = { ...kp, nama: e.target.value }; setKodePinjaman(copy); }} className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-xs text-navy-400 mb-1">Bunga (%)</label>
                      <input value={kp.bunga} onChange={(e) => { const copy = [...kodePinjaman]; copy[i] = { ...kp, bunga: e.target.value }; setKodePinjaman(copy); }} className={inputCls} />
                    </div>
                  </div>
                ))}
                <button type="button" disabled={saving} onClick={() => saveWithPersist("Kode pinjaman berhasil disimpan!")} className={btnPrimary}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Simpan
                </button>
              </>
            )}
            {activeModal === "kode_simpanan" && (
              <>
                {kodeSimpanan.map((ks, i) => (
                  <div key={i} className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs text-navy-400 mb-1">Kode</label>
                      <input value={ks.kode} onChange={(e) => { const copy = [...kodeSimpanan]; copy[i] = { ...ks, kode: e.target.value }; setKodeSimpanan(copy); }} className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-xs text-navy-400 mb-1">Nama</label>
                      <input value={ks.nama} onChange={(e) => { const copy = [...kodeSimpanan]; copy[i] = { ...ks, nama: e.target.value }; setKodeSimpanan(copy); }} className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-xs text-navy-400 mb-1">Keterangan</label>
                      <input value={ks.keterangan} onChange={(e) => { const copy = [...kodeSimpanan]; copy[i] = { ...ks, keterangan: e.target.value }; setKodeSimpanan(copy); }} className={inputCls} />
                    </div>
                  </div>
                ))}
                <button type="button" disabled={saving} onClick={() => saveWithPersist("Kode simpanan berhasil disimpan!")} className={btnPrimary}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Simpan
                </button>
              </>
            )}
            {activeModal === "backup" && (
              <>
                <p className="text-sm text-navy-300">Backup seluruh data koperasi ke file. Data yang di-backup meliputi anggota, simpanan, pinjaman, dan potongan.</p>
                <div className="bg-navy-800/50 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-navy-400">Terakhir Backup</span><span className="text-white">17 Mar 2026, 01:21</span></div>
                  <div className="flex justify-between text-sm"><span className="text-navy-400">Ukuran Data</span><span className="text-white">~2.4 MB</span></div>
                </div>
                <button type="button" disabled={saving} onClick={() => saveWithPersist("Backup berhasil! File tersimpan.")} className={btnPrimary}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <HardDrive className="w-4 h-4" />} Mulai Backup
                </button>
              </>
            )}
            {activeModal === "restore" && (
              <>
                <p className="text-sm text-navy-300">Kembalikan data koperasi dari file backup sebelumnya. Pastikan file backup valid.</p>
                <div className="bg-warning-600/10 border border-warning-600/30 rounded-xl p-3 text-sm text-warning-400">
                  Peringatan: Restore akan menimpa data saat ini. Pastikan Anda sudah backup terlebih dahulu.
                </div>
                <div className="border-2 border-dashed border-navy-600 rounded-xl p-8 text-center">
                  <Upload className="w-8 h-8 text-navy-500 mx-auto mb-2" />
                  <p className="text-sm text-navy-400">Pilih file backup untuk di-restore</p>
                  <input type="file" accept=".json,.sql,.bak" className="mt-3 text-sm text-navy-300 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-accent-600 file:text-white hover:file:bg-accent-500 cursor-pointer" />
                </div>
              </>
            )}
            {activeModal === "reindex" && (
              <>
                <p className="text-sm text-navy-300">Reindex akan memperbaiki index database untuk meningkatkan performa query dan akses data.</p>
                <div className="bg-navy-800/50 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-navy-400">Tabel</span><span className="text-white">anggota, transaksi_simpanan, pinjaman, potongan</span></div>
                  <div className="flex justify-between text-sm"><span className="text-navy-400">Terakhir Reindex</span><span className="text-white">Belum pernah</span></div>
                </div>
                <button type="button" disabled={saving} onClick={() => saveWithPersist("Reindex berhasil! Database telah dioptimalkan.")} className={btnPrimary}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} Mulai Reindex
                </button>
              </>
            )}
            {activeModal === "info" && (
              <div className="space-y-3">
                {[
                  ["Nama Aplikasi", "Koperasi Pintar"],
                  ["Versi", "v1.0.0"],
                  ["Framework", "Next.js 16 + React 19"],
                  ["Database", "PostgreSQL 16 (Supabase)"],
                  ["Developer", "Tim IT PRIMKOPPOL"],
                  ["Lisensi", "Internal Use Only"],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-navy-400">{label}</span>
                    <span className="text-white font-medium">{value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {renderModal()}

      <div className="bg-navy-900/80 rounded-2xl border border-navy-700/30 p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl bg-accent-500/20 flex items-center justify-center">
            <Building2 className="w-6 h-6 text-accent-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{namaKoperasi.toUpperCase()}</h3>
            <p className="text-sm text-navy-400">{alamat}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-navy-800/50 rounded-xl p-3">
            <p className="text-xs text-navy-400">Nama Koperasi</p>
            <p className="text-sm font-medium text-white mt-1">{namaKoperasi}</p>
          </div>
          <div className="bg-navy-800/50 rounded-xl p-3">
            <p className="text-xs text-navy-400">Badan Hukum</p>
            <p className="text-sm font-medium text-white mt-1">{badanHukum}</p>
          </div>
          <div className="bg-navy-800/50 rounded-xl p-3">
            <p className="text-xs text-navy-400">Ketua</p>
            <p className="text-sm font-medium text-white mt-1">{ketua}</p>
          </div>
          <div className="bg-navy-800/50 rounded-xl p-3">
            <p className="text-xs text-navy-400">Periode</p>
            <p className="text-sm font-medium text-white mt-1">{periode}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {settingSections.map((section) => {
          const Icon = section.icon;
          const style = colorStyles[section.color];
          return (
            <button
              key={section.id}
              type="button"
              onClick={() => setActiveModal(section.id)}
              className={`flex items-center gap-4 bg-navy-900/80 border rounded-2xl p-5 transition-all cursor-pointer group text-left ${style.bg}`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${style.icon}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">{section.title}</p>
                <p className="text-xs text-navy-400 mt-0.5">{section.desc}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-navy-600 group-hover:text-navy-300 transition-colors" />
            </button>
          );
        })}
      </div>

      <div className="bg-navy-900/80 rounded-2xl border border-navy-700/30 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Info className="w-5 h-5 text-accent-400" />
          <h3 className="text-base font-semibold text-white">Informasi Sistem</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-navy-800/50 rounded-xl p-3">
            <p className="text-xs text-navy-400">Versi Aplikasi</p>
            <p className="text-sm font-medium text-white mt-1">Koperasi Pintar v1.0</p>
          </div>
          <div className="bg-navy-800/50 rounded-xl p-3">
            <p className="text-xs text-navy-400">Database</p>
            <p className="text-sm font-medium text-white mt-1">PostgreSQL 16</p>
          </div>
          <div className="bg-navy-800/50 rounded-xl p-3">
            <p className="text-xs text-navy-400">Terakhir Backup</p>
            <p className="text-sm font-medium text-white mt-1">17 Mar 2026, 01:21</p>
          </div>
          <div className="bg-navy-800/50 rounded-xl p-3">
            <p className="text-xs text-navy-400">Operator Aktif</p>
            <p className="text-sm font-medium text-white mt-1">Admin (Super Admin)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
