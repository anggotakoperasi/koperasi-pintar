"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, Search, User, Calendar, Menu, LogOut, ChevronDown } from "lucide-react";
import type { UserSession } from "./LoginPage";

interface HeaderProps {
  title: string;
  subtitle?: string;
  user: UserSession;
  onMobileMenuOpen: () => void;
  onLogout: () => void;
}

export default function Header({ title, subtitle, user, onMobileMenuOpen, onLogout }: HeaderProps) {
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const now = new Date();
  const dateStr = now.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const initials = user.nama
    .split(" ")
    .filter((_, i) => i > 0)
    .slice(0, 2)
    .map((w) => w[0])
    .join("");

  return (
    <header className="h-[64px] lg:h-[72px] border-b border-navy-700/50 bg-navy-950/80 backdrop-blur-sm flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-3">
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

        {/* Profile section */}
        <div className="relative pl-2 lg:pl-4 border-l border-navy-700/50" ref={profileRef}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 lg:gap-3 cursor-pointer rounded-xl p-1 lg:p-1.5 hover:bg-navy-800/60 transition-colors"
          >
            <div className="w-9 h-9 rounded-xl bg-accent-500/20 flex items-center justify-center text-sm font-bold text-accent-400">
              {initials || <User className="w-5 h-5" />}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-white">{user.nama}</p>
              <p className="text-xs text-navy-400">{user.roleLabel}</p>
            </div>
            <ChevronDown className={`w-4 h-4 text-navy-400 hidden md:block transition-transform ${profileOpen ? "rotate-180" : ""}`} />
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-navy-800 border border-navy-600/50 rounded-2xl shadow-2xl overflow-hidden z-50">
              <div className="p-4 border-b border-navy-700/50">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-accent-500/20 flex items-center justify-center text-base font-bold text-accent-400">
                    {initials || <User className="w-6 h-6" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{user.nama}</p>
                    <p className="text-xs text-accent-400 font-medium">{user.roleLabel}</p>
                    <p className="text-xs text-navy-400 mt-0.5">@{user.username}</p>
                  </div>
                </div>
              </div>
              <div className="p-2">
                <div className="px-3 py-2 text-xs text-navy-400 flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5" />
                  {dateStr}
                </div>
                <button
                  onClick={() => { setProfileOpen(false); onLogout(); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-danger-400 hover:bg-danger-600/15 transition-colors cursor-pointer text-sm"
                >
                  <LogOut className="w-4 h-4" />
                  Keluar dari Sistem
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
