"use client";

import { useState } from "react";
import {
  Receipt,
  Search,
  Printer,
  CheckCircle2,
  Clock,
  XCircle,
  FileDown,
  ChevronDown,
} from "lucide-react";
import StatCard from "./StatCard";
import { potonganList, formatRupiah } from "@/data/mock";

export default function PotonganPage() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("semua");

  const filtered = potonganList.filter((p) => {
    const matchSearch = p.namaAnggota.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "semua" || p.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalPotongan = potonganList.reduce((s, p) => s + p.totalPotongan, 0);
  const terkirim = potonganList.filter((p) => p.status === "terkirim").length;
  const proses = potonganList.filter((p) => p.status === "proses").length;
  const gagal = potonganList.filter((p) => p.status === "gagal").length;

  const statusBadge = (s: string) => {
    switch (s) {
      case "terkirim":
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-success-600/20 text-success-400 border border-success-600/30">
            <CheckCircle2 className="w-3 h-3" /> Terkirim
          </span>
        );
      case "proses":
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-warning-600/20 text-warning-400 border border-warning-600/30">
            <Clock className="w-3 h-3" /> Proses
          </span>
        );
      case "gagal":
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-danger-600/20 text-danger-400 border border-danger-600/30">
            <XCircle className="w-3 h-3" /> Gagal
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Total Potongan" value={formatRupiah(totalPotongan)} subtitle="Bulan Maret 2026" icon={Receipt} color="blue" />
        <StatCard title="Terkirim" value={terkirim.toString()} subtitle="potongan berhasil" icon={CheckCircle2} color="green" />
        <StatCard title="Dalam Proses" value={proses.toString()} subtitle="menunggu verifikasi" icon={Clock} color="amber" />
        <StatCard title="Gagal" value={gagal.toString()} subtitle="perlu ditindaklanjuti" icon={XCircle} color="red" />
      </div>

      <div className="bg-navy-900/80 rounded-2xl border border-navy-700/30 overflow-hidden">
        <div className="p-5 border-b border-navy-700/30">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Daftar Potongan - Maret 2026</h3>
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
              <button className="flex items-center gap-2 bg-accent-500 hover:bg-accent-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer">
                <Printer className="w-4 h-4" />
                <span className="hidden sm:inline">Cetak</span>
              </button>
              <button className="flex items-center gap-2 bg-navy-700 hover:bg-navy-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer">
                <FileDown className="w-4 h-4" />
                <span className="hidden sm:inline">Export</span>
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-navy-700/30">
                <th className="text-left text-xs font-medium text-navy-400 uppercase px-5 py-3">Anggota</th>
                <th className="text-left text-xs font-medium text-navy-400 uppercase px-5 py-3">Bulan</th>
                <th className="text-right text-xs font-medium text-navy-400 uppercase px-5 py-3">Simp. Wajib</th>
                <th className="text-right text-xs font-medium text-navy-400 uppercase px-5 py-3">Angs. Pinjaman</th>
                <th className="text-right text-xs font-medium text-navy-400 uppercase px-5 py-3">Jasa Pinjaman</th>
                <th className="text-right text-xs font-medium text-navy-400 uppercase px-5 py-3 font-bold">Total</th>
                <th className="text-center text-xs font-medium text-navy-400 uppercase px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b border-navy-800/50 hover:bg-navy-800/30 transition-colors">
                  <td className="px-5 py-3">
                    <p className="text-sm font-medium text-white">{p.namaAnggota}</p>
                    <p className="text-xs text-navy-400">ID: {p.anggotaId}</p>
                  </td>
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
                <td colSpan={2} className="px-5 py-3 text-sm font-bold text-white">TOTAL</td>
                <td className="px-5 py-3 text-sm font-bold text-white text-right">{formatRupiah(filtered.reduce((s, p) => s + p.simpananWajib, 0))}</td>
                <td className="px-5 py-3 text-sm font-bold text-white text-right">{formatRupiah(filtered.reduce((s, p) => s + p.angsuranPinjaman, 0))}</td>
                <td className="px-5 py-3 text-sm font-bold text-white text-right">{formatRupiah(filtered.reduce((s, p) => s + p.jasaPinjaman, 0))}</td>
                <td className="px-5 py-3 text-sm font-bold text-accent-400 text-right">{formatRupiah(filtered.reduce((s, p) => s + p.totalPotongan, 0))}</td>
                <td className="px-5 py-3"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
