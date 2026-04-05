"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Receipt,
  Search,
  Printer,
  CheckCircle2,
  Clock,
  XCircle,
  FileDown,
  ChevronDown,
  Loader2,
  Eye,
  FileText,
  ClipboardList,
  PenLine,
  AlertTriangle,
  Save,
  Share2,
  Calendar,
  Trash2,
  Upload,
  History,
  Edit3,
  Filter,
} from "lucide-react";
import StatCard from "./StatCard";
import { formatRupiah } from "@/data/mock";
import type { Potongan } from "@/data/mock";
import { fetchPotongan, exportCSV } from "@/lib/fetchers";
import DetailPopup from "./DetailPopup";

function statusLabel(s: string): string {
  switch (s) {
    case "terkirim": return "Terkirim";
    case "proses": return "Proses";
    case "gagal": return "Gagal";
    default: return s;
  }
}

function statusBadge(s: string) {
  switch (s) {
    case "terkirim":
      return (<span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-success-600/20 text-success-400 border border-success-600/30"><CheckCircle2 className="w-3 h-3" /> Terkirim</span>);
    case "proses":
      return (<span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-warning-600/20 text-warning-400 border border-warning-600/30"><Clock className="w-3 h-3" /> Proses</span>);
    case "gagal":
      return (<span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-danger-600/20 text-danger-400 border border-danger-600/30"><XCircle className="w-3 h-3" /> Gagal</span>);
    default:
      return <span className="text-xs text-navy-400">{s}</span>;
  }
}

const bulanIdNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const bulanIdMap: Record<string, number> = { Januari: 1, Februari: 2, Maret: 3, April: 4, Mei: 5, Juni: 6, Juli: 7, Agustus: 8, September: 9, Oktober: 10, November: 11, Desember: 12 };

function dateToMonthLabel(val: string): string {
  if (!val) return "Semua Periode";
  const parts = val.split("-");
  const y = parts[0];
  const m = parseInt(parts[1]);
  return `${bulanIdNames[m - 1]} ${y}`;
}

function labelToDate(label: string): string {
  const parts = label.split(" ");
  if (parts.length < 2) return "";
  const m = bulanIdMap[parts[0]];
  if (!m) return "";
  return `${parts[1]}-${String(m).padStart(2, "0")}-01`;
}

function formatTanggal(val: string): string {
  if (!val) return "Semua Periode";
  try {
    const d = new Date(val);
    return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  } catch { return val; }
}

interface PotonganPageProps {
  activeTab?: string;
}

export default function PotonganPage({ activeTab = "potongan" }: PotonganPageProps) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("semua");
  const [filterBulan, setFilterBulan] = useState<string>("");
  const [potonganList, setPotonganList] = useState<Potongan[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailItem, setDetailItem] = useState<Potongan | null>(null);
  const [gagalPopup, setGagalPopup] = useState(false);
  const [prosesPopup, setProsesPopup] = useState(false);
  const [editItem, setEditItem] = useState<Potongan | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Potongan | null>(null);

  // Cetak states
  const [cetakMode, setCetakMode] = useState<"daftar" | "struk">("daftar");
  const [cetakBulan, setCetakBulan] = useState<string>("");
  const [cetakStatus, setCetakStatus] = useState<string>("semua");
  const [cetakSearch, setCetakSearch] = useState<string>("");

  // Koreksi states
  const [koreksiItem, setKoreksiItem] = useState<Potongan | null>(null);
  const [koreksiSaved, setKoreksiSaved] = useState(false);
  const [koreksiSearch, setKoreksiSearch] = useState("");
  const [koreksiTab, setKoreksiTab] = useState<"simpanan" | "pinjaman">("simpanan");
  const [koreksiAlasan, setKoreksiAlasan] = useState("");
  const [koreksiPeriode, setKoreksiPeriode] = useState<string>("");
  const [koreksiEditPeriode, setKoreksiEditPeriode] = useState(false);
  const [simpananRows, setSimpananRows] = useState([
    { kode: "PO", jenis: "Pokok", saldo: 0, potongan: "", persen: "0" },
    { kode: "WA", jenis: "Wajib", saldo: 0, potongan: "", persen: "0" },
    { kode: "SS", jenis: "Sukarela", saldo: 0, potongan: "", persen: "0" },
    { kode: "LL", jenis: "Lain-lain", saldo: 0, potongan: "", persen: "0" },
    { kode: "SH", jenis: "SHU", saldo: 0, potongan: "", persen: "0" },
  ]);
  const [pinjamanRows, setPinjamanRows] = useState([
    { kode: "BJ", keterangan: "BANK BJB", noRek: "BJB", tglPot: "1", pokok: "", jasa: "", deskripsi: "PINJAMAN BARU" },
    { kode: "SD", keterangan: "SANDANG", noRek: "1A", tglPot: "1", pokok: "", jasa: "", deskripsi: "KEWENANGAN" },
    { kode: "SP", keterangan: "UANG", noRek: "SP1", tglPot: "1", pokok: "", jasa: "", deskripsi: "BARU" },
    { kode: "SP", keterangan: "UANG", noRek: "SP2", tglPot: "1", pokok: "", jasa: "", deskripsi: "BARU" },
  ]);

  // Gagal upload states
  const [gagalUploadPopup, setGagalUploadPopup] = useState(false);

  // Rekap states
  const [rekapSearch, setRekapSearch] = useState("");
  const [rekapBulan, setRekapBulan] = useState<string>("");
  const [rekapJenis, setRekapJenis] = useState<string>("semua");

  useEffect(() => {
    fetchPotongan()
      .then(setPotonganList)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (koreksiItem) { setKoreksiItem(null); setKoreksiSaved(false); setKoreksiPeriode(""); setKoreksiEditPeriode(false); setKoreksiAlasan(""); return; }
      if (detailItem) { setDetailItem(null); return; }
      if (gagalPopup) { setGagalPopup(false); return; }
      if (prosesPopup) { setProsesPopup(false); return; }
      if (editItem) { setEditItem(null); return; }
      if (deleteConfirm) { setDeleteConfirm(null); return; }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [koreksiItem, detailItem, gagalPopup, prosesPopup, editItem, deleteConfirm]);

  const openKoreksi = (p: Potongan) => {
    setKoreksiItem(p);
    setKoreksiTab("simpanan");
    setKoreksiAlasan("");
    setSimpananRows([
      { kode: "PO", jenis: "Pokok", saldo: 5000, potongan: "0", persen: "0" },
      { kode: "WA", jenis: "Wajib", saldo: p.simpananWajib, potongan: String(p.simpananWajib), persen: "0" },
      { kode: "SS", jenis: "Sukarela", saldo: 0, potongan: "0", persen: "0" },
      { kode: "LL", jenis: "Lain-lain", saldo: 0, potongan: "0", persen: "0" },
      { kode: "SH", jenis: "SHU", saldo: 0, potongan: "0", persen: "0" },
    ]);
    setPinjamanRows([
      { kode: "BJ", keterangan: "BANK BJB", noRek: "BJB", tglPot: "1", pokok: String(p.angsuranPinjaman), jasa: String(p.jasaPinjaman), deskripsi: "PINJAMAN BARU" },
      { kode: "SD", keterangan: "SANDANG", noRek: "1A", tglPot: "1", pokok: "0", jasa: "0", deskripsi: "KEWENANGAN" },
      { kode: "SP", keterangan: "UANG", noRek: "SP1", tglPot: "1", pokok: "0", jasa: "0", deskripsi: "BARU" },
      { kode: "SP", keterangan: "UANG", noRek: "SP2", tglPot: "1", pokok: "0", jasa: "0", deskripsi: "BARU" },
    ]);
    setKoreksiSaved(false);
  };

  const totalSimpanan = simpananRows.reduce((s, r) => s + r.saldo, 0);
  const totalPotonganSimpanan = simpananRows.reduce((s, r) => s + (Number(r.potongan) || 0), 0);
  const totalPokokPinjaman = pinjamanRows.reduce((s, r) => s + (Number(r.pokok) || 0), 0);
  const totalJasaPinjaman = pinjamanRows.reduce((s, r) => s + (Number(r.jasa) || 0), 0);

  const saveKoreksi = () => {
    if (!koreksiItem) return;
    const newSimpWajib = Number(simpananRows.find((r) => r.kode === "WA")?.potongan) || 0;
    const newAngsuran = totalPokokPinjaman;
    const newJasa = totalJasaPinjaman;
    setPotonganList((prev) =>
      prev.map((p) =>
        p.id === koreksiItem.id
          ? { ...p, simpananWajib: newSimpWajib, angsuranPinjaman: newAngsuran, jasaPinjaman: newJasa, totalPotongan: totalPotonganSimpanan + newAngsuran + newJasa }
          : p
      )
    );
    setKoreksiSaved(true);
  };

  // Computed values
  const totalPotongan = potonganList.reduce((s, p) => s + p.totalPotongan, 0);
  const terkirim = potonganList.filter((p) => p.status === "terkirim").length;
  const proses = potonganList.filter((p) => p.status === "proses").length;
  const gagal = potonganList.filter((p) => p.status === "gagal").length;

  const rekapPerBulan = useMemo(() => {
    const map: Record<string, { bulan: string; total: number; count: number; simpWajib: number; angsuran: number; jasa: number }> = {};
    potonganList.forEach((p) => {
      if (!map[p.bulan]) map[p.bulan] = { bulan: p.bulan, total: 0, count: 0, simpWajib: 0, angsuran: 0, jasa: 0 };
      map[p.bulan].total += p.totalPotongan;
      map[p.bulan].count += 1;
      map[p.bulan].simpWajib += p.simpananWajib;
      map[p.bulan].angsuran += p.angsuranPinjaman;
      map[p.bulan].jasa += p.jasaPinjaman;
    });
    return Object.values(map).sort((a, b) => b.bulan.localeCompare(a.bulan));
  }, [potonganList]);

  const filtered = potonganList.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.namaAnggota.toLowerCase().includes(q) || p.anggotaId.toLowerCase().includes(q);
    const matchStatus = filterStatus === "semua" || p.status === filterStatus;
    const matchBulan = !filterBulan || p.bulan === dateToMonthLabel(filterBulan);
    return matchSearch && matchStatus && matchBulan;
  });

  const cetakFiltered = useMemo(() => {
    const q = cetakSearch.toLowerCase();
    const label = cetakBulan ? dateToMonthLabel(cetakBulan) : "";
    return potonganList.filter((p) => {
      const matchBulan = !cetakBulan || p.bulan === label;
      const matchStatus = cetakStatus === "semua" || p.status === cetakStatus;
      const matchSearch = !q || p.namaAnggota.toLowerCase().includes(q) || p.anggotaId.toLowerCase().includes(q);
      return matchBulan && matchStatus && matchSearch;
    });
  }, [potonganList, cetakBulan, cetakStatus, cetakSearch]);

  const rekapFiltered = useMemo(() => {
    const q = rekapSearch.toLowerCase();
    const label = rekapBulan ? dateToMonthLabel(rekapBulan) : "";
    return potonganList.filter((p) => {
      const matchBulan = !rekapBulan || p.bulan === label;
      const matchSearch = !q || p.namaAnggota.toLowerCase().includes(q) || p.anggotaId.toLowerCase().includes(q);
      const matchJenis = rekapJenis === "semua" || (rekapJenis === "simpanan" && p.simpananWajib > 0) || (rekapJenis === "pinjaman" && (p.angsuranPinjaman > 0 || p.jasaPinjaman > 0));
      return matchBulan && matchSearch && matchJenis;
    });
  }, [potonganList, rekapBulan, rekapSearch, rekapJenis]);

  // Print functions
  const handleCetakDaftarPotongan = () => {
    const data = cetakFiltered;
    const totalSW = data.reduce((s, p) => s + p.simpananWajib, 0);
    const totalAP = data.reduce((s, p) => s + p.angsuranPinjaman, 0);
    const totalJP = data.reduce((s, p) => s + p.jasaPinjaman, 0);
    const totalAll = data.reduce((s, p) => s + p.totalPotongan, 0);
    const periodeLabel = dateToMonthLabel(cetakBulan);
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`<!DOCTYPE html>
<html><head><title>Daftar Potongan - ${periodeLabel}</title>
<style>
  body { font-family: Arial, sans-serif; padding: 20px; color: #111; }
  h1 { font-size: 18px; margin-bottom: 4px; }
  h2 { font-size: 13px; color: #666; margin-bottom: 16px; font-weight: normal; }
  .org { font-size: 14px; color: #333; margin-bottom: 2px; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  th { background: #f0f0f0; border: 1px solid #ccc; padding: 6px 8px; text-align: left; font-weight: 600; }
  td { border: 1px solid #ddd; padding: 5px 8px; }
  tr:nth-child(even) { background: #fafafa; }
  .text-right { text-align: right; }
  .text-center { text-align: center; }
  .bold { font-weight: 700; }
  tfoot td { font-weight: 700; border-top: 2px solid #333; }
  .summary { margin-top: 16px; font-size: 12px; }
  .summary span { font-weight: 600; }
  @media print { body { padding: 0; } }
</style></head><body>
<p class="org">PRIMKOPPOL RESOR SUBANG</p>
<h1>DAFTAR POTONGAN GAJI ANGGOTA</h1>
<h2>Periode: ${periodeLabel}${cetakStatus !== "semua" ? ` — Status: ${statusLabel(cetakStatus)}` : ""} — Dicetak: ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</h2>
<table>
  <thead><tr><th>No</th><th>Nama Anggota</th><th>ID</th><th>Bulan</th><th class="text-right">Simp. Wajib</th><th class="text-right">Angs. Pinjaman</th><th class="text-right">Jasa Pinjaman</th><th class="text-right">Total</th><th class="text-center">Status</th></tr></thead>
  <tbody>${data.map((p, i) => `<tr><td>${i + 1}</td><td>${p.namaAnggota}</td><td>${p.anggotaId}</td><td>${p.bulan}</td><td class="text-right">${formatRupiah(p.simpananWajib)}</td><td class="text-right">${formatRupiah(p.angsuranPinjaman)}</td><td class="text-right">${formatRupiah(p.jasaPinjaman)}</td><td class="text-right bold">${formatRupiah(p.totalPotongan)}</td><td class="text-center">${statusLabel(p.status)}</td></tr>`).join("")}</tbody>
  <tfoot><tr><td colspan="4">TOTAL (${data.length} anggota)</td><td class="text-right">${formatRupiah(totalSW)}</td><td class="text-right">${formatRupiah(totalAP)}</td><td class="text-right">${formatRupiah(totalJP)}</td><td class="text-right">${formatRupiah(totalAll)}</td><td></td></tr></tfoot>
</table>
<div class="summary"><p>Total Simpanan Wajib: <span>${formatRupiah(totalSW)}</span></p><p>Total Angsuran Pinjaman: <span>${formatRupiah(totalAP)}</span></p><p>Total Jasa Pinjaman: <span>${formatRupiah(totalJP)}</span></p><p>Grand Total Potongan: <span>${formatRupiah(totalAll)}</span></p></div>
</body></html>`);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); }, 300);
  };

  const handleCetakStruk = (p: Potongan) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`<!DOCTYPE html>
<html><head><title>Struk Potongan - ${p.namaAnggota}</title>
<style>
  body { font-family: Arial, sans-serif; padding: 20px; color: #111; max-width: 400px; margin: 0 auto; }
  h1 { font-size: 16px; text-align: center; margin-bottom: 2px; }
  h2 { font-size: 12px; text-align: center; color: #666; margin-bottom: 16px; }
  .row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 12px; }
  .divider { border-top: 1px dashed #ccc; margin: 8px 0; }
  .divider-bold { border-top: 2px solid #333; margin: 8px 0; }
  .bold { font-weight: 700; }
  .label { color: #666; }
  @media print { body { padding: 0; } }
</style></head><body>
<h1>STRUK POTONGAN GAJI</h1>
<h2>PRIMKOPPOL RESOR SUBANG</h2>
<div class="divider"></div>
<div class="row"><span class="label">Nama</span><span class="bold">${p.namaAnggota}</span></div>
<div class="row"><span class="label">ID Anggota</span><span>${p.anggotaId}</span></div>
<div class="row"><span class="label">Periode</span><span>${p.bulan}</span></div>
<div class="divider"></div>
<div class="row"><span>Simpanan Wajib</span><span>${formatRupiah(p.simpananWajib)}</span></div>
<div class="row"><span>Angsuran Pinjaman</span><span>${formatRupiah(p.angsuranPinjaman)}</span></div>
<div class="row"><span>Jasa Pinjaman</span><span>${formatRupiah(p.jasaPinjaman)}</span></div>
<div class="divider-bold"></div>
<div class="row"><span class="bold">TOTAL POTONGAN</span><span class="bold">${formatRupiah(p.totalPotongan)}</span></div>
<div class="divider"></div>
<div class="row"><span class="label">Status</span><span>${statusLabel(p.status)}</span></div>
<div class="row"><span class="label">Dicetak</span><span>${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</span></div>
</body></html>`);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); }, 300);
  };

  const handleExportCSV = () => {
    const headers = ["No", "Nama Anggota", "ID", "Bulan", "Simp Wajib", "Angs Pinjaman", "Jasa Pinjaman", "Total Potongan", "Status"];
    const data = cetakMode === "daftar" ? cetakFiltered : filtered;
    const rows = data.map((p, i) => [String(i + 1), p.namaAnggota, p.anggotaId, p.bulan, String(p.simpananWajib), String(p.angsuranPinjaman), String(p.jasaPinjaman), String(p.totalPotongan), statusLabel(p.status)]);
    exportCSV(headers, rows, `potongan-${cetakBulan || "semua"}.csv`);
  };

  const handlePrintKoreksi = () => {
    if (!koreksiItem) return;
    const periode = koreksiPeriode ? dateToMonthLabel(koreksiPeriode) : koreksiItem.bulan;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`<!DOCTYPE html>
<html><head><title>Koreksi Potongan - ${koreksiItem.namaAnggota}</title>
<style>
  body { font-family: Arial, sans-serif; padding: 20px; color: #111; }
  h1 { font-size: 18px; margin-bottom: 4px; }
  h2 { font-size: 13px; color: #666; margin-bottom: 16px; font-weight: normal; }
  .org { font-size: 14px; color: #333; margin-bottom: 2px; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 16px; }
  th { background: #f0f0f0; border: 1px solid #ccc; padding: 6px 8px; text-align: left; font-weight: 600; }
  td { border: 1px solid #ddd; padding: 5px 8px; }
  .text-right { text-align: right; }
  .section { font-size: 13px; font-weight: 700; margin: 12px 0 6px; }
  .summary { margin-top: 12px; font-size: 12px; }
  .summary span { font-weight: 600; }
  .alasan { margin-top: 16px; padding: 8px 12px; background: #f9f9f9; border: 1px solid #ddd; border-radius: 4px; font-size: 12px; }
  @media print { body { padding: 0; } }
</style></head><body>
<p class="org">PRIMKOPPOL RESOR SUBANG</p>
<h1>KOREKSI POTONGAN</h1>
<h2>${koreksiItem.namaAnggota} (${koreksiItem.anggotaId}) — Periode: ${periode} — Dicetak: ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</h2>
<p class="section">[ SIMPANAN ]</p>
<table><thead><tr><th>Kode</th><th>Jenis</th><th class="text-right">Saldo</th><th class="text-right">Potongan</th><th class="text-right">% Jasa</th></tr></thead>
<tbody>${simpananRows.map(r => `<tr><td>${r.kode}</td><td>${r.jenis}</td><td class="text-right">${formatRupiah(r.saldo)}</td><td class="text-right">${formatRupiah(Number(r.potongan) || 0)}</td><td class="text-right">${r.persen}%</td></tr>`).join("")}</tbody></table>
<p class="section">[ PINJAMAN ]</p>
<table><thead><tr><th>Kd</th><th>Keterangan</th><th>No-Rek</th><th>Tgl-Pot</th><th class="text-right">Pot. Pokok</th><th class="text-right">Pot. Jasa</th><th>Deskripsi</th></tr></thead>
<tbody>${pinjamanRows.map(r => `<tr><td>${r.kode}</td><td>${r.keterangan}</td><td>${r.noRek}</td><td>${r.tglPot}</td><td class="text-right">${formatRupiah(Number(r.pokok) || 0)}</td><td class="text-right">${formatRupiah(Number(r.jasa) || 0)}</td><td>${r.deskripsi}</td></tr>`).join("")}</tbody></table>
<div class="summary"><p>Total Potongan Simpanan: <span>${formatRupiah(totalPotonganSimpanan)}</span></p><p>Potongan Pokok: <span>${formatRupiah(totalPokokPinjaman)}</span></p><p>Potongan Jasa: <span>${formatRupiah(totalJasaPinjaman)}</span></p><p><strong>GRAND TOTAL: ${formatRupiah(totalPotonganSimpanan + totalPokokPinjaman + totalJasaPinjaman)}</strong></p></div>
${koreksiAlasan ? `<div class="alasan"><strong>Alasan Koreksi:</strong> ${koreksiAlasan}</div>` : ""}
</body></html>`);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); }, 300);
  };

  const handleShareKoreksi = async () => {
    if (!koreksiItem) return;
    const periode = koreksiPeriode ? dateToMonthLabel(koreksiPeriode) : koreksiItem.bulan;
    const text = `KOREKSI POTONGAN\n${koreksiItem.namaAnggota} (${koreksiItem.anggotaId})\nPeriode: ${periode}\n\n[SIMPANAN]\n${simpananRows.map(r => `${r.kode} - ${r.jenis}: ${formatRupiah(Number(r.potongan) || 0)}`).join("\n")}\nTotal: ${formatRupiah(totalPotonganSimpanan)}\n\n[PINJAMAN]\n${pinjamanRows.map(r => `${r.kode} - ${r.keterangan}: Pokok ${formatRupiah(Number(r.pokok) || 0)}, Jasa ${formatRupiah(Number(r.jasa) || 0)}`).join("\n")}\n\nGRAND TOTAL: ${formatRupiah(totalPotonganSimpanan + totalPokokPinjaman + totalJasaPinjaman)}${koreksiAlasan ? `\n\nAlasan: ${koreksiAlasan}` : ""}`;
    if (navigator.share) {
      try { await navigator.share({ title: `Koreksi Potongan - ${koreksiItem.namaAnggota}`, text }); } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(text);
      alert("Data koreksi sudah disalin ke clipboard!");
    }
  };

  const handleGenerateLaporan = () => {
    const data = filtered;
    const totalSW = data.reduce((s, p) => s + p.simpananWajib, 0);
    const totalAP = data.reduce((s, p) => s + p.angsuranPinjaman, 0);
    const totalJP = data.reduce((s, p) => s + p.jasaPinjaman, 0);
    const totalAll = data.reduce((s, p) => s + p.totalPotongan, 0);
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`<!DOCTYPE html>
<html><head><title>Laporan Potongan</title>
<style>
  body { font-family: Arial, sans-serif; padding: 20px; color: #111; }
  h1 { font-size: 18px; margin-bottom: 4px; }
  h2 { font-size: 13px; color: #666; margin-bottom: 16px; font-weight: normal; }
  .org { font-size: 14px; color: #333; margin-bottom: 2px; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  th { background: #f0f0f0; border: 1px solid #ccc; padding: 6px 8px; text-align: left; font-weight: 600; }
  td { border: 1px solid #ddd; padding: 5px 8px; }
  tr:nth-child(even) { background: #fafafa; }
  .text-right { text-align: right; }
  tfoot td { font-weight: 700; border-top: 2px solid #333; }
  .summary-box { margin-top: 20px; padding: 12px; background: #f5f5f5; border: 1px solid #ddd; font-size: 12px; }
  .summary-box p { margin: 4px 0; }
  .summary-box span { font-weight: 600; }
  @media print { body { padding: 0; } }
</style></head><body>
<p class="org">PRIMKOPPOL RESOR SUBANG</p>
<h1>LAPORAN POTONGAN GAJI ANGGOTA</h1>
<h2>Periode: ${filterBulan ? dateToMonthLabel(filterBulan) : "Semua Periode"} — Status: ${filterStatus === "semua" ? "Semua" : statusLabel(filterStatus)} — Dicetak: ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</h2>
<table><thead><tr><th>No</th><th>Nama</th><th>ID</th><th>Bulan</th><th class="text-right">Simp. Wajib</th><th class="text-right">Angsuran</th><th class="text-right">Jasa</th><th class="text-right">Total</th><th>Status</th></tr></thead>
<tbody>${data.map((p, i) => `<tr><td>${i + 1}</td><td>${p.namaAnggota}</td><td>${p.anggotaId}</td><td>${p.bulan}</td><td class="text-right">${formatRupiah(p.simpananWajib)}</td><td class="text-right">${formatRupiah(p.angsuranPinjaman)}</td><td class="text-right">${formatRupiah(p.jasaPinjaman)}</td><td class="text-right">${formatRupiah(p.totalPotongan)}</td><td>${statusLabel(p.status)}</td></tr>`).join("")}</tbody>
<tfoot><tr><td colspan="4">TOTAL (${data.length} anggota)</td><td class="text-right">${formatRupiah(totalSW)}</td><td class="text-right">${formatRupiah(totalAP)}</td><td class="text-right">${formatRupiah(totalJP)}</td><td class="text-right">${formatRupiah(totalAll)}</td><td></td></tr></tfoot></table>
<div class="summary-box"><p><strong>RINGKASAN JURNAL POTONGAN</strong></p><p>Debit — Kas/Bank Bendahara: <span>${formatRupiah(totalAll)}</span></p><p>Kredit — Simpanan Wajib Anggota: <span>${formatRupiah(totalSW)}</span></p><p>Kredit — Angsuran Pinjaman: <span>${formatRupiah(totalAP)}</span></p><p>Kredit — Pendapatan Jasa Pinjaman: <span>${formatRupiah(totalJP)}</span></p><p style="margin-top:8px">Rata-rata potongan per anggota: <span>${data.length > 0 ? formatRupiah(Math.round(totalAll / data.length)) : "Rp 0"}</span></p><p>Terkirim: <span>${data.filter(p => p.status === "terkirim").length}</span> | Proses: <span>${data.filter(p => p.status === "proses").length}</span> | Gagal: <span>${data.filter(p => p.status === "gagal").length}</span></p></div>
</body></html>`);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); }, 300);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-accent-400 animate-spin" />
        <span className="ml-3 text-navy-300">Memuat data potongan...</span>
      </div>
    );
  }

  // =============================================
  // TAB 1: KELOLA DAFTAR POTONGAN (Input)
  // =============================================
  if (activeTab === "potongan_kelola") {
    return (
      <div className="space-y-6">
        <div className="bg-navy-900/80 rounded-2xl border border-navy-700/30 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-accent-500/20 flex items-center justify-center"><ClipboardList className="w-6 h-6 text-accent-400" /></div>
            <div><h3 className="text-lg font-bold text-white">Kelola Daftar Potongan</h3><p className="text-sm text-navy-400">Input — Kelola data potongan harian</p></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
            <div>
              <label className="block text-xs font-medium text-navy-400 uppercase tracking-wide mb-1.5">Periode</label>
              <input type="date" lang="id-ID" value={filterBulan} onChange={(e) => setFilterBulan(e.target.value)} className="w-full bg-navy-800 border border-navy-700/50 rounded-xl px-3 py-2.5 text-sm text-white outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-navy-400 uppercase tracking-wide mb-1.5">Status</label>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full bg-navy-800 border border-navy-700/50 rounded-xl px-3 py-2.5 text-sm text-white outline-none cursor-pointer">
                <option value="semua">Semua Status</option>
                <option value="terkirim">Terkirim</option>
                <option value="proses">Proses</option>
                <option value="gagal">Gagal</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-navy-400 uppercase tracking-wide mb-1.5">Cari Anggota</label>
              <input type="text" placeholder="Nama / ID..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-navy-800 border border-navy-700/50 rounded-xl px-3 py-2.5 text-sm text-white placeholder-navy-400 outline-none" />
            </div>
            <div className="flex items-end">
              <button type="button" onClick={() => { setFilterBulan(""); setFilterStatus("semua"); setSearch(""); }} className="w-full bg-navy-700 hover:bg-navy-600 text-white px-3 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer">Reset Filter</button>
            </div>
          </div>
          <p className="text-xs text-navy-400 mb-4"><span className="text-white font-medium">{filtered.length}</span> data potongan {filterBulan && <>— Periode: <span className="text-white">{dateToMonthLabel(filterBulan)}</span></>}</p>
        </div>

        <div className="bg-navy-900/80 rounded-2xl border border-navy-700/30 overflow-hidden">
          <div className="overflow-x-auto max-h-[65vh] overflow-y-auto">
            <table className="w-full">
              <thead className="bg-navy-800/80 sticky top-0">
                <tr className="border-b border-navy-600/40">
                  <th className="text-left text-xs font-semibold text-navy-200 uppercase tracking-wider px-4 py-3">No</th>
                  <th className="text-left text-xs font-semibold text-navy-200 uppercase tracking-wider px-4 py-3">Anggota</th>
                  <th className="text-left text-xs font-semibold text-navy-200 uppercase tracking-wider px-4 py-3">Bulan</th>
                  <th className="text-right text-xs font-semibold text-navy-200 uppercase tracking-wider px-4 py-3">Simp. Wajib</th>
                  <th className="text-right text-xs font-semibold text-navy-200 uppercase tracking-wider px-4 py-3">Angsuran</th>
                  <th className="text-right text-xs font-semibold text-navy-200 uppercase tracking-wider px-4 py-3">Jasa</th>
                  <th className="text-right text-xs font-semibold text-navy-200 uppercase tracking-wider px-4 py-3">Total</th>
                  <th className="text-center text-xs font-semibold text-navy-200 uppercase tracking-wider px-4 py-3">Status</th>
                  <th className="text-center text-xs font-semibold text-navy-200 uppercase tracking-wider px-4 py-3">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => (
                  <tr key={p.id} className="border-b border-navy-800/50 hover:bg-navy-800/30 transition-colors">
                    <td className="px-4 py-3 text-sm text-navy-400">{i + 1}</td>
                    <td className="px-4 py-3"><p className="text-sm font-medium text-white">{p.namaAnggota}</p><p className="text-xs text-navy-400">{p.anggotaId}</p></td>
                    <td className="px-4 py-3 text-sm text-navy-300">{p.bulan}</td>
                    <td className="px-4 py-3 text-sm text-white text-right">{formatRupiah(p.simpananWajib)}</td>
                    <td className="px-4 py-3 text-sm text-white text-right">{formatRupiah(p.angsuranPinjaman)}</td>
                    <td className="px-4 py-3 text-sm text-white text-right">{formatRupiah(p.jasaPinjaman)}</td>
                    <td className="px-4 py-3 text-sm text-accent-400 text-right font-bold">{formatRupiah(p.totalPotongan)}</td>
                    <td className="px-4 py-3 text-center">{statusBadge(p.status)}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button type="button" onClick={() => setDetailItem(p)} className="p-1.5 rounded-lg text-navy-400 hover:bg-navy-800 hover:text-accent-400 transition-colors cursor-pointer" title="Detail"><Eye className="w-3.5 h-3.5" /></button>
                        <button type="button" onClick={() => openKoreksi(p)} className="p-1.5 rounded-lg text-navy-400 hover:bg-navy-800 hover:text-warning-400 transition-colors cursor-pointer" title="Edit"><Edit3 className="w-3.5 h-3.5" /></button>
                        <button type="button" onClick={() => setDeleteConfirm(p)} className="p-1.5 rounded-lg text-navy-400 hover:bg-navy-800 hover:text-danger-400 transition-colors cursor-pointer" title="Hapus"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              {filtered.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-navy-600">
                    <td colSpan={3} className="px-4 py-3 text-sm font-bold text-white">TOTAL ({filtered.length})</td>
                    <td className="px-4 py-3 text-sm font-bold text-white text-right">{formatRupiah(filtered.reduce((s, p) => s + p.simpananWajib, 0))}</td>
                    <td className="px-4 py-3 text-sm font-bold text-white text-right">{formatRupiah(filtered.reduce((s, p) => s + p.angsuranPinjaman, 0))}</td>
                    <td className="px-4 py-3 text-sm font-bold text-white text-right">{formatRupiah(filtered.reduce((s, p) => s + p.jasaPinjaman, 0))}</td>
                    <td className="px-4 py-3 text-sm font-bold text-accent-400 text-right">{formatRupiah(filtered.reduce((s, p) => s + p.totalPotongan, 0))}</td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* Delete confirmation */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setDeleteConfirm(null)}>
            <div className="bg-navy-900 border border-navy-700/50 rounded-2xl w-full max-w-md p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-danger-500/20 flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-danger-400" /></div>
                <h3 className="text-lg font-bold text-white">Hapus Potongan</h3>
              </div>
              <p className="text-sm text-navy-300 mb-4">Yakin ingin menghapus potongan <span className="text-white font-medium">{deleteConfirm.namaAnggota}</span> periode {deleteConfirm.bulan}?</p>
              <div className="flex gap-2">
                <button type="button" onClick={() => setDeleteConfirm(null)} className="flex-1 bg-navy-700 hover:bg-navy-600 text-white py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer">Batal</button>
                <button type="button" onClick={() => { setPotonganList(prev => prev.filter(p => p.id !== deleteConfirm.id)); setDeleteConfirm(null); }} className="flex-1 bg-danger-500 hover:bg-danger-600 text-white py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer">Hapus</button>
              </div>
            </div>
          </div>
        )}

        {/* Koreksi/Edit popup (reused) */}
        {koreksiItem && renderKoreksiPopup()}

        <DetailPopup open={!!detailItem} onClose={() => setDetailItem(null)} title="Rincian Potongan" filename={`potongan-${detailItem?.namaAnggota?.replace(/\s+/g, "_") || "detail"}`}>
          {detailItem && renderDetailContent(detailItem)}
        </DetailPopup>
      </div>
    );
  }

  // =============================================
  // TAB 2: REKAPITULASI POTONGAN (Monitoring)
  // =============================================
  if (activeTab === "potongan_rekap") {
    const rekapTotalSW = rekapFiltered.reduce((s, p) => s + p.simpananWajib, 0);
    const rekapTotalAP = rekapFiltered.reduce((s, p) => s + p.angsuranPinjaman, 0);
    const rekapTotalJP = rekapFiltered.reduce((s, p) => s + p.jasaPinjaman, 0);
    const rekapTotalAll = rekapFiltered.reduce((s, p) => s + p.totalPotongan, 0);
    const avgPerAnggota = rekapFiltered.length > 0 ? Math.round(rekapTotalAll / rekapFiltered.length) : 0;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard title="Total Potongan" value={formatRupiah(rekapTotalAll)} icon={Receipt} color="blue" />
          <StatCard title="Total Simp. Wajib" value={formatRupiah(rekapTotalSW)} icon={CheckCircle2} color="green" />
          <StatCard title="Total Angsuran" value={formatRupiah(rekapTotalAP)} icon={Clock} color="amber" />
          <StatCard title="Rata-rata / Anggota" value={formatRupiah(avgPerAnggota)} icon={FileText} color="purple" />
        </div>

        <div className="bg-navy-900/80 rounded-2xl border border-navy-700/30 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center"><ClipboardList className="w-6 h-6 text-purple-400" /></div>
            <div><h3 className="text-lg font-bold text-white">Rekapitulasi Potongan</h3><p className="text-sm text-navy-400">Monitoring — Total potongan per periode</p></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
            <div>
              <label className="block text-xs font-medium text-navy-400 uppercase tracking-wide mb-1.5">Periode</label>
              <input type="date" lang="id-ID" value={rekapBulan} onChange={(e) => setRekapBulan(e.target.value)} className="w-full bg-navy-800 border border-navy-700/50 rounded-xl px-3 py-2.5 text-sm text-white outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-navy-400 uppercase tracking-wide mb-1.5">Cari Anggota</label>
              <input type="text" placeholder="Nama / ID..." value={rekapSearch} onChange={(e) => setRekapSearch(e.target.value)} className="w-full bg-navy-800 border border-navy-700/50 rounded-xl px-3 py-2.5 text-sm text-white placeholder-navy-400 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-navy-400 uppercase tracking-wide mb-1.5">Jenis Potongan</label>
              <select value={rekapJenis} onChange={(e) => setRekapJenis(e.target.value)} className="w-full bg-navy-800 border border-navy-700/50 rounded-xl px-3 py-2.5 text-sm text-white outline-none cursor-pointer">
                <option value="semua">Semua Jenis</option>
                <option value="simpanan">Simpanan Wajib</option>
                <option value="pinjaman">Angsuran & Jasa Pinjaman</option>
              </select>
            </div>
            <div className="flex items-end">
              <button type="button" onClick={() => { setRekapBulan(""); setRekapSearch(""); setRekapJenis("semua"); }} className="w-full bg-navy-700 hover:bg-navy-600 text-white px-3 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer">Reset</button>
            </div>
          </div>

          {/* Per bulan summary */}
          <h4 className="text-sm font-semibold text-navy-200 mb-3 uppercase tracking-wide">Rekap Per Bulan</h4>
          <div className="overflow-x-auto mb-6">
            <table className="w-full">
              <thead className="bg-navy-800/80">
                <tr className="border-b border-navy-600/40">
                  <th className="text-left text-xs font-semibold text-navy-200 uppercase tracking-wider px-4 py-3">Bulan</th>
                  <th className="text-center text-xs font-semibold text-navy-200 uppercase tracking-wider px-4 py-3">Jml Anggota</th>
                  <th className="text-right text-xs font-semibold text-navy-200 uppercase tracking-wider px-4 py-3">Simp. Wajib</th>
                  <th className="text-right text-xs font-semibold text-navy-200 uppercase tracking-wider px-4 py-3">Angsuran</th>
                  <th className="text-right text-xs font-semibold text-navy-200 uppercase tracking-wider px-4 py-3">Jasa</th>
                  <th className="text-right text-xs font-semibold text-navy-200 uppercase tracking-wider px-4 py-3">Total</th>
                </tr>
              </thead>
              <tbody>
                {rekapPerBulan.map((r) => (
                  <tr key={r.bulan} className="border-b border-navy-800/50 hover:bg-navy-800/30 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-white">{r.bulan}</td>
                    <td className="px-4 py-3 text-sm text-navy-300 text-center">{r.count}</td>
                    <td className="px-4 py-3 text-sm text-white text-right">{formatRupiah(r.simpWajib)}</td>
                    <td className="px-4 py-3 text-sm text-white text-right">{formatRupiah(r.angsuran)}</td>
                    <td className="px-4 py-3 text-sm text-white text-right">{formatRupiah(r.jasa)}</td>
                    <td className="px-4 py-3 text-sm text-accent-400 text-right font-bold">{formatRupiah(r.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Detail per anggota */}
          <h4 className="text-sm font-semibold text-navy-200 mb-3 uppercase tracking-wide">Detail Per Anggota ({rekapFiltered.length} data)</h4>
          <div className="overflow-x-auto max-h-[50vh] overflow-y-auto">
            <table className="w-full">
              <thead className="bg-navy-800/80 sticky top-0">
                <tr className="border-b border-navy-600/40">
                  <th className="text-left text-xs font-semibold text-navy-200 uppercase tracking-wider px-4 py-3">No</th>
                  <th className="text-left text-xs font-semibold text-navy-200 uppercase tracking-wider px-4 py-3">Anggota</th>
                  <th className="text-left text-xs font-semibold text-navy-200 uppercase tracking-wider px-4 py-3">Bulan</th>
                  <th className="text-right text-xs font-semibold text-navy-200 uppercase tracking-wider px-4 py-3">Simp. Wajib</th>
                  <th className="text-right text-xs font-semibold text-navy-200 uppercase tracking-wider px-4 py-3">Angsuran</th>
                  <th className="text-right text-xs font-semibold text-navy-200 uppercase tracking-wider px-4 py-3">Jasa</th>
                  <th className="text-right text-xs font-semibold text-navy-200 uppercase tracking-wider px-4 py-3">Total</th>
                  <th className="text-center text-xs font-semibold text-navy-200 uppercase tracking-wider px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {rekapFiltered.map((p, i) => (
                  <tr key={p.id} className="border-b border-navy-800/50 hover:bg-navy-800/30 transition-colors">
                    <td className="px-4 py-3 text-sm text-navy-400">{i + 1}</td>
                    <td className="px-4 py-3 text-sm font-medium text-white">{p.namaAnggota}</td>
                    <td className="px-4 py-3 text-sm text-navy-300">{p.bulan}</td>
                    <td className="px-4 py-3 text-sm text-white text-right">{formatRupiah(p.simpananWajib)}</td>
                    <td className="px-4 py-3 text-sm text-white text-right">{formatRupiah(p.angsuranPinjaman)}</td>
                    <td className="px-4 py-3 text-sm text-white text-right">{formatRupiah(p.jasaPinjaman)}</td>
                    <td className="px-4 py-3 text-sm text-accent-400 text-right font-bold">{formatRupiah(p.totalPotongan)}</td>
                    <td className="px-4 py-3 text-center">{statusBadge(p.status)}</td>
                  </tr>
                ))}
              </tbody>
              {rekapFiltered.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-navy-600">
                    <td colSpan={3} className="px-4 py-3 text-sm font-bold text-white">TOTAL</td>
                    <td className="px-4 py-3 text-sm font-bold text-white text-right">{formatRupiah(rekapTotalSW)}</td>
                    <td className="px-4 py-3 text-sm font-bold text-white text-right">{formatRupiah(rekapTotalAP)}</td>
                    <td className="px-4 py-3 text-sm font-bold text-white text-right">{formatRupiah(rekapTotalJP)}</td>
                    <td className="px-4 py-3 text-sm font-bold text-accent-400 text-right">{formatRupiah(rekapTotalAll)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* Jurnal summary */}
          <div className="mt-6 bg-navy-800/50 rounded-xl border border-navy-700/30 p-4">
            <h4 className="text-sm font-bold text-accent-400 mb-3">Ringkasan Jurnal Potongan</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="space-y-1.5">
                <p className="text-navy-400">Debit — Kas/Bank Bendahara: <span className="text-white font-medium ml-1">{formatRupiah(rekapTotalAll)}</span></p>
              </div>
              <div className="space-y-1.5">
                <p className="text-navy-400">Kredit — Simpanan Wajib: <span className="text-white font-medium ml-1">{formatRupiah(rekapTotalSW)}</span></p>
                <p className="text-navy-400">Kredit — Angsuran Pinjaman: <span className="text-white font-medium ml-1">{formatRupiah(rekapTotalAP)}</span></p>
                <p className="text-navy-400">Kredit — Pendapatan Jasa: <span className="text-white font-medium ml-1">{formatRupiah(rekapTotalJP)}</span></p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-navy-700/30 flex items-center justify-between">
              <p className="text-xs text-navy-400">Selisih (Debit - Kredit): <span className="text-success-400 font-bold ml-1">{formatRupiah(rekapTotalAll - rekapTotalSW - rekapTotalAP - rekapTotalJP)}</span> — {rekapTotalAll === rekapTotalSW + rekapTotalAP + rekapTotalJP ? "✓ Balance" : "⚠ Tidak balance"}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =============================================
  // TAB 3: PENCETAKAN (Output)
  // =============================================
  if (activeTab === "potongan_cetak") {
    return (
      <div className="space-y-6">
        <div className="bg-navy-900/80 rounded-2xl border border-navy-700/30 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-accent-500/20 flex items-center justify-center"><Printer className="w-6 h-6 text-accent-400" /></div>
            <div><h3 className="text-lg font-bold text-white">Pencetakan</h3><p className="text-sm text-navy-400">Output — Cetak daftar, struk, dan export data</p></div>
          </div>

          <div className="flex gap-2 mb-6">
            <button type="button" onClick={() => setCetakMode("daftar")} className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer ${cetakMode === "daftar" ? "bg-accent-500 text-white" : "bg-navy-800 text-navy-300 hover:bg-navy-700"}`}><Printer className="w-4 h-4 inline mr-1.5" />Cetak Daftar Potongan</button>
            <button type="button" onClick={() => setCetakMode("struk")} className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer ${cetakMode === "struk" ? "bg-accent-500 text-white" : "bg-navy-800 text-navy-300 hover:bg-navy-700"}`}><FileText className="w-4 h-4 inline mr-1.5" />Cetak Struk Potongan</button>
          </div>

          {cetakMode === "daftar" && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                <div>
                  <label className="block text-xs font-medium text-navy-400 uppercase tracking-wide mb-1.5">Periode</label>
                  <div className="flex gap-2">
                    <input type="date" lang="id-ID" value={cetakBulan} onChange={(e) => setCetakBulan(e.target.value)} className="flex-1 bg-navy-800 border border-navy-700/50 rounded-xl px-3 py-2.5 text-sm text-white outline-none" />
                    {cetakBulan && <button type="button" onClick={() => setCetakBulan("")} className="px-3 py-2.5 bg-navy-700 hover:bg-navy-600 text-navy-300 rounded-xl text-xs transition-colors cursor-pointer" title="Semua periode"><XCircle className="w-4 h-4" /></button>}
                  </div>
                  {!cetakBulan && <p className="text-xs text-accent-400 mt-1">Menampilkan semua periode</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-navy-400 uppercase tracking-wide mb-1.5">Status</label>
                  <select value={cetakStatus} onChange={(e) => setCetakStatus(e.target.value)} className="w-full bg-navy-800 border border-navy-700/50 rounded-xl px-3 py-2.5 text-sm text-white outline-none cursor-pointer">
                    <option value="semua">Semua Status</option>
                    <option value="terkirim">Terkirim</option>
                    <option value="proses">Proses</option>
                    <option value="gagal">Gagal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-navy-400 uppercase tracking-wide mb-1.5">Cari</label>
                  <input type="text" placeholder="Nama anggota..." value={cetakSearch} onChange={(e) => setCetakSearch(e.target.value)} className="w-full bg-navy-800 border border-navy-700/50 rounded-xl px-3 py-2.5 text-sm text-white placeholder-navy-400 outline-none" />
                </div>
              </div>
              <div className="flex gap-3 mb-6">
                <button type="button" onClick={handleCetakDaftarPotongan} disabled={cetakFiltered.length === 0} className="flex items-center gap-2 bg-accent-500 hover:bg-accent-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer"><Printer className="w-4 h-4" /> Cetak Daftar</button>
                <button type="button" onClick={handleExportCSV} disabled={cetakFiltered.length === 0} className="flex items-center gap-2 bg-navy-700 hover:bg-navy-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer"><FileDown className="w-4 h-4" /> Export CSV</button>
              </div>
              <div className="bg-navy-800/50 rounded-xl border border-navy-700/30 overflow-hidden">
                <div className="p-4 border-b border-navy-700/30">
                  <p className="text-sm text-white font-medium">Preview — {dateToMonthLabel(cetakBulan)} — <span className="text-accent-400">{cetakFiltered.length}</span> data</p>
                </div>
                {cetakFiltered.length > 0 ? (
                  <div className="overflow-x-auto max-h-[50vh] overflow-y-auto">
                    <table className="w-full">
                      <thead className="bg-navy-800/80 sticky top-0">
                        <tr className="border-b border-navy-600/40">
                          <th className="text-left text-xs font-semibold text-navy-200 uppercase tracking-wider px-4 py-2.5">No</th>
                          <th className="text-left text-xs font-semibold text-navy-200 uppercase tracking-wider px-4 py-2.5">Anggota</th>
                          <th className="text-right text-xs font-semibold text-navy-200 uppercase tracking-wider px-4 py-2.5">Simp. Wajib</th>
                          <th className="text-right text-xs font-semibold text-navy-200 uppercase tracking-wider px-4 py-2.5">Angsuran</th>
                          <th className="text-right text-xs font-semibold text-navy-200 uppercase tracking-wider px-4 py-2.5">Jasa</th>
                          <th className="text-right text-xs font-semibold text-navy-200 uppercase tracking-wider px-4 py-2.5">Total</th>
                          <th className="text-center text-xs font-semibold text-navy-200 uppercase tracking-wider px-4 py-2.5">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cetakFiltered.map((p, i) => (
                          <tr key={p.id} className="border-b border-navy-800/50 hover:bg-navy-800/30">
                            <td className="px-4 py-2.5 text-sm text-navy-400">{i + 1}</td>
                            <td className="px-4 py-2.5 text-sm font-medium text-white">{p.namaAnggota}</td>
                            <td className="px-4 py-2.5 text-sm text-white text-right">{formatRupiah(p.simpananWajib)}</td>
                            <td className="px-4 py-2.5 text-sm text-white text-right">{formatRupiah(p.angsuranPinjaman)}</td>
                            <td className="px-4 py-2.5 text-sm text-white text-right">{formatRupiah(p.jasaPinjaman)}</td>
                            <td className="px-4 py-2.5 text-sm text-accent-400 text-right font-bold">{formatRupiah(p.totalPotongan)}</td>
                            <td className="px-4 py-2.5 text-center">{statusBadge(p.status)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-10 text-center"><Receipt className="w-10 h-10 mx-auto mb-3 text-navy-400 opacity-50" /><p className="text-sm text-navy-300">Tidak ada data untuk periode ini</p></div>
                )}
              </div>
            </>
          )}

          {cetakMode === "struk" && (
            <>
              <div className="mb-4">
                <label className="block text-xs font-medium text-navy-400 uppercase tracking-wide mb-1.5">Cari Anggota</label>
                <div className="flex items-center bg-navy-800 rounded-xl px-3 py-2.5 gap-2 border border-navy-700/50">
                  <Search className="w-4 h-4 text-navy-400" />
                  <input type="text" placeholder="Ketik nama anggota..." value={cetakSearch} onChange={(e) => setCetakSearch(e.target.value)} className="bg-transparent text-sm text-white placeholder-navy-400 outline-none w-full" />
                </div>
              </div>
              <div className="space-y-2">
                {(cetakSearch ? potonganList.filter(p => p.namaAnggota.toLowerCase().includes(cetakSearch.toLowerCase())) : potonganList).slice(0, 20).map((p) => (
                  <div key={p.id} className="flex items-center justify-between bg-navy-800/50 rounded-xl p-4 border border-navy-700/20">
                    <div>
                      <p className="text-sm font-medium text-white">{p.namaAnggota}</p>
                      <p className="text-xs text-navy-400">{p.bulan} — Total: {formatRupiah(p.totalPotongan)}</p>
                    </div>
                    <button type="button" onClick={() => handleCetakStruk(p)} className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg bg-accent-500/15 text-accent-400 hover:bg-accent-500/25 transition-colors cursor-pointer"><Printer className="w-3.5 h-3.5" /> Cetak Struk</button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // =============================================
  // TAB 4: KOREKSI / PENYESUAIAN (Kontrol)
  // =============================================
  if (activeTab === "potongan_koreksi") {
    const koreksiFiltered = potonganList.filter((p) => {
      const q = koreksiSearch.toLowerCase();
      return !q || p.namaAnggota.toLowerCase().includes(q) || p.anggotaId.toLowerCase().includes(q);
    });

    return (
      <div className="space-y-6">
        <div className="bg-navy-900/80 rounded-2xl border border-navy-700/30 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-warning-500/20 flex items-center justify-center"><PenLine className="w-6 h-6 text-warning-400" /></div>
            <div><h3 className="text-lg font-bold text-white">Koreksi / Penyesuaian</h3><p className="text-sm text-navy-400">Kontrol — Koreksi data salah input dan penyesuaian</p></div>
          </div>
          <div className="bg-warning-600/10 border border-warning-600/20 rounded-xl p-3 mb-4">
            <p className="text-xs text-warning-300"><AlertTriangle className="w-3.5 h-3.5 inline mr-1" />Perubahan data koreksi akan dicatat di Riwayat Transaksi untuk keperluan audit dan rekonsiliasi.</p>
          </div>
          <div className="flex items-center bg-navy-800 rounded-xl px-3 py-2.5 gap-2 border border-navy-700/50 mb-4">
            <Search className="w-4 h-4 text-navy-400" />
            <input type="text" placeholder="Cari anggota untuk dikoreksi..." value={koreksiSearch} onChange={(e) => setKoreksiSearch(e.target.value)} className="bg-transparent text-sm text-white placeholder-navy-400 outline-none w-full" />
          </div>
          <div className="space-y-2">
            {koreksiFiltered.slice(0, 20).map((p) => (
              <div key={p.id} className="flex items-center justify-between bg-navy-800/50 rounded-xl p-4 border border-navy-700/20 hover:border-navy-600/30 transition-colors">
                <div>
                  <p className="text-sm font-medium text-white">{p.namaAnggota}</p>
                  <p className="text-xs text-navy-400">{p.bulan} — {statusLabel(p.status)} — Total: {formatRupiah(p.totalPotongan)}</p>
                </div>
                <button type="button" onClick={() => openKoreksi(p)} className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg bg-warning-600/15 text-warning-400 hover:bg-warning-600/25 border border-warning-600/30 transition-colors cursor-pointer"><PenLine className="w-3.5 h-3.5" /> Koreksi</button>
              </div>
            ))}
          </div>
        </div>

        {koreksiItem && renderKoreksiPopup()}
      </div>
    );
  }

  // =============================================
  // TAB 5: RIWAYAT TRANSAKSI (Audit)
  // =============================================
  if (activeTab === "potongan_riwayat") {
    const mockLogs = potonganList.slice(0, 30).map((p, i) => ({
      id: `LOG${String(i + 1).padStart(4, "0")}`,
      tanggal: new Date(Date.now() - i * 86400000).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }),
      waktu: new Date(Date.now() - i * 86400000).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
      aksi: i % 4 === 0 ? "Koreksi" : i % 3 === 0 ? "Hapus" : i % 2 === 0 ? "Update" : "Input",
      anggota: p.namaAnggota,
      keterangan: i % 4 === 0 ? `Koreksi simpanan wajib ${p.namaAnggota}` : i % 3 === 0 ? `Hapus data potongan ${p.namaAnggota}` : i % 2 === 0 ? `Update status menjadi ${statusLabel(p.status)}` : `Input potongan baru ${p.bulan}`,
      operator: "Admin",
      status: p.status === "gagal" ? "gagal" : "berhasil",
    }));

    return (
      <div className="space-y-6">
        <div className="bg-navy-900/80 rounded-2xl border border-navy-700/30 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center"><History className="w-6 h-6 text-cyan-400" /></div>
            <div><h3 className="text-lg font-bold text-white">Riwayat Transaksi</h3><p className="text-sm text-navy-400">Audit — Log semua aktivitas potongan</p></div>
          </div>
          <div className="overflow-x-auto max-h-[70vh] overflow-y-auto">
            <table className="w-full">
              <thead className="bg-navy-800/80 sticky top-0">
                <tr className="border-b border-navy-600/40">
                  <th className="text-left text-xs font-semibold text-navy-200 uppercase tracking-wider px-4 py-3">Tanggal</th>
                  <th className="text-left text-xs font-semibold text-navy-200 uppercase tracking-wider px-4 py-3">Aksi</th>
                  <th className="text-left text-xs font-semibold text-navy-200 uppercase tracking-wider px-4 py-3">Anggota</th>
                  <th className="text-left text-xs font-semibold text-navy-200 uppercase tracking-wider px-4 py-3">Keterangan</th>
                  <th className="text-left text-xs font-semibold text-navy-200 uppercase tracking-wider px-4 py-3">Operator</th>
                  <th className="text-center text-xs font-semibold text-navy-200 uppercase tracking-wider px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {mockLogs.map((log) => (
                  <tr key={log.id} className="border-b border-navy-800/50 hover:bg-navy-800/30 transition-colors">
                    <td className="px-4 py-3"><p className="text-sm text-white">{log.tanggal}</p><p className="text-xs text-navy-400">{log.waktu}</p></td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                        log.aksi === "Input" ? "bg-accent-600/20 text-accent-400" :
                        log.aksi === "Update" ? "bg-warning-600/20 text-warning-400" :
                        log.aksi === "Koreksi" ? "bg-purple-600/20 text-purple-400" :
                        "bg-danger-600/20 text-danger-400"
                      }`}>{log.aksi}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-white">{log.anggota}</td>
                    <td className="px-4 py-3 text-sm text-navy-300">{log.keterangan}</td>
                    <td className="px-4 py-3 text-sm text-navy-300">{log.operator}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${log.status === "berhasil" ? "bg-success-600/20 text-success-400" : "bg-danger-600/20 text-danger-400"}`}>
                        {log.status === "berhasil" ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {log.status === "berhasil" ? "Berhasil" : "Gagal"}
                      </span>
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

  // =============================================
  // DEFAULT: DASHBOARD POTONGAN
  // =============================================
  return (
    <div className="space-y-6">
      <DetailPopup open={!!detailItem} onClose={() => setDetailItem(null)} title="Rincian Potongan" filename={`potongan-${detailItem?.namaAnggota?.replace(/\s+/g, "_") || "detail"}`}>
        {detailItem && renderDetailContent(detailItem)}
      </DetailPopup>

      {/* Dashboard stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Total Potongan" value={formatRupiah(totalPotongan)} icon={Receipt} color="blue" />
        <StatCard title="Terkirim" value={terkirim.toString()} subtitle="potongan berhasil" icon={CheckCircle2} color="green" />
        <div className="bg-navy-900/80 rounded-2xl p-4 lg:p-5 border border-warning-500/20 hover:border-opacity-50 transition-all">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 lg:w-11 lg:h-11 rounded-xl bg-warning-500/15 flex items-center justify-center"><Clock className="w-5 h-5 text-warning-400" /></div>
          </div>
          <p className="text-xs lg:text-sm text-navy-300 mb-1">Dalam Proses</p>
          <p className="text-xl lg:text-2xl font-bold text-white">{proses}</p>
          <button type="button" onClick={() => setProsesPopup(true)} className="mt-2 text-xs font-medium text-warning-400 bg-warning-600/15 hover:bg-warning-600/25 border border-warning-600/30 px-3 py-1 rounded-lg transition-colors cursor-pointer">
            {proses > 0 ? `${proses} menunggu verifikasi →` : "Tidak ada dalam proses"}
          </button>
        </div>
        <div className="bg-navy-900/80 rounded-2xl p-4 lg:p-5 border border-danger-500/20 hover:border-opacity-50 transition-all">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 lg:w-11 lg:h-11 rounded-xl bg-danger-500/15 flex items-center justify-center"><XCircle className="w-5 h-5 text-danger-400" /></div>
          </div>
          <p className="text-xs lg:text-sm text-navy-300 mb-1">Gagal Potong</p>
          <p className="text-xl lg:text-2xl font-bold text-white">{gagal}</p>
          <div className="flex gap-2 mt-2">
            <button type="button" onClick={() => setGagalPopup(true)} className="text-xs font-medium text-danger-400 bg-danger-600/15 hover:bg-danger-600/25 border border-danger-600/30 px-3 py-1 rounded-lg transition-colors cursor-pointer">
              {gagal > 0 ? `${gagal} perlu tindakan →` : "Tidak ada gagal"}
            </button>
            <button type="button" onClick={() => setGagalUploadPopup(true)} className="text-xs font-medium text-navy-300 bg-navy-700 hover:bg-navy-600 px-3 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1">
              <Upload className="w-3 h-3" /> Upload Excel
            </button>
          </div>
        </div>
      </div>

      {/* Quick filter + Generate Laporan */}
      <div className="bg-navy-900/80 rounded-2xl border border-navy-700/30 p-5">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end justify-between">
          <div className="flex flex-wrap gap-3 flex-1">
            <div>
              <label className="block text-xs font-medium text-navy-400 uppercase tracking-wide mb-1">Periode</label>
              <input type="date" lang="id-ID" value={filterBulan} onChange={(e) => setFilterBulan(e.target.value)} className="bg-navy-800 border border-navy-700/50 rounded-xl px-3 py-2 text-sm text-white outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-navy-400 uppercase tracking-wide mb-1">Cari</label>
              <div className="flex items-center bg-navy-800 rounded-xl px-3 py-2 gap-2 border border-navy-700/50">
                <Search className="w-4 h-4 text-navy-400" />
                <input type="text" placeholder="Nama anggota..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-transparent text-sm text-white placeholder-navy-400 outline-none w-40" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-navy-400 uppercase tracking-wide mb-1">Status</label>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="bg-navy-800 border border-navy-700/50 rounded-xl px-3 py-2 pr-8 text-sm text-white outline-none cursor-pointer">
                <option value="semua">Semua</option>
                <option value="terkirim">Terkirim</option>
                <option value="proses">Proses</option>
                <option value="gagal">Gagal</option>
              </select>
            </div>
          </div>
          <button type="button" onClick={handleGenerateLaporan} className="flex items-center gap-2 bg-accent-500 hover:bg-accent-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer whitespace-nowrap">
            <FileText className="w-4 h-4" /> Generate Laporan
          </button>
        </div>
        {(filterBulan || search || filterStatus !== "semua") && (
          <div className="mt-3 flex items-center gap-2">
            <p className="text-xs text-navy-400"><Filter className="w-3 h-3 inline mr-1" />Filter aktif: <span className="text-white font-medium">{filtered.length}</span> dari {potonganList.length} data</p>
            <button type="button" onClick={() => { setFilterBulan(""); setSearch(""); setFilterStatus("semua"); }} className="text-xs text-accent-400 hover:text-accent-300 cursor-pointer">Reset</button>
          </div>
        )}
      </div>

      {/* Ringkasan per status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-navy-900/80 rounded-2xl border border-navy-700/30 p-5">
          <h4 className="text-sm font-semibold text-navy-200 mb-3">Ringkasan Keuangan</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-navy-400">Total Simp. Wajib</span><span className="text-white font-medium">{formatRupiah(potonganList.reduce((s, p) => s + p.simpananWajib, 0))}</span></div>
            <div className="flex justify-between"><span className="text-navy-400">Total Angsuran</span><span className="text-white font-medium">{formatRupiah(potonganList.reduce((s, p) => s + p.angsuranPinjaman, 0))}</span></div>
            <div className="flex justify-between"><span className="text-navy-400">Total Jasa Pinjaman</span><span className="text-white font-medium">{formatRupiah(potonganList.reduce((s, p) => s + p.jasaPinjaman, 0))}</span></div>
            <div className="flex justify-between border-t border-navy-700/50 pt-2"><span className="text-navy-300 font-medium">Grand Total</span><span className="text-accent-400 font-bold">{formatRupiah(totalPotongan)}</span></div>
          </div>
        </div>
        <div className="bg-navy-900/80 rounded-2xl border border-navy-700/30 p-5">
          <h4 className="text-sm font-semibold text-navy-200 mb-3">Status Distribusi</h4>
          <div className="space-y-3">
            <div><div className="flex justify-between text-xs mb-1"><span className="text-navy-400">Terkirim</span><span className="text-success-400 font-medium">{terkirim} / {potonganList.length}</span></div><div className="w-full bg-navy-800 rounded-full h-2"><div className="bg-success-500 rounded-full h-2 transition-all" style={{ width: `${potonganList.length > 0 ? (terkirim / potonganList.length) * 100 : 0}%` }}></div></div></div>
            <div><div className="flex justify-between text-xs mb-1"><span className="text-navy-400">Proses</span><span className="text-warning-400 font-medium">{proses} / {potonganList.length}</span></div><div className="w-full bg-navy-800 rounded-full h-2"><div className="bg-warning-500 rounded-full h-2 transition-all" style={{ width: `${potonganList.length > 0 ? (proses / potonganList.length) * 100 : 0}%` }}></div></div></div>
            <div><div className="flex justify-between text-xs mb-1"><span className="text-navy-400">Gagal</span><span className="text-danger-400 font-medium">{gagal} / {potonganList.length}</span></div><div className="w-full bg-navy-800 rounded-full h-2"><div className="bg-danger-500 rounded-full h-2 transition-all" style={{ width: `${potonganList.length > 0 ? (gagal / potonganList.length) * 100 : 0}%` }}></div></div></div>
          </div>
        </div>
        <div className="bg-navy-900/80 rounded-2xl border border-navy-700/30 p-5">
          <h4 className="text-sm font-semibold text-navy-200 mb-3">Jurnal Akuntansi</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-navy-400">D: Kas/Bank</span><span className="text-white font-medium">{formatRupiah(totalPotongan)}</span></div>
            <div className="flex justify-between"><span className="text-navy-400">K: Simp. Wajib</span><span className="text-white font-medium">{formatRupiah(potonganList.reduce((s, p) => s + p.simpananWajib, 0))}</span></div>
            <div className="flex justify-between"><span className="text-navy-400">K: Angsuran</span><span className="text-white font-medium">{formatRupiah(potonganList.reduce((s, p) => s + p.angsuranPinjaman, 0))}</span></div>
            <div className="flex justify-between"><span className="text-navy-400">K: Jasa Pinjaman</span><span className="text-white font-medium">{formatRupiah(potonganList.reduce((s, p) => s + p.jasaPinjaman, 0))}</span></div>
            <div className="flex justify-between border-t border-navy-700/50 pt-2"><span className="text-navy-300">Selisih</span><span className="text-success-400 font-bold">Rp 0 ✓</span></div>
          </div>
        </div>
      </div>

      {/* Popups */}
      {gagalPopup && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setGagalPopup(false)}>
          <div className="bg-navy-900 border border-navy-700/50 rounded-2xl w-full max-w-lg p-6 shadow-2xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-danger-500/20 flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-danger-400" /></div>
                <div><h3 className="text-lg font-bold text-white">Gagal Potong</h3><p className="text-xs text-navy-400">{gagal} potongan memerlukan tindakan</p></div>
              </div>
              <button type="button" onClick={() => setGagalPopup(false)} className="p-1.5 rounded-lg text-navy-400 hover:bg-navy-800 hover:text-white transition-colors cursor-pointer"><XCircle className="w-5 h-5" /></button>
            </div>
            {potonganList.filter((p) => p.status === "gagal").length === 0 ? (
              <div className="text-center py-8"><CheckCircle2 className="w-12 h-12 text-success-400 mx-auto mb-3" /><p className="text-sm text-navy-300">Tidak ada potongan gagal.</p></div>
            ) : (
              <div className="space-y-3">
                {potonganList.filter((p) => p.status === "gagal").map((p) => (
                  <div key={p.id} className="bg-navy-800/50 rounded-xl p-4 border border-danger-600/20">
                    <div className="flex items-start justify-between mb-2">
                      <div><p className="text-sm font-medium text-white">{p.namaAnggota}</p><p className="text-xs text-navy-400">ID: {p.anggotaId} — {p.bulan}</p></div>
                      {statusBadge(p.status)}
                    </div>
                    <div className="text-xs text-navy-400 space-y-1 mb-3">
                      <div className="flex justify-between"><span>Simpanan Wajib</span><span className="text-white">{formatRupiah(p.simpananWajib)}</span></div>
                      <div className="flex justify-between"><span>Angsuran</span><span className="text-white">{formatRupiah(p.angsuranPinjaman)}</span></div>
                      <div className="flex justify-between"><span>Jasa</span><span className="text-white">{formatRupiah(p.jasaPinjaman)}</span></div>
                      <div className="flex justify-between border-t border-navy-700/50 pt-1"><span className="font-medium text-navy-300">Total</span><span className="font-bold text-accent-400">{formatRupiah(p.totalPotongan)}</span></div>
                    </div>
                    <div className="bg-danger-600/10 border border-danger-600/20 rounded-lg p-2.5">
                      <p className="text-xs text-danger-300"><span className="font-semibold">Tindakan:</span> Verifikasi ulang data rekening, pastikan saldo mencukupi, kirim ulang.</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {prosesPopup && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setProsesPopup(false)}>
          <div className="bg-navy-900 border border-navy-700/50 rounded-2xl w-full max-w-lg p-6 shadow-2xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-warning-500/20 flex items-center justify-center"><Clock className="w-5 h-5 text-warning-400" /></div>
                <div><h3 className="text-lg font-bold text-white">Dalam Proses</h3><p className="text-xs text-navy-400">{proses} menunggu verifikasi</p></div>
              </div>
              <button type="button" onClick={() => setProsesPopup(false)} className="p-1.5 rounded-lg text-navy-400 hover:bg-navy-800 hover:text-white transition-colors cursor-pointer"><XCircle className="w-5 h-5" /></button>
            </div>
            {potonganList.filter((p) => p.status === "proses").length === 0 ? (
              <div className="text-center py-8"><CheckCircle2 className="w-12 h-12 text-success-400 mx-auto mb-3" /><p className="text-sm text-navy-300">Semua sudah diproses.</p></div>
            ) : (
              <div className="space-y-3">
                {potonganList.filter((p) => p.status === "proses").map((p) => (
                  <div key={p.id} className="bg-navy-800/50 rounded-xl p-4 border border-warning-600/20">
                    <div className="flex items-start justify-between mb-2">
                      <div><p className="text-sm font-medium text-white">{p.namaAnggota}</p><p className="text-xs text-navy-400">ID: {p.anggotaId} — {p.bulan}</p></div>
                      {statusBadge(p.status)}
                    </div>
                    <div className="text-xs text-navy-400 space-y-1">
                      <div className="flex justify-between"><span>Total</span><span className="font-bold text-accent-400">{formatRupiah(p.totalPotongan)}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {gagalUploadPopup && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setGagalUploadPopup(false)}>
          <div className="bg-navy-900 border border-navy-700/50 rounded-2xl w-full max-w-lg p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent-500/20 flex items-center justify-center"><Upload className="w-5 h-5 text-accent-400" /></div>
                <div><h3 className="text-lg font-bold text-white">Upload Data dari Excel</h3><p className="text-xs text-navy-400">Import data gagal potong dari file Excel</p></div>
              </div>
              <button type="button" onClick={() => setGagalUploadPopup(false)} className="p-1.5 rounded-lg text-navy-400 hover:bg-navy-800 hover:text-white transition-colors cursor-pointer"><XCircle className="w-5 h-5" /></button>
            </div>
            <div className="bg-navy-800/50 border-2 border-dashed border-navy-600/50 rounded-xl p-8 text-center mb-4">
              <Upload className="w-10 h-10 mx-auto mb-3 text-navy-400" />
              <p className="text-sm text-navy-300 mb-2">Drag & drop file Excel atau</p>
              <button type="button" className="bg-accent-500 hover:bg-accent-600 text-white px-5 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer">Pilih File</button>
              <p className="text-xs text-navy-400 mt-3">Format: .xlsx, .xls — Kolom: No, Nama, ID Anggota, Bulan, Simp. Wajib, Angsuran, Jasa, Total, Status</p>
            </div>
            <div className="bg-navy-800/50 rounded-xl p-3">
              <p className="text-xs text-navy-400"><span className="font-semibold text-navy-300">Format tabel:</span> Ikuti format cetakan Daftar Potongan. Kolom harus sesuai urutan: No, Nama Anggota, ID, Bulan, Simpanan Wajib, Angsuran Pinjaman, Jasa Pinjaman, Total, Status.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // =============================================
  // SHARED COMPONENTS
  // =============================================
  function renderDetailContent(item: Potongan) {
    return (
      <>
        <h3 className="text-base font-bold text-white text-center mb-1">RINCIAN POTONGAN GAJI</h3>
        <p className="text-xs text-navy-400 text-center mb-4">PRIMKOPPOL RESOR SUBANG</p>
        <div className="border-t border-navy-700/50 pt-3 space-y-2">
          <div className="flex justify-between"><span className="text-navy-400">Nama Anggota</span><span className="font-medium">{item.namaAnggota}</span></div>
          <div className="flex justify-between"><span className="text-navy-400">ID Anggota</span><span>{item.anggotaId}</span></div>
          <div className="flex justify-between"><span className="text-navy-400">Bulan</span><span>{item.bulan}</span></div>
        </div>
        <div className="border-t border-navy-700/50 pt-3 mt-3 space-y-2">
          <h4 className="text-xs font-semibold text-navy-400 uppercase">Rincian Potongan</h4>
          <div className="flex justify-between"><span className="text-navy-300">Simpanan Wajib</span><span className="text-white">{formatRupiah(item.simpananWajib)}</span></div>
          <div className="flex justify-between"><span className="text-navy-300">Angsuran Pinjaman</span><span className="text-white">{formatRupiah(item.angsuranPinjaman)}</span></div>
          <div className="flex justify-between"><span className="text-navy-300">Jasa Pinjaman</span><span className="text-white">{formatRupiah(item.jasaPinjaman)}</span></div>
        </div>
        <div className="border-t-2 border-navy-600 pt-3 mt-3 flex justify-between">
          <span className="font-bold text-white">TOTAL POTONGAN</span>
          <span className="font-bold text-accent-400">{formatRupiah(item.totalPotongan)}</span>
        </div>
        <div className="border-t border-navy-700/50 pt-3 mt-3 flex justify-between">
          <span className="text-navy-400">Status</span>
          <span className={`font-medium ${item.status === "terkirim" ? "text-success-400" : item.status === "proses" ? "text-warning-400" : "text-danger-400"}`}>{statusLabel(item.status)}</span>
        </div>
      </>
    );
  }

  function renderKoreksiPopup() {
    if (!koreksiItem) return null;
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => { setKoreksiItem(null); setKoreksiSaved(false); setKoreksiPeriode(""); setKoreksiEditPeriode(false); setKoreksiAlasan(""); }}>
        <div className="bg-navy-900 border border-navy-700/50 rounded-2xl w-full max-w-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-white mb-1">Koreksi Potongan</h3>
              <div className="flex items-center gap-2">
                <p className="text-xs text-navy-400">{koreksiItem.namaAnggota} — {koreksiPeriode ? dateToMonthLabel(koreksiPeriode) : koreksiItem.bulan}</p>
                <button type="button" onClick={() => setKoreksiEditPeriode(!koreksiEditPeriode)} className="text-navy-400 hover:text-accent-400 transition-colors cursor-pointer" title="Ubah periode"><Calendar className="w-3.5 h-3.5" /></button>
              </div>
              {koreksiEditPeriode && (
                <div className="mt-2"><input type="date" lang="id-ID" value={koreksiPeriode || labelToDate(koreksiItem.bulan)} onChange={(e) => setKoreksiPeriode(e.target.value)} className="bg-navy-800 border border-navy-600/50 rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-accent-500" /></div>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <button type="button" onClick={handlePrintKoreksi} className="p-2 bg-navy-800 hover:bg-navy-700 text-navy-300 hover:text-white rounded-lg transition-colors cursor-pointer" title="Cetak"><Printer className="w-4 h-4" /></button>
              <button type="button" onClick={handleShareKoreksi} className="p-2 bg-navy-800 hover:bg-navy-700 text-navy-300 hover:text-white rounded-lg transition-colors cursor-pointer" title="Bagikan"><Share2 className="w-4 h-4" /></button>
            </div>
          </div>

          {koreksiSaved ? (
            <div className="text-center py-6">
              <CheckCircle2 className="w-12 h-12 text-success-400 mx-auto mb-3" />
              <p className="text-sm font-medium text-success-400 mb-1">Koreksi berhasil disimpan!</p>
              <p className="text-xs text-navy-400 mb-4">Total Potongan: {formatRupiah(totalPotonganSimpanan + totalPokokPinjaman + totalJasaPinjaman)}</p>
              <button type="button" onClick={() => { setKoreksiItem(null); setKoreksiSaved(false); setKoreksiAlasan(""); }} className="bg-accent-500 hover:bg-accent-600 text-white px-5 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer">Tutup</button>
            </div>
          ) : (
            <>
              <div className="flex gap-2 mb-4">
                <button type="button" onClick={() => setKoreksiTab("simpanan")} className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer ${koreksiTab === "simpanan" ? "bg-accent-500 text-white" : "bg-navy-800 text-navy-300 hover:bg-navy-700"}`}>Koreksi Simpanan</button>
                <button type="button" onClick={() => setKoreksiTab("pinjaman")} className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer ${koreksiTab === "pinjaman" ? "bg-accent-500 text-white" : "bg-navy-800 text-navy-300 hover:bg-navy-700"}`}>Koreksi Pinjaman</button>
              </div>

              {koreksiTab === "simpanan" && (
                <div>
                  <h4 className="text-sm font-bold text-accent-400 mb-3 uppercase tracking-wide">[ Simpanan ]</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-navy-800/80">
                        <tr className="border-b border-navy-600/40">
                          <th className="text-left text-xs font-semibold text-navy-200 uppercase tracking-wider px-3 py-2.5">Kode</th>
                          <th className="text-left text-xs font-semibold text-navy-200 uppercase tracking-wider px-3 py-2.5">Jenis</th>
                          <th className="text-right text-xs font-semibold text-navy-200 uppercase tracking-wider px-3 py-2.5">Saldo</th>
                          <th className="text-right text-xs font-semibold text-navy-200 uppercase tracking-wider px-3 py-2.5">Potongan</th>
                          <th className="text-right text-xs font-semibold text-navy-200 uppercase tracking-wider px-3 py-2.5">% Jasa</th>
                        </tr>
                      </thead>
                      <tbody>
                        {simpananRows.map((row, i) => (
                          <tr key={row.kode} className="border-b border-navy-800/50">
                            <td className="px-3 py-2 text-sm font-mono font-bold text-warning-400">{row.kode}</td>
                            <td className="px-3 py-2 text-sm text-white">{row.jenis}</td>
                            <td className="px-3 py-2 text-sm text-white text-right">{formatRupiah(row.saldo)}</td>
                            <td className="px-3 py-2 text-right"><input type="number" value={row.potongan} onChange={(e) => { const v = e.target.value; setSimpananRows((prev) => prev.map((r, j) => j === i ? { ...r, potongan: v } : r)); }} className="w-28 bg-navy-800 border border-navy-600/50 rounded-lg px-2 py-1.5 text-sm text-white text-right outline-none focus:border-accent-500" /></td>
                            <td className="px-3 py-2 text-right"><input type="text" value={row.persen} onChange={(e) => { const v = e.target.value; setSimpananRows((prev) => prev.map((r, j) => j === i ? { ...r, persen: v } : r)); }} className="w-16 bg-navy-800 border border-navy-600/50 rounded-lg px-2 py-1.5 text-sm text-white text-right outline-none focus:border-accent-500" /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-3 flex justify-between items-center border-t-2 border-navy-600 pt-3">
                    <div className="text-sm"><span className="text-navy-400">Total Simpanan:</span> <span className="font-bold text-white ml-2">{formatRupiah(totalSimpanan)}</span></div>
                    <div className="text-sm"><span className="text-navy-400">Total Potongan:</span> <span className="font-bold text-accent-400 ml-2">{formatRupiah(totalPotonganSimpanan)}</span></div>
                  </div>
                </div>
              )}

              {koreksiTab === "pinjaman" && (
                <div>
                  <h4 className="text-sm font-bold text-success-400 mb-3 uppercase tracking-wide">[ Pinjaman ]</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-navy-800/80">
                        <tr className="border-b border-navy-600/40">
                          <th className="text-left text-xs font-semibold text-navy-200 uppercase tracking-wider px-3 py-2.5">Kd</th>
                          <th className="text-left text-xs font-semibold text-navy-200 uppercase tracking-wider px-3 py-2.5">Keterangan</th>
                          <th className="text-left text-xs font-semibold text-navy-200 uppercase tracking-wider px-3 py-2.5">No-Rek</th>
                          <th className="text-center text-xs font-semibold text-navy-200 uppercase tracking-wider px-3 py-2.5">Tgl-Pot</th>
                          <th className="text-right text-xs font-semibold text-navy-200 uppercase tracking-wider px-3 py-2.5">Pot. Pokok</th>
                          <th className="text-right text-xs font-semibold text-navy-200 uppercase tracking-wider px-3 py-2.5">Pot. Jasa</th>
                          <th className="text-left text-xs font-semibold text-navy-200 uppercase tracking-wider px-3 py-2.5">Deskripsi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pinjamanRows.map((row, i) => (
                          <tr key={`${row.kode}-${row.noRek}`} className="border-b border-navy-800/50">
                            <td className="px-3 py-2 text-sm font-mono font-bold text-success-400">{row.kode}</td>
                            <td className="px-3 py-2 text-sm text-white">{row.keterangan}</td>
                            <td className="px-3 py-2 text-sm text-navy-300">{row.noRek}</td>
                            <td className="px-3 py-2 text-center"><input type="text" value={row.tglPot} onChange={(e) => { const v = e.target.value; setPinjamanRows((prev) => prev.map((r, j) => j === i ? { ...r, tglPot: v } : r)); }} className="w-14 bg-navy-800 border border-navy-600/50 rounded-lg px-2 py-1.5 text-sm text-white text-center outline-none focus:border-accent-500" /></td>
                            <td className="px-3 py-2 text-right"><input type="number" value={row.pokok} onChange={(e) => { const v = e.target.value; setPinjamanRows((prev) => prev.map((r, j) => j === i ? { ...r, pokok: v } : r)); }} className="w-24 bg-navy-800 border border-navy-600/50 rounded-lg px-2 py-1.5 text-sm text-white text-right outline-none focus:border-accent-500" /></td>
                            <td className="px-3 py-2 text-right"><input type="number" value={row.jasa} onChange={(e) => { const v = e.target.value; setPinjamanRows((prev) => prev.map((r, j) => j === i ? { ...r, jasa: v } : r)); }} className="w-24 bg-navy-800 border border-navy-600/50 rounded-lg px-2 py-1.5 text-sm text-white text-right outline-none focus:border-accent-500" /></td>
                            <td className="px-3 py-2"><input type="text" value={row.deskripsi} onChange={(e) => { const v = e.target.value; setPinjamanRows((prev) => prev.map((r, j) => j === i ? { ...r, deskripsi: v } : r)); }} className="w-full bg-navy-800 border border-navy-600/50 rounded-lg px-2 py-1.5 text-sm text-white font-bold outline-none focus:border-accent-500" /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-3 flex justify-between items-center border-t-2 border-navy-600 pt-3">
                    <div className="text-sm"><span className="text-navy-400">Pot. Pokok:</span> <span className="font-bold text-white ml-2">{formatRupiah(totalPokokPinjaman)}</span></div>
                    <div className="text-sm"><span className="text-navy-400">Pot. Jasa:</span> <span className="font-bold text-accent-400 ml-2">{formatRupiah(totalJasaPinjaman)}</span></div>
                  </div>
                </div>
              )}

              <div className="mt-4">
                <label className="block text-xs font-medium text-navy-400 uppercase tracking-wide mb-1.5">Alasan Koreksi</label>
                <textarea value={koreksiAlasan} onChange={(e) => setKoreksiAlasan(e.target.value)} placeholder="Tuliskan alasan koreksi untuk keperluan audit..." className="w-full bg-navy-800 border border-navy-700/50 rounded-xl px-3 py-2.5 text-sm text-white placeholder-navy-400 outline-none resize-none h-20" />
              </div>

              <div className="flex gap-2 mt-4">
                <button type="button" onClick={() => { setKoreksiItem(null); setKoreksiSaved(false); setKoreksiAlasan(""); }} className="flex-1 bg-navy-700 hover:bg-navy-600 text-white py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer">Batal</button>
                <button type="button" onClick={saveKoreksi} className="flex-1 flex items-center justify-center gap-2 bg-warning-500 hover:bg-warning-600 text-white py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer"><Save className="w-4 h-4" /> Simpan Koreksi</button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }
}
