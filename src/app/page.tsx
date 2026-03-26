"use client";

import { useState } from "react";
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
  const [user, setUser] = useState<UserSession | null>(null);
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  if (!user) {
    return <LoginPage onLogin={(session) => setUser(session)} />;
  }

  const config = pageConfig[activeMenu] || pageConfig.dashboard;

  const handleLogout = () => {
    setUser(null);
    setActiveMenu("dashboard");
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
      />
      <main className={`transition-all duration-300 ${sidebarCollapsed ? "ml-[72px]" : "ml-[260px]"}`}>
        <Header title={config.title} subtitle={config.subtitle} user={user} />
        <div className="p-6">{renderPage()}</div>
      </main>
    </div>
  );
}
