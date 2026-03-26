"use client";

import { useState } from "react";
import {
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
  Plus,
  Search,
  ChevronDown,
  TrendingUp,
} from "lucide-react";
import StatCard from "./StatCard";
import {
  transaksiSimpananList,
  anggotaList,
  formatRupiah,
} from "@/data/mock";

export default function SimpananPage() {
  const [search, setSearch] = useState("");
  const [filterJenis, setFilterJenis] = useState<string>("semua");

  const filtered = transaksiSimpananList.filter((t) => {
    const matchSearch = t.namaAnggota.toLowerCase().includes(search.toLowerCase());
    const matchJenis = filterJenis === "semua" || t.jenis === filterJenis;
    return matchSearch && matchJenis;
  });

  const totalSetoran = transaksiSimpananList
    .filter((t) => t.jenis === "setoran")
    .reduce((s, t) => s + t.jumlah, 0);
  const totalPengambilan = transaksiSimpananList
    .filter((t) => t.jenis === "pengambilan")
    .reduce((s, t) => s + t.jumlah, 0);
  const totalSimpananAll = anggotaList.reduce(
    (s, a) => s + a.simpananPokok + a.simpananWajib + a.simpananSukarela,
    0
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Total Simpanan" value={formatRupiah(totalSimpananAll)} icon={Wallet} color="blue" trend={8.5} />
        <StatCard title="Setoran Bulan Ini" value={formatRupiah(totalSetoran)} icon={ArrowUpCircle} color="green" />
        <StatCard title="Pengambilan Bulan Ini" value={formatRupiah(totalPengambilan)} icon={ArrowDownCircle} color="amber" />
        <StatCard title="Net Simpanan" value={formatRupiah(totalSetoran - totalPengambilan)} icon={TrendingUp} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-navy-900/80 rounded-2xl border border-navy-700/30 p-5">
          <h3 className="text-base font-semibold text-white mb-4">Input Transaksi Cepat</h3>
          <div className="space-y-3">
            <button className="w-full flex items-center gap-3 bg-success-600/10 border border-success-600/20 hover:bg-success-600/20 rounded-xl p-4 transition-colors cursor-pointer">
              <div className="w-10 h-10 rounded-xl bg-success-500/20 flex items-center justify-center">
                <ArrowUpCircle className="w-5 h-5 text-success-400" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-white">Setoran Simpanan</p>
                <p className="text-xs text-navy-400">Setoran wajib, sukarela, atau pokok</p>
              </div>
            </button>
            <button className="w-full flex items-center gap-3 bg-warning-600/10 border border-warning-600/20 hover:bg-warning-600/20 rounded-xl p-4 transition-colors cursor-pointer">
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                label: "Simpanan Pokok",
                total: anggotaList.reduce((s, a) => s + a.simpananPokok, 0),
                color: "accent",
              },
              {
                label: "Simpanan Wajib",
                total: anggotaList.reduce((s, a) => s + a.simpananWajib, 0),
                color: "success",
              },
              {
                label: "Simpanan Sukarela",
                total: anggotaList.reduce((s, a) => s + a.simpananSukarela, 0),
                color: "warning",
              },
            ].map((item, i) => (
              <div key={i} className="bg-navy-800/50 rounded-xl p-4 sm:text-center flex sm:block items-center justify-between">
                <p className="text-xs text-navy-400 sm:mb-2">{item.label}</p>
                <p className="text-base sm:text-lg font-bold text-white">{formatRupiah(item.total)}</p>
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
                <input
                  type="text"
                  placeholder="Cari anggota..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-transparent text-sm text-white placeholder-navy-400 outline-none w-full sm:w-40"
                />
              </div>
              <div className="relative">
                <select
                  value={filterJenis}
                  onChange={(e) => setFilterJenis(e.target.value)}
                  className="appearance-none bg-navy-800 border border-navy-700/50 rounded-xl px-3 py-2 pr-8 text-sm text-white outline-none cursor-pointer"
                >
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
            <thead>
              <tr className="border-b border-navy-700/30">
                <th className="text-left text-xs font-medium text-navy-400 uppercase px-5 py-3">Tanggal</th>
                <th className="text-left text-xs font-medium text-navy-400 uppercase px-5 py-3">Anggota</th>
                <th className="text-left text-xs font-medium text-navy-400 uppercase px-5 py-3">Jenis</th>
                <th className="text-left text-xs font-medium text-navy-400 uppercase px-5 py-3">Kategori</th>
                <th className="text-right text-xs font-medium text-navy-400 uppercase px-5 py-3">Jumlah</th>
                <th className="text-left text-xs font-medium text-navy-400 uppercase px-5 py-3">Keterangan</th>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
