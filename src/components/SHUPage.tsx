"use client";

import { useState, useEffect } from "react";
import {
  PieChart as PieChartIcon,
  TrendingUp,
  Users,
  Calculator,
  Loader2,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import StatCard from "./StatCard";
import { formatRupiah, getTierColor, getTierLabel } from "@/data/mock";
import type { Anggota } from "@/data/mock";
import { fetchAnggota } from "@/lib/fetchers";

const distribusiColors = ["#3b82f6", "#22c55e", "#f59e0b", "#a855f7", "#ec4899"];

export default function SHUPage() {
  const [anggotaList, setAnggotaList] = useState<Anggota[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnggota()
      .then(setAnggotaList)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-accent-400 animate-spin" />
        <span className="ml-3 text-navy-300">Memuat data SHU...</span>
      </div>
    );
  }

  const totalSimpanan = anggotaList.reduce((s, a) => s + a.simpananPokok + a.simpananWajib + a.simpananSukarela, 0);
  const totalPinjaman = anggotaList.reduce((s, a) => s + a.totalPinjaman, 0);
  const estimasiTotalSHU = Math.round(totalSimpanan * 0.03 + totalPinjaman * 0.02);

  const shuDistribusi = [
    { kategori: "Jasa Simpanan", persentase: 40, jumlah: Math.round(estimasiTotalSHU * 0.4) },
    { kategori: "Jasa Pinjaman", persentase: 30, jumlah: Math.round(estimasiTotalSHU * 0.3) },
    { kategori: "Dana Cadangan", persentase: 15, jumlah: Math.round(estimasiTotalSHU * 0.15) },
    { kategori: "Dana Pengurus", persentase: 10, jumlah: Math.round(estimasiTotalSHU * 0.1) },
    { kategori: "Dana Sosial", persentase: 5, jumlah: Math.round(estimasiTotalSHU * 0.05) },
  ];

  const shuPerAnggota = anggotaList
    .filter((a) => a.status === "aktif")
    .map((a) => {
      const simpanan = a.simpananPokok + a.simpananWajib + a.simpananSukarela;
      const faktorSimpanan = simpanan / 1000000;
      const faktorSkor = a.skor / 100;
      const estimasiSHU = Math.round(faktorSimpanan * faktorSkor * 250000);
      return { ...a, totalSimpanan: simpanan, estimasiSHU };
    })
    .sort((a, b) => b.estimasiSHU - a.estimasiSHU);

  const top5SHU = shuPerAnggota.slice(0, 5).map((a) => ({
    name: a.nama.split(" ").slice(0, 2).join(" "),
    shu: a.estimasiSHU,
  }));

  const anggotaAktif = anggotaList.filter((a) => a.status === "aktif").length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Estimasi Total SHU" value={formatRupiah(estimasiTotalSHU)} subtitle="Tahun berjalan" icon={PieChartIcon} color="blue" />
        <StatCard title="Total Simpanan" value={formatRupiah(totalSimpanan)} icon={TrendingUp} color="green" />
        <StatCard title="Total Pinjaman" value={formatRupiah(totalPinjaman)} icon={Calculator} color="purple" />
        <StatCard title="Anggota Berhak" value={anggotaAktif.toString()} subtitle="anggota aktif" icon={Users} color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-navy-900/80 rounded-2xl border border-navy-700/30 p-5">
          <h3 className="text-base font-semibold text-white mb-1">Distribusi SHU</h3>
          <p className="text-sm text-navy-400 mb-4">Pembagian berdasarkan AD/ART</p>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={shuDistribusi.map((d, i) => ({ ...d, fill: distribusiColors[i] }))}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="jumlah"
                  nameKey="kategori"
                >
                  {shuDistribusi.map((_, i) => (
                    <Cell key={i} fill={distribusiColors[i]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatRupiah(Number(value))} contentStyle={{ background: "#0f1d3d", border: "1px solid #2d4e93", borderRadius: "12px", fontSize: "12px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-4">
            {shuDistribusi.map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: distribusiColors[i] }} />
                  <span className="text-sm text-navy-300">{item.kategori}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-navy-400">{item.persentase}%</span>
                  <span className="text-sm font-medium text-white">{formatRupiah(item.jumlah)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-navy-900/80 rounded-2xl border border-navy-700/30 p-5">
          <h3 className="text-base font-semibold text-white mb-1">Top 5 Estimasi SHU Anggota</h3>
          <p className="text-sm text-navy-400 mb-4">Berdasarkan simpanan & skor</p>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={top5SHU} layout="vertical" barSize={20}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e3a6e30" horizontal={false} />
                <XAxis type="number" tick={{ fill: "#7890c1", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}jt`} />
                <YAxis type="category" dataKey="name" tick={{ fill: "#c5d0e6", fontSize: 12 }} axisLine={false} tickLine={false} width={100} />
                <Tooltip formatter={(value) => formatRupiah(Number(value))} contentStyle={{ background: "#0f1d3d", border: "1px solid #2d4e93", borderRadius: "12px", fontSize: "12px" }} />
                <Bar dataKey="shu" name="Estimasi SHU" fill="#3b82f6" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-navy-900/80 rounded-2xl border border-navy-700/30 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Calculator className="w-5 h-5 text-accent-400" />
              Simulasi SHU per Anggota
            </h3>
            <p className="text-sm text-navy-400">Estimasi berdasarkan simpanan dan skor anggota</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-navy-700/30">
                <th className="text-left text-xs font-medium text-navy-400 uppercase px-5 py-3">#</th>
                <th className="text-left text-xs font-medium text-navy-400 uppercase px-5 py-3">Anggota</th>
                <th className="text-center text-xs font-medium text-navy-400 uppercase px-5 py-3">Tier</th>
                <th className="text-center text-xs font-medium text-navy-400 uppercase px-5 py-3">Skor</th>
                <th className="text-right text-xs font-medium text-navy-400 uppercase px-5 py-3">Total Simpanan</th>
                <th className="text-right text-xs font-medium text-navy-400 uppercase px-5 py-3">Estimasi SHU</th>
              </tr>
            </thead>
            <tbody>
              {shuPerAnggota.slice(0, 50).map((a, i) => (
                <tr key={a.id} className="border-b border-navy-800/50 hover:bg-navy-800/30 transition-colors">
                  <td className="px-5 py-3 text-sm text-navy-400">{i + 1}</td>
                  <td className="px-5 py-3">
                    <p className="text-sm font-medium text-white">{a.nama}</p>
                    <p className="text-xs text-navy-400">{a.satuan}</p>
                  </td>
                  <td className="px-5 py-3 text-center">
                    <span className={`inline-block text-[10px] font-bold px-2.5 py-1 rounded-full ${getTierColor(a.tier)}`}>
                      {getTierLabel(a.tier)}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-center">
                    <span className={`text-sm font-bold ${
                      a.skor >= 80 ? "text-success-400" : a.skor >= 60 ? "text-warning-400" : "text-danger-400"
                    }`}>{a.skor}</span>
                  </td>
                  <td className="px-5 py-3 text-sm text-white text-right">{formatRupiah(a.totalSimpanan)}</td>
                  <td className="px-5 py-3 text-sm font-bold text-accent-400 text-right">{formatRupiah(a.estimasiSHU)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-navy-600">
                <td colSpan={5} className="px-5 py-3 text-sm font-bold text-white">TOTAL ESTIMASI SHU</td>
                <td className="px-5 py-3 text-sm font-bold text-accent-400 text-right">
                  {formatRupiah(shuPerAnggota.reduce((s, a) => s + a.estimasiSHU, 0))}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
