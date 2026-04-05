"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Receipt,
  Search,
  Printer,
  CheckCircle2,
  Clock,
  XCircle,
  FileDown,
  ChevronDown,
  Loader2,
  Eye,
  FileText,
  ClipboardList,
  PenLine,
  AlertTriangle,
  Save,
} from "lucide-react";
import StatCard from "./StatCard";
import { formatRupiah } from "@/data/mock";
import type { Potongan } from "@/data/mock";
import { fetchPotongan, exportCSV } from "@/lib/fetchers";
import DetailPopup from "./DetailPopup";

function statusLabel(s: string): string {
  switch (s) {
    case "terkirim": return "Terkirim";
    case "proses": return "Proses";
    case "gagal": return "Gagal";
    default: return s;
  }
}

interface PotonganPageProps {
  activeTab?: string;
}

export default function PotonganPage({ activeTab = "potongan" }: PotonganPageProps) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("semua");
  const [potonganList, setPotonganList] = useState<Potongan[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailItem, setDetailItem] = useState<Potongan | null>(null);
  const [gagalPopup, setGagalPopup] = useState(false);
  const [prosesPopup, setProsesPopup] = useState(false);
  const [koreksiItem, setKoreksiItem] = useState<Potongan | null>(null);
  const [koreksiSaved, setKoreksiSaved] = useState(false);
  const [cetakBulan, setCetakBulan] = useState<string>("");
  const [cetakStatus, setCetakStatus] = useState<string>("semua");
  const [cetakSearch, setCetakSearch] = useState<string>("");
  const [koreksiSearch, setKoreksiSearch] = useState("");
  const [koreksiTab, setKoreksiTab] = useState<"simpanan" | "pinjaman">("simpanan");
  const [simpananRows, setSimpananRows] = useState([
    { kode: "PO", jenis: "Pokok", saldo: 0, potongan: "", persen: "0" },
    { kode: "WA", jenis: "Wajib", saldo: 0, potongan: "", persen: "0" },
    { kode: "SS", jenis: "Sukarela", saldo: 0, potongan: "", persen: "0" },
    { kode: "LL", jenis: "Lain-lain", saldo: 0, potongan: "", persen: "0" },
    { kode: "SH", jenis: "SHU", saldo: 0, potongan: "", persen: "0" },
  ]);
  const [pinjamanRows, setPinjamanRows] = useState([
    { kode: "BJ", keterangan: "BANK BJB", noRek: "BJB", tglPot: "1", pokok: "", jasa: "", deskripsi: "PINJAMAN BARU" },
    { kode: "SD", keterangan: "SANDANG", noRek: "1A", tglPot: "1", pokok: "", jasa: "", deskripsi: "KEWENANGAN" },
    { kode: "SP", keterangan: "UANG", noRek: "SP1", tglPot: "1", pokok: "", jasa: "", deskripsi: "BARU" },
    { kode: "SP", keterangan: "UANG", noRek: "SP2", tglPot: "1", pokok: "", jasa: "", deskripsi: "BARU" },
  ]);

  useEffect(() => {
    fetchPotongan()
      .then(setPotonganList)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!koreksiItem && !detailItem && !gagalPopup && !prosesPopup) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        if (prosesPopup) { setProsesPopup(false); return; }
        if (gagalPopup) { setGagalPopup(false); return; }
        if (koreksiItem) { setKoreksiItem(null); setKoreksiSaved(false); return; }
        if (detailItem) setDetailItem(null);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [koreksiItem, detailItem, gagalPopup, prosesPopup]);

  const openKoreksi = (p: Potongan) => {
    setKoreksiItem(p);
    setKoreksiTab("simpanan");
    setSimpananRows([
      { kode: "PO", jenis: "Pokok", saldo: 5000, potongan: "0", persen: "0" },
      { kode: "WA", jenis: "Wajib", saldo: p.simpananWajib, potongan: String(p.simpananWajib), persen: "0" },
      { kode: "SS", jenis: "Sukarela", saldo: 0, potongan: "0", persen: "0" },
      { kode: "LL", jenis: "Lain-lain", saldo: 0, potongan: "0", persen: "0" },
      { kode: "SH", jenis: "SHU", saldo: 0, potongan: "0", persen: "0" },
    ]);
    setPinjamanRows([
      { kode: "BJ", keterangan: "BANK BJB", noRek: "BJB", tglPot: "1", pokok: String(p.angsuranPinjaman), jasa: String(p.jasaPinjaman), deskripsi: "PINJAMAN BARU" },
      { kode: "SD", keterangan: "SANDANG", noRek: "1A", tglPot: "1", pokok: "0", jasa: "0", deskripsi: "KEWENANGAN" },
      { kode: "SP", keterangan: "UANG", noRek: "SP1", tglPot: "1", pokok: "0", jasa: "0", deskripsi: "BARU" },
      { kode: "SP", keterangan: "UANG", noRek: "SP2", tglPot: "1", pokok: "0", jasa: "0", deskripsi: "BARU" },
    ]);
    setKoreksiSaved(false);
  };

  const totalSimpanan = simpananRows.reduce((s, r) => s + r.saldo, 0);
  const totalPotonganSimpanan = simpananRows.reduce((s, r) => s + (Number(r.potongan) || 0), 0);
  const totalPokokPinjaman = pinjamanRows.reduce((s, r) => s + (Number(r.pokok) || 0), 0);
  const totalJasaPinjaman = pinjamanRows.reduce((s, r) => s + (Number(r.jasa) || 0), 0);

  const saveKoreksi = () => {
    if (!koreksiItem) return;
    const newSimpWajib = Number(simpananRows.find((r) => r.kode === "WA")?.potongan) || 0;
    const newAngsuran = totalPokokPinjaman;
    const newJasa = totalJasaPinjaman;
    setPotonganList((prev) =>
      prev.map((p) =>
        p.id === koreksiItem.id
          ? { ...p, simpananWajib: newSimpWajib, angsuranPinjaman: newAngsuran, jasaPinjaman: newJasa, totalPotongan: totalPotonganSimpanan + newAngsuran + newJasa }
          : p
      )
    );
    setKoreksiSaved(true);
  };

  const rekapPerBulan = useMemo(() => {
    const map: Record<string, { bulan: string; total: number; count: number; simpWajib: number; angsuran: number; jasa: number }> = {};
    potonganList.forEach((p) => {
      if (!map[p.bulan]) map[p.bulan] = { bulan: p.bulan, total: 0, count: 0, simpWajib: 0, angsuran: 0, jasa: 0 };
      map[p.bulan].total += p.totalPotongan;
      map[p.bulan].count += 1;
      map[p.bulan].simpWajib += p.simpananWajib;
      map[p.bulan].angsuran += p.angsuranPinjaman;
      map[p.bulan].jasa += p.jasaPinjaman;
    });
    return Object.values(map).sort((a, b) => b.bulan.localeCompare(a.bulan));
  }, [potonganList]);

  const availableBulans = useMemo(() => {
    const set = new Set<string>();
    potonganList.forEach((p) => set.add(p.bulan));
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [potonganList]);

  const cetakFiltered = useMemo(() => {
    const q = cetakSearch.toLowerCase();
    return potonganList.filter((p) => {
      const matchBulan = !cetakBulan || p.bulan === cetakBulan;
      const matchStatus = cetakStatus === "semua" || p.status === cetakStatus;
      const matchSearch = !q || p.namaAnggota.toLowerCase().includes(q) || p.anggotaId.toLowerCase().includes(q);
      return matchBulan && matchStatus && matchSearch;
    });
  }, [potonganList, cetakBulan, cetakStatus, cetakSearch]);

  const handleCetakDaftarPotongan = () => {
    const data = cetakFiltered;
    const totalSW = data.reduce((s, p) => s + p.simpananWajib, 0);
    const totalAP = data.reduce((s, p) => s + p.angsuranPinjaman, 0);
    const totalJP = data.reduce((s, p) => s + p.jasaPinjaman, 0);
    const totalAll = data.reduce((s, p) => s + p.totalPotongan, 0);
    const periodeLabel = cetakBulan || "Semua Periode";

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`<!DOCTYPE html>
<html><head><title>Daftar Potongan - ${periodeLabel}</title>
<style>
  body { font-family: Arial, sans-serif; padding: 20px; color: #111; }
  h1 { font-size: 18px; margin-bottom: 4px; }
  h2 { font-size: 13px; color: #666; margin-bottom: 16px; font-weight: normal; }
  .org { font-size: 14px; color: #333; margin-bottom: 2px; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  th { background: #f0f0f0; border: 1px solid #ccc; padding: 6px 8px; text-align: left; font-weight: 600; }
  td { border: 1px solid #ddd; padding: 5px 8px; }
  tr:nth-child(even) { background: #fafafa; }
  .text-right { text-align: right; }
  .text-center { text-align: center; }
  .bold { font-weight: 700; }
  .summary { margin-top: 16px; font-size: 12px; }
  .summary span { font-weight: 600; }
  tfoot td { font-weight: 700; border-top: 2px solid #333; }
  @media print { body { padding: 0; } }
</style></head><body>
<p class="org">PRIMKOPPOL RESOR SUBANG</p>
<h1>DAFTAR POTONGAN GAJI ANGGOTA</h1>
<h2>Periode: ${periodeLabel}${cetakStatus !== "semua" ? ` — Status: ${statusLabel(cetakStatus)}` : ""} — Dicetak: ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</h2>
<table>
  <thead><tr>
    <th>No</th><th>Nama Anggota</th><th>ID Anggota</th><th>Bulan</th>
    <th class="text-right">Simp. Wajib</th><th class="text-right">Angs. Pinjaman</th>
    <th class="text-right">Jasa Pinjaman</th><th class="text-right">Total Potongan</th>
    <th class="text-center">Status</th>
  </tr></thead>
  <tbody>${data.map((p, i) => `<tr>
    <td>${i + 1}</td><td>${p.namaAnggota}</td><td>${p.anggotaId}</td><td>${p.bulan}</td>
    <td class="text-right">${formatRupiah(p.simpananWajib)}</td>
    <td class="text-right">${formatRupiah(p.angsuranPinjaman)}</td>
    <td class="text-right">${formatRupiah(p.jasaPinjaman)}</td>
    <td class="text-right bold">${formatRupiah(p.totalPotongan)}</td>
    <td class="text-center">${statusLabel(p.status)}</td>
  </tr>`).join("")}</tbody>
  <tfoot><tr>
    <td colspan="4">TOTAL (${data.length} anggota)</td>
    <td class="text-right">${formatRupiah(totalSW)}</td>
    <td class="text-right">${formatRupiah(totalAP)}</td>
    <td class="text-right">${formatRupiah(totalJP)}</td>
    <td class="text-right">${formatRupiah(totalAll)}</td>
    <td></td>
  </tr></tfoot>
</table>
<div class="summary">
  <p>Total Simpanan Wajib: <span>${formatRupiah(totalSW)}</span></p>
  <p>Total Angsuran Pinjaman: <span>${formatRupiah(totalAP)}</span></p>
  <p>Total Jasa Pinjaman: <span>${formatRupiah(totalJP)}</span></p>
  <p>Grand Total Potongan: <span>${formatRupiah(totalAll)}</span></p>
</div>
</body></html>`);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); }, 300);
  };

  const handleExportCetak = () => {
    const data = cetakFiltered;
    const headers = ["No", "Nama Anggota", "ID Anggota", "Bulan", "Simp Wajib", "Angs Pinjaman", "Jasa Pinjaman", "Total Potongan", "Status"];
    const rows = data.map((p, i) => [
      String(i + 1), p.namaAnggota, p.anggotaId, p.bulan,
      String(p.simpananWajib), String(p.angsuranPinjaman), String(p.jasaPinjaman),
      String(p.totalPotongan), statusLabel(p.status),
    ]);
    exportCSV(headers, rows, `daftar-potongan-${cetakBulan || "semua"}.csv`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-accent-400 animate-spin" />
        <span className="ml-3 text-navy-300">Memuat data potongan...</span>
      </div>
    );
  }

  const filtered = potonganList.filter((p) => {
    const matchSearch = p.namaAnggota.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "semua" || p.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalPotongan = potonganList.reduce((s, p) => s + p.totalPotongan, 0);
  const terkirim = potonganList.filter((p) => p.status === "terkirim").length;
  const proses = potonganList.filter((p) => p.status === "proses").length;
  const gagal = potonganList.filter((p) => p.status === "gagal").length;

  const handleExport = () => {
    const headers = ["Anggota", "ID Anggota", "Bulan", "Simp Wajib", "Angs Pinjaman", "Jasa Pinjaman", "Total", "Status"];
    const rows = filtered.map((p) => [p.namaAnggota, p.anggotaId, p.bulan, String(p.simpananWajib), String(p.angsuranPinjaman), String(p.jasaPinjaman), String(p.totalPotongan), statusLabel(p.status)]);
    exportCSV(headers, rows, "potongan.csv");
  };

  const handlePrint = () => { window.print(); };

  const statusBadge = (s: string) => {
    switch (s) {
      case "terkirim":
        return (<span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-success-600/20 text-success-400 border border-success-600/30"><CheckCircle2 className="w-3 h-3" /> Terkirim</span>);
      case "proses":
        return (<span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-warning-600/20 text-warning-400 border border-warning-600/30"><Clock className="w-3 h-3" /> Proses</span>);
      case "gagal":
        return (<span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-danger-600/20 text-danger-400 border border-danger-600/30"><XCircle className="w-3 h-3" /> Gagal</span>);
      default: return null;
    }
  };

  if (activeTab === "potongan_cetak") {
    const cetakTotalSW = cetakFiltered.reduce((s, p) => s + p.simpananWajib, 0);
    const cetakTotalAP = cetakFiltered.reduce((s, p) => s + p.angsuranPinjaman, 0);
    const cetakTotalJP = cetakFiltered.reduce((s, p) => s + p.jasaPinjaman, 0);
    const cetakTotalAll = cetakFiltered.reduce((s, p) => s + p.totalPotongan, 0);

    return (
      <div className="space-y-6">
        <div className="bg-navy-900/80 rounded-2xl border border-navy-700/30 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-accent-500/20 flex items-center justify-center"><Printer className="w-6 h-6 text-accent-400" /></div>
            <div><h3 className="text-lg font-bold text-white">Pencetakan Daftar Potongan</h3><p className="text-sm text-navy-400">Cetak daftar potongan per periode bulan</p></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-xs font-medium text-navy-400 uppercase tracking-wide mb-1.5">Periode Bulan</label>
              <select value={cetakBulan} onChange={(e) => setCetakBulan(e.target.value)} className="w-full bg-navy-800 border border-navy-700/50 rounded-xl px-3 py-2.5 text-sm text-white outline-none cursor-pointer">
                <option value="">Semua Periode</option>
                {availableBulans.map((b) => {
                  const count = potonganList.filter((p) => p.bulan === b).length;
                  return <option key={b} value={b}>{b} ({count} data)</option>;
                })}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-navy-400 uppercase tracking-wide mb-1.5">Status</label>
              <select value={cetakStatus} onChange={(e) => setCetakStatus(e.target.value)} className="w-full bg-navy-800 border border-navy-700/50 rounded-xl px-3 py-2.5 text-sm text-white outline-none cursor-pointer">
                <option value="semua">Semua Status</option>
                <option value="terkirim">Terkirim</option>
                <option value="proses">Proses</option>
                <option value="gagal">Gagal</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-navy-400 uppercase tracking-wide mb-1.5">Cari Anggota</label>
              <input type="text" placeholder="Ketik nama anggota..." value={cetakSearch} onChange={(e) => setCetakSearch(e.target.value)} className="w-full bg-navy-800 border border-navy-700/50 rounded-xl px-3 py-2.5 text-sm text-white placeholder-navy-400 outline-none" />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={handleCetakDaftarPotongan} disabled={cetakFiltered.length === 0} className="flex items-center gap-2 bg-accent-500 hover:bg-accent-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer">
              <Printer className="w-4 h-4" /> Cetak Daftar Potongan
            </button>
            <button type="button" onClick={handleExportCetak} disabled={cetakFiltered.length === 0} className="flex items-center gap-2 bg-navy-700 hover:bg-navy-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer">
              <FileDown className="w-4 h-4" /> Export CSV
            </button>
          </div>
        </div>

        <div className="bg-navy-900/80 rounded-2xl border border-navy-700/30 overflow-hidden">
          <div className="p-5 border-b border-navy-700/30">
            <h3 className="text-base font-semibold text-white">
              Preview Data — {cetakBulan || "Semua Periode"}
            </h3>
            <p className="text-sm text-navy-400 mt-1">
              <span className="text-white font-medium">{cetakFiltered.length}</span> data potongan ditemukan
              {cetakStatus !== "semua" && <> — Status: <span className="text-white font-medium">{statusLabel(cetakStatus)}</span></>}
            </p>
          </div>

          {cetakFiltered.length > 0 ? (
            <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
              <table className="w-full">
                <thead className="bg-navy-800/80 sticky top-0">
                  <tr className="border-b border-navy-600/40">
                    <th className="text-left text-xs font-semibold text-navy-200 uppercase tracking-wider px-5 py-3">No</th>
                    <th className="text-left text-xs font-semibold text-navy-200 uppercase tracking-wider px-5 py-3">Nama Anggota</th>
                    <th className="text-left text-xs font-semibold text-navy-200 uppercase tracking-wider px-5 py-3">ID</th>
                    <th className="text-left text-xs font-semibold text-navy-200 uppercase tracking-wider px-5 py-3">Bulan</th>
                    <th className="text-right text-xs font-semibold text-navy-200 uppercase tracking-wider px-5 py-3">Simp. Wajib</th>
                    <th className="text-right text-xs font-semibold text-navy-200 uppercase tracking-wider px-5 py-3">Angs. Pinjaman</th>
                    <th className="text-right text-xs font-semibold text-navy-200 uppercase tracking-wider px-5 py-3">Jasa Pinjaman</th>
                    <th className="text-right text-xs font-semibold text-navy-200 uppercase tracking-wider px-5 py-3">Total</th>
                    <th className="text-center text-xs font-semibold text-navy-200 uppercase tracking-wider px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {cetakFiltered.map((p, i) => (
                    <tr key={p.id} className="border-b border-navy-800/50 hover:bg-navy-800/30 transition-colors">
                      <td className="px-5 py-3 text-sm text-navy-300">{i + 1}</td>
                      <td className="px-5 py-3 text-sm font-medium text-white">{p.namaAnggota}</td>
                      <td className="px-5 py-3 text-sm text-navy-300">{p.anggotaId}</td>
                      <td className="px-5 py-3 text-sm text-navy-300">{p.bulan}</td>
                      <td className="px-5 py-3 text-sm text-white text-right">{formatRupiah(p.simpananWajib)}</td>
                      <td className="px-5 py-3 text-sm text-white text-right">{formatRupiah(p.angsuranPinjaman)}</td>
                      <td className="px-5 py-3 text-sm text-white text-right">{formatRupiah(p.jasaPinjaman)}</td>
                      <td className="px-5 py-3 text-sm text-accent-400 text-right font-bold">{formatRupiah(p.totalPotongan)}</td>
                      <td className="px-5 py-3 text-center">{statusBadge(p.status)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-navy-600">
                    <td colSpan={4} className="px-5 py-3 text-sm font-bold text-white">TOTAL ({cetakFiltered.length} anggota)</td>
                    <td className="px-5 py-3 text-sm font-bold text-white text-right">{formatRupiah(cetakTotalSW)}</td>
                    <td className="px-5 py-3 text-sm font-bold text-white text-right">{formatRupiah(cetakTotalAP)}</td>
                    <td className="px-5 py-3 text-sm font-bold text-white text-right">{formatRupiah(cetakTotalJP)}</td>
                    <td className="px-5 py-3 text-sm font-bold text-accent-400 text-right">{formatRupiah(cetakTotalAll)}</td>
                    <td className="px-5 py-3"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <Receipt className="w-12 h-12 mx-auto mb-3 text-navy-400 opacity-50" />
              <p className="text-base font-medium text-navy-300">Tidak ada data potongan</p>
              <p className="text-sm text-navy-400">Ubah periode bulan atau filter status untuk menampilkan data</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (activeTab === "potongan_struk") {
    return (
      <div className="space-y-6">
        <div className="bg-navy-900/80 rounded-2xl border border-navy-700/30 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-success-500/20 flex items-center justify-center"><FileText className="w-6 h-6 text-success-400" /></div>
            <div><h3 className="text-lg font-bold text-white">Pencetakan Struk Potongan</h3><p className="text-sm text-navy-400">Cetak struk potongan per anggota</p></div>
          </div>
          <div className="mb-6">
            <label className="block text-xs font-medium text-navy-400 uppercase tracking-wide mb-1.5">Cari Anggota</label>
            <div className="flex items-center bg-navy-800 rounded-xl px-3 py-2.5 gap-2 border border-navy-700/50">
              <Search className="w-4 h-4 text-navy-400" />
              <input type="text" placeholder="Ketik nama anggota..." className="bg-transparent text-sm text-white placeholder-navy-400 outline-none w-full" />
            </div>
          </div>
          <div className="space-y-2">
            {potonganList.slice(0, 10).map((p) => (
              <div key={p.id} className="flex items-center justify-between bg-navy-800/50 rounded-xl p-4 border border-navy-700/20">
                <div>
                  <p className="text-sm font-medium text-white">{p.namaAnggota}</p>
                  <p className="text-xs text-navy-400">{p.bulan} — Total: {formatRupiah(p.totalPotongan)}</p>
                </div>
                <button type="button" onClick={() => setDetailItem(p)} className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg bg-accent-500/15 text-accent-400 hover:bg-accent-500/25 transition-colors cursor-pointer">
                  <Printer className="w-3.5 h-3.5" /> Cetak Struk
                </button>
              </div>
            ))}
          </div>
        </div>
        <DetailPopup open={!!detailItem} onClose={() => setDetailItem(null)} title="Struk Potongan" filename={`struk-${detailItem?.namaAnggota?.replace(/\s+/g, "_") || "detail"}`}>
          {detailItem && (
            <>
              <h3 className="text-base font-bold text-white text-center mb-1">STRUK POTONGAN GAJI</h3>
              <p className="text-xs text-navy-400 text-center mb-4">PRIMKOPPOL RESOR SUBANG</p>
              <div className="border-t border-navy-700/50 pt-3 space-y-2">
                <div className="flex justify-between"><span className="text-navy-400">Nama</span><span className="font-medium">{detailItem.namaAnggota}</span></div>
                <div className="flex justify-between"><span className="text-navy-400">Bulan</span><span>{detailItem.bulan}</span></div>
                <div className="flex justify-between"><span className="text-navy-300">Simpanan Wajib</span><span>{formatRupiah(detailItem.simpananWajib)}</span></div>
                <div className="flex justify-between"><span className="text-navy-300">Angsuran Pinjaman</span><span>{formatRupiah(detailItem.angsuranPinjaman)}</span></div>
                <div className="flex justify-between"><span className="text-navy-300">Jasa Pinjaman</span><span>{formatRupiah(detailItem.jasaPinjaman)}</span></div>
              </div>
              <div className="border-t-2 border-navy-600 pt-3 mt-3 flex justify-between">
                <span className="font-bold text-white">TOTAL</span>
                <span className="font-bold text-accent-400">{formatRupiah(detailItem.totalPotongan)}</span>
              </div>
            </>
          )}
        </DetailPopup>
      </div>
    );
  }

  if (activeTab === "potongan_rekap") {
    return (
      <div className="space-y-6">
        <div className="bg-navy-900/80 rounded-2xl border border-navy-700/30 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center"><ClipboardList className="w-6 h-6 text-purple-400" /></div>
            <div><h3 className="text-lg font-bold text-white">Rekap Daftar Potongan</h3><p className="text-sm text-navy-400">Rekapitulasi potongan per periode bulan</p></div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-navy-800/80">
                <tr className="border-b border-navy-600/40">
                  <th className="text-left text-xs font-semibold text-navy-200 uppercase tracking-wider px-5 py-3">Bulan</th>
                  <th className="text-center text-xs font-semibold text-navy-200 uppercase tracking-wider px-5 py-3">Jml Anggota</th>
                  <th className="text-right text-xs font-semibold text-navy-200 uppercase tracking-wider px-5 py-3">Simp. Wajib</th>
                  <th className="text-right text-xs font-semibold text-navy-200 uppercase tracking-wider px-5 py-3">Angsuran</th>
                  <th className="text-right text-xs font-semibold text-navy-200 uppercase tracking-wider px-5 py-3">Jasa</th>
                  <th className="text-right text-xs font-semibold text-navy-200 uppercase tracking-wider px-5 py-3">Total</th>
                </tr>
              </thead>
              <tbody>
                {rekapPerBulan.map((r) => (
                  <tr key={r.bulan} className="border-b border-navy-800/50 hover:bg-navy-800/30 transition-colors">
                    <td className="px-5 py-3 text-sm font-medium text-white">{r.bulan}</td>
                    <td className="px-5 py-3 text-sm text-navy-300 text-center">{r.count}</td>
                    <td className="px-5 py-3 text-sm text-white text-right">{formatRupiah(r.simpWajib)}</td>
                    <td className="px-5 py-3 text-sm text-white text-right">{formatRupiah(r.angsuran)}</td>
                    <td className="px-5 py-3 text-sm text-white text-right">{formatRupiah(r.jasa)}</td>
                    <td className="px-5 py-3 text-sm text-accent-400 text-right font-bold">{formatRupiah(r.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === "potongan_koreksi") {
    const koreksiFiltered = koreksiSearch
      ? potonganList.filter((p) => p.namaAnggota.toLowerCase().includes(koreksiSearch.toLowerCase()))
      : potonganList;

    return (
      <div className="space-y-6">
        <div className="bg-navy-900/80 rounded-2xl border border-navy-700/30 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-warning-500/20 flex items-center justify-center"><PenLine className="w-6 h-6 text-warning-400" /></div>
            <div><h3 className="text-lg font-bold text-white">Koreksi Daftar Potongan</h3><p className="text-sm text-navy-400">Koreksi dan penyesuaian data potongan anggota</p></div>
          </div>
          <div className="bg-warning-600/10 border border-warning-600/30 rounded-xl p-4 mb-6 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-warning-400 shrink-0 mt-0.5" />
            <p className="text-sm text-warning-400">Perubahan data koreksi akan tercatat di log sistem. Pastikan data yang diubah sudah benar sebelum menyimpan.</p>
          </div>
          <div className="mb-4">
            <label className="block text-xs font-medium text-navy-400 uppercase tracking-wide mb-1.5">Cari Anggota untuk Dikoreksi</label>
            <div className="flex items-center bg-navy-800 rounded-xl px-3 py-2.5 gap-2 border border-navy-700/50">
              <Search className="w-4 h-4 text-navy-400" />
              <input type="text" placeholder="Ketik nama anggota..." value={koreksiSearch} onChange={(e) => setKoreksiSearch(e.target.value)} className="bg-transparent text-sm text-white placeholder-navy-400 outline-none w-full" />
            </div>
          </div>
          <div className="space-y-2">
            {koreksiFiltered.slice(0, 20).map((p) => (
              <div key={p.id} className="flex items-center justify-between bg-navy-800/50 rounded-xl p-4 border border-navy-700/20">
                <div>
                  <p className="text-sm font-medium text-white">{p.namaAnggota}</p>
                  <p className="text-xs text-navy-400">{p.bulan} — {statusLabel(p.status)} — Total: {formatRupiah(p.totalPotongan)}</p>
                </div>
                <button type="button" onClick={() => openKoreksi(p)} className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg bg-warning-500/15 text-warning-400 hover:bg-warning-500/25 transition-colors cursor-pointer">
                  <PenLine className="w-3.5 h-3.5" /> Koreksi
                </button>
              </div>
            ))}
            {koreksiFiltered.length === 0 && (
              <p className="text-sm text-navy-400 text-center py-6">Tidak ada data ditemukan.</p>
            )}
          </div>
        </div>

        {koreksiItem && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => { setKoreksiItem(null); setKoreksiSaved(false); }}>
            <div className="bg-navy-900 border border-navy-700/50 rounded-2xl w-full max-w-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-bold text-white mb-1">Koreksi Potongan</h3>
              <p className="text-xs text-navy-400 mb-4">{koreksiItem.namaAnggota} — {koreksiItem.bulan}</p>

              {koreksiSaved ? (
                <div className="text-center py-6">
                  <CheckCircle2 className="w-12 h-12 text-success-400 mx-auto mb-3" />
                  <p className="text-sm font-medium text-success-400 mb-1">Koreksi berhasil disimpan!</p>
                  <p className="text-xs text-navy-400 mb-4">Total Potongan Simpanan: {formatRupiah(totalPotonganSimpanan)} | Potongan Pokok: {formatRupiah(totalPokokPinjaman)} | Potongan Jasa: {formatRupiah(totalJasaPinjaman)}</p>
                  <button type="button" onClick={() => { setKoreksiItem(null); setKoreksiSaved(false); }} className="bg-accent-500 hover:bg-accent-600 text-white px-5 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer">Tutup</button>
                </div>
              ) : (
                <>
                  <div className="flex gap-2 mb-4">
                    <button type="button" onClick={() => setKoreksiTab("simpanan")} className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer ${koreksiTab === "simpanan" ? "bg-accent-500 text-white" : "bg-navy-800 text-navy-300 hover:bg-navy-700"}`}>Koreksi Simpanan</button>
                    <button type="button" onClick={() => setKoreksiTab("pinjaman")} className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer ${koreksiTab === "pinjaman" ? "bg-accent-500 text-white" : "bg-navy-800 text-navy-300 hover:bg-navy-700"}`}>Koreksi Pinjaman</button>
                  </div>

                  {koreksiTab === "simpanan" && (
                    <div>
                      <h4 className="text-sm font-bold text-accent-400 mb-3 uppercase tracking-wide">[ Simpanan ]</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-navy-800/80">
                            <tr className="border-b border-navy-600/40">
                              <th className="text-left text-xs font-semibold text-navy-200 uppercase tracking-wider px-3 py-2.5">Kode</th>
                              <th className="text-left text-xs font-semibold text-navy-200 uppercase tracking-wider px-3 py-2.5">Jenis</th>
                              <th className="text-right text-xs font-semibold text-navy-200 uppercase tracking-wider px-3 py-2.5">Saldo Simpanan</th>
                              <th className="text-right text-xs font-semibold text-navy-200 uppercase tracking-wider px-3 py-2.5">Potongan Bulan Ini</th>
                              <th className="text-right text-xs font-semibold text-navy-200 uppercase tracking-wider px-3 py-2.5">% Jasa/Tahun</th>
                            </tr>
                          </thead>
                          <tbody>
                            {simpananRows.map((row, i) => (
                              <tr key={row.kode} className="border-b border-navy-800/50">
                                <td className="px-3 py-2 text-sm font-mono font-bold text-warning-400">{row.kode}</td>
                                <td className="px-3 py-2 text-sm text-white">{row.jenis}</td>
                                <td className="px-3 py-2 text-sm text-white text-right">{formatRupiah(row.saldo)}</td>
                                <td className="px-3 py-2 text-right">
                                  <input type="number" value={row.potongan} onChange={(e) => { const v = e.target.value; setSimpananRows((prev) => prev.map((r, j) => j === i ? { ...r, potongan: v } : r)); }} className="w-28 bg-navy-800 border border-navy-600/50 rounded-lg px-2 py-1.5 text-sm text-white text-right outline-none focus:border-accent-500" />
                                </td>
                                <td className="px-3 py-2 text-right">
                                  <input type="text" value={row.persen} onChange={(e) => { const v = e.target.value; setSimpananRows((prev) => prev.map((r, j) => j === i ? { ...r, persen: v } : r)); }} className="w-16 bg-navy-800 border border-navy-600/50 rounded-lg px-2 py-1.5 text-sm text-white text-right outline-none focus:border-accent-500" />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="mt-3 flex justify-between items-center border-t-2 border-navy-600 pt-3">
                        <div className="text-sm"><span className="text-navy-400">Total Simpanan:</span> <span className="font-bold text-white ml-2">{formatRupiah(totalSimpanan)}</span></div>
                        <div className="text-sm"><span className="text-navy-400">Total Potongan:</span> <span className="font-bold text-accent-400 ml-2">{formatRupiah(totalPotonganSimpanan)}</span></div>
                      </div>
                    </div>
                  )}

                  {koreksiTab === "pinjaman" && (
                    <div>
                      <h4 className="text-sm font-bold text-success-400 mb-3 uppercase tracking-wide">[ Pinjaman ]</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-navy-800/80">
                            <tr className="border-b border-navy-600/40">
                              <th className="text-left text-xs font-semibold text-navy-200 uppercase tracking-wider px-3 py-2.5">Kd</th>
                              <th className="text-left text-xs font-semibold text-navy-200 uppercase tracking-wider px-3 py-2.5">Keterangan</th>
                              <th className="text-left text-xs font-semibold text-navy-200 uppercase tracking-wider px-3 py-2.5">No-Rek</th>
                              <th className="text-center text-xs font-semibold text-navy-200 uppercase tracking-wider px-3 py-2.5">Tgl-Pot</th>
                              <th className="text-right text-xs font-semibold text-navy-200 uppercase tracking-wider px-3 py-2.5">Pot. Pokok</th>
                              <th className="text-right text-xs font-semibold text-navy-200 uppercase tracking-wider px-3 py-2.5">Pot. Jasa</th>
                              <th className="text-left text-xs font-semibold text-navy-200 uppercase tracking-wider px-3 py-2.5">Deskripsi</th>
                            </tr>
                          </thead>
                          <tbody>
                            {pinjamanRows.map((row, i) => (
                              <tr key={`${row.kode}-${row.noRek}`} className="border-b border-navy-800/50">
                                <td className="px-3 py-2 text-sm font-mono font-bold text-success-400">{row.kode}</td>
                                <td className="px-3 py-2 text-sm text-white">{row.keterangan}</td>
                                <td className="px-3 py-2 text-sm text-navy-300">{row.noRek}</td>
                                <td className="px-3 py-2 text-center">
                                  <input type="text" value={row.tglPot} onChange={(e) => { const v = e.target.value; setPinjamanRows((prev) => prev.map((r, j) => j === i ? { ...r, tglPot: v } : r)); }} className="w-14 bg-navy-800 border border-navy-600/50 rounded-lg px-2 py-1.5 text-sm text-white text-center outline-none focus:border-accent-500" />
                                </td>
                                <td className="px-3 py-2 text-right">
                                  <input type="number" value={row.pokok} onChange={(e) => { const v = e.target.value; setPinjamanRows((prev) => prev.map((r, j) => j === i ? { ...r, pokok: v } : r)); }} className="w-24 bg-navy-800 border border-navy-600/50 rounded-lg px-2 py-1.5 text-sm text-white text-right outline-none focus:border-accent-500" />
                                </td>
                                <td className="px-3 py-2 text-right">
                                  <input type="number" value={row.jasa} onChange={(e) => { const v = e.target.value; setPinjamanRows((prev) => prev.map((r, j) => j === i ? { ...r, jasa: v } : r)); }} className="w-24 bg-navy-800 border border-navy-600/50 rounded-lg px-2 py-1.5 text-sm text-white text-right outline-none focus:border-accent-500" />
                                </td>
                                <td className="px-3 py-2">
                                  <input type="text" value={row.deskripsi} onChange={(e) => { const v = e.target.value; setPinjamanRows((prev) => prev.map((r, j) => j === i ? { ...r, deskripsi: v } : r)); }} className="w-full bg-navy-800 border border-navy-600/50 rounded-lg px-2 py-1.5 text-sm text-white font-bold outline-none focus:border-accent-500" />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="mt-3 flex justify-between items-center border-t-2 border-navy-600 pt-3">
                        <div className="text-sm"><span className="text-navy-400">Potongan Pokok:</span> <span className="font-bold text-white ml-2">{formatRupiah(totalPokokPinjaman)}</span></div>
                        <div className="text-sm"><span className="text-navy-400">Potongan Jasa:</span> <span className="font-bold text-accent-400 ml-2">{formatRupiah(totalJasaPinjaman)}</span></div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 mt-6">
                    <button type="button" onClick={() => { setKoreksiItem(null); setKoreksiSaved(false); }} className="flex-1 bg-navy-700 hover:bg-navy-600 text-white py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer">Batal</button>
                    <button type="button" onClick={saveKoreksi} className="flex-1 flex items-center justify-center gap-2 bg-warning-500 hover:bg-warning-600 text-white py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer">
                      <Save className="w-4 h-4" /> Simpan Koreksi
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (activeTab === "potongan_rekapitulasi") {
    const grandTotal = potonganList.reduce((s, p) => s + p.totalPotongan, 0);
    const grandSimpWajib = potonganList.reduce((s, p) => s + p.simpananWajib, 0);
    const grandAngsuran = potonganList.reduce((s, p) => s + p.angsuranPinjaman, 0);
    const grandJasa = potonganList.reduce((s, p) => s + p.jasaPinjaman, 0);

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard title="Total Potongan" value={formatRupiah(grandTotal)} icon={Receipt} color="blue" />
          <StatCard title="Total Simp. Wajib" value={formatRupiah(grandSimpWajib)} icon={CheckCircle2} color="green" />
          <StatCard title="Total Angsuran" value={formatRupiah(grandAngsuran)} icon={Clock} color="amber" />
          <StatCard title="Total Jasa" value={formatRupiah(grandJasa)} icon={FileText} color="purple" />
        </div>
        <div className="bg-navy-900/80 rounded-2xl border border-navy-700/30 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center"><ClipboardList className="w-6 h-6 text-cyan-400" /></div>
            <div><h3 className="text-lg font-bold text-white">Daftar Potongan (Rekapitulasi)</h3><p className="text-sm text-navy-400">Rekapitulasi lengkap seluruh potongan anggota</p></div>
          </div>
          <div className="flex gap-3 mb-4">
            <button type="button" onClick={() => window.print()} className="flex items-center gap-2 bg-accent-500 hover:bg-accent-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer">
              <Printer className="w-4 h-4" /> Cetak
            </button>
            <button type="button" onClick={handleExport} className="flex items-center gap-2 bg-navy-700 hover:bg-navy-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer">
              <FileDown className="w-4 h-4" /> Export CSV
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-navy-800/80">
                <tr className="border-b border-navy-600/40">
                  <th className="text-left text-xs font-semibold text-navy-200 uppercase tracking-wider px-5 py-3">No</th>
                  <th className="text-left text-xs font-semibold text-navy-200 uppercase tracking-wider px-5 py-3">Anggota</th>
                  <th className="text-left text-xs font-semibold text-navy-200 uppercase tracking-wider px-5 py-3">Bulan</th>
                  <th className="text-right text-xs font-semibold text-navy-200 uppercase tracking-wider px-5 py-3">Simp. Wajib</th>
                  <th className="text-right text-xs font-semibold text-navy-200 uppercase tracking-wider px-5 py-3">Angsuran</th>
                  <th className="text-right text-xs font-semibold text-navy-200 uppercase tracking-wider px-5 py-3">Jasa</th>
                  <th className="text-right text-xs font-semibold text-navy-200 uppercase tracking-wider px-5 py-3">Total</th>
                  <th className="text-center text-xs font-semibold text-navy-200 uppercase tracking-wider px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {potonganList.map((p, i) => (
                  <tr key={p.id} className="border-b border-navy-800/50 hover:bg-navy-800/30 transition-colors">
                    <td className="px-5 py-3 text-sm text-navy-400">{i + 1}</td>
                    <td className="px-5 py-3 text-sm font-medium text-white">{p.namaAnggota}</td>
                    <td className="px-5 py-3 text-sm text-navy-300">{p.bulan}</td>
                    <td className="px-5 py-3 text-sm text-white text-right">{formatRupiah(p.simpananWajib)}</td>
                    <td className="px-5 py-3 text-sm text-white text-right">{formatRupiah(p.angsuranPinjaman)}</td>
                    <td className="px-5 py-3 text-sm text-white text-right">{formatRupiah(p.jasaPinjaman)}</td>
                    <td className="px-5 py-3 text-sm text-accent-400 text-right font-bold">{formatRupiah(p.totalPotongan)}</td>
                    <td className="px-5 py-3 text-center">{statusBadge(p.status)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-navy-600">
                  <td colSpan={3} className="px-5 py-3 text-sm font-bold text-white">GRAND TOTAL</td>
                  <td className="px-5 py-3 text-sm font-bold text-white text-right">{formatRupiah(grandSimpWajib)}</td>
                  <td className="px-5 py-3 text-sm font-bold text-white text-right">{formatRupiah(grandAngsuran)}</td>
                  <td className="px-5 py-3 text-sm font-bold text-white text-right">{formatRupiah(grandJasa)}</td>
                  <td className="px-5 py-3 text-sm font-bold text-accent-400 text-right">{formatRupiah(grandTotal)}</td>
                  <td className="px-5 py-3"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DetailPopup
        open={!!detailItem}
        onClose={() => setDetailItem(null)}
        title="Rincian Potongan"
        filename={`potongan-${detailItem?.namaAnggota?.replace(/\s+/g, "_") || "detail"}`}
      >
        {detailItem && (
          <>
            <h3 className="text-base font-bold text-white text-center mb-1">RINCIAN POTONGAN GAJI</h3>
            <p className="text-xs text-navy-400 text-center mb-4">PRIMKOPPOL RESOR SUBANG</p>
            <div className="border-t border-navy-700/50 pt-3 space-y-2">
              <div className="flex justify-between"><span className="text-navy-400">Nama Anggota</span><span className="font-medium">{detailItem.namaAnggota}</span></div>
              <div className="flex justify-between"><span className="text-navy-400">ID Anggota</span><span>{detailItem.anggotaId}</span></div>
              <div className="flex justify-between"><span className="text-navy-400">Bulan</span><span>{detailItem.bulan}</span></div>
            </div>
            <div className="border-t border-navy-700/50 pt-3 mt-3 space-y-2">
              <h4 className="text-xs font-semibold text-navy-400 uppercase">Rincian Potongan</h4>
              <div className="flex justify-between"><span className="text-navy-300">Simpanan Wajib</span><span className="text-white">{formatRupiah(detailItem.simpananWajib)}</span></div>
              <div className="flex justify-between"><span className="text-navy-300">Angsuran Pinjaman</span><span className="text-white">{formatRupiah(detailItem.angsuranPinjaman)}</span></div>
              <div className="flex justify-between"><span className="text-navy-300">Jasa Pinjaman</span><span className="text-white">{formatRupiah(detailItem.jasaPinjaman)}</span></div>
            </div>
            <div className="border-t-2 border-navy-600 pt-3 mt-3 flex justify-between">
              <span className="font-bold text-white">TOTAL POTONGAN</span>
              <span className="font-bold text-accent-400">{formatRupiah(detailItem.totalPotongan)}</span>
            </div>
            <div className="border-t border-navy-700/50 pt-3 mt-3 flex justify-between">
              <span className="text-navy-400">Status</span>
              <span className={`font-medium ${detailItem.status === "terkirim" ? "text-success-400" : detailItem.status === "proses" ? "text-warning-400" : "text-danger-400"}`}>
                {statusLabel(detailItem.status)}
              </span>
            </div>
          </>
        )}
      </DetailPopup>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 print:hidden">
        <StatCard title="Total Potongan" value={formatRupiah(totalPotongan)} icon={Receipt} color="blue" />
        <StatCard title="Terkirim" value={terkirim.toString()} subtitle="potongan berhasil" icon={CheckCircle2} color="green" />
        <div className="bg-navy-900/80 rounded-2xl p-4 lg:p-5 border border-warning-500/20 hover:border-opacity-50 transition-all">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 lg:w-11 lg:h-11 rounded-xl bg-warning-500/15 flex items-center justify-center">
              <Clock className="w-5 h-5 text-warning-400" />
            </div>
          </div>
          <p className="text-xs lg:text-sm text-navy-300 mb-1">Dalam Proses</p>
          <p className="text-xl lg:text-2xl font-bold text-white">{proses}</p>
          <button type="button" onClick={() => setProsesPopup(true)} className="mt-2 text-xs font-medium text-warning-400 bg-warning-600/15 hover:bg-warning-600/25 border border-warning-600/30 px-3 py-1 rounded-lg transition-colors cursor-pointer">
            {proses > 0 ? `${proses} menunggu verifikasi →` : "Tidak ada dalam proses"}
          </button>
        </div>
        <div className="bg-navy-900/80 rounded-2xl p-4 lg:p-5 border border-danger-500/20 hover:border-opacity-50 transition-all">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 lg:w-11 lg:h-11 rounded-xl bg-danger-500/15 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-danger-400" />
            </div>
          </div>
          <p className="text-xs lg:text-sm text-navy-300 mb-1">Gagal</p>
          <p className="text-xl lg:text-2xl font-bold text-white">{gagal}</p>
          <button type="button" onClick={() => setGagalPopup(true)} className="mt-2 text-xs font-medium text-danger-400 bg-danger-600/15 hover:bg-danger-600/25 border border-danger-600/30 px-3 py-1 rounded-lg transition-colors cursor-pointer">
            {gagal > 0 ? `${gagal} perlu ditindaklanjuti →` : "Tidak ada yang gagal"}
          </button>
        </div>
      </div>

      {gagalPopup && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setGagalPopup(false)}>
          <div className="bg-navy-900 border border-navy-700/50 rounded-2xl w-full max-w-lg p-6 shadow-2xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-danger-500/20 flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-danger-400" /></div>
                <div>
                  <h3 className="text-lg font-bold text-white">Tindak Lanjut Potongan Gagal</h3>
                  <p className="text-xs text-navy-400">{gagal} potongan memerlukan tindakan</p>
                </div>
              </div>
              <button type="button" onClick={() => setGagalPopup(false)} className="p-1.5 rounded-lg text-navy-400 hover:bg-navy-800 hover:text-white transition-colors cursor-pointer"><XCircle className="w-5 h-5" /></button>
            </div>
            {potonganList.filter((p) => p.status === "gagal").length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 className="w-12 h-12 text-success-400 mx-auto mb-3" />
                <p className="text-sm text-navy-300">Semua potongan berhasil, tidak ada yang perlu ditindaklanjuti.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {potonganList.filter((p) => p.status === "gagal").map((p) => (
                  <div key={p.id} className="bg-navy-800/50 rounded-xl p-4 border border-danger-600/20">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-sm font-medium text-white">{p.namaAnggota}</p>
                        <p className="text-xs text-navy-400">ID: {p.anggotaId} — {p.bulan}</p>
                      </div>
                      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-danger-600/20 text-danger-400 border border-danger-600/30">
                        <XCircle className="w-3 h-3" /> Gagal
                      </span>
                    </div>
                    <div className="text-xs text-navy-400 space-y-1 mb-3">
                      <div className="flex justify-between"><span>Simpanan Wajib</span><span className="text-white">{formatRupiah(p.simpananWajib)}</span></div>
                      <div className="flex justify-between"><span>Angsuran Pinjaman</span><span className="text-white">{formatRupiah(p.angsuranPinjaman)}</span></div>
                      <div className="flex justify-between"><span>Jasa Pinjaman</span><span className="text-white">{formatRupiah(p.jasaPinjaman)}</span></div>
                      <div className="flex justify-between border-t border-navy-700/50 pt-1 mt-1"><span className="font-medium text-navy-300">Total</span><span className="font-bold text-accent-400">{formatRupiah(p.totalPotongan)}</span></div>
                    </div>
                    <div className="bg-danger-600/10 border border-danger-600/20 rounded-lg p-2.5">
                      <p className="text-xs text-danger-300"><span className="font-semibold">Tindakan:</span> Verifikasi ulang data rekening anggota, pastikan saldo mencukupi, lalu kirim ulang permintaan potongan melalui sistem.</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {prosesPopup && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setProsesPopup(false)}>
          <div className="bg-navy-900 border border-navy-700/50 rounded-2xl w-full max-w-lg p-6 shadow-2xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-warning-500/20 flex items-center justify-center"><Clock className="w-5 h-5 text-warning-400" /></div>
                <div>
                  <h3 className="text-lg font-bold text-white">Potongan Dalam Proses</h3>
                  <p className="text-xs text-navy-400">{proses} potongan menunggu verifikasi</p>
                </div>
              </div>
              <button type="button" onClick={() => setProsesPopup(false)} className="p-1.5 rounded-lg text-navy-400 hover:bg-navy-800 hover:text-white transition-colors cursor-pointer"><XCircle className="w-5 h-5" /></button>
            </div>
            {potonganList.filter((p) => p.status === "proses").length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 className="w-12 h-12 text-success-400 mx-auto mb-3" />
                <p className="text-sm text-navy-300">Semua potongan sudah diproses, tidak ada yang menunggu verifikasi.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {potonganList.filter((p) => p.status === "proses").map((p) => (
                  <div key={p.id} className="bg-navy-800/50 rounded-xl p-4 border border-warning-600/20">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-sm font-medium text-white">{p.namaAnggota}</p>
                        <p className="text-xs text-navy-400">ID: {p.anggotaId} — {p.bulan}</p>
                      </div>
                      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-warning-600/20 text-warning-400 border border-warning-600/30">
                        <Clock className="w-3 h-3" /> Proses
                      </span>
                    </div>
                    <div className="text-xs text-navy-400 space-y-1 mb-3">
                      <div className="flex justify-between"><span>Simpanan Wajib</span><span className="text-white">{formatRupiah(p.simpananWajib)}</span></div>
                      <div className="flex justify-between"><span>Angsuran Pinjaman</span><span className="text-white">{formatRupiah(p.angsuranPinjaman)}</span></div>
                      <div className="flex justify-between"><span>Jasa Pinjaman</span><span className="text-white">{formatRupiah(p.jasaPinjaman)}</span></div>
                      <div className="flex justify-between border-t border-navy-700/50 pt-1 mt-1"><span className="font-medium text-navy-300">Total</span><span className="font-bold text-accent-400">{formatRupiah(p.totalPotongan)}</span></div>
                    </div>
                    <div className="bg-warning-600/10 border border-warning-600/20 rounded-lg p-2.5">
                      <p className="text-xs text-warning-300"><span className="font-semibold">Status:</span> Potongan sedang dalam antrian verifikasi oleh bendahara. Estimasi selesai dalam 1-3 hari kerja.</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="bg-navy-900/80 rounded-2xl border border-navy-700/30 overflow-hidden">
        <div className="p-5 border-b border-navy-700/30 print:hidden">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Daftar Potongan</h3>
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="flex items-center bg-navy-800 rounded-xl px-3 py-2 gap-2 border border-navy-700/50 flex-1 sm:flex-initial">
                <Search className="w-4 h-4 text-navy-400" />
                <input type="text" placeholder="Cari anggota..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-transparent text-sm text-white placeholder-navy-400 outline-none w-full sm:w-40" />
              </div>
              <div className="relative">
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="appearance-none bg-navy-800 border border-navy-700/50 rounded-xl px-3 py-2 pr-8 text-sm text-white outline-none cursor-pointer">
                  <option value="semua">Semua Status</option>
                  <option value="terkirim">Terkirim</option>
                  <option value="proses">Proses</option>
                  <option value="gagal">Gagal</option>
                </select>
                <ChevronDown className="w-4 h-4 text-navy-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              <button type="button" onClick={handlePrint} className="flex items-center gap-2 bg-accent-500 hover:bg-accent-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer">
                <Printer className="w-4 h-4" /><span className="hidden sm:inline">Cetak</span>
              </button>
              <button type="button" onClick={handleExport} className="flex items-center gap-2 bg-navy-700 hover:bg-navy-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer">
                <FileDown className="w-4 h-4" /><span className="hidden sm:inline">Export</span>
              </button>
            </div>
          </div>
        </div>

        <div className="hidden print:block px-5 pt-5 pb-2">
          <h3 className="text-lg font-semibold text-black">Daftar Potongan</h3>
        </div>

        <div className="overflow-x-auto" id="potongan-print-table">
          <table className="w-full">
            <thead className="bg-navy-800/80 sticky top-0">
              <tr className="border-b border-navy-600/40 print:border-gray-300">
                <th className="text-left text-xs font-semibold text-navy-200 uppercase tracking-wider px-5 py-3 print:text-black">Anggota</th>
                <th className="text-left text-xs font-semibold text-navy-200 uppercase tracking-wider px-5 py-3 print:text-black">Bulan</th>
                <th className="text-right text-xs font-semibold text-navy-200 uppercase tracking-wider px-5 py-3 print:text-black">Simp. Wajib</th>
                <th className="text-right text-xs font-semibold text-navy-200 uppercase tracking-wider px-5 py-3 print:text-black">Angs. Pinjaman</th>
                <th className="text-right text-xs font-semibold text-navy-200 uppercase tracking-wider px-5 py-3 print:text-black">Jasa Pinjaman</th>
                <th className="text-right text-xs font-semibold text-navy-200 uppercase tracking-wider px-5 py-3 font-bold print:text-black">Total</th>
                <th className="text-center text-xs font-semibold text-navy-200 uppercase tracking-wider px-5 py-3 print:text-black">Status</th>
                <th className="text-center text-xs font-semibold text-navy-200 uppercase tracking-wider px-5 py-3 print:hidden">Rincian</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b border-navy-800/50 hover:bg-navy-800/30 transition-colors print:border-gray-200 print:hover:bg-transparent">
                  <td className="px-5 py-3">
                    <p className="text-sm font-medium text-white print:text-black">{p.namaAnggota}</p>
                    <p className="text-xs text-navy-400 print:text-gray-600">ID: {p.anggotaId}</p>
                  </td>
                  <td className="px-5 py-3 text-sm text-navy-300 print:text-black">{p.bulan}</td>
                  <td className="px-5 py-3 text-sm text-white text-right print:text-black">{formatRupiah(p.simpananWajib)}</td>
                  <td className="px-5 py-3 text-sm text-white text-right print:text-black">{formatRupiah(p.angsuranPinjaman)}</td>
                  <td className="px-5 py-3 text-sm text-white text-right print:text-black">{formatRupiah(p.jasaPinjaman)}</td>
                  <td className="px-5 py-3 text-sm text-accent-400 text-right font-bold print:text-black">{formatRupiah(p.totalPotongan)}</td>
                  <td className="px-5 py-3 text-center">
                    <span className="print:hidden">{statusBadge(p.status)}</span>
                    <span className="hidden print:inline print:text-black">{statusLabel(p.status)}</span>
                  </td>
                  <td className="px-5 py-3 text-center print:hidden">
                    <button type="button" onClick={() => setDetailItem(p)} className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg bg-accent-500/15 text-accent-400 hover:bg-accent-500/25 transition-colors cursor-pointer">
                      <Eye className="w-3.5 h-3.5" /> Detail
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-navy-600 print:border-gray-400">
                <td colSpan={2} className="px-5 py-3 text-sm font-bold text-white print:text-black">TOTAL</td>
                <td className="px-5 py-3 text-sm font-bold text-white text-right print:text-black">{formatRupiah(filtered.reduce((s, p) => s + p.simpananWajib, 0))}</td>
                <td className="px-5 py-3 text-sm font-bold text-white text-right print:text-black">{formatRupiah(filtered.reduce((s, p) => s + p.angsuranPinjaman, 0))}</td>
                <td className="px-5 py-3 text-sm font-bold text-white text-right print:text-black">{formatRupiah(filtered.reduce((s, p) => s + p.jasaPinjaman, 0))}</td>
                <td className="px-5 py-3 text-sm font-bold text-accent-400 text-right print:text-black">{formatRupiah(filtered.reduce((s, p) => s + p.totalPotongan, 0))}</td>
                <td className="px-5 py-3"></td>
                <td className="px-5 py-3 print:hidden"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
