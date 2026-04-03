"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
  Search,
  ChevronDown,
  TrendingUp,
  Loader2,
  X,
  Eye,
  Calendar,
  Filter,
} from "lucide-react";
import StatCard from "./StatCard";
import { formatRupiah } from "@/data/mock";
import type { Anggota, TransaksiSimpanan } from "@/data/mock";
import {
  fetchAnggota,
  fetchTransaksiSimpanan,
  insertTransaksiSimpanan,
} from "@/lib/fetchers";
import DetailPopup from "./DetailPopup";

type ModalJenis = "setoran" | "pengambilan" | null;

function formatThousands(v: string): string {
  const digits = v.replace(/\D/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("id-ID");
}

function stripThousands(v: string): string {
  return v.replace(/\./g, "");
}

const emptyForm = () => ({
  anggotaQuery: "",
  anggotaId: "",
  kategori: "wajib" as TransaksiSimpanan["kategori"],
  jumlah: "",
  keterangan: "",
});

export default function SimpananPage() {
  const [search, setSearch] = useState("");
  const [filterJenis, setFilterJenis] = useState<string>("semua");
  const [anggotaList, setAnggotaList] = useState<Anggota[]>([]);
  const [transaksiList, setTransaksiList] = useState<TransaksiSimpanan[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalJenis, setModalJenis] = useState<ModalJenis>(null);
  const [form, setForm] = useState(emptyForm());
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [detailItem, setDetailItem] = useState<TransaksiSimpanan | null>(null);
  const [detailDateFrom, setDetailDateFrom] = useState("");
  const [detailDateTo, setDetailDateTo] = useState("");
  const [detailKategori, setDetailKategori] = useState<string>("semua");

  useEffect(() => {
    Promise.all([fetchAnggota(), fetchTransaksiSimpanan()])
      .then(([a, t]) => {
        setAnggotaList(a);
        setTransaksiList(t);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const refreshData = async () => {
    const [a, t] = await Promise.all([fetchAnggota(), fetchTransaksiSimpanan()]);
    setAnggotaList(a);
    setTransaksiList(t);
  };

  const openModal = (jenis: "setoran" | "pengambilan") => {
    setForm(emptyForm());
    setSubmitError(null);
    setModalJenis(jenis);
  };

  const closeModal = useCallback(() => {
    setModalJenis(null);
    setSubmitError(null);
  }, []);

  useEffect(() => {
    if (!modalJenis) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") { e.preventDefault(); closeModal(); }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [modalJenis, closeModal]);

  const selectedAnggota = useMemo(
    () => anggotaList.find((a) => a.id === form.anggotaId) ?? null,
    [anggotaList, form.anggotaId]
  );

  const filteredModalAnggota = useMemo(() => {
    const q = form.anggotaQuery.trim().toLowerCase();
    return anggotaList.filter((a) => {
      if (!q) return true;
      return (
        a.nama.toLowerCase().includes(q) ||
        a.nrp.toLowerCase().includes(q) ||
        a.nomorAnggota.toLowerCase().includes(q)
      );
    });
  }, [anggotaList, form.anggotaQuery]);

  const handleSubmitModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalJenis || !selectedAnggota) {
      setSubmitError("Pilih anggota terlebih dahulu.");
      return;
    }
    const jumlahNum = Number(stripThousands(form.jumlah));
    if (!Number.isFinite(jumlahNum) || jumlahNum <= 0) {
      setSubmitError("Jumlah harus berupa angka positif.");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      await insertTransaksiSimpanan({
        tanggal: new Date().toISOString().slice(0, 10),
        anggotaId: selectedAnggota.id,
        namaAnggota: selectedAnggota.nama,
        jenis: modalJenis,
        kategori: form.kategori,
        jumlah: jumlahNum,
        keterangan: form.keterangan.trim(),
      });
      await refreshData();
      setModalJenis(null);
      setSubmitError(null);
    } catch (err) {
      console.error(err);
      setSubmitError(err instanceof Error ? err.message : "Gagal menyimpan transaksi.");
    } finally {
      setSubmitting(false);
    }
  };

  const openDetail = useCallback((t: TransaksiSimpanan) => {
    setDetailItem(t);
    setDetailDateFrom("");
    setDetailDateTo("");
    setDetailKategori("semua");
  }, []);

  const detailTransactions = useMemo(() => {
    if (!detailItem) return [];
    return transaksiList.filter((t) => {
      if (t.namaAnggota !== detailItem.namaAnggota) return false;
      if (detailKategori !== "semua" && t.kategori !== detailKategori) return false;
      if (detailDateFrom && t.tanggal < detailDateFrom) return false;
      if (detailDateTo && t.tanggal > detailDateTo) return false;
      return true;
    });
  }, [detailItem, transaksiList, detailKategori, detailDateFrom, detailDateTo]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-accent-400 animate-spin" />
        <span className="ml-3 text-navy-300">Memuat data simpanan...</span>
      </div>
    );
  }

  const filtered = transaksiList.filter((t) => {
    const matchSearch = t.namaAnggota.toLowerCase().includes(search.toLowerCase());
    const matchJenis = filterJenis === "semua" || t.jenis === filterJenis;
    return matchSearch && matchJenis;
  });

  const totalSetoran = transaksiList
    .filter((t) => t.jenis === "setoran")
    .reduce((s, t) => s + t.jumlah, 0);
  const totalPengambilan = transaksiList
    .filter((t) => t.jenis === "pengambilan")
    .reduce((s, t) => s + t.jumlah, 0);
  const totalSimpananAll = anggotaList.reduce(
    (s, a) => s + a.simpananPokok + a.simpananWajib + a.simpananSukarela,
    0
  );

  const modalTitle =
    modalJenis === "setoran"
      ? "Setoran Simpanan"
      : modalJenis === "pengambilan"
        ? "Pengambilan Simpanan"
        : "";

  return (
    <div className="space-y-6">
      {modalJenis && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
          role="presentation"
          onClick={(ev) => {
            if (ev.target === ev.currentTarget && !submitting) closeModal();
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-navy-700 bg-navy-900 shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="simpanan-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-navy-700 px-5 py-4">
              <h2 id="simpanan-modal-title" className="text-lg font-semibold text-white">
                {modalTitle}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                disabled={submitting}
                className="rounded-lg p-1.5 text-navy-400 hover:bg-navy-800 hover:text-white transition-colors disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                aria-label="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitModal} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-navy-400 uppercase tracking-wide mb-1.5">
                  Anggota
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400 pointer-events-none" />
                  <input
                    type="text"
                    value={form.anggotaQuery}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, anggotaQuery: e.target.value, anggotaId: "" }))
                    }
                    placeholder="Cari nama, NRP/NIP, atau nomor anggota..."
                    className="w-full rounded-xl border border-navy-700 bg-navy-800 pl-9 pr-3 py-2.5 text-sm text-white placeholder-navy-400 outline-none focus:border-accent-500/50 focus:ring-1 focus:ring-accent-500/30"
                  />
                </div>
                {selectedAnggota ? (
                  <p className="mt-2 text-sm text-success-400">
                    Dipilih: {selectedAnggota.nama} ({selectedAnggota.nomorAnggota})
                  </p>
                ) : null}
                <ul className="mt-2 max-h-40 overflow-y-auto rounded-xl border border-navy-700 bg-navy-800/80 divide-y divide-navy-700/50">
                  {filteredModalAnggota.length === 0 ? (
                    <li className="px-3 py-3 text-sm text-navy-400 text-center">
                      Tidak ada anggota yang cocok.
                    </li>
                  ) : (
                    filteredModalAnggota.map((a) => (
                      <li key={a.id}>
                        <button
                          type="button"
                          onClick={() =>
                            setForm((f) => ({
                              ...f,
                              anggotaId: a.id,
                              anggotaQuery: `${a.nama} — ${a.nomorAnggota}`,
                            }))
                          }
                          className={`w-full text-left px-3 py-2.5 text-sm transition-colors cursor-pointer ${
                            form.anggotaId === a.id
                              ? "bg-accent-600/20 text-accent-300"
                              : "text-navy-200 hover:bg-navy-700/50 text-white"
                          }`}
                        >
                          <span className="font-medium">{a.nama}</span>
                          <span className="text-navy-400 text-xs block">
                            {a.nomorAnggota} · {a.nrp}
                          </span>
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              </div>

              <div>
                <label className="block text-xs font-medium text-navy-400 uppercase tracking-wide mb-1.5">
                  Kategori
                </label>
                <select
                  value={form.kategori}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      kategori: e.target.value as TransaksiSimpanan["kategori"],
                    }))
                  }
                  className="w-full appearance-none rounded-xl border border-navy-700 bg-navy-800 px-3 py-2.5 pr-10 text-sm text-white outline-none cursor-pointer focus:border-accent-500/50"
                >
                  <option value="pokok">Pokok</option>
                  <option value="wajib">Wajib</option>
                  <option value="sukarela">Sukarela</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-navy-400 uppercase tracking-wide mb-1.5">
                  Jumlah (Rp)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={form.jumlah}
                  onChange={(e) => setForm((f) => ({ ...f, jumlah: stripThousands(e.target.value).replace(/\D/g, "") }))}
                  onBlur={(e) => setForm((f) => ({ ...f, jumlah: formatThousands(e.target.value) }))}
                  onFocus={(e) => setForm((f) => ({ ...f, jumlah: stripThousands(e.target.value) }))}
                  placeholder="0"
                  className="w-full rounded-xl border border-navy-700 bg-navy-800 px-3 py-2.5 text-sm text-white placeholder-navy-400 outline-none focus:border-accent-500/50 focus:ring-1 focus:ring-accent-500/30"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-navy-400 uppercase tracking-wide mb-1.5">
                  Keterangan
                </label>
                <textarea
                  value={form.keterangan}
                  onChange={(e) => setForm((f) => ({ ...f, keterangan: e.target.value }))}
                  rows={3}
                  placeholder="Opsional"
                  className="w-full resize-none rounded-xl border border-navy-700 bg-navy-800 px-3 py-2.5 text-sm text-white placeholder-navy-400 outline-none focus:border-accent-500/50 focus:ring-1 focus:ring-accent-500/30"
                />
              </div>

              {submitError ? (
                <p className="text-sm text-red-400 bg-red-950/40 border border-red-900/50 rounded-xl px-3 py-2">
                  {submitError}
                </p>
              ) : null}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={submitting}
                  className="flex-1 rounded-xl border border-navy-600 bg-navy-800 py-2.5 text-sm font-medium text-navy-200 hover:bg-navy-700 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-accent-500 hover:bg-accent-600 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    "Simpan"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DetailPopup
        open={!!detailItem}
        onClose={() => setDetailItem(null)}
        title={`Rincian Simpanan — ${detailItem?.namaAnggota || ""}`}
        filename={`simpanan-${detailItem?.namaAnggota?.replace(/\s+/g, "_") || "detail"}`}
      >
        {detailItem && (
          <>
            <h3 className="text-base font-bold text-white text-center mb-1">RINCIAN TRANSAKSI SIMPANAN</h3>
            <p className="text-xs text-navy-400 text-center mb-4">PRIMKOPPOL RESOR SUBANG</p>

            <div className="flex flex-wrap gap-2 mb-4">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-navy-400" />
                <input
                  type="date"
                  value={detailDateFrom}
                  onChange={(e) => setDetailDateFrom(e.target.value)}
                  className="bg-navy-800 border border-navy-600/50 rounded-lg px-2 py-1 text-xs text-white outline-none"
                  title="Dari tanggal"
                />
                <span className="text-navy-400 text-xs">s/d</span>
                <input
                  type="date"
                  value={detailDateTo}
                  onChange={(e) => setDetailDateTo(e.target.value)}
                  className="bg-navy-800 border border-navy-600/50 rounded-lg px-2 py-1 text-xs text-white outline-none"
                  title="Sampai tanggal"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-navy-400" />
                <select
                  value={detailKategori}
                  onChange={(e) => setDetailKategori(e.target.value)}
                  className="bg-navy-800 border border-navy-600/50 rounded-lg px-2 py-1 text-xs text-white outline-none cursor-pointer"
                >
                  <option value="semua">Semua Kategori</option>
                  <option value="pokok">Pokok</option>
                  <option value="wajib">Wajib</option>
                  <option value="sukarela">Sukarela</option>
                </select>
              </div>
            </div>

            <div className="border-t border-navy-700/50 pt-3 space-y-2 mb-3">
              <div className="flex justify-between">
                <span className="text-navy-400">Nama Anggota</span>
                <span className="font-medium">{detailItem.namaAnggota}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-navy-400">Total Transaksi</span>
                <span className="font-medium">{detailTransactions.length} transaksi</span>
              </div>
            </div>

            {detailTransactions.length > 0 ? (
              <div className="border border-navy-700/40 rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-navy-800/80 border-b border-navy-600/40">
                      <th className="text-left px-2 py-1.5 text-navy-300 font-semibold">Tanggal</th>
                      <th className="text-left px-2 py-1.5 text-navy-300 font-semibold">Jenis</th>
                      <th className="text-left px-2 py-1.5 text-navy-300 font-semibold">Kategori</th>
                      <th className="text-right px-2 py-1.5 text-navy-300 font-semibold">Jumlah</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailTransactions.map((dt) => (
                      <tr key={dt.id} className="border-b border-navy-800/50">
                        <td className="px-2 py-1.5 text-navy-300">
                          {new Date(dt.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                        </td>
                        <td className="px-2 py-1.5">
                          <span className={dt.jenis === "setoran" ? "text-success-400" : "text-warning-400"}>
                            {dt.jenis === "setoran" ? "Setoran" : "Pengambilan"}
                          </span>
                        </td>
                        <td className="px-2 py-1.5 text-navy-300 capitalize">{dt.kategori}</td>
                        <td className={`px-2 py-1.5 text-right font-medium ${dt.jenis === "setoran" ? "text-success-400" : "text-warning-400"}`}>
                          {dt.jenis === "setoran" ? "+" : "-"}{formatRupiah(dt.jumlah)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-navy-400 text-xs py-4">Tidak ada transaksi untuk filter ini.</p>
            )}

            {detailTransactions.length > 0 && (() => {
              const totalSetor = detailTransactions.filter(d => d.jenis === "setoran").reduce((s, d) => s + d.jumlah, 0);
              const totalAmbil = detailTransactions.filter(d => d.jenis === "pengambilan").reduce((s, d) => s + d.jumlah, 0);
              return (
                <div className="border-t-2 border-navy-600 pt-3 mt-3 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-navy-400">Total Setoran</span>
                    <span className="text-success-400 font-medium">+{formatRupiah(totalSetor)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-navy-400">Total Pengambilan</span>
                    <span className="text-warning-400 font-medium">-{formatRupiah(totalAmbil)}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-1 border-t border-navy-700/50">
                    <span className="font-bold text-white">SALDO BERSIH</span>
                    <span className={`font-bold ${totalSetor - totalAmbil >= 0 ? "text-success-400" : "text-danger-400"}`}>
                      {formatRupiah(totalSetor - totalAmbil)}
                    </span>
                  </div>
                </div>
              );
            })()}
          </>
        )}
      </DetailPopup>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Total Simpanan" value={formatRupiah(totalSimpananAll)} icon={Wallet} color="blue" />
        <StatCard title="Total Setoran" value={formatRupiah(totalSetoran)} icon={ArrowUpCircle} color="green" />
        <StatCard title="Total Pengambilan" value={formatRupiah(totalPengambilan)} icon={ArrowDownCircle} color="amber" />
        <StatCard title="Net Simpanan" value={formatRupiah(totalSetoran - totalPengambilan)} icon={TrendingUp} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-navy-900/80 rounded-2xl border border-navy-700/30 p-5">
          <h3 className="text-base font-semibold text-white mb-4">Input Transaksi Cepat</h3>
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => openModal("setoran")}
              className="w-full flex items-center gap-3 bg-success-600/10 border border-success-600/20 hover:bg-success-600/20 rounded-xl p-4 transition-colors cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-success-500/20 flex items-center justify-center">
                <ArrowUpCircle className="w-5 h-5 text-success-400" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-white">Setoran Simpanan</p>
                <p className="text-xs text-navy-400">Setoran wajib, sukarela, atau pokok</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => openModal("pengambilan")}
              className="w-full flex items-center gap-3 bg-warning-600/10 border border-warning-600/20 hover:bg-warning-600/20 rounded-xl p-4 transition-colors cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-warning-500/20 flex items-center justify-center">
                <ArrowDownCircle className="w-5 h-5 text-warning-400" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-white">Pengambilan Simpanan</p>
                <p className="text-xs text-navy-400">Tarik simpanan sukarela</p>
              </div>
            </button>
          </div>
        </div>

        <div className="lg:col-span-2 bg-navy-900/80 rounded-2xl border border-navy-700/30 p-5">
          <h3 className="text-base font-semibold text-white mb-4">Ringkasan per Kategori</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { label: "Simpanan Pokok", total: anggotaList.reduce((s, a) => s + a.simpananPokok, 0), color: "accent" },
              { label: "Simpanan Wajib", total: anggotaList.reduce((s, a) => s + a.simpananWajib, 0), color: "success" },
              { label: "Simpanan Sukarela", total: anggotaList.reduce((s, a) => s + a.simpananSukarela, 0), color: "warning" },
            ].map((item, i) => (
              <div key={i} className="bg-navy-800/50 rounded-xl p-4 md:text-center flex md:block items-center justify-between">
                <p className="text-xs text-navy-400 md:mb-2">{item.label}</p>
                <p className="text-base md:text-lg font-bold text-white">{formatRupiah(item.total)}</p>
                <p className="text-xs text-navy-400 mt-1">{anggotaList.length} anggota</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-navy-900/80 rounded-2xl border border-navy-700/30 overflow-hidden">
        <div className="p-5 border-b border-navy-700/30">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Riwayat Transaksi Simpanan</h3>
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="flex items-center bg-navy-800 rounded-xl px-3 py-2 gap-2 border border-navy-700/50 flex-1 sm:flex-initial">
                <Search className="w-4 h-4 text-navy-400" />
                <input type="text" placeholder="Cari anggota..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-transparent text-sm text-white placeholder-navy-400 outline-none w-full sm:w-40" />
              </div>
              <div className="relative">
                <select value={filterJenis} onChange={(e) => setFilterJenis(e.target.value)} className="appearance-none bg-navy-800 border border-navy-700/50 rounded-xl px-3 py-2 pr-8 text-sm text-white outline-none cursor-pointer">
                  <option value="semua">Semua</option>
                  <option value="setoran">Setoran</option>
                  <option value="pengambilan">Pengambilan</option>
                </select>
                <ChevronDown className="w-4 h-4 text-navy-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-navy-800/80 sticky top-0">
              <tr className="border-b border-navy-600/40">
                <th className="text-left text-xs font-semibold text-navy-200 uppercase tracking-wider px-5 py-3">Tanggal</th>
                <th className="text-left text-xs font-semibold text-navy-200 uppercase tracking-wider px-5 py-3">Anggota</th>
                <th className="text-left text-xs font-semibold text-navy-200 uppercase tracking-wider px-5 py-3">Jenis</th>
                <th className="text-left text-xs font-semibold text-navy-200 uppercase tracking-wider px-5 py-3">Kategori</th>
                <th className="text-right text-xs font-semibold text-navy-200 uppercase tracking-wider px-5 py-3">Jumlah</th>
                <th className="text-left text-xs font-semibold text-navy-200 uppercase tracking-wider px-5 py-3">Keterangan</th>
                <th className="text-center text-xs font-semibold text-navy-200 uppercase tracking-wider px-5 py-3">Rincian</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id} className="border-b border-navy-800/50 hover:bg-navy-800/30 transition-colors">
                  <td className="px-5 py-3 text-sm text-navy-300">
                    {new Date(t.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-5 py-3 text-sm font-medium text-white">{t.namaAnggota}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${
                      t.jenis === "setoran"
                        ? "bg-success-600/20 text-success-400 border border-success-600/30"
                        : "bg-warning-600/20 text-warning-400 border border-warning-600/30"
                    }`}>
                      {t.jenis === "setoran" ? <ArrowUpCircle className="w-3 h-3" /> : <ArrowDownCircle className="w-3 h-3" />}
                      {t.jenis === "setoran" ? "Setoran" : "Pengambilan"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm text-navy-300 capitalize">{t.kategori}</td>
                  <td className={`px-5 py-3 text-sm font-bold text-right ${
                    t.jenis === "setoran" ? "text-success-400" : "text-warning-400"
                  }`}>
                    {t.jenis === "setoran" ? "+" : "-"}{formatRupiah(t.jumlah)}
                  </td>
                  <td className="px-5 py-3 text-sm text-navy-400">{t.keterangan}</td>
                  <td className="px-5 py-3 text-center">
                    <button type="button" onClick={() => openDetail(t)} className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg bg-accent-500/15 text-accent-400 hover:bg-accent-500/25 transition-colors cursor-pointer">
                      <Eye className="w-3.5 h-3.5" /> Detail
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
