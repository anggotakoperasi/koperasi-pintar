"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
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
  Edit3,
  AlertTriangle,
  Shield,
  Plus,
  Trash2,
  Download,
  FileCheck,
} from "lucide-react";
import {
  fetchAnggota, fetchTransaksiSimpanan, fetchPinjaman, fetchPotongan, fetchCOA, fetchJurnalEntriesWithAkun,
  fetchOperators, insertOperator, updateOperator, deleteOperator as deleteOperatorDB,
  fetchAppSettings, upsertAppSettings,
  type DBOperator,
} from "@/lib/fetchers";
import { supabase } from "@/lib/supabase";

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
interface Operator { id: number; nama: string; username: string; password?: string; role: string; aktif: boolean; }

const ROLE_OPTIONS = ["Super Admin", "Admin Operasional", "Bendahara", "Manajer Unit", "Viewer"];

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

function syncToLocalStorage(s: { namaKoperasi: string; alamat: string }) {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    const current = raw ? JSON.parse(raw) : {};
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...current, namaKoperasi: s.namaKoperasi, alamat: s.alamat }));
  } catch { /* ignore */ }
}

export default function PengaturanPage({ highlightKey }: { highlightKey?: string | null } = {}) {
  const [activeModal, setActiveModal] = useState<ModalId>(null);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [dbLoaded, setDbLoaded] = useState(false);

  const [namaKoperasi, setNamaKoperasi] = useState(DEFAULTS.namaKoperasi);
  const [alamat, setAlamat] = useState(DEFAULTS.alamat);
  const [ketua, setKetua] = useState(DEFAULTS.ketua);
  const [badanHukum, setBadanHukum] = useState(DEFAULTS.badanHukum);
  const [periode, setPeriode] = useState(DEFAULTS.periode);

  const [operators, setOperators] = useState<Operator[]>([]);
  const [editingOp, setEditingOp] = useState<Operator | null>(null);
  const [superAdminWarning, setSuperAdminWarning] = useState(false);

  const [kodePinjaman, setKodePinjaman] = useState<KodePinjaman[]>(DEFAULTS.kodePinjaman);
  const [kodeSimpanan, setKodeSimpanan] = useState<KodeSimpanan[]>(DEFAULTS.kodeSimpanan);

  const [lastBackup, setLastBackup] = useState<string | null>(null);
  const [backupBusy, setBackupBusy] = useState(false);
  const [backupError, setBackupError] = useState<string | null>(null);
  const [restoreBusy, setRestoreBusy] = useState(false);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [restorePreview, setRestorePreview] = useState<Record<string, number> | null>(null);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [restoreData, setRestoreData] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [reindexBusy, setReindexBusy] = useState(false);
  const [reindexError, setReindexError] = useState<string | null>(null);
  const [reindexStats, setReindexStats] = useState<Record<string, number> | null>(null);
  const [lastReindex, setLastReindex] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setLastBackup(localStorage.getItem("koperasi_last_backup"));
      setLastReindex(localStorage.getItem("koperasi_last_reindex"));
    }
    (async () => {
      try {
        const [settings, ops] = await Promise.all([fetchAppSettings(), fetchOperators()]);
        setNamaKoperasi(settings.namaKoperasi);
        setAlamat(settings.alamat);
        setKetua(settings.ketua);
        setBadanHukum(settings.badanHukum);
        setPeriode(settings.periode);
        setKodePinjaman(settings.kodePinjaman.length ? settings.kodePinjaman : DEFAULTS.kodePinjaman);
        setKodeSimpanan(settings.kodeSimpanan.length ? settings.kodeSimpanan : DEFAULTS.kodeSimpanan);
        setOperators(ops.map(o => ({ ...o, password: o.password })));
        syncToLocalStorage({ namaKoperasi: settings.namaKoperasi, alamat: settings.alamat });
      } catch (err) {
        console.warn("[Pengaturan] Gagal load dari Supabase, pakai default:", err);
      } finally {
        setDbLoaded(true);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showSuccess = (msg: string) => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(null), 2500);
    }, 400);
  };

  const saveSettingsToDB = async () => {
    await upsertAppSettings({ namaKoperasi, alamat, ketua, badanHukum, periode, kodePinjaman, kodeSimpanan });
    syncToLocalStorage({ namaKoperasi, alamat });
  };

  const closeModal = useCallback(() => {
    setActiveModal(null);
    setSuccessMsg(null);
    setBackupError(null);
    setRestoreError(null);
    setRestorePreview(null);
    setRestoreFile(null);
    setRestoreData(null);
    setReindexError(null);
    setReindexStats(null);
  }, []);

  const handleBackup = async () => {
    setBackupBusy(true);
    setBackupError(null);
    try {
      const [anggota, simpanan, pinjaman, potongan, coa, jurnal] = await Promise.all([
        fetchAnggota(),
        fetchTransaksiSimpanan(),
        fetchPinjaman(),
        fetchPotongan(),
        fetchCOA().catch(() => []),
        fetchJurnalEntriesWithAkun().catch(() => []),
      ]);
      const backupPayload = {
        version: "1.0",
        app: "koperasi-pintar",
        createdAt: new Date().toISOString(),
        data: { anggota, simpanan, pinjaman, potongan, coa, jurnal },
      };
      const json = JSON.stringify(backupPayload, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const dateStr = new Date().toISOString().slice(0, 10);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `backup-koperasi-${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);

      const now = new Date().toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
      localStorage.setItem("koperasi_last_backup", now);
      setLastBackup(now);
      setSuccessMsg(`Backup berhasil! File "backup-koperasi-${dateStr}.json" telah didownload.`);
    } catch (err) {
      setBackupError(`Gagal backup: ${(err as Error).message}`);
    } finally {
      setBackupBusy(false);
    }
  };

  const handleRestoreFileSelect = async (file: File) => {
    setRestoreError(null);
    setRestorePreview(null);
    setRestoreFile(file);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!parsed.data || parsed.app !== "koperasi-pintar") {
        setRestoreError("File bukan backup Koperasi Pintar yang valid.");
        return;
      }
      const d = parsed.data;
      const preview: Record<string, number> = {};
      if (d.anggota?.length) preview["Anggota"] = d.anggota.length;
      if (d.simpanan?.length) preview["Transaksi Simpanan"] = d.simpanan.length;
      if (d.pinjaman?.length) preview["Pinjaman"] = d.pinjaman.length;
      if (d.potongan?.length) preview["Potongan"] = d.potongan.length;
      if (d.coa?.length) preview["Chart of Accounts"] = d.coa.length;
      if (d.jurnal?.length) preview["Jurnal Entries"] = d.jurnal.length;
      setRestorePreview(preview);
      setRestoreData(parsed);
    } catch {
      setRestoreError("File tidak bisa dibaca. Pastikan format JSON valid.");
    }
  };

  const toSnake = (s: string) => s.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);

  const handleRestoreConfirm = async () => {
    if (!restoreData?.data) return;
    setRestoreBusy(true);
    setRestoreError(null);
    try {
      const d = restoreData.data;
      const mapToDb = (arr: any[]) => arr.map((item: any) => {
        const row: any = {};
        for (const [k, v] of Object.entries(item)) {
          row[toSnake(k)] = v;
        }
        return row;
      });

      if (d.anggota?.length) {
        const rows = mapToDb(d.anggota);
        const { error } = await supabase.from("anggota").upsert(rows, { onConflict: "id" });
        if (error) throw new Error(`Anggota: ${error.message}`);
      }
      if (d.simpanan?.length) {
        const rows = mapToDb(d.simpanan);
        const { error } = await supabase.from("transaksi_simpanan").upsert(rows, { onConflict: "id" });
        if (error) throw new Error(`Simpanan: ${error.message}`);
      }
      if (d.pinjaman?.length) {
        const rows = mapToDb(d.pinjaman);
        const { error } = await supabase.from("pinjaman").upsert(rows, { onConflict: "id" });
        if (error) throw new Error(`Pinjaman: ${error.message}`);
      }
      if (d.potongan?.length) {
        const rows = mapToDb(d.potongan);
        const { error } = await supabase.from("potongan").upsert(rows, { onConflict: "id" });
        if (error) throw new Error(`Potongan: ${error.message}`);
      }
      if (d.coa?.length) {
        const rows = mapToDb(d.coa);
        const { error } = await supabase.from("coa").upsert(rows, { onConflict: "kode" });
        if (error) throw new Error(`COA: ${error.message}`);
      }
      if (d.jurnal?.length) {
        const rows = mapToDb(d.jurnal);
        const { error } = await supabase.from("jurnal_entries").upsert(rows, { onConflict: "id" });
        if (error) throw new Error(`Jurnal: ${error.message}`);
      }

      setSuccessMsg("Restore berhasil! Data telah dipulihkan. Silakan refresh halaman.");
      setRestorePreview(null);
      setRestoreFile(null);
      setRestoreData(null);
    } catch (err) {
      setRestoreError(`Gagal restore: ${(err as Error).message}`);
    } finally {
      setRestoreBusy(false);
    }
  };

  const handleReindex = async () => {
    setReindexBusy(true);
    setReindexError(null);
    try {
      const tables = ["anggota", "transaksi_simpanan", "pinjaman", "potongan", "coa", "jurnal_entries"];
      const stats: Record<string, number> = {};
      for (const t of tables) {
        const { count, error } = await supabase.from(t).select("*", { count: "exact", head: true });
        if (error) throw new Error(`Tabel ${t}: ${error.message}`);
        stats[t] = count ?? 0;
      }
      setReindexStats(stats);
      const now = new Date().toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
      localStorage.setItem("koperasi_last_reindex", now);
      setLastReindex(now);
      setSuccessMsg("Reindex berhasil! Semua tabel telah diverifikasi.");
    } catch (err) {
      setReindexError(`Gagal reindex: ${(err as Error).message}`);
    } finally {
      setReindexBusy(false);
    }
  };

  useEffect(() => {
    if (!activeModal) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") { e.preventDefault(); closeModal(); }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [activeModal, closeModal]);

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
                  <label className="block text-xs font-medium text-navy-400 uppercase tracking-wide mb-1.5">
                    Nama Koperasi
                    <span className="ml-2 text-[10px] text-warning-400 normal-case tracking-normal">(Terkunci — tidak dapat diubah)</span>
                  </label>
                  <input
                    value={namaKoperasi}
                    readOnly
                    disabled
                    className={`${inputCls} opacity-60 cursor-not-allowed`}
                    title="Nama koperasi tidak dapat diubah karena terkait hak cipta aplikasi"
                  />
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
                <button type="button" disabled={saving} onClick={async () => { try { await saveSettingsToDB(); showSuccess("Setup program berhasil disimpan!"); } catch { showSuccess("Gagal simpan ke database."); } }} className={btnPrimary}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Simpan
                </button>
              </>
            )}
            {activeModal === "operator" && (
              <>
                {editingOp ? (
                  <div className="space-y-4">
                    {editingOp.role === "Super Admin" && (
                      <div className="flex items-start gap-2 bg-warning-600/10 border border-warning-600/30 rounded-xl px-4 py-3">
                        <AlertTriangle className="w-4 h-4 text-warning-400 shrink-0 mt-0.5" />
                        <div className="text-xs text-warning-400">
                          <p className="font-semibold">Perhatian: Akun Super Admin</p>
                          <p className="mt-0.5 text-warning-400">Mengubah data Super Admin dapat mengakibatkan kehilangan akses ke sistem. Pastikan Anda mengetahui apa yang dilakukan.</p>
                        </div>
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-medium text-navy-400 uppercase tracking-wide mb-1.5">Nama</label>
                      <input value={editingOp.nama} onChange={(e) => setEditingOp({ ...editingOp, nama: e.target.value })} className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-navy-400 uppercase tracking-wide mb-1.5">Username</label>
                      <input value={editingOp.username} onChange={(e) => setEditingOp({ ...editingOp, username: e.target.value })} className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-navy-400 uppercase tracking-wide mb-1.5">Password</label>
                      <input
                        type="password"
                        value={editingOp.password ?? ""}
                        onChange={(e) => setEditingOp({ ...editingOp, password: e.target.value })}
                        placeholder="Masukkan password"
                        className={inputCls}
                      />
                      <p className="text-[10px] text-navy-500 mt-1">Minimal 6 karakter. Wajib diisi.</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-navy-400 uppercase tracking-wide mb-1.5">Role</label>
                      <select
                        value={editingOp.role}
                        onChange={(e) => setEditingOp({ ...editingOp, role: e.target.value })}
                        className={`${inputCls} cursor-pointer`}
                      >
                        {ROLE_OPTIONS.filter((r) => {
                          if (r !== "Super Admin") return true;
                          const isEditing = operators.some(o => o.id === editingOp.id);
                          if (isEditing && editingOp.role === "Super Admin") return true;
                          return !operators.some(o => o.role === "Super Admin");
                        }).map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setEditingOp(null)}
                        className="flex-1 rounded-xl border border-navy-600 bg-navy-800 py-2.5 text-sm font-medium text-navy-200 hover:bg-navy-700 transition-colors cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        disabled={!editingOp.nama.trim() || !editingOp.username.trim() || !(editingOp.password && editingOp.password.length >= 6)}
                        onClick={async () => {
                          if (editingOp.role === "Super Admin" && !superAdminWarning) {
                            setSuperAdminWarning(true);
                            return;
                          }
                          try {
                            const exists = operators.some((o) => o.id === editingOp.id);
                            if (exists) {
                              await updateOperator(editingOp.id, {
                                nama: editingOp.nama,
                                username: editingOp.username,
                                password: editingOp.password || "",
                                role: editingOp.role,
                                aktif: editingOp.aktif,
                              });
                              setOperators(prev => prev.map(o => o.id === editingOp.id ? editingOp : o));
                            } else {
                              const newId = await insertOperator({
                                nama: editingOp.nama,
                                username: editingOp.username,
                                password: editingOp.password || "",
                                role: editingOp.role,
                                aktif: editingOp.aktif,
                              });
                              setOperators(prev => [...prev, { ...editingOp, id: newId }]);
                            }
                            setSuperAdminWarning(false);
                            setEditingOp(null);
                            showSuccess(exists ? "Data operator berhasil diperbarui!" : "Operator baru berhasil ditambahkan!");
                          } catch (err: any) {
                            showSuccess(`Gagal: ${err?.message || "Error"}`);
                          }
                        }}
                        className={btnPrimary + " flex-1 cursor-pointer"}
                      >
                        <Save className="w-4 h-4" /> Simpan
                      </button>
                    </div>
                    {superAdminWarning && (
                      <div className="flex items-start gap-2 bg-danger-600/10 border border-danger-600/30 rounded-xl px-4 py-3 animate-pulse">
                        <Shield className="w-4 h-4 text-danger-400 shrink-0 mt-0.5" />
                        <div className="text-xs text-danger-400">
                          <p className="font-semibold">Konfirmasi Perubahan Super Admin</p>
                          <p className="mt-0.5 text-danger-400">Anda akan mengubah data akun Super Admin. Klik &quot;Simpan&quot; sekali lagi untuk mengonfirmasi.</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-navy-800/80">
                          <tr className="border-b border-navy-600/40">
                            <th className="text-left text-xs font-medium text-navy-400 uppercase px-3 py-2">Nama</th>
                            <th className="text-left text-xs font-medium text-navy-400 uppercase px-3 py-2">Username</th>
                            <th className="text-left text-xs font-medium text-navy-400 uppercase px-3 py-2">Role</th>
                            <th className="text-center text-xs font-medium text-navy-400 uppercase px-3 py-2">Aksi</th>
                          </tr>
                        </thead>
                        <tbody>
                          {operators.map((op) => (
                            <tr key={op.id} className="border-b border-navy-800/50">
                              <td className="px-3 py-2.5 text-sm text-white">
                                <div className="flex items-center gap-2">
                                  {op.role === "Super Admin" && <Shield className="w-3.5 h-3.5 text-warning-400 shrink-0" />}
                                  {op.nama}
                                </div>
                              </td>
                              <td className="px-3 py-2.5 text-sm text-navy-300">{op.username}</td>
                              <td className="px-3 py-2.5 text-sm text-navy-300">{op.role}</td>
                              <td className="px-3 py-2.5 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => { setEditingOp({ ...op }); setSuperAdminWarning(false); }}
                                    className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-accent-500/15 text-accent-400 hover:bg-accent-500/25 transition-colors cursor-pointer"
                                    title={`Edit ${op.nama}`}
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      if (confirm(`Hapus operator ${op.nama}?`)) {
                                        try {
                                          await deleteOperatorDB(op.id);
                                          setOperators(prev => prev.filter(o => o.id !== op.id));
                                          showSuccess("Operator berhasil dihapus.");
                                        } catch (err: any) {
                                          showSuccess(`Gagal hapus: ${err?.message || "Error"}`);
                                        }
                                      }
                                    }}
                                    className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-danger-600/15 text-danger-400 hover:bg-danger-600/25 transition-colors cursor-pointer"
                                    title={`Hapus ${op.nama}`}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingOp({ id: -Date.now(), nama: "", username: "", password: "", role: "Admin Operasional", aktif: true });
                          setSuperAdminWarning(false);
                        }}
                        className="flex items-center gap-2 bg-accent-500 hover:bg-accent-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer"
                      >
                        <Plus className="w-4 h-4" /> Tambah Operator
                      </button>
                      <p className="text-xs text-navy-400">Password ditentukan saat membuat operator.</p>
                    </div>
                  </>
                )}
              </>
            )}
            {activeModal === "kode_pinjaman" && (
              <>
                {kodePinjaman.map((kp, i) => (
                  <div key={i} className="flex items-end gap-2">
                    <div className="flex-1 grid grid-cols-3 gap-2">
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
                    <button type="button" onClick={() => { if (kodePinjaman.length > 1) setKodePinjaman(kodePinjaman.filter((_, j) => j !== i)); }} disabled={kodePinjaman.length <= 1} className="mb-0.5 p-2 rounded-lg bg-danger-600/20 text-danger-400 hover:bg-danger-600/30 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed" title="Hapus baris">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <button type="button" onClick={() => setKodePinjaman([...kodePinjaman, { kode: "", nama: "", bunga: "1.0" }])} className="flex items-center gap-2 bg-navy-700 hover:bg-navy-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer">
                    <Plus className="w-4 h-4" /> Tambah Baris
                  </button>
                  <button type="button" disabled={saving} onClick={async () => { try { await saveSettingsToDB(); showSuccess("Kode pinjaman berhasil disimpan!"); } catch { showSuccess("Gagal simpan."); } }} className={btnPrimary}>
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Simpan
                  </button>
                </div>
              </>
            )}
            {activeModal === "kode_simpanan" && (
              <>
                {kodeSimpanan.map((ks, i) => (
                  <div key={i} className="flex items-end gap-2">
                    <div className="flex-1 grid grid-cols-3 gap-2">
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
                    <button type="button" onClick={() => { if (kodeSimpanan.length > 1) setKodeSimpanan(kodeSimpanan.filter((_, j) => j !== i)); }} disabled={kodeSimpanan.length <= 1} className="mb-0.5 p-2 rounded-lg bg-danger-600/20 text-danger-400 hover:bg-danger-600/30 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed" title="Hapus baris">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <button type="button" onClick={() => setKodeSimpanan([...kodeSimpanan, { kode: "", nama: "", keterangan: "" }])} className="flex items-center gap-2 bg-navy-700 hover:bg-navy-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer">
                    <Plus className="w-4 h-4" /> Tambah Baris
                  </button>
                  <button type="button" disabled={saving} onClick={async () => { try { await saveSettingsToDB(); showSuccess("Kode simpanan berhasil disimpan!"); } catch { showSuccess("Gagal simpan."); } }} className={btnPrimary}>
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Simpan
                  </button>
                </div>
              </>
            )}
            {activeModal === "backup" && (
              <>
                <p className="text-sm text-navy-300">Backup seluruh data koperasi ke file JSON. File akan otomatis ter-download ke komputer Anda.</p>
                <div className="bg-navy-800/50 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-navy-400">Terakhir Backup</span><span className="text-white">{lastBackup || "Belum pernah"}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-navy-400">Data</span><span className="text-white">Anggota, Simpanan, Pinjaman, Potongan, COA, Jurnal</span></div>
                </div>
                {backupError && (
                  <div className="flex items-center gap-2 bg-danger-600/15 border border-danger-600/30 rounded-xl px-4 py-3 text-sm text-danger-400">
                    <AlertTriangle className="w-4 h-4 shrink-0" /> {backupError}
                  </div>
                )}
                <button type="button" disabled={backupBusy} onClick={handleBackup} className={btnPrimary}>
                  {backupBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Mulai Backup
                </button>
                <p className="text-xs text-navy-500">File backup akan disimpan di folder Download browser Anda dengan nama <span className="text-navy-300">backup-koperasi-[tanggal].json</span></p>
              </>
            )}
            {activeModal === "restore" && (
              <>
                <p className="text-sm text-navy-300">Kembalikan data koperasi dari file backup JSON. Pilih file yang sebelumnya di-backup dari menu Backup File Data.</p>
                <div className="bg-warning-600/10 border border-warning-600/30 rounded-xl p-3 text-sm text-warning-400">
                  Peringatan: Restore akan menimpa data yang sama. Pastikan Anda sudah backup data saat ini terlebih dahulu.
                </div>
                {restoreError && (
                  <div className="flex items-center gap-2 bg-danger-600/15 border border-danger-600/30 rounded-xl px-4 py-3 text-sm text-danger-400">
                    <AlertTriangle className="w-4 h-4 shrink-0" /> {restoreError}
                  </div>
                )}
                <div
                  className="border-2 border-dashed border-navy-600 rounded-xl p-8 text-center cursor-pointer hover:border-accent-500/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {restoreFile ? (
                    <>
                      <FileCheck className="w-8 h-8 text-success-400 mx-auto mb-2" />
                      <p className="text-sm text-success-400 font-medium">{restoreFile.name}</p>
                      <p className="text-xs text-navy-400 mt-1">{(restoreFile.size / 1024).toFixed(1)} KB</p>
                    </>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-navy-400 mx-auto mb-2" />
                      <p className="text-sm text-navy-400">Klik untuk pilih file backup (.json)</p>
                    </>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleRestoreFileSelect(f);
                    }}
                  />
                </div>
                {restorePreview && (
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-white">Data yang akan di-restore:</p>
                    <div className="bg-navy-800/50 rounded-xl p-4 space-y-2">
                      {Object.entries(restorePreview).map(([key, count]) => (
                        <div key={key} className="flex justify-between text-sm">
                          <span className="text-navy-400">{key}</span>
                          <span className="text-white font-medium">{count} data</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-navy-500">Dibuat: {restoreData?.createdAt ? new Date(restoreData.createdAt).toLocaleString("id-ID") : "-"}</p>
                    <button type="button" disabled={restoreBusy} onClick={handleRestoreConfirm} className={btnPrimary}>
                      {restoreBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Konfirmasi Restore
                    </button>
                  </div>
                )}
              </>
            )}
            {activeModal === "reindex" && (
              <>
                <p className="text-sm text-navy-300">Reindex akan memverifikasi seluruh tabel database dan menampilkan statistik jumlah data per tabel.</p>
                <div className="bg-navy-800/50 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-navy-400">Tabel</span><span className="text-white">anggota, transaksi_simpanan, pinjaman, potongan, coa, jurnal_entries</span></div>
                  <div className="flex justify-between text-sm"><span className="text-navy-400">Terakhir Reindex</span><span className="text-white">{lastReindex || "Belum pernah"}</span></div>
                </div>
                {reindexError && (
                  <div className="flex items-center gap-2 bg-danger-600/15 border border-danger-600/30 rounded-xl px-4 py-3 text-sm text-danger-400">
                    <AlertTriangle className="w-4 h-4 shrink-0" /> {reindexError}
                  </div>
                )}
                {reindexStats && (
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-white">Statistik Tabel:</p>
                    <div className="bg-navy-800/50 rounded-xl p-4 space-y-2">
                      {Object.entries(reindexStats).map(([table, count]) => (
                        <div key={table} className="flex justify-between text-sm">
                          <span className="text-navy-400">{table}</span>
                          <span className="text-white font-medium">{count} baris</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <button type="button" disabled={reindexBusy} onClick={handleReindex} className={btnPrimary}>
                  {reindexBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} Mulai Reindex
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
              <ChevronRight className="w-5 h-5 text-navy-500 group-hover:text-navy-200 transition-colors" />
            </button>
          );
        })}
      </div>

      <div className={`bg-navy-900/80 rounded-2xl border border-navy-700/30 p-6${highlightKey === "pengaturan-backup" ? " animate-notif-highlight" : ""}`}>
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
            <p className="text-sm font-medium text-white mt-1">{lastBackup || "Belum pernah"}</p>
          </div>
          <div className="bg-navy-800/50 rounded-xl p-3">
            <p className="text-xs text-navy-400">Operator Aktif</p>
            <p className="text-sm font-medium text-white mt-1">{operators.filter(o => o.aktif).length} operator ({operators.find(o => o.role === "Super Admin")?.nama?.split(" ").pop() || "Admin"})</p>
          </div>
        </div>
      </div>
    </div>
  );
}
