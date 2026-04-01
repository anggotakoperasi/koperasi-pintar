"use client";

import { useState, useEffect } from "react";
import LoginPage from "@/components/LoginPage";
import type { UserSession } from "@/components/LoginPage";
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
      case "dashboard": return <DashboardPage />;
      case "anggota": return <AnggotaPage />;
      case "simpanan": return <SimpananPage />;
      case "pinjaman": return <PinjamanPage />;
      case "potongan": return <PotonganPage />;
      case "shu": return <SHUPage />;
      case "laporan": return <LaporanPage />;
      case "pengaturan": return <PengaturanPage />;
      default: return <DashboardPage />;
    }
  };

  return (
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
        />
        <div className="p-4 lg:p-6">{renderPage()}</div>
      </main>
    </div>
  );
}
