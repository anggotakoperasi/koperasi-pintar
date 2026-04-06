"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Eye,
  EyeOff,
  LogIn,
  ShieldCheck,
  UserCog,
  Landmark,
  Briefcase,
  User,
  Users,
  ClipboardCheck,
  ChevronDown,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getOrgName } from "@/data/mock";

export interface UserSession {
  username: string;
  nama: string;
  role: string;
  roleLabel: string;
  loginAt?: string;
  device?: string;
  ip?: string;
}

interface LoginPageProps {
  onLogin: (session: UserSession) => void;
}

interface RoleOption {
  value: string;
  label: string;
  icon: LucideIcon;
  desc: string;
}

const roles: RoleOption[] = [
  { value: "super_admin", label: "Super Admin", icon: ShieldCheck, desc: "Pengurus Inti - Akses penuh" },
  { value: "admin_ops", label: "Admin Operasional", icon: UserCog, desc: "Operasional harian koperasi" },
  { value: "bendahara", label: "Bendahara", icon: Landmark, desc: "Keuangan & pembukuan" },
  { value: "manajer_unit", label: "Manajer Unit Usaha", icon: Briefcase, desc: "Pengelola unit usaha" },
  { value: "pegawai", label: "Pegawai", icon: User, desc: "Staf koperasi" },
  { value: "anggota", label: "Anggota Koperasi", icon: Users, desc: "Anggota terdaftar" },
  { value: "auditor", label: "Auditor / Pengawas", icon: ClipboardCheck, desc: "Pengawasan & audit" },
];

