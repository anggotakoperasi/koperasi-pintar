"use client";

import {
  Users,
  Wallet,
  HandCoins,
  TrendingUp,
  AlertTriangle,
  Award,
  ArrowUpRight,
  PiggyBank,
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
  AreaChart,
  Area,
} from "recharts";
import StatCard from "./StatCard";
import {
  anggotaList,
  pinjamanList,
  arusKasBulanan,
  komposisiSimpanan,
  trendAnggota,
  shuData,
  formatRupiah,
  getTierColor,
  getTierLabel,
} from "@/data/mock";

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
  const totalAnggotaAktif = anggotaList.filter((a) => a.status === "aktif").length;
  const totalSimpanan = anggotaList.reduce((sum, a) => sum + a.simpananPokok + a.simpananWajib + a.simpananSukarela, 0);
  const totalPinjamanBeredar = pinjamanList.reduce((sum, p) => sum + p.sisaPinjaman, 0);
  const pinjamanMacet = pinjamanList.filter((p) => p.status === "macet");
  const tingkatMacet = ((pinjamanMacet.length / pinjamanList.length) * 100).toFixed(1);

  const topMembers = [...anggotaList]
    .filter((a) => a.status === "aktif")
    .sort((a, b) => b.skor - a.skor)
    .slice(0, 5);

  const riskMembers = [...anggotaList]
    .filter((a) => a.tier === "risk" || a.tier === "standard")
    .sort((a, b) => a.skor - b.skor)
    .slice(0, 3);

  const kesehatanSkor = 82;
  const kesehatanLabel = kesehatanSkor >= 80 ? "A" : kesehatanSkor >= 60 ? "B" : "C";
  const kesehatanColor = kesehatanSkor >= 80 ? "text-success-400" : kesehatanSkor >= 60 ? "text-warning-400" : "text-danger-400";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Anggota Aktif"
          value={totalAnggotaAktif.toString()}
          subtitle="dari 312 total anggota"
          icon={Users}
          trend={12.2}
          color="blue"
        />
        <StatCard
          title="Total Simpanan"
          value={formatRupiah(totalSimpanan)}
          subtitle="pokok + wajib + sukarela"
          icon={Wallet}
          trend={8.5}
          color="green"
        />
        <StatCard
          title="Pinjaman Beredar"
          value={formatRupiah(totalPinjamanBeredar)}
          subtitle={`${pinjamanList.length} pinjaman aktif`}
          icon={HandCoins}
          trend={-3.2}
          color="amber"
        />
        <StatCard
          title="SHU Berjalan"
          value={formatRupiah(shuData.totalSHU)}
          subtitle={`+${shuData.pertumbuhan}% dari tahun lalu`}
          icon={PiggyBank}
          trend={shuData.pertumbuhan}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-navy-900/80 rounded-2xl p-5 border border-navy-700/30">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-white">Arus Kas Bulanan</h3>
              <p className="text-sm text-navy-400">Kas masuk vs kas keluar tahun 2026</p>
            </div>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={arusKasBulanan} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e3a6e30" />
                <XAxis dataKey="bulan" tick={{ fill: "#7890c1", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#7890c1", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}jt`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="masuk" name="Kas Masuk" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                <Bar dataKey="keluar" name="Kas Keluar" fill="#f59e0b80" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-navy-900/80 rounded-2xl p-5 border border-navy-700/30">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-white">Kesehatan Koperasi</h3>
            <div className={`text-3xl font-black ${kesehatanColor}`}>{kesehatanLabel}</div>
          </div>
          <div className="space-y-3">
            {[
              { label: "Likuiditas", value: 88, color: "bg-success-500" },
              { label: "Profitabilitas", value: 75, color: "bg-accent-500" },
              { label: "Risiko Pinjaman", value: 82, color: "bg-warning-500" },
              { label: "Pertumbuhan", value: 90, color: "bg-purple-500" },
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
          <div className="mt-4 pt-4 border-t border-navy-700/30">
            <p className="text-xs text-navy-400">Skor keseluruhan: <span className={`font-bold ${kesehatanColor}`}>{kesehatanSkor}/100</span></p>
          </div>
        </div>

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-navy-900/80 rounded-2xl p-5 border border-navy-700/30">
          <h3 className="text-base font-semibold text-white mb-1">Pertumbuhan Anggota</h3>
          <p className="text-sm text-navy-400 mb-4">5 tahun terakhir</p>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendAnggota}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e3a6e30" />
                <XAxis dataKey="tahun" tick={{ fill: "#7890c1", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#7890c1", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "#0f1d3d", border: "1px solid #2d4e93", borderRadius: "12px", fontSize: "12px" }} />
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="jumlah" name="Jumlah Anggota" stroke="#3b82f6" fill="url(#areaGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-navy-900/80 rounded-2xl p-5 border border-navy-700/30">
          <h3 className="text-base font-semibold text-white mb-1">Distribusi SHU</h3>
          <p className="text-sm text-navy-400 mb-4">Total: {formatRupiah(shuData.totalSHU)}</p>
          <div className="space-y-3">
            {shuData.distribusi.map((item, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-navy-300">{item.kategori} ({item.persentase}%)</span>
                  <span className="text-white font-medium">{formatRupiah(item.jumlah)}</span>
                </div>
                <div className="h-2.5 bg-navy-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${item.persentase * 2}%`,
                      background: ["#3b82f6", "#22c55e", "#f59e0b", "#a855f7", "#ec4899"][i],
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-navy-700/30 flex items-center justify-between">
            <span className="text-sm text-navy-300">vs Tahun Lalu</span>
            <div className="flex items-center gap-1 text-success-400 text-sm font-medium">
              <ArrowUpRight className="w-4 h-4" />
              +{shuData.pertumbuhan}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
