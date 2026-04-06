"use client";

import { useState, useEffect, useMemo, useCallback, type FormEvent } from "react";
import {
  HandCoins,
  Search,
  ChevronDown,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  Banknote,
  Loader2,
  X,
  Eye,
} from "lucide-react";
import StatCard from "./StatCard";
import { formatRupiah, getStatusPinjamanBg, getOrgName } from "@/data/mock";
import type { Pinjaman, Anggota } from "@/data/mock";
import { fetchPinjaman, fetchAnggota, insertPinjaman, bayarAngsuran } from "@/lib/fetchers";
import DetailPopup from "./DetailPopup";
import { useToast } from "./Toast";

const JENIS_PINJAMAN_DEFAULT = ["Simpan Pinjam", "Kredit Serba Guna", "Bank Mandiri", "Lainnya"];

function loadJenisPinjaman(): string[] {
  if (typeof window === "undefined") return JENIS_PINJAMAN_DEFAULT;
  try {
    const raw = localStorage.getItem("koperasi_pengaturan");
    if (!raw) return JENIS_PINJAMAN_DEFAULT;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed.kodePinjaman) && parsed.kodePinjaman.length > 0) {
      return parsed.kodePinjaman.map((k: { nama: string }) => k.nama);
    }
  } catch { /* ignore */ }
  return JENIS_PINJAMAN_DEFAULT;
}

