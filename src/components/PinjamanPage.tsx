"use client";

import { useState } from "react";
import {
  HandCoins,
  Search,
  ChevronDown,
  Plus,
  Eye,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  TrendingDown,
  Banknote,
} from "lucide-react";
import StatCard from "./StatCard";
import {
  pinjamanList,
  formatRupiah,
  getStatusPinjamanBg,
} from "@/data/mock";

export default function PinjamanPage() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("semua");

  const filtered = pinjamanList.filter((p) => {
    const matchSearch = p.namaAnggota.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "semua" || p.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalDisalurkan = pinjamanList.reduce((s, p) => s + p.jumlahPinjaman, 0);
  const totalSisa = pinjamanList.reduce((s, p) => s + p.sisaPinjaman, 0);
  const lancar = pinjamanList.filter((p) => p.status === "lancar").length;
  const macet = pinjamanList.filter((p) => p.status === "macet").length;

  const statusLabel = (s: string) => {
    switch (s) {
      case "lancar": return "Lancar";
      case "kurang_lancar": return "Kurang Lancar";
      case "macet": return "Macet";
      default: return s;
    }
  };

  const statusIcon = (s: string) => {
    switch (s) {
      case "lancar": return <CheckCircle2 className="w-3.5 h-3.5" />;
      case "kurang_lancar": return <Clock className="w-3.5 h-3.5" />;
      case "macet": return <XCircle className="w-3.5 h-3.5" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Total Disalurkan" value={formatRupiah(totalDisalurkan)} icon={Banknote} color="blue" />
        <StatCard title="Sisa Pinjaman" value={formatRupiah(totalSisa)} icon={HandCoins} color="amber" />
        <StatCard title="Pinjaman Lancar" value={`${lancar} / ${pinjamanList.length}`} icon={CheckCircle2} color="green" />
        <StatCard title="Pinjaman Macet" value={`${macet} pinjaman`} subtitle={`${((macet / pinjamanList.length) * 100).toFixed(1)}% dari total`} icon={AlertTriangle} color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="bg-navy-900/80 rounded-2xl border border-navy-700/30 p-5">
          <h3 className="text-base font-semibold text-white mb-4">Aksi Cepat</h3>
          <div className="space-y-3">
            <button className="w-full flex items-center gap-3 bg-accent-500/10 border border-accent-500/20 hover:bg-accent-500/20 rounded-xl p-4 transition-colors cursor-pointer">
              <div className="w-10 h-10 rounded-xl bg-accent-500/20 flex items-center justify-center">
                <Plus className="w-5 h-5 text-accent-400" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-white">Pinjaman Baru</p>
                <p className="text-xs text-navy-400">Ajukan pinjaman anggota</p>
              </div>
            </button>
            <button className="w-full flex items-center gap-3 bg-success-600/10 border border-success-600/20 hover:bg-success-600/20 rounded-xl p-4 transition-colors cursor-pointer">
              <div className="w-10 h-10 rounded-xl bg-success-500/20 flex items-center justify-center">
                <Banknote className="w-5 h-5 text-success-400" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-white">Bayar Angsuran</p>
                <p className="text-xs text-navy-400">Input pembayaran angsuran</p>
              </div>
            </button>
          </div>
        </div>

        <div className="lg:col-span-3 bg-navy-900/80 rounded-2xl border border-navy-700/30 p-5">
          <h3 className="text-base font-semibold text-white mb-4">Status Pinjaman</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: "Lancar", count: pinjamanList.filter((p) => p.status === "lancar").length, total: pinjamanList.filter((p) => p.status === "lancar").reduce((s, p) => s + p.sisaPinjaman, 0), color: "success", pct: Math.round((pinjamanList.filter((p) => p.status === "lancar").length / pinjamanList.length) * 100) },
              { label: "Kurang Lancar", count: pinjamanList.filter((p) => p.status === "kurang_lancar").length, total: pinjamanList.filter((p) => p.status === "kurang_lancar").reduce((s, p) => s + p.sisaPinjaman, 0), color: "warning", pct: Math.round((pinjamanList.filter((p) => p.status === "kurang_lancar").length / pinjamanList.length) * 100) },
              { label: "Macet", count: pinjamanList.filter((p) => p.status === "macet").length, total: pinjamanList.filter((p) => p.status === "macet").reduce((s, p) => s + p.sisaPinjaman, 0), color: "danger", pct: Math.round((pinjamanList.filter((p) => p.status === "macet").length / pinjamanList.length) * 100) },
            ].map((item, i) => (
              <div key={i} className={`bg-${item.color}-600/10 border border-${item.color}-600/20 rounded-xl p-4`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-medium text-${item.color}-400`}>{item.label}</span>
                  <span className={`text-xs font-bold text-${item.color}-400`}>{item.pct}%</span>
                </div>
                <p className="text-lg sm:text-xl font-bold text-white">{item.count} <span className="text-sm font-normal text-navy-400">pinjaman</span></p>
                <p className="text-xs text-navy-400 mt-1">Total: {formatRupiah(item.total)}</p>
                <div className="h-1.5 bg-navy-800 rounded-full mt-2 overflow-hidden">
                  <div className={`h-full bg-${item.color}-500 rounded-full`} style={{ width: `${item.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-navy-900/80 rounded-2xl border border-navy-700/30 overflow-hidden">
        <div className="p-5 border-b border-navy-700/30">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Daftar Pinjaman</h3>
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="flex items-center bg-navy-800 rounded-xl px-3 py-2 gap-2 border border-navy-700/50 flex-1 sm:flex-initial">
                <Search className="w-4 h-4 text-navy-400" />
                <input type="text" placeholder="Cari anggota..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-transparent text-sm text-white placeholder-navy-400 outline-none w-full sm:w-40" />
              </div>
              <div className="relative">
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="appearance-none bg-navy-800 border border-navy-700/50 rounded-xl px-3 py-2 pr-8 text-sm text-white outline-none cursor-pointer">
                  <option value="semua">Semua Status</option>
                  <option value="lancar">Lancar</option>
                  <option value="kurang_lancar">Kurang Lancar</option>
                  <option value="macet">Macet</option>
                </select>
                <ChevronDown className="w-4 h-4 text-navy-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-navy-700/30">
                <th className="text-left text-xs font-medium text-navy-400 uppercase px-5 py-3">Anggota</th>
                <th className="text-left text-xs font-medium text-navy-400 uppercase px-5 py-3">Jenis</th>
                <th className="text-right text-xs font-medium text-navy-400 uppercase px-5 py-3">Jumlah</th>
                <th className="text-right text-xs font-medium text-navy-400 uppercase px-5 py-3">Sisa</th>
                <th className="text-center text-xs font-medium text-navy-400 uppercase px-5 py-3">Tenor</th>
                <th className="text-right text-xs font-medium text-navy-400 uppercase px-5 py-3">Angsuran/bln</th>
                <th className="text-center text-xs font-medium text-navy-400 uppercase px-5 py-3">Status</th>
                <th className="text-left text-xs font-medium text-navy-400 uppercase px-5 py-3">Jatuh Tempo</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b border-navy-800/50 hover:bg-navy-800/30 transition-colors">
                  <td className="px-5 py-3">
                    <p className="text-sm font-medium text-white">{p.namaAnggota}</p>
                    <p className="text-xs text-navy-400">ID: {p.id}</p>
                  </td>
                  <td className="px-5 py-3 text-sm text-navy-300">{p.jenisPinjaman}</td>
                  <td className="px-5 py-3 text-sm text-white text-right font-medium">{formatRupiah(p.jumlahPinjaman)}</td>
                  <td className="px-5 py-3 text-sm text-warning-400 text-right font-medium">{formatRupiah(p.sisaPinjaman)}</td>
                  <td className="px-5 py-3 text-sm text-navy-300 text-center">{p.sisaTenor}/{p.tenor} bln</td>
                  <td className="px-5 py-3 text-sm text-white text-right">{formatRupiah(p.angsuranPerBulan)}</td>
                  <td className="px-5 py-3 text-center">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${getStatusPinjamanBg(p.status)}`}>
                      {statusIcon(p.status)}
                      {statusLabel(p.status)}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm text-navy-300">
                    {new Date(p.jatuhTempo).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
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
