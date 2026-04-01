"use client";

import { useState, useEffect } from "react";
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

export default function PotonganPage() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("semua");
  const [potonganList, setPotonganList] = useState<Potongan[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailItem, setDetailItem] = useState<Potongan | null>(null);

  useEffect(() => {
    fetchPotongan()
      .then(setPotonganList)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

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
        <StatCard title="Dalam Proses" value={proses.toString()} subtitle="menunggu verifikasi" icon={Clock} color="amber" />
        <StatCard title="Gagal" value={gagal.toString()} subtitle="perlu ditindaklanjuti" icon={XCircle} color="red" />
      </div>

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