function addMonthsIso(startYmd: string, months: number): string {
  const [y, m, d] = startYmd.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setMonth(date.getMonth() + months);
  const yy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

function formatThousands(v: string): string {
  const digits = v.replace(/\D/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("id-ID");
}

function stripThousands(v: string): string {
  return v.replace(/\./g, "");
}

function todayIso(): string {
  const d = new Date();
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

/** Cicilan bulanan: flat rate (pokok/tenor + pokok*bunga%). */
function hitungAngsuranPerBulan(
  pokok: number,
  bungaPerBulanPct: number,
  tenorBulan: number
): number {
  if (!tenorBulan || tenorBulan < 1) return 0;
  if (!pokok || pokok <= 0) return 0;
  const angsuranPokok = pokok / tenorBulan;
  const bungaPerBulan = pokok * (bungaPerBulanPct / 100);
  return Math.round(angsuranPokok + bungaPerBulan);
}

export default function PinjamanPage({ highlightKey }: { highlightKey?: string | null }) {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("semua");
  const [pinjamanList, setPinjamanList] = useState<Pinjaman[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalBaruOpen, setModalBaruOpen] = useState(false);
  const [modalBayarOpen, setModalBayarOpen] = useState(false);
  const [anggotaList, setAnggotaList] = useState<Anggota[]>([]);
  const [loadingAnggota, setLoadingAnggota] = useState(false);
  const [submittingBaru, setSubmittingBaru] = useState(false);
  const [submittingBayar, setSubmittingBayar] = useState(false);

  const [baruAnggotaId, setBaruAnggotaId] = useState("");
  const jenisPinjamanList = useMemo(() => loadJenisPinjaman(), [modalBaruOpen]);
  const [baruJenis, setBaruJenis] = useState<string>("");
  const [baruJumlah, setBaruJumlah] = useState("");
  const [baruTenor, setBaruTenor] = useState("");
  const [baruBunga, setBaruBunga] = useState("1");

  const [bayarPinjamanId, setBayarPinjamanId] = useState("");
  const [bayarPokok, setBayarPokok] = useState("");
  const [bayarJasa, setBayarJasa] = useState("");
  const [detailItem, setDetailItem] = useState<Pinjaman | null>(null);

  const refreshPinjaman = () =>
    fetchPinjaman()
      .then(setPinjamanList)
      .catch(console.error);

  useEffect(() => {
    fetchPinjaman()
      .then(setPinjamanList)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!modalBaruOpen) return;
    setBaruJenis(jenisPinjamanList[0] || "");
    setLoadingAnggota(true);
    fetchAnggota()
      .then(setAnggotaList)
      .catch(console.error)
      .finally(() => setLoadingAnggota(false));
  }, [modalBaruOpen, jenisPinjamanList]);

  const closeModalBaru = useCallback(() => { if (!submittingBaru) setModalBaruOpen(false); }, [submittingBaru]);
  const closeModalBayar = useCallback(() => { if (!submittingBayar) setModalBayarOpen(false); }, [submittingBayar]);

  useEffect(() => {
    if (!modalBaruOpen && !modalBayarOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        if (modalBaruOpen) closeModalBaru();
        if (modalBayarOpen) closeModalBayar();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [modalBaruOpen, modalBayarOpen, closeModalBaru, closeModalBayar]);

  const tanggalPinjamBaru = useMemo(() => todayIso(), [modalBaruOpen]);

  const parsedJumlah = parseFloat(baruJumlah.replace(/\./g, "").replace(",", ".")) || 0;
  const parsedTenor = parseInt(baruTenor, 10) || 0;
  const parsedBunga = parseFloat(baruBunga.replace(",", ".")) || 0;

  const angsuranDihitung = useMemo(
    () => hitungAngsuranPerBulan(parsedJumlah, parsedBunga, parsedTenor),
    [parsedJumlah, parsedBunga, parsedTenor]
  );

  const jatuhTempoDihitung = useMemo(() => {
    if (!parsedTenor || parsedTenor < 1) return "—";
    return addMonthsIso(tanggalPinjamBaru, parsedTenor);
  }, [tanggalPinjamBaru, parsedTenor]);

  const resetFormBaru = () => {
    setBaruAnggotaId("");
    setBaruJenis(jenisPinjamanList[0] || "");
    setBaruJumlah("");
    setBaruTenor("");
    setBaruBunga("1");
  };

  const resetFormBayar = () => {
    setBayarPinjamanId("");
    setBayarPokok("");
    setBayarJasa("");
  };

  const handleSubmitBaru = async (e: FormEvent) => {
    e.preventDefault();
    const anggota = anggotaList.find((a) => a.id === baruAnggotaId);
    if (!anggota || parsedJumlah <= 0 || parsedTenor < 1) return;
    setSubmittingBaru(true);
    try {
      const jt = addMonthsIso(tanggalPinjamBaru, parsedTenor);
      await insertPinjaman({
        anggotaId: anggota.id,
        namaAnggota: anggota.nama,
        jenisPinjaman: baruJenis,
        jumlahPinjaman: parsedJumlah,
        sisaPinjaman: parsedJumlah,
        bungaPerBulan: parsedBunga,
        tenor: parsedTenor,
        sisaTenor: parsedTenor,
        angsuranPerBulan: angsuranDihitung,
        status: "lancar",
        tanggalPinjam: tanggalPinjamBaru,
        jatuhTempo: jt,
      });
      await refreshPinjaman();
      setModalBaruOpen(false);
      resetFormBaru();
      toast("success", `Pinjaman baru ${formatRupiah(parsedJumlah)} untuk ${anggota.nama} berhasil disimpan.`);
    } catch (err) {
      console.error(err);
      toast("error", `Gagal menyimpan pinjaman: ${err instanceof Error ? err.message : "Terjadi kesalahan"}`);
    } finally {
      setSubmittingBaru(false);
    }
  };

  const handleSubmitBayar = async (e: FormEvent) => {
    e.preventDefault();
    const pokok = parseFloat(bayarPokok.replace(/\./g, "").replace(",", ".")) || 0;
    const jasa = parseFloat(bayarJasa.replace(/\./g, "").replace(",", ".")) || 0;
    if (!bayarPinjamanId || pokok < 0 || jasa < 0) return;
    setSubmittingBayar(true);
    try {
      await bayarAngsuran(bayarPinjamanId, pokok, jasa);
      await refreshPinjaman();
      setModalBayarOpen(false);
      resetFormBayar();
      toast("success", `Angsuran ${formatRupiah(pokok + jasa)} berhasil dibayar.`);
    } catch (err) {
      console.error(err);
      toast("error", `Gagal membayar angsuran: ${err instanceof Error ? err.message : "Terjadi kesalahan"}`);
    } finally {
      setSubmittingBayar(false);
    }
  };

  const pinjamanAktifBayar = pinjamanList.filter((p) => p.sisaPinjaman > 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-accent-400 animate-spin" />
        <span className="ml-3 text-navy-300">Memuat data pinjaman...</span>
      </div>
    );
  }

  const filtered = pinjamanList.filter((p) => {
    const matchSearch = p.namaAnggota.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "semua" || p.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalDisalurkan = pinjamanList.reduce((s, p) => s + p.jumlahPinjaman, 0);
  const totalSisa = pinjamanList.reduce((s, p) => s + p.sisaPinjaman, 0);
  const lancar = pinjamanList.filter((p) => p.status === "lancar").length;
  const macet = pinjamanList.filter((p) => p.status === "macet").length;

  const statusLabel = (s: string) => {
    switch (s) {
      case "lancar":
        return "Lancar";
      case "kurang_lancar":
        return "Kurang Lancar";
      case "macet":
        return "Macet";
      default:
        return s;
    }
  };

  const statusIcon = (s: string) => {
    switch (s) {
      case "lancar":
        return <CheckCircle2 className="w-3.5 h-3.5" />;
      case "kurang_lancar":
        return <Clock className="w-3.5 h-3.5" />;
      case "macet":
        return <XCircle className="w-3.5 h-3.5" />;
      default:
        return null;
    }
  };

  const modalShell =
    "fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-sm";
  const modalPanel =
    "w-full max-w-lg rounded-2xl border border-navy-600/50 bg-navy-950 shadow-2xl shadow-black/40";

  return (
    <div className="space-y-6">
      {modalBaruOpen && (
        <div
          className={modalShell}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-pinjaman-baru-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalBaruOpen(false);
          }}
        >
          <div className={modalPanel} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-navy-700/60 px-5 py-4">
              <h2 id="modal-pinjaman-baru-title" className="text-lg font-semibold text-white">
                Pinjaman Baru
              </h2>
              <button
                type="button"
                onClick={() => setModalBaruOpen(false)}
                className="rounded-lg p-2 text-navy-400 hover:bg-navy-800 hover:text-white transition-colors"
                aria-label="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmitBaru} className="p-5 space-y-4">
              {loadingAnggota ? (
                <div className="flex items-center justify-center py-12 text-navy-400">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  Memuat daftar anggota...
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-medium text-navy-400 uppercase tracking-wide mb-1.5">
                      Anggota
                    </label>
                    <select
                      required
                      value={baruAnggotaId}
                      onChange={(e) => setBaruAnggotaId(e.target.value)}
                      className="w-full bg-navy-900 border border-navy-600/60 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-accent-500/40"
                    >
                      <option value="">Pilih anggota</option>
                      {anggotaList.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.nama} — {a.nomorAnggota}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-navy-400 uppercase tracking-wide mb-1.5">
                      Jenis pinjaman
                    </label>
                    <select
                      value={baruJenis}
                      onChange={(e) => setBaruJenis(e.target.value)}
                      className="w-full bg-navy-900 border border-navy-600/60 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-accent-500/40"
                    >
                      {jenisPinjamanList.map((j) => (
                        <option key={j} value={j}>
                          {j}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-navy-400 uppercase tracking-wide mb-1.5">
                        Jumlah pinjaman (Rp)
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        required
                        value={baruJumlah}
                        onChange={(e) => setBaruJumlah(stripThousands(e.target.value).replace(/\D/g, ""))}
                        onBlur={(e) => setBaruJumlah(formatThousands(e.target.value))}
                        onFocus={(e) => setBaruJumlah(stripThousands(e.target.value))}
                        className="w-full bg-navy-900 border border-navy-600/60 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-accent-500/40"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-navy-400 uppercase tracking-wide mb-1.5">
                        Tenor (bulan)
                      </label>
                      <input
                        type="number"
                        min={1}
                        required
                        value={baruTenor}
                        onChange={(e) => setBaruTenor(e.target.value)}
                        className="w-full bg-navy-900 border border-navy-600/60 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-accent-500/40"
                        placeholder="12"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-navy-400 uppercase tracking-wide mb-1.5">
                      Bunga per bulan (%)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={baruBunga}
                      onChange={(e) => setBaruBunga(e.target.value)}
                      className="w-full bg-navy-900 border border-navy-600/60 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-accent-500/40"
                    />
                  </div>
                  <div className="rounded-xl border border-navy-700/50 bg-navy-900/80 p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-navy-400">Angsuran per bulan</span>
                      <span className="font-medium text-accent-300">
                        {parsedTenor >= 1 && parsedJumlah > 0
                          ? formatRupiah(angsuranDihitung)
                          : "—"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-navy-400">Jatuh tempo</span>
                      <span className="font-medium text-white">
                        {jatuhTempoDihitung === "—"
                          ? "—"
                          : new Date(jatuhTempoDihitung + "T12:00:00").toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                      </span>
                    </div>
                    <p className="text-xs text-navy-400 pt-1">
                      Tanggal pinjam:{" "}
                      {new Date(tanggalPinjamBaru + "T12:00:00").toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setModalBaruOpen(false)}
                      className="flex-1 rounded-xl border border-navy-600 py-2.5 text-sm font-medium text-navy-300 hover:bg-navy-800 transition-colors"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={submittingBaru || !baruAnggotaId}
                      className="flex-1 rounded-xl bg-accent-600 hover:bg-accent-500 disabled:opacity-50 py-2.5 text-sm font-medium text-white transition-colors flex items-center justify-center gap-2"
                    >
                      {submittingBaru && <Loader2 className="w-4 h-4 animate-spin" />}
                      Simpan
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}

      {modalBayarOpen && (
        <div
          className={modalShell}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-bayar-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalBayarOpen(false);
          }}
        >
          <div className={modalPanel} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-navy-700/60 px-5 py-4">
              <h2 id="modal-bayar-title" className="text-lg font-semibold text-white">
                Bayar Angsuran
              </h2>
              <button
                type="button"
                onClick={() => setModalBayarOpen(false)}
                className="rounded-lg p-2 text-navy-400 hover:bg-navy-800 hover:text-white transition-colors"
                aria-label="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmitBayar} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-navy-400 uppercase tracking-wide mb-1.5">
                  Pinjaman
                </label>
                <select
                  required
                  value={bayarPinjamanId}
                  onChange={(e) => setBayarPinjamanId(e.target.value)}
                  className="w-full bg-navy-900 border border-navy-600/60 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-success-500/40"
                >
                  <option value="">Pilih pinjaman</option>
                  {pinjamanAktifBayar.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.namaAnggota} — sisa {formatRupiah(p.sisaPinjaman)}
                    </option>
                  ))}
                </select>
                {pinjamanAktifBayar.length === 0 && (
                  <p className="text-xs text-navy-400 mt-2">Tidak ada pinjaman dengan sisa pokok.</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-navy-400 uppercase tracking-wide mb-1.5">
                  Jumlah pokok (Rp)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  value={bayarPokok}
                  onChange={(e) => setBayarPokok(stripThousands(e.target.value).replace(/\D/g, ""))}
                  onBlur={(e) => setBayarPokok(formatThousands(e.target.value))}
                  onFocus={(e) => setBayarPokok(stripThousands(e.target.value))}
                  className="w-full bg-navy-900 border border-navy-600/60 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-success-500/40"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-navy-400 uppercase tracking-wide mb-1.5">
                  Jumlah jasa (Rp)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  value={bayarJasa}
                  onChange={(e) => setBayarJasa(stripThousands(e.target.value).replace(/\D/g, ""))}
                  onBlur={(e) => setBayarJasa(formatThousands(e.target.value))}
                  onFocus={(e) => setBayarJasa(stripThousands(e.target.value))}
                  className="w-full bg-navy-900 border border-navy-600/60 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-success-500/40"
                  placeholder="0"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalBayarOpen(false)}
                  className="flex-1 rounded-xl border border-navy-600 py-2.5 text-sm font-medium text-navy-300 hover:bg-navy-800 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingBayar || !bayarPinjamanId || pinjamanAktifBayar.length === 0}
                  className="flex-1 rounded-xl bg-success-600 hover:bg-success-500 disabled:opacity-50 py-2.5 text-sm font-medium text-white transition-colors flex items-center justify-center gap-2"
                >
                  {submittingBayar && <Loader2 className="w-4 h-4 animate-spin" />}
                  Proses
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DetailPopup
        open={!!detailItem}
        onClose={() => setDetailItem(null)}
        title="Rincian Pinjaman"
        filename={`pinjaman-${detailItem?.namaAnggota?.replace(/\s+/g, "_") || "detail"}`}
      >
        {detailItem && (
          <>
            <h3 className="text-base font-bold text-white text-center mb-1">RINCIAN PINJAMAN</h3>
            <p className="text-xs text-navy-400 text-center mb-4">{getOrgName()}</p>
            <div className="border-t border-navy-700/50 pt-3 space-y-2">
              <div className="flex justify-between"><span className="text-navy-400">Nama Anggota</span><span className="font-medium">{detailItem.namaAnggota}</span></div>
              <div className="flex justify-between"><span className="text-navy-400">Jenis Pinjaman</span><span>{detailItem.jenisPinjaman}</span></div>
              <div className="flex justify-between"><span className="text-navy-400">Tanggal Pinjam</span><span>{new Date(detailItem.tanggalPinjam).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</span></div>
              <div className="flex justify-between"><span className="text-navy-400">Jatuh Tempo</span><span>{new Date(detailItem.jatuhTempo).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</span></div>
            </div>
            <div className="border-t border-navy-700/50 pt-3 mt-3 space-y-2">
              <h4 className="text-xs font-semibold text-navy-400 uppercase">Detail Keuangan</h4>
              <div className="flex justify-between"><span className="text-navy-300">Jumlah Pinjaman</span><span className="text-white">{formatRupiah(detailItem.jumlahPinjaman)}</span></div>
              <div className="flex justify-between"><span className="text-navy-300">Sisa Pinjaman</span><span className="text-warning-400 font-medium">{formatRupiah(detailItem.sisaPinjaman)}</span></div>
              <div className="flex justify-between"><span className="text-navy-300">Bunga / Bulan</span><span className="text-white">{detailItem.bungaPerBulan}%</span></div>
              <div className="flex justify-between"><span className="text-navy-300">Tenor</span><span className="text-white">{detailItem.sisaTenor}/{detailItem.tenor} bulan</span></div>
              <div className="flex justify-between"><span className="text-navy-300">Angsuran / Bulan</span><span className="text-accent-400 font-bold">{formatRupiah(detailItem.angsuranPerBulan)}</span></div>
            </div>
            <div className="border-t border-navy-700/50 pt-3 mt-3 flex justify-between">
              <span className="text-navy-400">Status</span>
              <span className={`font-medium ${detailItem.status === "lancar" ? "text-success-400" : detailItem.status === "kurang_lancar" ? "text-warning-400" : "text-danger-400"}`}>
                {detailItem.status === "lancar" ? "Lancar" : detailItem.status === "kurang_lancar" ? "Kurang Lancar" : "Macet"}
              </span>
            </div>
          </>
        )}
      </DetailPopup>

      <div className={`grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4${highlightKey === "pinjaman-baru" ? " animate-notif-highlight" : ""}`}>
        <StatCard title="Total Disalurkan" value={formatRupiah(totalDisalurkan)} icon={Banknote} color="blue" />
        <StatCard title="Sisa Pinjaman" value={formatRupiah(totalSisa)} icon={HandCoins} color="amber" />
        <StatCard title="Pinjaman Lancar" value={`${lancar} / ${pinjamanList.length}`} icon={CheckCircle2} color="green" />
        <StatCard
          title="Pinjaman Macet"
          value={`${macet} pinjaman`}
          subtitle={pinjamanList.length > 0 ? `${((macet / pinjamanList.length) * 100).toFixed(1)}% dari total` : "0%"}
          icon={AlertTriangle}
          color="red"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="bg-navy-900/80 rounded-2xl border border-navy-700/30 p-5">
          <h3 className="text-base font-semibold text-white mb-4">Aksi Cepat</h3>
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setModalBaruOpen(true)}
              className="w-full flex items-center gap-3 bg-accent-500/10 border border-accent-500/20 hover:bg-accent-500/20 rounded-xl p-4 transition-colors cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-accent-500/20 flex items-center justify-center">
                <Plus className="w-5 h-5 text-accent-400" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-white">Pinjaman Baru</p>
                <p className="text-xs text-navy-400">Ajukan pinjaman anggota</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setModalBayarOpen(true)}
              className="w-full flex items-center gap-3 bg-success-600/10 border border-success-600/20 hover:bg-success-600/20 rounded-xl p-4 transition-colors cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-success-500/20 flex items-center justify-center">
                <Banknote className="w-5 h-5 text-success-400" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-white">Bayar Angsuran</p>
                <p className="text-xs text-navy-400">Input pembayaran angsuran</p>
              </div>
            </button>
          </div>
        </div>

        <div className="lg:col-span-3 bg-navy-900/80 rounded-2xl border border-navy-700/30 p-5">
          <h3 className="text-base font-semibold text-white mb-4">Status Pinjaman</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              {
                label: "Lancar",
                count: pinjamanList.filter((p) => p.status === "lancar").length,
                total: pinjamanList.filter((p) => p.status === "lancar").reduce((s, p) => s + p.sisaPinjaman, 0),
                color: "success",
                pct:
                  pinjamanList.length > 0
                    ? Math.round((pinjamanList.filter((p) => p.status === "lancar").length / pinjamanList.length) * 100)
                    : 0,
              },
              {
                label: "Kurang Lancar",
                count: pinjamanList.filter((p) => p.status === "kurang_lancar").length,
                total: pinjamanList.filter((p) => p.status === "kurang_lancar").reduce((s, p) => s + p.sisaPinjaman, 0),
                color: "warning",
                pct:
                  pinjamanList.length > 0
                    ? Math.round(
                        (pinjamanList.filter((p) => p.status === "kurang_lancar").length / pinjamanList.length) * 100
                      )
                    : 0,
              },
              {
                label: "Macet",
                count: pinjamanList.filter((p) => p.status === "macet").length,
                total: pinjamanList.filter((p) => p.status === "macet").reduce((s, p) => s + p.sisaPinjaman, 0),
                color: "danger",
                pct:
                  pinjamanList.length > 0
                    ? Math.round((pinjamanList.filter((p) => p.status === "macet").length / pinjamanList.length) * 100)
                    : 0,
              },
            ].map((item, i) => (
              <div
                key={i}
                className={`bg-${item.color}-600/10 border border-${item.color}-600/20 rounded-xl p-3 md:p-4 flex md:block items-center gap-4`}
              >
                <div className="flex-1 md:mb-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-sm font-medium text-${item.color}-400`}>{item.label}</span>
                    <span className={`text-xs font-bold text-${item.color}-400`}>{item.pct}%</span>
                  </div>
                  <p className="text-xs text-navy-400">Total: {formatRupiah(item.total)}</p>
                </div>
                <div className="text-right md:text-left">
                  <p className="text-2xl md:text-xl font-bold text-white">{item.count}</p>
                  <p className="text-xs text-navy-400">pinjaman</p>
                </div>
                <div className="hidden md:block h-1.5 bg-navy-800 rounded-full mt-2 overflow-hidden">
                  <div className={`h-full bg-${item.color}-500 rounded-full`} style={{ width: `${item.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-navy-900/80 rounded-2xl border border-navy-700/30 overflow-hidden">
        <div className="p-5 border-b border-navy-700/30">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Daftar Pinjaman</h3>
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="flex items-center bg-navy-800 rounded-xl px-3 py-2 gap-2 border border-navy-700/50 flex-1 sm:flex-initial">
                <Search className="w-4 h-4 text-navy-400" />
                <input
                  type="text"
                  placeholder="Cari anggota..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-transparent text-sm text-white placeholder-navy-400 outline-none w-full sm:w-40"
                />
              </div>
              <div className="relative">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="appearance-none bg-navy-800 border border-navy-700/50 rounded-xl px-3 py-2 pr-8 text-sm text-white outline-none cursor-pointer"
                >
                  <option value="semua">Semua Status</option>
                  <option value="lancar">Lancar</option>
                  <option value="kurang_lancar">Kurang Lancar</option>
                  <option value="macet">Macet</option>
                </select>
                <ChevronDown className="w-4 h-4 text-navy-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-navy-800/80 sticky top-0">
              <tr className="border-b border-navy-600/40">
                <th className="text-left text-xs font-semibold text-navy-200 uppercase tracking-wider px-5 py-3">Anggota</th>
                <th className="text-left text-xs font-semibold text-navy-200 uppercase tracking-wider px-5 py-3">Jenis</th>
                <th className="text-right text-xs font-semibold text-navy-200 uppercase tracking-wider px-5 py-3">Jumlah</th>
                <th className="text-right text-xs font-semibold text-navy-200 uppercase tracking-wider px-5 py-3">Sisa</th>
                <th className="text-center text-xs font-semibold text-navy-200 uppercase tracking-wider px-5 py-3">Tenor</th>
                <th className="text-right text-xs font-semibold text-navy-200 uppercase tracking-wider px-5 py-3">Angsuran/bln</th>
                <th className="text-center text-xs font-semibold text-navy-200 uppercase tracking-wider px-5 py-3">Status</th>
                <th className="text-left text-xs font-semibold text-navy-200 uppercase tracking-wider px-5 py-3">Jatuh Tempo</th>
                <th className="text-center text-xs font-semibold text-navy-200 uppercase tracking-wider px-5 py-3">Rincian</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b border-navy-800/50 hover:bg-navy-800/30 transition-colors">
                  <td className="px-5 py-3">
                    <p className="text-sm font-medium text-white">{p.namaAnggota}</p>
                    <p className="text-xs text-navy-400">ID: {p.id}</p>
                  </td>
                  <td className="px-5 py-3 text-sm text-navy-300">{p.jenisPinjaman}</td>
                  <td className="px-5 py-3 text-sm text-white text-right font-medium">{formatRupiah(p.jumlahPinjaman)}</td>
                  <td className="px-5 py-3 text-sm text-warning-400 text-right font-medium">{formatRupiah(p.sisaPinjaman)}</td>
                  <td className="px-5 py-3 text-sm text-navy-300 text-center">
                    {p.sisaTenor}/{p.tenor} bln
                  </td>
                  <td className="px-5 py-3 text-sm text-white text-right">{formatRupiah(p.angsuranPerBulan)}</td>
                  <td className="px-5 py-3 text-center">
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${getStatusPinjamanBg(p.status)}`}
                    >
                      {statusIcon(p.status)}
                      {statusLabel(p.status)}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm text-navy-300">
                    {new Date(p.jatuhTempo).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-5 py-3 text-center">
                    <button type="button" onClick={() => setDetailItem(p)} className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg bg-accent-500/15 text-accent-400 hover:bg-accent-500/25 transition-colors cursor-pointer">
                      <Eye className="w-3.5 h-3.5" /> Detail
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