const demoAccounts: Record<string, { username: string; password: string; nama: string }> = {
  super_admin: { username: "admin", password: "admin123", nama: "IPTU (PURN) POL HARDOYO" },
  admin_ops: { username: "operator", password: "operator123", nama: "BRIPKA DEWI ASTUTI" },
  bendahara: { username: "bendahara", password: "bend123", nama: "IPTU SLAMET RIYADI" },
  manajer_unit: { username: "manajer", password: "manajer123", nama: "AIPDA RINA MARLINA" },
  pegawai: { username: "pegawai", password: "pegawai123", nama: "BRIPTU ADE FIRMANSYAH" },
  anggota: { username: "anggota", password: "anggota123", nama: "BRIPKA AHMAD SURYANA" },
  auditor: { username: "auditor", password: "auditor123", nama: "AKP HASAN BASRI" },
};

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const selectedRoleObj = roles.find((r) => r.value === selectedRole);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!selectedRole) {
      setError("Pilih role / jabatan terlebih dahulu");
      return;
    }
    if (!username.trim()) {
      setError("Username tidak boleh kosong");
      return;
    }
    if (!password.trim()) {
      setError("Password tidak boleh kosong");
      return;
    }

    setIsLoading(true);

    const ua = navigator.userAgent;
    let deviceLabel = "Unknown";
    if (/Mobile|Android/i.test(ua)) deviceLabel = "Mobile";
    else if (/Tablet|iPad/i.test(ua)) deviceLabel = "Tablet";
    else deviceLabel = "Desktop";
    const browserMatch = ua.match(/(Chrome|Firefox|Safari|Edge|Opera)\/[\d.]+/);
    if (browserMatch) deviceLabel += ` — ${browserMatch[1]}`;
    const osMatch = ua.match(/\(([^)]+)\)/);
    if (osMatch) {
      const osPart = osMatch[1].split(";")[0].trim();
      deviceLabel += ` (${osPart})`;
    }

    fetch("https://api.ipify.org?format=json")
      .then((r) => r.json())
      .then((data) => data.ip as string)
      .catch(() => "Tidak diketahui")
      .then((ip) => {
        setTimeout(() => {
          const demo = demoAccounts[selectedRole];
          if (demo && username === demo.username && password === demo.password) {
            const roleObj = roles.find((r) => r.value === selectedRole)!;
            onLogin({
              username,
              nama: demo.nama,
              role: selectedRole,
              roleLabel: roleObj.label,
              loginAt: new Date().toISOString(),
              device: deviceLabel,
              ip,
            });
          } else {
            setError("Username atau password salah. Coba gunakan akun demo.");
            setIsLoading(false);
          }
        }, 500);
      });
  };

  const fillDemo = () => {
    if (!selectedRole) {
      setError("Pilih role dulu, baru tekan tombol demo");
      return;
    }
    const demo = demoAccounts[selectedRole];
    if (demo) {
      setUsername(demo.username);
      setPassword(demo.password);
      setError("");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
        backgroundSize: "40px 40px",
      }} />
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-accent-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-accent-600/5 rounded-full blur-3xl" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-white shadow-lg shadow-accent-500/20 mb-5 overflow-hidden">
            <Image src="/logo.png" alt="Logo PRIMKOPPOL" width={96} height={96} className="w-full h-full object-cover" priority />
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">Koperasi Pintar</h1>
          <p className="text-navy-200 text-base">{getOrgName()}</p>
          <p className="text-navy-300 text-sm mt-1">Sistem Simpan Pinjam Koperasi Terpadu</p>
        </div>

        {/* Login Card */}
        <div className="bg-navy-900/90 border border-navy-700/40 rounded-3xl p-7 backdrop-blur-sm shadow-2xl">
          <h2 className="text-lg font-semibold text-white mb-1">Masuk ke Sistem</h2>
          <p className="text-sm text-navy-300 mb-6">Silakan pilih jabatan dan masukkan akun Anda</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Role selector */}
            <div>
              <label className="block text-sm font-medium text-navy-200 mb-2">
                Jabatan / Role
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                  className="w-full flex items-center justify-between bg-navy-800 border border-navy-600/50 rounded-xl px-4 py-3.5 text-left hover:border-accent-500/50 transition-colors cursor-pointer focus:outline-none focus:border-accent-500/70 focus:ring-1 focus:ring-accent-500/30"
                >
                  {selectedRoleObj ? (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-accent-500/15 flex items-center justify-center">
                        <selectedRoleObj.icon className="w-4 h-4 text-accent-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{selectedRoleObj.label}</p>
                        <p className="text-xs text-navy-400">{selectedRoleObj.desc}</p>
                      </div>
                    </div>
                  ) : (
                    <span className="text-sm text-navy-400">-- Pilih Jabatan --</span>
                  )}
                  <ChevronDown className={`w-5 h-5 text-navy-400 transition-transform ${showRoleDropdown ? "rotate-180" : ""}`} />
                </button>

                {showRoleDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-navy-800 border border-navy-600/50 rounded-xl shadow-2xl z-50 overflow-hidden max-h-72 overflow-y-auto">
                    {roles.map((role) => {
                      const Icon = role.icon;
                      const isSelected = selectedRole === role.value;
                      return (
                        <button
                          key={role.value}
                          type="button"
                          onClick={() => {
                            setSelectedRole(role.value);
                            setShowRoleDropdown(false);
                            setUsername("");
                            setPassword("");
                            setError("");
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors cursor-pointer ${
                            isSelected
                              ? "bg-accent-500/10 border-l-2 border-accent-400"
                              : "hover:bg-navy-700/60 border-l-2 border-transparent"
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            isSelected ? "bg-accent-500/20" : "bg-navy-700"
                          }`}>
                            <Icon className={`w-4 h-4 ${isSelected ? "text-accent-400" : "text-navy-300"}`} />
                          </div>
                          <div className="flex-1">
                            <p className={`text-sm font-medium ${isSelected ? "text-accent-400" : "text-white"}`}>{role.label}</p>
                            <p className="text-xs text-navy-400">{role.desc}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-navy-200 mb-2">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError(""); }}
                placeholder="Masukkan username"
                className="w-full bg-navy-800 border border-navy-600/50 rounded-xl px-4 py-3.5 text-sm text-white placeholder-navy-400 outline-none focus:border-accent-500/70 focus:ring-1 focus:ring-accent-500/30 transition-colors"
                autoComplete="username"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-navy-200 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  placeholder="Masukkan password"
                  className="w-full bg-navy-800 border border-navy-600/50 rounded-xl px-4 py-3.5 pr-12 text-sm text-white placeholder-navy-400 outline-none focus:border-accent-500/70 focus:ring-1 focus:ring-accent-500/30 transition-colors"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-navy-400 hover:text-white transition-colors cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="bg-danger-600/10 border border-danger-600/25 rounded-xl px-4 py-3 text-sm text-danger-400">
                {error}
              </div>
            )}

            {/* Login button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-accent-500 hover:bg-accent-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-colors cursor-pointer text-base shadow-lg shadow-accent-500/20"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Masuk
                </>
              )}
            </button>
          </form>

        </div>

        {/* Footer */}
        <p className="text-center text-xs text-navy-400 mt-6">
          Koperasi Pintar v1.0 &middot; {getOrgName()}
        </p>
      </div>
    </div>
  );
}
