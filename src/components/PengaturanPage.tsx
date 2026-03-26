"use client";

import {
  Settings,
  Building2,
  UserCog,
  Key,
  Database,
  Shield,
  Tag,
  RefreshCw,
  HardDrive,
  Upload,
  Info,
  Save,
  ChevronRight,
} from "lucide-react";

const settingSections = [
  {
    title: "Setup Program",
    desc: "Konfigurasi nama & alamat koperasi, jenis printer, dll.",
    icon: Building2,
    color: "accent",
  },
  {
    title: "Data Operator",
    desc: "Kelola akun operator dan hak akses.",
    icon: UserCog,
    color: "green",
  },
  {
    title: "Edit Kode Pinjaman",
    desc: "Atur kode jenis pinjaman dan parameter bunga.",
    icon: Tag,
    color: "amber",
  },
  {
    title: "Edit Kode Simpanan",
    desc: "Atur kode jenis simpanan dan konfigurasi.",
    icon: Key,
    color: "purple",
  },
  {
    title: "Backup File Data",
    desc: "Backup seluruh data koperasi ke file.",
    icon: HardDrive,
    color: "blue",
  },
  {
    title: "Restore File Backup",
    desc: "Kembalikan data dari file backup.",
    icon: Upload,
    color: "red",
  },
  {
    title: "Reindex File Data",
    desc: "Perbaiki index database untuk performa optimal.",
    icon: RefreshCw,
    color: "cyan",
  },
  {
    title: "Informasi Software",
    desc: "Versi aplikasi dan informasi sistem.",
    icon: Info,
    color: "gray",
  },
];

const colorStyles: Record<string, { icon: string; bg: string }> = {
  accent: { icon: "bg-accent-500/20 text-accent-400", bg: "border-accent-500/20 hover:bg-accent-500/5" },
  green: { icon: "bg-success-500/20 text-success-400", bg: "border-success-500/20 hover:bg-success-500/5" },
  amber: { icon: "bg-warning-500/20 text-warning-400", bg: "border-warning-500/20 hover:bg-warning-500/5" },
  purple: { icon: "bg-purple-500/20 text-purple-400", bg: "border-purple-500/20 hover:bg-purple-500/5" },
  blue: { icon: "bg-blue-500/20 text-blue-400", bg: "border-blue-500/20 hover:bg-blue-500/5" },
  red: { icon: "bg-danger-500/20 text-danger-400", bg: "border-danger-500/20 hover:bg-danger-500/5" },
  cyan: { icon: "bg-cyan-500/20 text-cyan-400", bg: "border-cyan-500/20 hover:bg-cyan-500/5" },
  gray: { icon: "bg-gray-500/20 text-gray-400", bg: "border-gray-500/20 hover:bg-gray-500/5" },
};

export default function PengaturanPage() {
  return (
    <div className="space-y-6">
      <div className="bg-navy-900/80 rounded-2xl border border-navy-700/30 p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl bg-accent-500/20 flex items-center justify-center">
            <Building2 className="w-6 h-6 text-accent-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">PRIMKOPPOL RESOR SUBANG</h3>
            <p className="text-sm text-navy-400">Jl. Otista No.52, Subang</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-navy-800/50 rounded-xl p-3">
            <p className="text-xs text-navy-400">Nama Koperasi</p>
            <p className="text-sm font-medium text-white mt-1">Primkoppol Resor Subang</p>
          </div>
          <div className="bg-navy-800/50 rounded-xl p-3">
            <p className="text-xs text-navy-400">Badan Hukum</p>
            <p className="text-sm font-medium text-white mt-1">No. 123/BH/2018</p>
          </div>
          <div className="bg-navy-800/50 rounded-xl p-3">
            <p className="text-xs text-navy-400">Ketua</p>
            <p className="text-sm font-medium text-white mt-1">KOMPOL SURYADI</p>
          </div>
          <div className="bg-navy-800/50 rounded-xl p-3">
            <p className="text-xs text-navy-400">Periode</p>
            <p className="text-sm font-medium text-white mt-1">2025 - 2028</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {settingSections.map((section, i) => {
          const Icon = section.icon;
          const style = colorStyles[section.color];
          return (
            <button
              key={i}
              className={`flex items-center gap-4 bg-navy-900/80 border rounded-2xl p-5 transition-all cursor-pointer group text-left ${style.bg}`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${style.icon}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">{section.title}</p>
                <p className="text-xs text-navy-400 mt-0.5">{section.desc}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-navy-600 group-hover:text-navy-300 transition-colors" />
            </button>
          );
        })}
      </div>

      <div className="bg-navy-900/80 rounded-2xl border border-navy-700/30 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Info className="w-5 h-5 text-accent-400" />
          <h3 className="text-base font-semibold text-white">Informasi Sistem</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-navy-800/50 rounded-xl p-3">
            <p className="text-xs text-navy-400">Versi Aplikasi</p>
            <p className="text-sm font-medium text-white mt-1">Koperasi Pintar v1.0</p>
          </div>
          <div className="bg-navy-800/50 rounded-xl p-3">
            <p className="text-xs text-navy-400">Database</p>
            <p className="text-sm font-medium text-white mt-1">PostgreSQL 16</p>
          </div>
          <div className="bg-navy-800/50 rounded-xl p-3">
            <p className="text-xs text-navy-400">Terakhir Backup</p>
            <p className="text-sm font-medium text-white mt-1">17 Mar 2026, 01:21</p>
          </div>
          <div className="bg-navy-800/50 rounded-xl p-3">
            <p className="text-xs text-navy-400">Operator Aktif</p>
            <p className="text-sm font-medium text-white mt-1">Admin (Super Admin)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
