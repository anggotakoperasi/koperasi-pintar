"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Bell, Search, User, Calendar, Menu, LogOut, ChevronDown, Loader2 } from "lucide-react";
import type { UserSession } from "./LoginPage";
import type { Anggota } from "@/data/mock";
import { searchAnggota } from "@/lib/fetchers";

interface HeaderProps {
  title: string;
  subtitle?: string;
  user: UserSession;
  onMobileMenuOpen: () => void;
  onLogout: () => void;
  onSearchSelect?: (anggota: Anggota) => void;
}

export default function Header({
  title,
  subtitle,
  user,
  onMobileMenuOpen,
  onLogout,
  onSearchSelect,
}: HeaderProps) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Anggota[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);
  const searchWrapRef = useRef<HTMLDivElement>(null);

  const now = new Date();
  const dateStr = now.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery.trim()), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }

    let cancelled = false;
    setSearchLoading(true);
    setSearchResults([]);
    searchAnggota(debouncedQuery)
      .then((rows) => {
        if (!cancelled) {
          setSearchResults(rows.slice(0, 8));
          setSearchLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSearchResults([]);
          setSearchLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (profileRef.current && !profileRef.current.contains(target)) {
        setProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(target)) {
        setNotifOpen(false);
      }
      if (searchWrapRef.current && !searchWrapRef.current.contains(target)) {
        setSearchDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const closeSearchDropdown = useCallback(() => {
    setSearchDropdownOpen(false);
  }, []);

  useEffect(() => {
    if (!searchDropdownOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        closeSearchDropdown();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [searchDropdownOpen, closeSearchDropdown]);

  const handleSearchSelect = (a: Anggota) => {
    onSearchSelect?.(a);
    setSearchQuery("");
    setDebouncedQuery("");
    setSearchResults([]);
    setSearchLoading(false);
    closeSearchDropdown();
  };

  const initials = user.nama
    .split(" ")
    .filter((_, i) => i > 0)
    .slice(0, 2)
    .map((w) => w[0])
    .join("");

  const trimmedSearch = searchQuery.trim();
  const showSearchPanel = searchDropdownOpen && trimmedSearch.length >= 2;
  const searchPending = trimmedSearch.length >= 2 && debouncedQuery !== trimmedSearch;
  const searchBusy = searchLoading || searchPending;

  return (
    <header className="h-[64px] lg:h-[72px] border-b border-navy-700/50 bg-navy-950/80 backdrop-blur-sm flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button
          type="button"
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

        <div ref={searchWrapRef} className="relative hidden lg:block">
          <div
            className={`flex items-center bg-navy-800 rounded-xl px-3 py-2 gap-2 border transition-colors ${
              searchDropdownOpen ? "border-navy-500/70 ring-1 ring-navy-600/40" : "border-navy-700/50"
            }`}
          >
            <Search className="w-4 h-4 shrink-0 text-navy-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchDropdownOpen(true)}
              placeholder="Cari nama, NRP/NIP, no. anggota..."
              className="bg-transparent text-sm text-white placeholder-navy-400 outline-none w-48"
              autoComplete="off"
              aria-expanded={showSearchPanel}
              aria-haspopup="listbox"
            />
            {searchBusy && <Loader2 className="w-4 h-4 shrink-0 text-accent-400 animate-spin" />}
          </div>

          {showSearchPanel && (
            <div
              className="absolute right-0 top-full mt-2 w-[min(100vw-2rem,22rem)] bg-navy-800 border border-navy-600/50 rounded-2xl shadow-2xl overflow-hidden z-50"
              role="listbox"
            >
              {searchBusy ? (
                <div className="px-4 py-8 flex flex-col items-center justify-center gap-2 text-navy-400 text-sm">
                  <Loader2 className="w-6 h-6 text-accent-400 animate-spin" />
                  <span>Mencari anggota...</span>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-navy-400">Tidak ada anggota yang cocok</div>
              ) : (
                <ul className="max-h-[min(70vh,20rem)] overflow-y-auto py-1">
                  {searchResults.map((a) => (
                    <li key={a.id}>
                      <button
                        type="button"
                        role="option"
                        className="w-full text-left px-4 py-3 hover:bg-navy-700/60 transition-colors cursor-pointer border-b border-navy-700/40 last:border-0"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleSearchSelect(a)}
                      >
                        <p className="text-sm font-semibold text-white truncate">{a.nama}</p>
                        <p className="text-xs text-navy-300 mt-1">
                          <span className="text-navy-400">Pangkat:</span> {a.pangkat || "—"}
                        </p>
                        <p className="text-xs text-navy-300 mt-0.5">
                          <span className="text-navy-400">Satuan:</span> {a.satuan || "—"}
                        </p>
                        <p className="text-xs text-navy-300 mt-0.5">
                          <span className="text-navy-400">NRP/NIP:</span> {a.nrp || "—"}
                        </p>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative p-2 rounded-xl hover:bg-navy-800 transition-colors cursor-pointer"
          >
            <Bell className="w-5 h-5 text-navy-300" />
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-danger-500 rounded-full border-2 border-navy-950" />
          </button>
          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-navy-800 border border-navy-600/50 rounded-2xl shadow-2xl overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-navy-700/50 flex items-center justify-between">
                <p className="text-sm font-semibold text-white">Notifikasi</p>
                <span className="text-xs font-medium text-accent-400 bg-accent-500/15 px-2 py-0.5 rounded-full">3 baru</span>
              </div>
              <ul className="max-h-72 overflow-y-auto divide-y divide-navy-700/40">
                {[
                  { msg: "Pinjaman baru diajukan oleh BRIPKA AHMAD SURYANA", time: "5 menit lalu", unread: true },
                  { msg: "Setoran simpanan wajib berhasil diproses", time: "1 jam lalu", unread: true },
                  { msg: "Potongan bulan Maret 2026 telah dikirim", time: "3 jam lalu", unread: true },
                  { msg: "Backup otomatis berhasil dilakukan", time: "1 hari lalu", unread: false },
                  { msg: "Anggota baru terdaftar: BRIPTU HENDRA", time: "2 hari lalu", unread: false },
                ].map((n, i) => (
                  <li key={i} className={`px-4 py-3 text-sm ${n.unread ? "bg-accent-500/5" : ""}`}>
                    <p className={`${n.unread ? "text-white font-medium" : "text-navy-300"}`}>{n.msg}</p>
                    <p className="text-xs text-navy-500 mt-1">{n.time}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="relative pl-2 lg:pl-4 border-l border-navy-700/50" ref={profileRef}>
          <button
            type="button"
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
            <ChevronDown
              className={`w-4 h-4 text-navy-400 hidden md:block transition-transform ${profileOpen ? "rotate-180" : ""}`}
            />
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
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    onLogout();
                  }}
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
