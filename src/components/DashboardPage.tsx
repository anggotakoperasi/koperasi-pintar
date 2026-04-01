"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Wallet,
  HandCoins,
  TrendingUp,
  AlertTriangle,
  Award,
  ArrowUpRight,
  PiggyBank,
  Loader2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import StatCard from "./StatCard";
import { formatRupiah, getTierColor, getTierLabel } from "@/data/mock";
import type { Anggota, Pinjaman } from "@/data/mock";
import { fetchAnggota, fetchPinjaman } from "@/lib/fetchers";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-navy-800 border border-navy-600 rounded-xl p-3 shadow-xl">
        <p className="text-sm font-medium text-white mb-1">{label}</p>
        {payload.map((entry: any, i: number) => (
          <p key={i} className="text-xs" style={{ color: entry.color }}>
            {entry.name}: {formatRupiah(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  const [anggotaList, setAnggotaList] = useState<Anggota[]>([]);
  const [pinjamanList, setPinjamanList] = useState<Pinjaman[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchAnggota(), fetchPinjaman()])
      .then(([a, p]) => { setAnggotaList(a); setPinjamanList(p); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-accent-400 animate-spin" />
        <span className="ml-3 text-navy-300">Memuat dashboard...</span>
      </div>
    );
  }

  const totalAnggotaAktif = anggotaList.filter((a) => a.status === "aktif").length;
  const totalSimpanan = anggotaList.reduce((sum, a) => sum + a.simpananPokok + a.simpananWajib + a.simpananSukarela, 0);
  const totalPinjamanBeredar = pinjamanList.reduce((sum, p) => sum + p.sisaPinjaman, 0);
  const pinjamanMacet = pinjamanList.filter((p) => p.status === "macet");
  const tingkatMacet = pinjamanList.length > 0 ? ((pinjamanMacet.length / pinjamanList.length) * 100).toFixed(1) : "0";

  const totalSimpananPokok = anggotaList.reduce((s, a) => s + a.simpananPokok, 0);
  const totalSimpananWajib = anggotaList.reduce((s, a) => s + a.simpananWajib, 0);
  const totalSimpananSukarela = anggotaList.reduce((s, a) => s + a.simpananSukarela, 0);

  const komposisiSimpanan = [
    { name: "Simpanan Pokok", value: totalSimpananPokok, color: "#3b82f6" },
    { name: "Simpanan Wajib", value: totalSimpananWajib, color: "#22c55e" },
    { name: "Simpanan Sukarela", value: totalSimpananSukarela, color: "#f59e0b" },
  ];

  const topMembers = [...anggotaList]
    .filter((a) => a.status === "aktif")
    .sort((a, b) => b.skor - a.skor)
    .slice(0, 5);

  const riskMembers = [...anggotaList]
    .filter((a) => a.tier === "risk" || a.tier === "standard")
    .sort((a, b) => a.skor - b.skor)
    .slice(0, 3);

  const lancarPct = pinjamanList.length > 0 ? Math.round((pinjamanList.filter(p => p.status === "lancar").length / pinjamanList.length) * 100) : 0;
  const simpananVsPinjaman = totalSimpanan > 0 ? Math.min(100, Math.round((totalSimpanan / (totalSimpanan + totalPinjamanBeredar)) * 100)) : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Anggota Aktif"
          value={totalAnggotaAktif.toString()}
          subtitle={`dari ${anggotaList.length} total anggota`}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Total Simpanan"
          value={formatRupiah(totalSimpanan)}
          subtitle="pokok + wajib + sukarela"
          icon={Wallet}
          color="green"
        />
        <StatCard
          title="Pinjaman Beredar"
          value={formatRupiah(totalPinjamanBeredar)}
          subtitle={`${pinjamanList.length} pinjaman aktif`}
          icon={HandCoins}
          color="amber"
        />
        <StatCard
          title="Tingkat Macet"
          value={`${tingkatMacet}%`}
          subtitle={`${pinjamanMacet.length} dari ${pinjamanList.length} pinjaman`}
          icon={AlertTriangle}
          color="red"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-navy-900/80 rounded-2xl p-5 border border-navy-700/30">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-white">Kesehatan Koperasi</h3>
              <p className="text-sm text-navy-400">Indikator utama kinerja</p>
            </div>
          </div>
          <div className="space-y-3">
            {[
              { label: "Kelancaran Pinjaman", value: lancarPct, color: "bg-success-500" },
              { label: "Rasio Simpanan vs Pinjaman", value: simpananVsPinjaman, color: "bg-accent-500" },
              { label: "Partisipasi Anggota", value: anggotaList.length > 0 ? Math.round((totalAnggotaAktif / anggotaList.length) * 100) : 0, color: "bg-warning-500" },
              { label: "Rata-rata Skor Anggota", value: anggotaList.length > 0 ? Math.round(anggotaList.reduce((s, a) => s + a.skor, 0) / anggotaList.length) : 0, color: "bg-purple-500" },
            ].map((item, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-navy-300">{item.label}</span>
                  <span className="text-white font-medium">{item.value}%</span>
                </div>
                <div className="h-2 bg-navy-800 rounded-full overflow-hidden">
                  <div className={`h-full ${item.color} rounded-full transition-all`} style={{ width: `${item.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-navy-900/80 rounded-2xl p-5 border border-navy-700/30">
          <h3 className="text-base font-semibold text-white mb-1">Komposisi Simpanan</h3>
          <p className="text-sm text-navy-400 mb-2">Total {formatRupiah(totalSimpanan)}</p>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={komposisiSimpanan}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {komposisiSimpanan.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatRupiah(Number(value))} contentStyle={{ background: "#0f1d3d", border: "1px solid #2d4e93", borderRadius: "12px", fontSize: "12px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-2">
            {komposisiSimpanan.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-navy-300">{item.name}</span>
                </div>
                <span className="text-white font-medium">{formatRupiah(item.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-navy-900/80 rounded-2xl p-5 border border-navy-700/30">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-warning-400" />
              Top Member
            </h3>
          </div>
          <div className="space-y-3">
            {topMembers.map((m, i) => (
              <div key={m.id} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                  i === 0 ? "bg-warning-500/20 text-warning-400" : i === 1 ? "bg-slate-400/20 text-slate-300" : "bg-navy-700 text-navy-300"
                }`}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{m.nama}</p>
                  <p className="text-xs text-navy-400">{m.satuan}</p>
                </div>
                <div className="text-right">
                  <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${getTierColor(m.tier)}`}>
                    {getTierLabel(m.tier)}
                  </span>
                  <p className="text-xs text-navy-400 mt-0.5">Skor: {m.skor}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-navy-900/80 rounded-2xl p-5 border border-navy-700/30">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-danger-400" />
              Perlu Perhatian
            </h3>
          </div>
          <div className="space-y-3 mb-4">
            {riskMembers.map((m) => (
              <div key={m.id} className="flex items-center gap-3 bg-navy-800/50 rounded-xl p-3">
                <div className="w-8 h-8 rounded-lg bg-danger-500/20 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-danger-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{m.nama}</p>
                  <p className="text-xs text-navy-400">Skor: {m.skor} - Sisa pinjaman: {formatRupiah(m.sisaPinjaman)}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-danger-600/10 border border-danger-600/20 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-danger-400" />
              <span className="text-sm font-medium text-danger-400">Kredit Macet</span>
            </div>
            <p className="text-2xl font-bold text-white">{tingkatMacet}%</p>
            <p className="text-xs text-navy-400">{pinjamanMacet.length} dari {pinjamanList.length} pinjaman</p>
          </div>
        </div>
      </div>
    </div>
  );
}
