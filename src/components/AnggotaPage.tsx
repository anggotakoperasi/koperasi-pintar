"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Plus,
  ChevronDown,
  Eye,
  Edit3,
  Trash2,
  Award,
  Users,
  UserCheck,
  UserX,
  Loader2,
  X,
  Wallet,
  HandCoins,
  Calendar,
  Shield,
  AlertTriangle,
} from "lucide-react";
import StatCard from "./StatCard";
import { formatRupiah, getTierColor, getTierLabel } from "@/data/mock";
import type { Anggota } from "@/data/mock";
import { fetchAnggota, insertAnggota, updateAnggota, deleteAnggota, getMaxNomorAnggota } from "@/lib/fetchers";
import DatePickerID from "./DatePickerID";
import { useToast } from "./Toast";

const PANGKAT_OPTIONS: string[] = [
  "AKBP",
  "KOMPOL",
  "AKP",
  "IPTU",
  "IPDA",
  "AIPTU",
  "AIPDA",
  "BRIPKA",
  "BRIGADIR",
  "BRIPTU",
  "BRIPDA",
];

const POLSEK_OPTIONS = Array.from({ length: 20 }, (_, i) => `POLSEK ${String(i + 1).padStart(2, "0")}`);

const SATUAN_OPTIONS = [
  "POLRES",
  "SAT RESKRIM",
  "SAT LANTAS",
  "SABHARA",
  "SAT INTELKAM",
  "SAT BINMAS",
  "SAT NARKOBA",
  ...POLSEK_OPTIONS,
];

const STATUS_OPTIONS: Anggota["status"][] = ["aktif", "pasif", "keluar"];

function nextNomorAnggota(list: Anggota[]): string {
  const nums = list
    .map((a) => parseInt(String(a.nomorAnggota).replace(/\D/g, "") || "0", 10))
    .filter((n) => !Number.isNaN(n) && n >= 0);
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return String(next).padStart(3, "0");
}

