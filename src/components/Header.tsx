"use client";

import { Bell, Search, User, Calendar, Menu } from "lucide-react";
import type { UserSession } from "./LoginPage";

interface HeaderProps {
  title: string;
  subtitle?: string;
  user: UserSession;
  onMobileMenuOpen: () => void;
}

export default function Header({ title, subtitle, user, onMobileMenuOpen }: HeaderProps) {
  const now = new Date();
  const dateStr = now.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <header className="h-[64px] lg:h-[72px] border-b border-navy-700/50 bg-navy-950/80 backdrop-blur-sm flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        {/* Hamburger - mobile only */}
        <button
          onClick={onMobileMenuOpen}
          className="p-2 -ml-1 rounded-xl text-navy-300 hover:bg-navy-800 hover:text-white lg:hidden cursor-pointer"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div>
          <h2 className="text-lg lg:text-xl font-bold text-white">{title}</h2>
          {subtitle && <p className="text-xs lg:text-sm text-navy-300 hidden sm:block">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-2 lg:gap-4">
        <div className="hidden xl:flex items-center gap-2 text-sm text-navy-300">
          <Calendar className="w-4 h-4" />
          <span>{dateStr}</span>
        </div>

        <div className="hidden lg:flex items-center bg-navy-800 rounded-xl px-3 py-2 gap-2 border border-navy-700/50">
          <Search className="w-4 h-4 text-navy-400" />
          <input
            type="text"
            placeholder="Cari anggota, transaksi..."
            className="bg-transparent text-sm text-white placeholder-navy-400 outline-none w-48"
          />
        </div>

        <button className="relative p-2 rounded-xl hover:bg-navy-800 transition-colors cursor-pointer">
          <Bell className="w-5 h-5 text-navy-300" />
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-danger-500 rounded-full border-2 border-navy-950" />
        </button>

        <div className="flex items-center gap-2 lg:gap-3 pl-2 lg:pl-4 border-l border-navy-700/50">
          <div className="w-8 h-8 lg:w-9 lg:h-9 rounded-xl bg-accent-500/20 flex items-center justify-center">
            <User className="w-4 h-4 lg:w-5 lg:h-5 text-accent-400" />
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-white">{user.nama}</p>
            <p className="text-xs text-navy-400">{user.roleLabel}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
