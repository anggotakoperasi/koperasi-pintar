"use client";

import { useState, useEffect, useCallback } from "react";
import LoginPage from "@/components/LoginPage";
import type { UserSession } from "@/components/LoginPage";
import type { Anggota } from "@/data/mock";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import DashboardPage from "@/components/DashboardPage";
import AnggotaPage from "@/components/AnggotaPage";
import SimpananPage from "@/components/SimpananPage";
import PinjamanPage from "@/components/PinjamanPage";
import PotonganPage from "@/components/PotonganPage";
import SHUPage from "@/components/SHUPage";
import LaporanPage from "@/components/LaporanPage";
import PengaturanPage from "@/components/PengaturanPage";
import { ToastProvider } from "@/components/Toast";

const SESSION_KEY = "koperasi_session";
const MENU_KEY = "koperasi_menu";

function loadSession(): UserSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function loadMenu(): string {
  if (typeof window === "undefined") return "dashboard";
  return localStorage.getItem(MENU_KEY) || "dashboard";
}

const pageConfig: Record<string, { title: string; subtitle: string }> = {
  dashboard: { title: "Dashboard", subtitle: "Ringkasan data koperasi secara real-time" },
  anggota: { title: "Data Anggota", subtitle: "Kelola data anggota koperasi" },
  simpanan: { title: "Simpanan", subtitle: "Setoran & pengambilan simpanan anggota" },
  pinjaman: { title: "Pinjaman", subtitle: "Manajemen pinjaman & angsuran" },
  potongan: { title: "Daftar Potongan", subtitle: "Potongan gaji untuk simpanan & angsuran" },
  potongan_cetak: { title: "Pencetakan Daftar Potongan", subtitle: "Cetak daftar potongan per periode" },
  potongan_struk: { title: "Pencetakan Struk Potongan", subtitle: "Cetak struk potongan individual" },
  potongan_rekap: { title: "Rekap Daftar Potongan", subtitle: "Rekapitulasi data potongan anggota" },
  potongan_koreksi: { title: "Koreksi Daftar Potongan", subtitle: "Koreksi dan penyesuaian data potongan" },
  potongan_rekapitulasi: { title: "Daftar Potongan (Rekapitulasi)", subtitle: "Rekapitulasi lengkap potongan" },
  shu: { title: "SHU", subtitle: "Sisa Hasil Usaha & distribusi" },
  laporan: { title: "Laporan & Pencetakan", subtitle: "Cetak dan export laporan koperasi" },
  pengaturan: { title: "Pengaturan", subtitle: "Konfigurasi sistem dan data master" },
};

export default function Home() {
  const [user, setUser] = useState<UserSession | null>(loadSession);
  const [activeMenu, setActiveMenu] = useState(loadMenu);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [globalSelectedAnggota, setGlobalSelectedAnggota] = useState<Anggota | null>(null);
  const [highlightKey, setHighlightKey] = useState<string | null>(null);

  const handleGlobalSearch = useCallback((anggota: Anggota) => {
    setActiveMenu("anggota");
    setGlobalSelectedAnggota(anggota);
  }, []);

  const handleNotifNavigate = useCallback((menuId: string, hKey?: string) => {
    setActiveMenu(menuId);
    if (hKey) {
      setHighlightKey(hKey);
      setTimeout(() => setHighlightKey(null), 2500);
    }
  }, []);

  useEffect(() => { setHydrated(true); }, []);

  useEffect(() => {
    if (user) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem(MENU_KEY, activeMenu);
  }, [activeMenu]);

  if (!hydrated) return null;

  if (!user) {
    return <LoginPage onLogin={(session) => setUser(session)} />;
  }

  const config = pageConfig[activeMenu] || pageConfig.dashboard;

  const handleLogout = () => {
    setUser(null);
    setActiveMenu("dashboard");
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(MENU_KEY);
  };

  const renderPage = () => {
    switch (activeMenu) {
      case "dashboard": return <DashboardPage highlightKey={highlightKey} />;
      case "anggota": return <AnggotaPage globalSelectedAnggota={globalSelectedAnggota} onGlobalSelectedClear={() => setGlobalSelectedAnggota(null)} highlightKey={highlightKey} />;
      case "simpanan": return <SimpananPage highlightKey={highlightKey} />;
      case "pinjaman": return <PinjamanPage highlightKey={highlightKey} />;
      case "potongan":
      case "potongan_kelola":
      case "potongan_cetak":
      case "potongan_rekap":
      case "potongan_koreksi":
      case "potongan_riwayat":
        return <PotonganPage activeTab={activeMenu} highlightKey={highlightKey} />;
      case "shu": return <SHUPage />;
      case "laporan": return <LaporanPage />;
      case "pengaturan": return <PengaturanPage highlightKey={highlightKey} />;
      default: return <DashboardPage highlightKey={highlightKey} />;
    }
  };

  return (
    <ToastProvider>
    <div className="min-h-screen">
      <Sidebar
        activeMenu={activeMenu}
        onMenuChange={setActiveMenu}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        onLogout={handleLogout}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />
      {/* ml-0 on mobile, margin on desktop */}
      <main className={`transition-all duration-300 ml-0 ${sidebarCollapsed ? "lg:ml-[72px]" : "lg:ml-[260px]"}`}>
        <Header
          title={config.title}
          subtitle={config.subtitle}
          user={user}
          onMobileMenuOpen={() => setMobileMenuOpen(true)}
          onLogout={handleLogout}
          onSearchSelect={handleGlobalSearch}
          onNavigate={handleNotifNavigate}
        />
        <div className="p-4 lg:p-6">{renderPage()}</div>
      </main>
    </div>
    </ToastProvider>
  );
}