function todayISODate(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function withOption(options: readonly string[], current: string): string[] {
  const list = [...options];
  if (current && !list.includes(current)) list.unshift(current);
  return list;
}

const selectClass =
  "w-full bg-navy-800 border border-navy-700/50 rounded-xl px-3 py-2.5 text-sm text-white outline-none cursor-pointer";

const inputClass =
  "w-full bg-navy-800 border border-navy-700/50 rounded-xl px-3 py-2.5 text-sm text-white placeholder-navy-400 outline-none";

interface AnggotaPageProps {
  globalSelectedAnggota?: Anggota | null;
  onGlobalSelectedClear?: () => void;
  highlightKey?: string | null;
}

export default function AnggotaPage({ globalSelectedAnggota, onGlobalSelectedClear, highlightKey }: AnggotaPageProps = {}) {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [filterTier, setFilterTier] = useState<string>("semua");
  const [selectedAnggota, setSelectedAnggota] = useState<string | null>(null);
  const [anggotaList, setAnggotaList] = useState<Anggota[]>([]);
  const [loading, setLoading] = useState(true);

  const [detailAnggota, setDetailAnggota] = useState<Anggota | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Anggota | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPangkatOptions, setEditPangkatOptions] = useState<string[]>([...PANGKAT_OPTIONS]);
  const [editSatuanOptions, setEditSatuanOptions] = useState<string[]>([...SATUAN_OPTIONS]);
  const [formBusy, setFormBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [addForm, setAddForm] = useState<{
    nama: string;
    pangkat: string;
    satuan: string;
    nrp: string;
    bergabung: string;
    noHp: string;
    email: string;
  }>({
    nama: "",
    pangkat: PANGKAT_OPTIONS[0],
    satuan: SATUAN_OPTIONS[0],
    nrp: "",
    bergabung: todayISODate(),
    noHp: "",
    email: "",
  });

  const [editForm, setEditForm] = useState<{
    nama: string;
    pangkat: string;
    satuan: string;
    nrp: string;
    status: Anggota["status"];
    noHp: string;
    email: string;
  }>({
    nama: "",
    pangkat: PANGKAT_OPTIONS[0],
    satuan: SATUAN_OPTIONS[0],
    nrp: "",
    status: "aktif",
    noHp: "",
    email: "",
  });

  const refreshList = useCallback(async () => {
    try {
      const data = await fetchAnggota();
      setAnggotaList(data);
    } catch (e) {
      console.error(e);
      setFeedback({ type: "error", message: "Gagal memuat ulang daftar anggota." });
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchAnggota()
      .then(setAnggotaList)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!feedback) return;
    const t = setTimeout(() => setFeedback(null), 4000);
    return () => clearTimeout(t);
  }, [feedback]);

  useEffect(() => {
    if (globalSelectedAnggota) {
      setDetailAnggota(globalSelectedAnggota);
      onGlobalSelectedClear?.();
    }
  }, [globalSelectedAnggota, onGlobalSelectedClear]);

  useEffect(() => {
    const anyOpen = addOpen || editOpen || !!deleteConfirm || !!detailAnggota;
    if (!anyOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        if (deleteConfirm) { setDeleteConfirm(null); return; }
        if (detailAnggota) { setDetailAnggota(null); return; }
        if (editOpen && !formBusy) { setEditOpen(false); setEditingId(null); return; }
        if (addOpen && !formBusy) { setAddOpen(false); return; }
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [addOpen, editOpen, deleteConfirm, detailAnggota, formBusy]);

  const openAdd = () => {
    setAddForm({
      nama: "",
      pangkat: PANGKAT_OPTIONS[0],
      satuan: SATUAN_OPTIONS[0],
      nrp: "",
      bergabung: todayISODate(),
      noHp: "",
      email: "",
    });
    setAddOpen(true);
  };

  const openEdit = (a: Anggota) => {
    setEditingId(a.id);
    setEditPangkatOptions(withOption(PANGKAT_OPTIONS, a.pangkat));
    setEditSatuanOptions(withOption(SATUAN_OPTIONS, a.satuan));
    setEditForm({
      nama: a.nama,
      pangkat: a.pangkat,
      satuan: a.satuan,
      nrp: a.nrp,
      status: a.status,
      noHp: a.noHp || "",
      email: a.email || "",
    });
    setEditOpen(true);
  };

  const closeAdd = () => {
    if (!formBusy) setAddOpen(false);
  };

  const closeEdit = () => {
    if (!formBusy) {
      setEditOpen(false);
      setEditingId(null);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.nama.trim() || !addForm.nrp.trim()) {
      setFeedback({ type: "error", message: "Nama dan NRP/NIP wajib diisi." });
      return;
    }
    setFormBusy(true);
    try {
      const maxNum = await getMaxNomorAnggota();
      const nomorAnggota = String(maxNum + 1).padStart(3, "0");
      await insertAnggota({
        nomorAnggota,
        nama: addForm.nama.trim(),
        pangkat: addForm.pangkat,
        satuan: addForm.satuan,
        nrp: addForm.nrp.trim(),
        status: "aktif",
        tier: "standard",
        skor: 50,
        simpananPokok: 0,
        simpananWajib: 0,
        simpananSukarela: 0,
        totalPinjaman: 0,
        sisaPinjaman: 0,
        bergabung: addForm.bergabung,
        noHp: addForm.noHp.trim(),
        email: addForm.email.trim(),
      });
      await refreshList();
      setAddOpen(false);
      setFeedback({ type: "success", message: "Anggota berhasil ditambahkan." });
      toast("success", `Anggota ${addForm.nama.trim()} berhasil ditambahkan.`);
    } catch (err: any) {
      console.error(err);
      const detail = err?.message || err?.toString() || "Terjadi kesalahan";
      setFeedback({ type: "error", message: `Gagal menambah anggota: ${detail}` });
      toast("error", `Gagal menambah anggota: ${detail}`);
    } finally {
      setFormBusy(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    if (!editForm.nama.trim() || !editForm.nrp.trim()) {
      setFeedback({ type: "error", message: "Nama dan NRP/NIP wajib diisi." });
      return;
    }
    setFormBusy(true);
    try {
      await updateAnggota(editingId, {
        nama: editForm.nama.trim(),
        pangkat: editForm.pangkat,
        satuan: editForm.satuan,
        nrp: editForm.nrp.trim(),
        status: editForm.status,
        noHp: editForm.noHp.trim(),
        email: editForm.email.trim(),
      });
      await refreshList();
      setEditOpen(false);
      setEditingId(null);
      setFeedback({ type: "success", message: "Data anggota berhasil diperbarui." });
      toast("success", "Data anggota berhasil diperbarui.");
    } catch (err: any) {
      console.error(err);
      const detail = err?.message || "Terjadi kesalahan";
      setFeedback({ type: "error", message: `Gagal memperbarui: ${detail}` });
      toast("error", `Gagal memperbarui: ${detail}`);
    } finally {
      setFormBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleteBusy(true);
    try {
      await deleteAnggota(deleteConfirm.id);
      await refreshList();
      setDeleteConfirm(null);
      if (selectedAnggota === deleteConfirm.id) setSelectedAnggota(null);
      if (detailAnggota?.id === deleteConfirm.id) setDetailAnggota(null);
      setFeedback({ type: "success", message: `Anggota ${deleteConfirm.nama} berhasil dihapus.` });
      toast("success", `Anggota ${deleteConfirm.nama} berhasil dihapus.`);
    } catch (err: any) {
      console.error(err);
      const detail = err?.message || "Terjadi kesalahan";
      setFeedback({ type: "error", message: `Gagal menghapus: ${detail}` });
      toast("error", `Gagal menghapus: ${detail}`);
    } finally {
      setDeleteBusy(false);
    }
  };

  const filtered = anggotaList.filter((a) => {
    const matchSearch =
      a.nama.toLowerCase().includes(search.toLowerCase()) ||
      a.nrp.includes(search) ||
      a.nomorAnggota.includes(search);
    const matchTier = filterTier === "semua" || a.tier === filterTier;
    return matchSearch && matchTier;
  });

  const aktif = anggotaList.filter((a) => a.status === "aktif").length;
  const pasif = anggotaList.filter((a) => a.status !== "aktif").length;

  const detail = selectedAnggota ? anggotaList.find((a) => a.id === selectedAnggota) : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-accent-400 animate-spin" />
        <span className="ml-3 text-navy-300">Memuat data anggota...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      {feedback && (
        <div
          className={`fixed top-4 right-4 z-[60] max-w-sm rounded-xl border px-4 py-3 text-sm shadow-lg ${
            feedback.type === "success"
              ? "bg-navy-900 border-success-600/40 text-success-300"
              : "bg-navy-900 border-danger-600/40 text-danger-300"
          }`}
          role="alert"
        >
          {feedback.message}
        </div>
      )}

      {addOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
          onClick={closeAdd}
          role="presentation"
        >
          <div
            className="w-full max-w-md rounded-2xl border border-navy-700 bg-navy-900 shadow-xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="add-anggota-title"
          >
            <div className="flex items-center justify-between border-b border-navy-700 px-5 py-4">
              <h2 id="add-anggota-title" className="text-lg font-semibold text-white">
                Tambah Anggota
              </h2>
              <button
                type="button"
                onClick={closeAdd}
                disabled={formBusy}
                className="rounded-lg p-2 text-navy-400 hover:bg-navy-800 hover:text-white transition-colors disabled:opacity-50"
                aria-label="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="p-5 space-y-4">
              <p className="text-xs text-navy-400">
                Nomor anggota: <span className="text-accent-400 font-mono">{nextNomorAnggota(anggotaList)}</span>{" "}
                (otomatis)
              </p>
              <div>
                <label className="block text-xs font-medium text-navy-400 mb-1.5">Nama</label>
                <input
                  type="text"
                  value={addForm.nama}
                  onChange={(e) => setAddForm((f) => ({ ...f, nama: e.target.value }))}
                  className={inputClass}
                  placeholder="Nama lengkap"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-navy-400 mb-1.5">Pangkat</label>
                <select
                  value={addForm.pangkat}
                  onChange={(e) => setAddForm((f) => ({ ...f, pangkat: e.target.value }))}
                  className={selectClass}
                >
                  {PANGKAT_OPTIONS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-navy-400 mb-1.5">Satuan</label>
                <select
                  value={addForm.satuan}
                  onChange={(e) => setAddForm((f) => ({ ...f, satuan: e.target.value }))}
                  className={selectClass}
                >
                  {SATUAN_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-navy-400 mb-1.5">NRP/NIP</label>
                <input
                  type="text"
                  value={addForm.nrp}
                  onChange={(e) => setAddForm((f) => ({ ...f, nrp: e.target.value }))}
                  className={inputClass}
                  placeholder="Nomor registrasi"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-navy-400 mb-1.5">No. Hp</label>
                <input
                  type="tel"
                  value={addForm.noHp}
                  onChange={(e) => setAddForm((f) => ({ ...f, noHp: e.target.value }))}
                  className={inputClass}
                  placeholder="08xxxxxxxxxx"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-navy-400 mb-1.5">Email</label>
                <input
                  type="email"
                  value={addForm.email}
                  onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))}
                  className={inputClass}
                  placeholder="contoh@email.com"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-navy-400 mb-1.5">Bergabung</label>
                <DatePickerID
                  value={addForm.bergabung}
                  onChange={(val) => setAddForm((f) => ({ ...f, bergabung: val }))}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeAdd}
                  disabled={formBusy}
                  className="flex-1 rounded-xl border border-navy-700 py-2.5 text-sm font-medium text-navy-300 hover:bg-navy-800 transition-colors disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formBusy}
                  className="flex-1 rounded-xl bg-accent-500 hover:bg-accent-600 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
                >
                  {formBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
          onClick={closeEdit}
          role="presentation"
        >
          <div
            className="w-full max-w-md rounded-2xl border border-navy-700 bg-navy-900 shadow-xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="edit-anggota-title"
          >
            <div className="flex items-center justify-between border-b border-navy-700 px-5 py-4">
              <h2 id="edit-anggota-title" className="text-lg font-semibold text-white">
                Edit Anggota
              </h2>
              <button
                type="button"
                onClick={closeEdit}
                disabled={formBusy}
                className="rounded-lg p-2 text-navy-400 hover:bg-navy-800 hover:text-white transition-colors disabled:opacity-50"
                aria-label="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-navy-400 mb-1.5">Nama</label>
                <input
                  type="text"
                  value={editForm.nama}
                  onChange={(e) => setEditForm((f) => ({ ...f, nama: e.target.value }))}
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-navy-400 mb-1.5">Pangkat</label>
                <select
                  value={editForm.pangkat}
                  onChange={(e) => setEditForm((f) => ({ ...f, pangkat: e.target.value }))}
                  className={selectClass}
                >
                  {editPangkatOptions.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-navy-400 mb-1.5">Satuan</label>
                <select
                  value={editForm.satuan}
                  onChange={(e) => setEditForm((f) => ({ ...f, satuan: e.target.value }))}
                  className={selectClass}
                >
                  {editSatuanOptions.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-navy-400 mb-1.5">NRP/NIP</label>
                <input
                  type="text"
                  value={editForm.nrp}
                  onChange={(e) => setEditForm((f) => ({ ...f, nrp: e.target.value }))}
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-navy-400 mb-1.5">No. Hp</label>
                <input
                  type="tel"
                  value={editForm.noHp}
                  onChange={(e) => setEditForm((f) => ({ ...f, noHp: e.target.value }))}
                  className={inputClass}
                  placeholder="08xxxxxxxxxx"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-navy-400 mb-1.5">Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                  className={inputClass}
                  placeholder="contoh@email.com"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-navy-400 mb-1.5">Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, status: e.target.value as Anggota["status"] }))
                  }
                  className={selectClass}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeEdit}
                  disabled={formBusy}
                  className="flex-1 rounded-xl border border-navy-700 py-2.5 text-sm font-medium text-navy-300 hover:bg-navy-800 transition-colors disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formBusy}
                  className="flex-1 rounded-xl bg-accent-500 hover:bg-accent-600 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
                >
                  {formBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Perbarui
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className={`grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4${highlightKey === "anggota-baru" ? " animate-notif-highlight" : ""}`}>
        <StatCard title="Total Anggota" value={anggotaList.length.toString()} icon={Users} color="blue" />
        <StatCard title="Anggota Aktif" value={aktif.toString()} icon={UserCheck} color="green" />
        <StatCard title="Anggota Non-Aktif" value={pasif.toString()} icon={UserX} color="amber" />
        <StatCard
          title="Rata-rata Skor"
          value={
            anggotaList.length > 0
              ? (anggotaList.reduce((s, a) => s + a.skor, 0) / anggotaList.length).toFixed(0)
              : "0"
          }
          icon={Award}
          color="purple"
        />
      </div>

      <div className="bg-navy-900/80 rounded-2xl border border-navy-700/30 overflow-hidden">
        <div className="p-5 border-b border-navy-700/30">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Daftar Anggota</h3>
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="flex items-center bg-navy-800 rounded-xl px-3 py-2 gap-2 border border-navy-700/50 flex-1 sm:flex-initial">
                <Search className="w-4 h-4 text-navy-400" />
                <input
                  type="text"
                  placeholder="Cari nama / NRP/NIP..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-transparent text-sm text-white placeholder-navy-400 outline-none w-full sm:w-48"
                />
              </div>
              <div className="relative">
                <select
                  value={filterTier}
                  onChange={(e) => setFilterTier(e.target.value)}
                  className="appearance-none bg-navy-800 border border-navy-700/50 rounded-xl px-3 py-2 pr-8 text-sm text-white outline-none cursor-pointer"
                >
                  <option value="semua">Semua Tier</option>
                  <option value="platinum">Platinum</option>
                  <option value="gold">Gold</option>
                  <option value="silver">Silver</option>
                  <option value="standard">Standard</option>
                  <option value="risk">Risk</option>
                </select>
                <ChevronDown className="w-4 h-4 text-navy-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              <button
                type="button"
                onClick={openAdd}
                className="flex items-center gap-2 bg-accent-500 hover:bg-accent-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Tambah</span>
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-navy-800/80 sticky top-0">
              <tr className="border-b border-navy-600/40">
                <th className="text-left text-xs font-semibold text-navy-200 uppercase tracking-wider px-5 py-3">No.</th>
                <th className="text-left text-xs font-semibold text-navy-200 uppercase tracking-wider px-5 py-3">Nama / NRP/NIP</th>
                <th className="text-left text-xs font-semibold text-navy-200 uppercase tracking-wider px-5 py-3">Satuan</th>
                <th className="text-left text-xs font-semibold text-navy-200 uppercase tracking-wider px-5 py-3">Tier</th>
                <th className="text-right text-xs font-semibold text-navy-200 uppercase tracking-wider px-5 py-3">Total Simpanan</th>
                <th className="text-right text-xs font-semibold text-navy-200 uppercase tracking-wider px-5 py-3">Sisa Pinjaman</th>
                <th className="text-center text-xs font-semibold text-navy-200 uppercase tracking-wider px-5 py-3">Skor</th>
                <th className="text-center text-xs font-semibold text-navy-200 uppercase tracking-wider px-5 py-3">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => {
                const totalSimpanan = a.simpananPokok + a.simpananWajib + a.simpananSukarela;
                return (
                  <tr
                    key={a.id}
                    className={`border-b border-navy-800/50 hover:bg-navy-800/30 transition-colors ${
                      selectedAnggota === a.id ? "bg-accent-500/5" : ""
                    }`}
                  >
                    <td className="px-5 py-3 text-sm text-navy-300">{a.nomorAnggota}</td>
                    <td className="px-5 py-3">
                      <p className="text-sm font-medium text-white">{a.nama}</p>
                      <p className="text-xs text-navy-400">
                        {a.pangkat} - NRP/NIP: {a.nrp}
                      </p>
                    </td>
                    <td className="px-5 py-3 text-sm text-navy-300">{a.satuan}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-block text-[10px] font-bold px-2.5 py-1 rounded-full ${getTierColor(a.tier)}`}
                      >
                        {getTierLabel(a.tier)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-white text-right font-medium">
                      {formatRupiah(totalSimpanan)}
                    </td>
                    <td className="px-5 py-3 text-sm text-right font-medium">
                      <span className={a.sisaPinjaman > 0 ? "text-warning-400" : "text-success-400"}>
                        {formatRupiah(a.sisaPinjaman)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <div
                        className={`inline-flex items-center justify-center w-10 h-10 rounded-xl text-sm font-bold ${
                          a.skor >= 80
                            ? "bg-success-600/20 text-success-400"
                            : a.skor >= 60
                              ? "bg-warning-600/20 text-warning-400"
                              : "bg-danger-600/20 text-danger-400"
                        }`}
                      >
                        {a.skor}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setDetailAnggota(a)}
                          className="p-2 rounded-lg hover:bg-navy-700 text-navy-400 hover:text-accent-400 transition-colors cursor-pointer"
                          title="Lihat Detail"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEdit(a)}
                          className="p-2 rounded-lg hover:bg-navy-700 text-navy-400 hover:text-warning-400 transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirm(a)}
                          className="p-2 rounded-lg hover:bg-navy-700 text-navy-400 hover:text-danger-400 transition-colors cursor-pointer"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="p-12 text-center text-navy-400">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-lg font-medium">Tidak ada data ditemukan</p>
            <p className="text-sm">Coba ubah kata kunci pencarian</p>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {detailAnggota && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setDetailAnggota(null)}
          role="presentation"
        >
          <div
            className="w-full max-w-2xl rounded-2xl border border-navy-700 bg-navy-900 shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
          >
            {/* Header */}
            <div className="flex items-start justify-between border-b border-navy-700 px-6 py-5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-accent-500/20 flex items-center justify-center">
                  <Shield className="w-7 h-7 text-accent-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{detailAnggota.nama}</h2>
                  <p className="text-sm text-navy-400">
                    {detailAnggota.pangkat} — {detailAnggota.satuan}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDetailAnggota(null)}
                className="rounded-xl p-2 text-navy-400 hover:bg-navy-800 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Info cards row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-navy-800/60 rounded-xl p-3 border border-navy-700/30">
                  <p className="text-[11px] text-navy-400 uppercase tracking-wider">No. Anggota</p>
                  <p className="text-base font-bold text-white mt-1">{detailAnggota.nomorAnggota}</p>
                </div>
                <div className="bg-navy-800/60 rounded-xl p-3 border border-navy-700/30">
                  <p className="text-[11px] text-navy-400 uppercase tracking-wider">NRP/NIP</p>
                  <p className="text-base font-bold text-white mt-1">{detailAnggota.nrp || "-"}</p>
                </div>
                <div className="bg-navy-800/60 rounded-xl p-3 border border-navy-700/30">
                  <p className="text-[11px] text-navy-400 uppercase tracking-wider">Status</p>
                  <p className={`text-base font-bold mt-1 ${
                    detailAnggota.status === "aktif" ? "text-success-400" :
                    detailAnggota.status === "pasif" ? "text-warning-400" : "text-danger-400"
                  }`}>
                    {detailAnggota.status.toUpperCase()}
                  </p>
                </div>
                <div className="bg-navy-800/60 rounded-xl p-3 border border-navy-700/30">
                  <p className="text-[11px] text-navy-400 uppercase tracking-wider">Bergabung</p>
                  <p className="text-base font-bold text-white mt-1">
                    {detailAnggota.bergabung ? new Date(detailAnggota.bergabung).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "-"}
                  </p>
                </div>
                <div className="bg-navy-800/60 rounded-xl p-3 border border-navy-700/30">
                  <p className="text-[11px] text-navy-400 uppercase tracking-wider">No. Hp</p>
                  <p className="text-base font-bold text-white mt-1">{detailAnggota.noHp || "-"}</p>
                </div>
                <div className="bg-navy-800/60 rounded-xl p-3 border border-navy-700/30">
                  <p className="text-[11px] text-navy-400 uppercase tracking-wider">Email</p>
                  <p className="text-base font-bold text-white mt-1 break-all">{detailAnggota.email || "-"}</p>
                </div>
              </div>

              {/* Tier & Skor */}
              <div className="flex items-center gap-4">
                <span className={`inline-block text-xs font-bold px-4 py-2 rounded-full ${getTierColor(detailAnggota.tier)}`}>
                  {getTierLabel(detailAnggota.tier)} MEMBER
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-navy-400">Skor Kredit:</span>
                  <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl text-sm font-bold ${
                    detailAnggota.skor >= 80 ? "bg-success-600/20 text-success-400" :
                    detailAnggota.skor >= 60 ? "bg-warning-600/20 text-warning-400" :
                    "bg-danger-600/20 text-danger-400"
                  }`}>
                    {detailAnggota.skor}
                  </div>
                </div>
              </div>

              {/* Simpanan Section */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Wallet className="w-4 h-4 text-success-400" />
                  <h4 className="text-sm font-semibold text-white">Simpanan</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-navy-800/50 rounded-xl p-4 border border-navy-700/20">
                    <p className="text-xs text-navy-400 mb-1">Simpanan Pokok</p>
                    <p className="text-lg font-bold text-white">{formatRupiah(detailAnggota.simpananPokok)}</p>
                  </div>
                  <div className="bg-navy-800/50 rounded-xl p-4 border border-navy-700/20">
                    <p className="text-xs text-navy-400 mb-1">Simpanan Wajib</p>
                    <p className="text-lg font-bold text-white">{formatRupiah(detailAnggota.simpananWajib)}</p>
                  </div>
                  <div className="bg-navy-800/50 rounded-xl p-4 border border-navy-700/20">
                    <p className="text-xs text-navy-400 mb-1">Simpanan Sukarela</p>
                    <p className="text-lg font-bold text-white">{formatRupiah(detailAnggota.simpananSukarela)}</p>
                  </div>
                </div>
                <div className="mt-2 bg-success-600/10 border border-success-600/20 rounded-xl p-3 flex items-center justify-between">
                  <span className="text-sm text-success-300">Total Simpanan</span>
                  <span className="text-lg font-bold text-success-400">
                    {formatRupiah(detailAnggota.simpananPokok + detailAnggota.simpananWajib + detailAnggota.simpananSukarela)}
                  </span>
                </div>
              </div>

              {/* Pinjaman Section */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <HandCoins className="w-4 h-4 text-warning-400" />
                  <h4 className="text-sm font-semibold text-white">Pinjaman</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-navy-800/50 rounded-xl p-4 border border-navy-700/20">
                    <p className="text-xs text-navy-400 mb-1">Total Pinjaman</p>
                    <p className="text-lg font-bold text-white">{formatRupiah(detailAnggota.totalPinjaman)}</p>
                  </div>
                  <div className="bg-navy-800/50 rounded-xl p-4 border border-navy-700/20">
                    <p className="text-xs text-navy-400 mb-1">Sisa Pinjaman</p>
                    <p className={`text-lg font-bold ${detailAnggota.sisaPinjaman > 0 ? "text-warning-400" : "text-success-400"}`}>
                      {formatRupiah(detailAnggota.sisaPinjaman)}
                    </p>
                  </div>
                </div>
                {detailAnggota.totalPinjaman > 0 && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs text-navy-400 mb-1">
                      <span>Sudah dibayar</span>
                      <span>{detailAnggota.totalPinjaman > 0 ? Math.round(((detailAnggota.totalPinjaman - detailAnggota.sisaPinjaman) / detailAnggota.totalPinjaman) * 100) : 0}%</span>
                    </div>
                    <div className="w-full h-2 bg-navy-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent-500 rounded-full transition-all"
                        style={{ width: `${detailAnggota.totalPinjaman > 0 ? ((detailAnggota.totalPinjaman - detailAnggota.sisaPinjaman) / detailAnggota.totalPinjaman) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 pt-2 border-t border-navy-700/30">
                <button
                  type="button"
                  onClick={() => { setDetailAnggota(null); openEdit(detailAnggota); }}
                  className="flex-1 flex items-center justify-center gap-2 bg-warning-600/15 hover:bg-warning-600/25 text-warning-400 border border-warning-600/30 rounded-xl py-2.5 text-sm font-medium transition-colors cursor-pointer"
                >
                  <Edit3 className="w-4 h-4" /> Edit Data
                </button>
                <button
                  type="button"
                  onClick={() => { setDetailAnggota(null); setDeleteConfirm(detailAnggota); }}
                  className="flex items-center justify-center gap-2 bg-danger-600/15 hover:bg-danger-600/25 text-danger-400 border border-danger-600/30 rounded-xl px-5 py-2.5 text-sm font-medium transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" /> Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => { if (!deleteBusy) setDeleteConfirm(null); }}
          role="presentation"
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-danger-600/30 bg-navy-900 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
          >
            <div className="p-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-danger-600/20 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-7 h-7 text-danger-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Hapus Anggota?</h3>
              <p className="text-sm text-navy-400 mb-1">
                Anda akan menghapus data anggota:
              </p>
              <p className="text-base font-semibold text-white mb-1">{deleteConfirm.nama}</p>
              <p className="text-xs text-navy-400 mb-4">
                {deleteConfirm.pangkat} — NRP/NIP: {deleteConfirm.nrp}
              </p>
              <p className="text-xs text-danger-400 bg-danger-600/10 border border-danger-600/20 rounded-xl px-3 py-2 mb-5">
                Semua data terkait (simpanan, pinjaman, potongan) juga akan dihapus. Tindakan ini tidak bisa dibatalkan.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setDeleteConfirm(null)}
                  disabled={deleteBusy}
                  className="flex-1 rounded-xl border border-navy-700 py-2.5 text-sm font-medium text-navy-300 hover:bg-navy-800 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleteBusy}
                  className="flex-1 rounded-xl bg-danger-600 hover:bg-danger-700 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2 cursor-pointer"
                >
                  {deleteBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  Ya, Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
