"use client";

import {
  FileText,
  Download,
  Printer,
  FileSpreadsheet,
  File,
  Users,
  Wallet,
  HandCoins,
  Receipt,
  PieChart,
  ClipboardList,
  BarChart3,
  Calendar,
  ArrowRight,
} from "lucide-react";

const laporanCategories = [
  {
    title: "Laporan Anggota",
    icon: Users,
    color: "accent",
    items: [
      "Daftar Anggota Aktif",
      "Nominatif Simpanan & Pinjaman",
      "Daftar Anggota per Satuan",
      "Rekap Data Anggota",
    ],
  },
  {
    title: "Laporan Simpanan",
    icon: Wallet,
    color: "green",
    items: [
      "Daftar Setoran Simpanan",
      "Daftar Pengambilan Simpanan",
      "Rekapitulasi Simpanan",
      "Akumulasi Jasa Simpanan",
      "Rekening Koran Simpanan",
      "Cetak Daftar Setoran per Anggota",
    ],
  },
  {
    title: "Laporan Pinjaman",
    icon: HandCoins,
    color: "amber",
    items: [
      "Daftar Realisasi Pinjaman",
      "Daftar Setoran Jasa Pinjaman",
      "Daftar Pinjaman Jatuh Tempo",
      "Daftar Pinjaman Macet",
      "Rekening Koran Pinjaman",
      "Daftar Pengambilan per Anggota",
    ],
  },
  {
    title: "Laporan Potongan",
    icon: Receipt,
    color: "purple",
    items: [
      "Daftar Potongan Bulanan",
      "Rekap Daftar Potongan",
      "Struk Potongan per Anggota",
      "Koreksi Daftar Potongan",
    ],
  },
  {
    title: "Laporan SHU",
    icon: PieChart,
    color: "pink",
    items: [
      "Rincian SHU per Anggota",
      "Rekapitulasi SHU",
      "Distribusi SHU",
      "Simulasi SHU",
    ],
  },
  {
    title: "Laporan Keuangan",
    icon: BarChart3,
    color: "cyan",
    items: [
      "Neraca",
      "Laba Rugi",
      "Arus Kas",
      "Buku Besar",
      "Grafik Tren 3 Tahun",
    ],
  },
];

const colorBg: Record<string, string> = {
  accent: "bg-accent-500/10 border-accent-500/20",
  green: "bg-success-500/10 border-success-500/20",
  amber: "bg-warning-500/10 border-warning-500/20",
  purple: "bg-purple-500/10 border-purple-500/20",
  pink: "bg-pink-500/10 border-pink-500/20",
  cyan: "bg-cyan-500/10 border-cyan-500/20",
};

const colorIcon: Record<string, string> = {
  accent: "bg-accent-500/20 text-accent-400",
  green: "bg-success-500/20 text-success-400",
  amber: "bg-warning-500/20 text-warning-400",
  purple: "bg-purple-500/20 text-purple-400",
  pink: "bg-pink-500/20 text-pink-400",
  cyan: "bg-cyan-500/20 text-cyan-400",
};

const colorText: Record<string, string> = {
  accent: "text-accent-400",
  green: "text-success-400",
  amber: "text-warning-400",
  purple: "text-purple-400",
  pink: "text-pink-400",
  cyan: "text-cyan-400",
};

export default function LaporanPage() {
  return (
    <div className="space-y-6">
      <div className="bg-navy-900/80 rounded-2xl border border-navy-700/30 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white">Cetak Laporan</h3>
            <p className="text-sm text-navy-400">Pilih jenis laporan untuk dicetak atau di-export</p>
          </div>
          <div className="flex items-center gap-2 bg-navy-800 rounded-xl px-3 py-2 border border-navy-700/50">
            <Calendar className="w-4 h-4 text-navy-400" />
            <span className="text-sm text-white">Maret 2026</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {laporanCategories.map((cat, i) => {
            const Icon = cat.icon;
            return (
              <div key={i} className={`rounded-2xl border p-5 ${colorBg[cat.color]}`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorIcon[cat.color]}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-semibold text-white">{cat.title}</h4>
                </div>
                <div className="space-y-1.5">
                  {cat.items.map((item, j) => (
                    <button
                      key={j}
                      className="w-full flex items-center justify-between text-left px-3 py-2.5 rounded-xl hover:bg-navy-800/60 transition-colors group cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-navy-500 group-hover:text-navy-300" />
                        <span className="text-sm text-navy-200 group-hover:text-white transition-colors">{item}</span>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Printer className="w-3.5 h-3.5 text-navy-400 hover:text-accent-400 cursor-pointer" />
                        <Download className="w-3.5 h-3.5 text-navy-400 hover:text-success-400 cursor-pointer" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-navy-900/80 rounded-2xl border border-navy-700/30 p-5">
        <h3 className="text-base font-semibold text-white mb-4">Export Format</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button className="flex items-center gap-4 bg-navy-800/50 hover:bg-navy-800 border border-navy-700/30 rounded-xl p-4 transition-colors cursor-pointer group">
            <div className="w-12 h-12 rounded-xl bg-danger-500/15 flex items-center justify-center">
              <File className="w-6 h-6 text-danger-400" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-white">PDF</p>
              <p className="text-xs text-navy-400">Siap cetak, format profesional</p>
            </div>
            <ArrowRight className="w-4 h-4 text-navy-500 ml-auto group-hover:text-white transition-colors" />
          </button>
          <button className="flex items-center gap-4 bg-navy-800/50 hover:bg-navy-800 border border-navy-700/30 rounded-xl p-4 transition-colors cursor-pointer group">
            <div className="w-12 h-12 rounded-xl bg-success-500/15 flex items-center justify-center">
              <FileSpreadsheet className="w-6 h-6 text-success-400" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-white">Excel</p>
              <p className="text-xs text-navy-400">Detail lengkap, bisa diedit</p>
            </div>
            <ArrowRight className="w-4 h-4 text-navy-500 ml-auto group-hover:text-white transition-colors" />
          </button>
          <button className="flex items-center gap-4 bg-navy-800/50 hover:bg-navy-800 border border-navy-700/30 rounded-xl p-4 transition-colors cursor-pointer group">
            <div className="w-12 h-12 rounded-xl bg-accent-500/15 flex items-center justify-center">
              <ClipboardList className="w-6 h-6 text-accent-400" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-white">Preview</p>
              <p className="text-xs text-navy-400">Lihat di layar sebelum cetak</p>
            </div>
            <ArrowRight className="w-4 h-4 text-navy-500 ml-auto group-hover:text-white transition-colors" />
          </button>
        </div>
      </div>
    </div>
  );
}
