"use client";

import { useState } from "react";
import {
  Search,
  Plus,
  Filter,
  ChevronDown,
  Eye,
  Edit3,
  Award,
  Users,
  UserCheck,
  UserX,
} from "lucide-react";
import StatCard from "./StatCard";
import {
  anggotaList,
  formatRupiah,
  getTierColor,
  getTierLabel,
} from "@/data/mock";

export default function AnggotaPage() {
  const [search, setSearch] = useState("");
  const [filterTier, setFilterTier] = useState<string>("semua");
  const [selectedAnggota, setSelectedAnggota] = useState<string | null>(null);

  const filtered = anggotaList.filter((a) => {
    const matchSearch = a.nama.toLowerCase().includes(search.toLowerCase()) ||
      a.nrp.includes(search) ||
      a.nomorAnggota.includes(search);
    const matchTier = filterTier === "semua" || a.tier === filterTier;
    return matchSearch && matchTier;
  });

  const aktif = anggotaList.filter((a) => a.status === "aktif").length;
  const pasif = anggotaList.filter((a) => a.status === "pasif").length;
  const totalSimpananAll = anggotaList.reduce(
    (s, a) => s + a.simpananPokok + a.simpananWajib + a.simpananSukarela,
    0
  );

  const detail = selectedAnggota ? anggotaList.find((a) => a.id === selectedAnggota) : null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Total Anggota" value={anggotaList.length.toString()} icon={Users} color="blue" />
        <StatCard title="Anggota Aktif" value={aktif.toString()} icon={UserCheck} color="green" />
        <StatCard title="Anggota Pasif" value={pasif.toString()} icon={UserX} color="amber" />
        <StatCard title="Rata-rata Skor" value={(anggotaList.reduce((s, a) => s + a.skor, 0) / anggotaList.length).toFixed(0)} icon={Award} color="purple" />
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
                  placeholder="Cari nama / NRP..."
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
              <button className="flex items-center gap-2 bg-accent-500 hover:bg-accent-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Tambah</span>
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-navy-700/30">
                <th className="text-left text-xs font-medium text-navy-400 uppercase px-5 py-3">No.</th>
                <th className="text-left text-xs font-medium text-navy-400 uppercase px-5 py-3">Nama / NRP</th>
                <th className="text-left text-xs font-medium text-navy-400 uppercase px-5 py-3">Satuan</th>
                <th className="text-left text-xs font-medium text-navy-400 uppercase px-5 py-3">Tier</th>
                <th className="text-right text-xs font-medium text-navy-400 uppercase px-5 py-3">Total Simpanan</th>
                <th className="text-right text-xs font-medium text-navy-400 uppercase px-5 py-3">Sisa Pinjaman</th>
                <th className="text-center text-xs font-medium text-navy-400 uppercase px-5 py-3">Skor</th>
                <th className="text-center text-xs font-medium text-navy-400 uppercase px-5 py-3">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a, i) => {
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
                      <p className="text-xs text-navy-400">{a.pangkat} - NRP: {a.nrp}</p>
                    </td>
                    <td className="px-5 py-3 text-sm text-navy-300">{a.satuan}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-block text-[10px] font-bold px-2.5 py-1 rounded-full ${getTierColor(a.tier)}`}>
                        {getTierLabel(a.tier)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-white text-right font-medium">{formatRupiah(totalSimpanan)}</td>
                    <td className="px-5 py-3 text-sm text-right font-medium">
                      <span className={a.sisaPinjaman > 0 ? "text-warning-400" : "text-success-400"}>
                        {formatRupiah(a.sisaPinjaman)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl text-sm font-bold ${
                        a.skor >= 80 ? "bg-success-600/20 text-success-400" :
                        a.skor >= 60 ? "bg-warning-600/20 text-warning-400" :
                        "bg-danger-600/20 text-danger-400"
                      }`}>
                        {a.skor}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setSelectedAnggota(selectedAnggota === a.id ? null : a.id)}
                          className="p-2 rounded-lg hover:bg-navy-700 text-navy-400 hover:text-accent-400 transition-colors cursor-pointer"
                          title="Lihat Detail"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-2 rounded-lg hover:bg-navy-700 text-navy-400 hover:text-warning-400 transition-colors cursor-pointer" title="Edit">
                          <Edit3 className="w-4 h-4" />
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

      {detail && (
        <div className="bg-navy-900/80 rounded-2xl border border-accent-500/20 p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-white">{detail.nama}</h3>
              <p className="text-sm text-navy-400">{detail.pangkat} - {detail.satuan} | NRP: {detail.nrp}</p>
            </div>
            <div className="text-right">
              <span className={`inline-block text-xs font-bold px-3 py-1.5 rounded-full ${getTierColor(detail.tier)}`}>
                {getTierLabel(detail.tier)} MEMBER
              </span>
              <p className="text-sm text-navy-400 mt-1">Skor: <span className="text-white font-bold">{detail.skor}</span></p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-navy-800/50 rounded-xl p-4">
              <p className="text-xs text-navy-400 mb-1">Simpanan Pokok</p>
              <p className="text-lg font-bold text-white">{formatRupiah(detail.simpananPokok)}</p>
            </div>
            <div className="bg-navy-800/50 rounded-xl p-4">
              <p className="text-xs text-navy-400 mb-1">Simpanan Wajib</p>
              <p className="text-lg font-bold text-white">{formatRupiah(detail.simpananWajib)}</p>
            </div>
            <div className="bg-navy-800/50 rounded-xl p-4">
              <p className="text-xs text-navy-400 mb-1">Simpanan Sukarela</p>
              <p className="text-lg font-bold text-white">{formatRupiah(detail.simpananSukarela)}</p>
            </div>
            <div className="bg-navy-800/50 rounded-xl p-4">
              <p className="text-xs text-navy-400 mb-1">Sisa Pinjaman</p>
              <p className="text-lg font-bold text-warning-400">{formatRupiah(detail.sisaPinjaman)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
