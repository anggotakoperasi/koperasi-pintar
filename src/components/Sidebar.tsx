"use client";

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
  Shield,
} from "lucide-react";

interface SidebarProps {
  activeMenu: string;
  onMenuChange: (menu: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onLogout: () => void;
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

export default function Sidebar({ activeMenu, onMenuChange, collapsed, onToggleCollapse, onLogout }: SidebarProps) {

  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-navy-900 border-r border-navy-700/50 z-40 flex flex-col transition-all duration-300 ${
        collapsed ? "w-[72px]" : "w-[260px]"
      }`}
    >
      <div className="flex items-center gap-3 px-4 h-[72px] border-b border-navy-700/50">
        <div className="w-10 h-10 rounded-xl bg-accent-500 flex items-center justify-center flex-shrink-0">
          <Shield className="w-6 h-6 text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="text-base font-bold text-white leading-tight">Koperasi Pintar</h1>
            <p className="text-[11px] text-navy-300 leading-tight">PRIMKOPPOL Subang</p>
          </div>
        )}
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeMenu === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onMenuChange(item.id)}
              title={collapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-[15px] font-medium transition-all duration-200 cursor-pointer ${
                isActive
                  ? "bg-accent-500/15 text-accent-400 shadow-lg shadow-accent-500/5"
                  : "text-navy-300 hover:bg-navy-800 hover:text-white"
              }`}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-accent-400" : ""}`} />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t border-navy-700/50 space-y-1">
        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-navy-400 hover:bg-navy-800 hover:text-white transition-all text-sm cursor-pointer"
        >
          {collapsed ? <ChevronRight className="w-5 h-5 flex-shrink-0" /> : <ChevronLeft className="w-5 h-5 flex-shrink-0" />}
          {!collapsed && <span>Perkecil Menu</span>}
        </button>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-navy-400 hover:bg-danger-600/20 hover:text-danger-400 transition-all text-sm cursor-pointer"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Keluar</span>}
        </button>
      </div>
    </aside>
  );
}
