"use client";

import Image from "next/image";
import {
  LayoutDashboard,
  Users,
  Wallet,
  HandCoins,
  Receipt,
  PieChart,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  X,
} from "lucide-react";

interface SidebarProps {
  activeMenu: string;
  onMenuChange: (menu: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onLogout: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "anggota", label: "Data Anggota", icon: Users },
  { id: "simpanan", label: "Simpanan", icon: Wallet },
  { id: "pinjaman", label: "Pinjaman", icon: HandCoins },
  { id: "potongan", label: "Daftar Potongan", icon: Receipt },
  { id: "shu", label: "SHU", icon: PieChart },
  { id: "laporan", label: "Laporan", icon: FileText },
  { id: "pengaturan", label: "Pengaturan", icon: Settings },
];

export default function Sidebar({
  activeMenu,
  onMenuChange,
  collapsed,
  onToggleCollapse,
  onLogout,
  mobileOpen,
  onMobileClose,
}: SidebarProps) {
  const handleMenuClick = (id: string) => {
    onMenuChange(id);
    onMobileClose();
  };

  return (
    <>
      {/* Mobile overlay backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={`
          fixed left-0 top-0 h-full bg-navy-900 border-r border-navy-700/50 z-50 flex flex-col transition-all duration-300
          
          /* Mobile: slide-over drawer */
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
          w-[280px]
          
          /* Desktop: always visible, collapsible */
          lg:translate-x-0
          ${collapsed ? "lg:w-[72px]" : "lg:w-[260px]"}
        `}
      >
        <div className="flex items-center gap-3 px-4 h-[72px] border-b border-navy-700/50">
          <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-white">
            <Image src="/logo.png" alt="Logo PRIMKOPPOL" width={40} height={40} className="w-full h-full object-cover" priority />
          </div>
          <div className="overflow-hidden lg:hidden">
            <h1 className="text-base font-bold text-white leading-tight">Koperasi Pintar</h1>
            <p className="text-[11px] text-navy-300 leading-tight">PRIMKOPPOL Subang</p>
          </div>
          {!collapsed && (
            <div className="overflow-hidden hidden lg:block">
              <h1 className="text-base font-bold text-white leading-tight">Koperasi Pintar</h1>
              <p className="text-[11px] text-navy-300 leading-tight">PRIMKOPPOL Subang</p>
            </div>
          )}
          {/* Mobile close button */}
          <button
            onClick={onMobileClose}
            className="ml-auto p-2 rounded-xl text-navy-400 hover:bg-navy-800 hover:text-white lg:hidden cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeMenu === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleMenuClick(item.id)}
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-[15px] font-medium transition-all duration-200 cursor-pointer ${
                  isActive
                    ? "bg-accent-500/15 text-accent-400 shadow-lg shadow-accent-500/5"
                    : "text-navy-300 hover:bg-navy-800 hover:text-white"
                }`}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-accent-400" : ""}`} />
                {/* Mobile: always show label. Desktop: respect collapse */}
                <span className="lg:hidden">{item.label}</span>
                {!collapsed && <span className="hidden lg:inline">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-navy-700/50 space-y-1">
          {/* Collapse toggle - desktop only */}
          <button
            onClick={onToggleCollapse}
            className="w-full hidden lg:flex items-center gap-3 px-3 py-2.5 rounded-xl text-navy-400 hover:bg-navy-800 hover:text-white transition-all text-sm cursor-pointer"
          >
            {collapsed ? <ChevronRight className="w-5 h-5 flex-shrink-0" /> : <ChevronLeft className="w-5 h-5 flex-shrink-0" />}
            {!collapsed && <span>Perkecil Menu</span>}
          </button>
          <button
            onClick={() => { onLogout(); onMobileClose(); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-navy-400 hover:bg-danger-600/20 hover:text-danger-400 transition-all text-sm cursor-pointer"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span className="lg:hidden">Keluar</span>
            {!collapsed && <span className="hidden lg:inline">Keluar</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
