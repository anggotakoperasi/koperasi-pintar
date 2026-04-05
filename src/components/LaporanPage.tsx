"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  FileText,
  Download,
  Printer,
  FileSpreadsheet,
  File,
  Users,
  Wallet,
  HandCoins,
  Receipt,
  PieChart,
  ClipboardList,
  BarChart3,
  Calendar,
  ArrowRight,
  X,
  Loader2,
  Eye,
  ChevronDown,
  Search,
} from "lucide-react";
import { formatRupiah } from "@/data/mock";
import type { Anggota, TransaksiSimpanan, Pinjaman, Potongan } from "@/data/mock";
import {
  fetchAnggota,
  fetchTransaksiSimpanan,
  fetchPinjaman,
  fetchPotongan,
  exportCSV,
} from "@/lib/fetchers";
import DatePickerID from "./DatePickerID";

interface ReportResult {
  title: string;
  subtitle: string;
  headers: string[];
  rows: string[][];
  summary?: { label: string; value: string }[];
}

type ReportGenerator = (
  anggota: Anggota[],
  transaksi: TransaksiSimpanan[],
  pinjaman: Pinjaman[],
  potongan: Potongan[],
  bulan: string
) => ReportResult;

function fmtDate(d: string) {
  if (!d) return "-";
  try {
    return new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  } catch { return d; }
}

function fmtBulan(b: string) {
  if (!b) return "-";
  try {
    const [y, m] = b.split("-");
    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    return `${months[parseInt(m) - 1]} ${y}`;
  } catch { return b; }
}

const reportGenerators: Record<string, ReportGenerator> = {
  "Daftar Anggota Aktif": (anggota) => {
    const aktif = anggota.filter(a => a.status === "aktif");
    return {
      title: "Daftar Anggota Aktif",
      subtitle: `Total ${aktif.length} anggota aktif`,
      headers: ["No", "No. Anggota", "Nama", "Pangkat", "Satuan", "NRP/NIP", "Bergabung"],
      rows: aktif.map((a, i) => [
        String(i + 1), a.nomorAnggota, a.nama, a.pangkat, a.satuan, a.nrp, fmtDate(a.bergabung),
      ]),
      summary: [
        { label: "Total Anggota Aktif", value: String(aktif.length) },
        { label: "Satuan Terbanyak", value: getMostCommon(aktif.map(a => a.satuan)) },
      ],
    };
  },

  "Nominatif Simpanan & Pinjaman": (anggota) => {
    const aktif = anggota.filter(a => a.status === "aktif");
    const totPokok = aktif.reduce((s, a) => s + a.simpananPokok, 0);
    const totWajib = aktif.reduce((s, a) => s + a.simpananWajib, 0);
    const totSukarela = aktif.reduce((s, a) => s + a.simpananSukarela, 0);
    const totPinjaman = aktif.reduce((s, a) => s + a.sisaPinjaman, 0);
    return {
      title: "Nominatif Simpanan & Pinjaman",
      subtitle: `Data ${aktif.length} anggota aktif`,
      headers: ["No", "No. Anggota", "Nama", "Pangkat", "Simp. Pokok", "Simp. Wajib", "Simp. Sukarela", "Sisa Pinjaman"],
      rows: aktif.map((a, i) => [
        String(i + 1), a.nomorAnggota, a.nama, a.pangkat,
        formatRupiah(a.simpananPokok), formatRupiah(a.simpananWajib),
        formatRupiah(a.simpananSukarela), formatRupiah(a.sisaPinjaman),
      ]),
      summary: [
        { label: "Total Simpanan Pokok", value: formatRupiah(totPokok) },
        { label: "Total Simpanan Wajib", value: formatRupiah(totWajib) },
        { label: "Total Simpanan Sukarela", value: formatRupiah(totSukarela) },
        { label: "Total Sisa Pinjaman", value: formatRupiah(totPinjaman) },
      ],
    };
  },

  "Daftar Anggota per Satuan": (anggota) => {
    const aktif = anggota.filter(a => a.status === "aktif");
    const grouped = new Map<string, Anggota[]>();
    aktif.forEach(a => {
      const list = grouped.get(a.satuan) || [];
      list.push(a);
      grouped.set(a.satuan, list);
    });
    const rows: string[][] = [];
    let no = 1;
    Array.from(grouped.entries())
      .sort((a, b) => b[1].length - a[1].length)
      .forEach(([satuan, members]) => {
        members.forEach((a, i) => {
          rows.push([String(no++), satuan, a.nomorAnggota, a.nama, a.pangkat, a.nrp]);
        });
      });
    return {
      title: "Daftar Anggota per Satuan",
      subtitle: `${grouped.size} satuan, ${aktif.length} anggota`,
      headers: ["No", "Satuan", "No. Anggota", "Nama", "Pangkat", "NRP/NIP"],
      rows,
      summary: Array.from(grouped.entries())
        .sort((a, b) => b[1].length - a[1].length)
        .slice(0, 6)
        .map(([s, m]) => ({ label: s, value: `${m.length} anggota` })),
    };
  },

  "Rekap Data Anggota": (anggota) => {
    const byStatus = { aktif: 0, pasif: 0, keluar: 0 };
    anggota.forEach(a => { byStatus[a.status] = (byStatus[a.status] || 0) + 1; });
    const byTier: Record<string, number> = {};
    anggota.forEach(a => { byTier[a.tier] = (byTier[a.tier] || 0) + 1; });
    return {
      title: "Rekapitulasi Data Anggota",
      subtitle: `Total ${anggota.length} anggota`,
      headers: ["Kategori", "Keterangan", "Jumlah", "Persentase"],
      rows: [
        ["Status", "Aktif", String(byStatus.aktif), pct(byStatus.aktif, anggota.length)],
        ["Status", "Pasif", String(byStatus.pasif), pct(byStatus.pasif, anggota.length)],
        ["Status", "Keluar", String(byStatus.keluar), pct(byStatus.keluar, anggota.length)],
        ...Object.entries(byTier).map(([t, c]) => ["Tier", t.toUpperCase(), String(c), pct(c, anggota.length)]),
      ],
      summary: [
        { label: "Total Anggota", value: String(anggota.length) },
        { label: "Aktif", value: String(byStatus.aktif) },
        { label: "Pasif", value: String(byStatus.pasif) },
        { label: "Keluar", value: String(byStatus.keluar) },
      ],
    };
  },

  "Daftar Setoran Simpanan": (_, transaksi) => {
    const setoran = transaksi.filter(t => t.jenis === "setoran");
    const total = setoran.reduce((s, t) => s + t.jumlah, 0);
    return {
      title: "Daftar Setoran Simpanan",
      subtitle: `${setoran.length} transaksi setoran`,
      headers: ["No", "Tanggal", "ID Anggota", "Nama", "Kategori", "Jumlah", "Keterangan"],
      rows: setoran.map((t, i) => [
        String(i + 1), fmtDate(t.tanggal), t.anggotaId, t.namaAnggota,
        t.kategori.toUpperCase(), formatRupiah(t.jumlah), t.keterangan || "-",
      ]),
      summary: [
        { label: "Total Setoran", value: formatRupiah(total) },
        { label: "Jumlah Transaksi", value: String(setoran.length) },
      ],
    };
  },

  "Daftar Pengambilan Simpanan": (_, transaksi) => {
    const pengambilan = transaksi.filter(t => t.jenis === "pengambilan");
    const total = pengambilan.reduce((s, t) => s + t.jumlah, 0);
    return {
      title: "Daftar Pengambilan Simpanan",
      subtitle: `${pengambilan.length} transaksi pengambilan`,
      headers: ["No", "Tanggal", "ID Anggota", "Nama", "Kategori", "Jumlah", "Keterangan"],
      rows: pengambilan.map((t, i) => [
        String(i + 1), fmtDate(t.tanggal), t.anggotaId, t.namaAnggota,
        t.kategori.toUpperCase(), formatRupiah(t.jumlah), t.keterangan || "-",
      ]),
      summary: [
        { label: "Total Pengambilan", value: formatRupiah(total) },
        { label: "Jumlah Transaksi", value: String(pengambilan.length) },
      ],
    };
  },

  "Rekapitulasi Simpanan": (anggota) => {
    const aktif = anggota.filter(a => a.status === "aktif");
    const totP = aktif.reduce((s, a) => s + a.simpananPokok, 0);
    const totW = aktif.reduce((s, a) => s + a.simpananWajib, 0);
    const totS = aktif.reduce((s, a) => s + a.simpananSukarela, 0);
    return {
      title: "Rekapitulasi Simpanan",
      subtitle: `${aktif.length} anggota aktif`,
      headers: ["No", "No. Anggota", "Nama", "Simp. Pokok", "Simp. Wajib", "Simp. Sukarela", "Total Simpanan"],
      rows: aktif.map((a, i) => [
        String(i + 1), a.nomorAnggota, a.nama,
        formatRupiah(a.simpananPokok), formatRupiah(a.simpananWajib),
        formatRupiah(a.simpananSukarela), formatRupiah(a.simpananPokok + a.simpananWajib + a.simpananSukarela),
      ]),
      summary: [
        { label: "Total Simp. Pokok", value: formatRupiah(totP) },
        { label: "Total Simp. Wajib", value: formatRupiah(totW) },
        { label: "Total Simp. Sukarela", value: formatRupiah(totS) },
        { label: "Grand Total", value: formatRupiah(totP + totW + totS) },
      ],
    };
  },

  "Akumulasi Jasa Simpanan": (anggota) => {
    const aktif = anggota.filter(a => a.status === "aktif");
    const jasaRate = 0.005;
    return {
      title: "Akumulasi Jasa Simpanan",
      subtitle: "Estimasi jasa simpanan (0.5%/bulan)",
      headers: ["No", "Nama", "Total Simpanan", "Est. Jasa/Bulan", "Est. Jasa/Tahun"],
      rows: aktif.map((a, i) => {
        const totalSimp = a.simpananPokok + a.simpananWajib + a.simpananSukarela;
        return [
          String(i + 1), a.nama, formatRupiah(totalSimp),
          formatRupiah(Math.round(totalSimp * jasaRate)),
          formatRupiah(Math.round(totalSimp * jasaRate * 12)),
        ];
      }),
    };
  },

  "Rekening Koran Simpanan": (anggota, transaksi) => {
    const sorted = [...transaksi].sort((a, b) => a.tanggal.localeCompare(b.tanggal));
    return {
      title: "Rekening Koran Simpanan",
      subtitle: `${sorted.length} transaksi`,
      headers: ["No", "Tanggal", "Nama", "Jenis", "Kategori", "Jumlah", "Ket."],
      rows: sorted.map((t, i) => [
        String(i + 1), fmtDate(t.tanggal), t.namaAnggota,
        t.jenis === "setoran" ? "SETOR" : "AMBIL",
        t.kategori.toUpperCase(), formatRupiah(t.jumlah), t.keterangan || "-",
      ]),
    };
  },

  "Cetak Daftar Setoran per Anggota": (anggota, transaksi) => {
    const setoran = transaksi.filter(t => t.jenis === "setoran");
    const grouped = new Map<string, { nama: string; total: number; count: number }>();
    setoran.forEach(t => {
      const existing = grouped.get(t.anggotaId) || { nama: t.namaAnggota, total: 0, count: 0 };
      existing.total += t.jumlah;
      existing.count += 1;
      grouped.set(t.anggotaId, existing);
    });
    const rows = Array.from(grouped.entries()).map(([id, v], i) => [
      String(i + 1), id, v.nama, String(v.count), formatRupiah(v.total),
    ]);
    return {
      title: "Daftar Setoran per Anggota",
      subtitle: `${grouped.size} anggota`,
      headers: ["No", "ID Anggota", "Nama", "Jml Transaksi", "Total Setoran"],
      rows,
    };
  },

  "Daftar Realisasi Pinjaman": (_, __, pinjaman) => {
    const total = pinjaman.reduce((s, p) => s + p.jumlahPinjaman, 0);
    return {
      title: "Daftar Realisasi Pinjaman",
      subtitle: `${pinjaman.length} pinjaman`,
      headers: ["No", "Nama", "Jenis", "Jumlah Pinjaman", "Sisa", "Tenor", "Angsuran/Bln", "Tgl Pinjam", "Status"],
      rows: pinjaman.map((p, i) => [
        String(i + 1), p.namaAnggota, p.jenisPinjaman,
        formatRupiah(p.jumlahPinjaman), formatRupiah(p.sisaPinjaman),
        `${p.tenor} bln`, formatRupiah(p.angsuranPerBulan),
        fmtDate(p.tanggalPinjam), statusLabel(p.status),
      ]),
      summary: [
        { label: "Total Realisasi", value: formatRupiah(total) },
        { label: "Jumlah Pinjaman", value: String(pinjaman.length) },
      ],
    };
  },

  "Daftar Setoran Jasa Pinjaman": (_, __, pinjaman) => {
    const aktif = pinjaman.filter(p => p.sisaPinjaman > 0);
    const totalJasa = aktif.reduce((s, p) => s + (p.sisaPinjaman * p.bungaPerBulan / 100), 0);
    return {
      title: "Daftar Setoran Jasa Pinjaman",
      subtitle: `${aktif.length} pinjaman aktif`,
      headers: ["No", "Nama", "Sisa Pinjaman", "Bunga (%)", "Jasa/Bulan", "Sisa Tenor"],
      rows: aktif.map((p, i) => [
        String(i + 1), p.namaAnggota, formatRupiah(p.sisaPinjaman),
        `${p.bungaPerBulan}%`, formatRupiah(Math.round(p.sisaPinjaman * p.bungaPerBulan / 100)),
        `${p.sisaTenor} bln`,
      ]),
      summary: [{ label: "Est. Total Jasa/Bulan", value: formatRupiah(Math.round(totalJasa)) }],
    };
  },

  "Daftar Pinjaman Jatuh Tempo": (_, __, pinjaman) => {
    const now = new Date();
    const tempo = pinjaman.filter(p => {
      if (p.sisaPinjaman <= 0) return false;
      const jt = new Date(p.jatuhTempo);
      const diff = (jt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return diff <= 90;
    });
    return {
      title: "Daftar Pinjaman Jatuh Tempo",
      subtitle: `${tempo.length} pinjaman jatuh tempo dalam 90 hari`,
      headers: ["No", "Nama", "Jumlah Pinjaman", "Sisa", "Jatuh Tempo", "Sisa Tenor", "Status"],
      rows: tempo.map((p, i) => [
        String(i + 1), p.namaAnggota, formatRupiah(p.jumlahPinjaman),
        formatRupiah(p.sisaPinjaman), fmtDate(p.jatuhTempo),
        `${p.sisaTenor} bln`, statusLabel(p.status),
      ]),
    };
  },

  "Daftar Pinjaman Macet": (_, __, pinjaman) => {
    const macet = pinjaman.filter(p => p.status === "macet");
    const total = macet.reduce((s, p) => s + p.sisaPinjaman, 0);
    return {
      title: "Daftar Pinjaman Macet",
      subtitle: `${macet.length} pinjaman macet`,
      headers: ["No", "Nama", "Jenis", "Jumlah Awal", "Sisa", "Jatuh Tempo"],
      rows: macet.map((p, i) => [
        String(i + 1), p.namaAnggota, p.jenisPinjaman,
        formatRupiah(p.jumlahPinjaman), formatRupiah(p.sisaPinjaman), fmtDate(p.jatuhTempo),
      ]),
      summary: [
        { label: "Total Pinjaman Macet", value: formatRupiah(total) },
        { label: "Jumlah Kasus", value: String(macet.length) },
      ],
    };
  },

  "Rekening Koran Pinjaman": (_, __, pinjaman) => {
    const sorted = [...pinjaman].sort((a, b) => a.tanggalPinjam.localeCompare(b.tanggalPinjam));
    return {
      title: "Rekening Koran Pinjaman",
      subtitle: `${sorted.length} record`,
      headers: ["No", "Tgl Pinjam", "Nama", "Jenis", "Jumlah", "Sisa", "Angsuran/Bln", "Status"],
      rows: sorted.map((p, i) => [
        String(i + 1), fmtDate(p.tanggalPinjam), p.namaAnggota, p.jenisPinjaman,
        formatRupiah(p.jumlahPinjaman), formatRupiah(p.sisaPinjaman),
        formatRupiah(p.angsuranPerBulan), statusLabel(p.status),
      ]),
    };
  },

  "Daftar Pengambilan per Anggota": (_, __, pinjaman) => {
    const grouped = new Map<string, { nama: string; total: number; sisa: number; count: number }>();
    pinjaman.forEach(p => {
      const existing = grouped.get(p.anggotaId) || { nama: p.namaAnggota, total: 0, sisa: 0, count: 0 };
      existing.total += p.jumlahPinjaman;
      existing.sisa += p.sisaPinjaman;
      existing.count += 1;
      grouped.set(p.anggotaId, existing);
    });
    return {
      title: "Daftar Pinjaman per Anggota",
      subtitle: `${grouped.size} anggota`,
      headers: ["No", "ID", "Nama", "Jml Pinjaman", "Total Pinjaman", "Total Sisa"],
      rows: Array.from(grouped.entries()).map(([id, v], i) => [
        String(i + 1), id, v.nama, String(v.count), formatRupiah(v.total), formatRupiah(v.sisa),
      ]),
    };
  },

  "Daftar Potongan Bulanan": (_, __, ___, potongan, bulan) => {
    const filtered = potongan.filter(p => !bulan || p.bulan === bulan);
    const total = filtered.reduce((s, p) => s + p.totalPotongan, 0);
    return {
      title: "Daftar Potongan Bulanan",
      subtitle: bulan ? `Bulan: ${fmtBulan(bulan)}` : `Semua bulan (${filtered.length} record)`,
      headers: ["No", "Nama", "Bulan", "Simp. Wajib", "Angs. Pinjaman", "Jasa Pinjaman", "Total", "Status"],
      rows: filtered.map((p, i) => [
        String(i + 1), p.namaAnggota, fmtBulan(p.bulan),
        formatRupiah(p.simpananWajib), formatRupiah(p.angsuranPinjaman),
        formatRupiah(p.jasaPinjaman), formatRupiah(p.totalPotongan),
        p.status === "terkirim" ? "Terkirim" : p.status === "proses" ? "Proses" : "Gagal",
      ]),
      summary: [{ label: "Grand Total Potongan", value: formatRupiah(total) }],
    };
  },

  "Rekap Daftar Potongan": (_, __, ___, potongan) => {
    const byMonth = new Map<string, { sw: number; ap: number; jp: number; total: number; count: number }>();
    potongan.forEach(p => {
      const existing = byMonth.get(p.bulan) || { sw: 0, ap: 0, jp: 0, total: 0, count: 0 };
      existing.sw += p.simpananWajib;
      existing.ap += p.angsuranPinjaman;
      existing.jp += p.jasaPinjaman;
      existing.total += p.totalPotongan;
      existing.count += 1;
      byMonth.set(p.bulan, existing);
    });
    return {
      title: "Rekapitulasi Daftar Potongan",
      subtitle: `${byMonth.size} bulan`,
      headers: ["No", "Bulan", "Jml Anggota", "Simp. Wajib", "Angs. Pinjaman", "Jasa Pinjaman", "Grand Total"],
      rows: Array.from(byMonth.entries())
        .sort((a, b) => b[0].localeCompare(a[0]))
        .map(([bulan, v], i) => [
          String(i + 1), fmtBulan(bulan), String(v.count),
          formatRupiah(v.sw), formatRupiah(v.ap), formatRupiah(v.jp), formatRupiah(v.total),
        ]),
    };
  },

  "Struk Potongan per Anggota": (_, __, ___, potongan) => {
    const byAnggota = new Map<string, { nama: string; total: number; months: number }>();
    potongan.forEach(p => {
      const existing = byAnggota.get(p.anggotaId) || { nama: p.namaAnggota, total: 0, months: 0 };
      existing.total += p.totalPotongan;
      existing.months += 1;
      byAnggota.set(p.anggotaId, existing);
    });
    return {
      title: "Struk Potongan per Anggota",
      subtitle: `${byAnggota.size} anggota`,
      headers: ["No", "ID", "Nama", "Jumlah Bulan", "Total Potongan", "Rata-rata/Bulan"],
      rows: Array.from(byAnggota.entries()).map(([id, v], i) => [
        String(i + 1), id, v.nama, String(v.months),
        formatRupiah(v.total), formatRupiah(Math.round(v.total / Math.max(v.months, 1))),
      ]),
    };
  },

  "Koreksi Daftar Potongan": (_, __, ___, potongan) => {
    const gagal = potongan.filter(p => p.status === "gagal");
    return {
      title: "Koreksi Daftar Potongan",
      subtitle: `${gagal.length} potongan status gagal`,
      headers: ["No", "Nama", "Bulan", "Total Potongan", "Status"],
      rows: gagal.map((p, i) => [
        String(i + 1), p.namaAnggota, fmtBulan(p.bulan), formatRupiah(p.totalPotongan), "GAGAL",
      ]),
    };
  },

  "Rincian SHU per Anggota": (anggota) => {
    const aktif = anggota.filter(a => a.status === "aktif");
    const totalSimp = aktif.reduce((s, a) => s + a.simpananPokok + a.simpananWajib + a.simpananSukarela, 0);
    const totalPinj = aktif.reduce((s, a) => s + a.totalPinjaman, 0);
    const estimasiSHU = totalSimp * 0.03 + totalPinj * 0.01;
    return {
      title: "Rincian SHU per Anggota",
      subtitle: `Estimasi distribusi SHU`,
      headers: ["No", "Nama", "Total Simpanan", "Total Pinjaman", "Kontribusi (%)", "Est. SHU"],
      rows: aktif.map((a, i) => {
        const simp = a.simpananPokok + a.simpananWajib + a.simpananSukarela;
        const kontribusi = totalSimp > 0 ? ((simp / totalSimp) * 60 + (a.totalPinjaman / Math.max(totalPinj, 1)) * 40) : 0;
        return [
          String(i + 1), a.nama, formatRupiah(simp), formatRupiah(a.totalPinjaman),
          `${kontribusi.toFixed(2)}%`, formatRupiah(Math.round(estimasiSHU * kontribusi / 100)),
        ];
      }),
      summary: [
        { label: "Total Simpanan Seluruh", value: formatRupiah(totalSimp) },
        { label: "Total Pinjaman Seluruh", value: formatRupiah(totalPinj) },
        { label: "Estimasi SHU Total", value: formatRupiah(Math.round(estimasiSHU)) },
      ],
    };
  },

  "Rekapitulasi SHU": (anggota) => {
    const aktif = anggota.filter(a => a.status === "aktif");
    const totSimp = aktif.reduce((s, a) => s + a.simpananPokok + a.simpananWajib + a.simpananSukarela, 0);
    const totPinj = aktif.reduce((s, a) => s + a.totalPinjaman, 0);
    const jasaSimp = totSimp * 0.03;
    const jasaPinj = totPinj * 0.01;
    return {
      title: "Rekapitulasi SHU",
      subtitle: "Ringkasan Sisa Hasil Usaha",
      headers: ["No", "Komponen", "Jumlah"],
      rows: [
        ["1", "Total Simpanan Anggota", formatRupiah(totSimp)],
        ["2", "Total Pinjaman Anggota", formatRupiah(totPinj)],
        ["3", "Estimasi Pendapatan Jasa Simpanan (3%)", formatRupiah(Math.round(jasaSimp))],
        ["4", "Estimasi Pendapatan Jasa Pinjaman (1%)", formatRupiah(Math.round(jasaPinj))],
        ["5", "Estimasi Total Pendapatan", formatRupiah(Math.round(jasaSimp + jasaPinj))],
        ["6", "Cadangan (25%)", formatRupiah(Math.round((jasaSimp + jasaPinj) * 0.25))],
        ["7", "Dana Pengurus (10%)", formatRupiah(Math.round((jasaSimp + jasaPinj) * 0.10))],
        ["8", "Dana Pendidikan (5%)", formatRupiah(Math.round((jasaSimp + jasaPinj) * 0.05))],
        ["9", "Dana Sosial (5%)", formatRupiah(Math.round((jasaSimp + jasaPinj) * 0.05))],
        ["10", "SHU untuk Anggota (55%)", formatRupiah(Math.round((jasaSimp + jasaPinj) * 0.55))],
      ],
    };
  },

  "Distribusi SHU": (anggota) => {
    const aktif = anggota.filter(a => a.status === "aktif");
    const tierGroups: Record<string, { count: number; simpanan: number }> = {};
    aktif.forEach(a => {
      if (!tierGroups[a.tier]) tierGroups[a.tier] = { count: 0, simpanan: 0 };
      tierGroups[a.tier].count += 1;
      tierGroups[a.tier].simpanan += a.simpananPokok + a.simpananWajib + a.simpananSukarela;
    });
    return {
      title: "Distribusi SHU per Tier",
      subtitle: "Breakdown distribusi SHU berdasarkan tier",
      headers: ["No", "Tier", "Jumlah Anggota", "Total Simpanan", "Kontribusi (%)"],
      rows: Object.entries(tierGroups).map(([tier, v], i) => {
        const totalSimp = aktif.reduce((s, a) => s + a.simpananPokok + a.simpananWajib + a.simpananSukarela, 0);
        return [
          String(i + 1), tier.toUpperCase(), String(v.count),
          formatRupiah(v.simpanan), totalSimp > 0 ? `${((v.simpanan / totalSimp) * 100).toFixed(1)}%` : "0%",
        ];
      }),
    };
  },

  "Simulasi SHU": (anggota) => {
    const aktif = anggota.filter(a => a.status === "aktif");
    const top20 = [...aktif]
      .sort((a, b) => (b.simpananPokok + b.simpananWajib + b.simpananSukarela) - (a.simpananPokok + a.simpananWajib + a.simpananSukarela))
      .slice(0, 20);
    const totalSimp = aktif.reduce((s, a) => s + a.simpananPokok + a.simpananWajib + a.simpananSukarela, 0);
    const shuPool = totalSimp * 0.03 * 0.55;
    return {
      title: "Simulasi SHU (Top 20 Anggota)",
      subtitle: "Berdasarkan kontribusi simpanan terbesar",
      headers: ["No", "Nama", "Total Simpanan", "% Kontribusi", "Est. SHU"],
      rows: top20.map((a, i) => {
        const simp = a.simpananPokok + a.simpananWajib + a.simpananSukarela;
        const share = totalSimp > 0 ? simp / totalSimp : 0;
        return [
          String(i + 1), a.nama, formatRupiah(simp),
          `${(share * 100).toFixed(2)}%`, formatRupiah(Math.round(shuPool * share)),
        ];
      }),
      summary: [{ label: "Pool SHU Anggota (55%)", value: formatRupiah(Math.round(shuPool)) }],
    };
  },

  "Neraca": (anggota, _, pinjaman) => {
    const aktif = anggota.filter(a => a.status === "aktif");
    const totSimp = aktif.reduce((s, a) => s + a.simpananPokok + a.simpananWajib + a.simpananSukarela, 0);
    const totSisaPinj = pinjaman.reduce((s, p) => s + p.sisaPinjaman, 0);
    const kas = totSimp - totSisaPinj * 0.5;
    return {
      title: "Neraca (Estimasi)",
      subtitle: "Laporan Posisi Keuangan",
      headers: ["No", "Pos", "Jumlah"],
      rows: [
        ["", "AKTIVA", ""],
        ["1", "Kas & Bank", formatRupiah(Math.max(0, Math.round(kas)))],
        ["2", "Piutang Pinjaman Anggota", formatRupiah(totSisaPinj)],
        ["", "Total Aktiva", formatRupiah(Math.round(Math.max(0, kas) + totSisaPinj))],
        ["", "", ""],
        ["", "PASIVA", ""],
        ["3", "Simpanan Pokok", formatRupiah(aktif.reduce((s, a) => s + a.simpananPokok, 0))],
        ["4", "Simpanan Wajib", formatRupiah(aktif.reduce((s, a) => s + a.simpananWajib, 0))],
        ["5", "Simpanan Sukarela", formatRupiah(aktif.reduce((s, a) => s + a.simpananSukarela, 0))],
        ["", "Total Pasiva", formatRupiah(totSimp)],
      ],
    };
  },

  "Laba Rugi": (anggota, _, pinjaman) => {
    const totSisaPinj = pinjaman.reduce((s, p) => s + p.sisaPinjaman, 0);
    const avgBunga = pinjaman.length > 0 ? pinjaman.reduce((s, p) => s + p.bungaPerBulan, 0) / pinjaman.length : 1;
    const pendapatanJasa = Math.round(totSisaPinj * avgBunga / 100 * 12);
    const biayaOps = Math.round(pendapatanJasa * 0.2);
    return {
      title: "Laporan Laba Rugi (Estimasi)",
      subtitle: "Periode berjalan",
      headers: ["No", "Pos", "Jumlah"],
      rows: [
        ["", "PENDAPATAN", ""],
        ["1", "Jasa Pinjaman", formatRupiah(pendapatanJasa)],
        ["2", "Provisi & Administrasi", formatRupiah(Math.round(pendapatanJasa * 0.05))],
        ["", "Total Pendapatan", formatRupiah(Math.round(pendapatanJasa * 1.05))],
        ["", "", ""],
        ["", "BIAYA", ""],
        ["3", "Biaya Operasional", formatRupiah(biayaOps)],
        ["4", "Biaya Administrasi", formatRupiah(Math.round(biayaOps * 0.3))],
        ["", "Total Biaya", formatRupiah(Math.round(biayaOps * 1.3))],
        ["", "", ""],
        ["", "LABA BERSIH (SHU)", formatRupiah(Math.round(pendapatanJasa * 1.05 - biayaOps * 1.3))],
      ],
    };
  },

  "Arus Kas": (anggota, transaksi, pinjaman) => {
    const totalSetoran = transaksi.filter(t => t.jenis === "setoran").reduce((s, t) => s + t.jumlah, 0);
    const totalPengambilan = transaksi.filter(t => t.jenis === "pengambilan").reduce((s, t) => s + t.jumlah, 0);
    const totalPinjBaru = pinjaman.reduce((s, p) => s + p.jumlahPinjaman, 0);
    const totalAngsuran = pinjaman.reduce((s, p) => s + (p.jumlahPinjaman - p.sisaPinjaman), 0);
    return {
      title: "Laporan Arus Kas (Estimasi)",
      subtitle: "Aliran kas masuk dan keluar",
      headers: ["No", "Keterangan", "Masuk", "Keluar"],
      rows: [
        ["1", "Setoran Simpanan", formatRupiah(totalSetoran), "-"],
        ["2", "Pengambilan Simpanan", "-", formatRupiah(totalPengambilan)],
        ["3", "Pencairan Pinjaman", "-", formatRupiah(totalPinjBaru)],
        ["4", "Angsuran Pinjaman Diterima", formatRupiah(totalAngsuran), "-"],
        ["", "", "", ""],
        ["", "Total Kas Masuk", formatRupiah(totalSetoran + totalAngsuran), ""],
        ["", "Total Kas Keluar", "", formatRupiah(totalPengambilan + totalPinjBaru)],
        ["", "Arus Kas Bersih", formatRupiah(totalSetoran + totalAngsuran - totalPengambilan - totalPinjBaru), ""],
      ],
    };
  },

  "Buku Besar": (_, transaksi) => {
    const sorted = [...transaksi].sort((a, b) => a.tanggal.localeCompare(b.tanggal));
    let saldo = 0;
    return {
      title: "Buku Besar Simpanan",
      subtitle: `${sorted.length} entri`,
      headers: ["No", "Tanggal", "Keterangan", "Debit", "Kredit", "Saldo"],
      rows: sorted.map((t, i) => {
        if (t.jenis === "setoran") saldo += t.jumlah;
        else saldo -= t.jumlah;
        return [
          String(i + 1), fmtDate(t.tanggal),
          `${t.jenis === "setoran" ? "Setor" : "Ambil"} ${t.kategori} - ${t.namaAnggota}`,
          t.jenis === "setoran" ? formatRupiah(t.jumlah) : "-",
          t.jenis === "pengambilan" ? formatRupiah(t.jumlah) : "-",
          formatRupiah(saldo),
        ];
      }),
    };
  },

  "Grafik Tren 3 Tahun": (anggota) => {
    const aktif = anggota.filter(a => a.status === "aktif");
    const totSimp = aktif.reduce((s, a) => s + a.simpananPokok + a.simpananWajib + a.simpananSukarela, 0);
    const thisYear = new Date().getFullYear();
    return {
      title: "Tren Keuangan 3 Tahun (Estimasi)",
      subtitle: "Proyeksi berdasarkan data saat ini",
      headers: ["Tahun", "Est. Simpanan", "Est. Pinjaman", "Est. SHU"],
      rows: [
        [String(thisYear - 2), formatRupiah(Math.round(totSimp * 0.7)), formatRupiah(Math.round(totSimp * 0.3)), formatRupiah(Math.round(totSimp * 0.015))],
        [String(thisYear - 1), formatRupiah(Math.round(totSimp * 0.85)), formatRupiah(Math.round(totSimp * 0.35)), formatRupiah(Math.round(totSimp * 0.02))],
        [String(thisYear), formatRupiah(totSimp), formatRupiah(aktif.reduce((s, a) => s + a.totalPinjaman, 0)), formatRupiah(Math.round(totSimp * 0.03))],
      ],
    };
  },
};

function getMostCommon(arr: string[]): string {
  const counts: Record<string, number> = {};
  arr.forEach(v => { counts[v] = (counts[v] || 0) + 1; });
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || "-";
}

function pct(part: number, total: number): string {
  return total > 0 ? `${((part / total) * 100).toFixed(1)}%` : "0%";
}

function statusLabel(s: string): string {
  if (s === "lancar") return "Lancar";
  if (s === "kurang_lancar") return "Kurang Lancar";
  if (s === "macet") return "Macet";
  return s;
}

const laporanCategories = [
  {
    title: "Laporan Anggota",
    icon: Users,
    color: "accent",
    items: ["Daftar Anggota Aktif", "Nominatif Simpanan & Pinjaman", "Daftar Anggota per Satuan", "Rekap Data Anggota"],
  },
  {
    title: "Laporan Simpanan",
    icon: Wallet,
    color: "green",
    items: ["Daftar Setoran Simpanan", "Daftar Pengambilan Simpanan", "Rekapitulasi Simpanan", "Akumulasi Jasa Simpanan", "Rekening Koran Simpanan", "Cetak Daftar Setoran per Anggota"],
  },
  {
    title: "Laporan Pinjaman",
    icon: HandCoins,
    color: "amber",
    items: ["Daftar Realisasi Pinjaman", "Daftar Setoran Jasa Pinjaman", "Daftar Pinjaman Jatuh Tempo", "Daftar Pinjaman Macet", "Rekening Koran Pinjaman", "Daftar Pengambilan per Anggota"],
  },
  {
    title: "Laporan Potongan",
    icon: Receipt,
    color: "purple",
    items: ["Daftar Potongan Bulanan", "Rekap Daftar Potongan", "Struk Potongan per Anggota", "Koreksi Daftar Potongan"],
  },
  {
    title: "Laporan SHU",
    icon: PieChart,
    color: "pink",
    items: ["Rincian SHU per Anggota", "Rekapitulasi SHU", "Distribusi SHU", "Simulasi SHU"],
  },
  {
    title: "Laporan Keuangan",
    icon: BarChart3,
    color: "cyan",
    items: ["Neraca", "Laba Rugi", "Arus Kas", "Buku Besar", "Grafik Tren 3 Tahun"],
  },
];

const colorBg: Record<string, string> = {
  accent: "bg-accent-500/10 border-accent-500/20",
  green: "bg-success-500/10 border-success-500/20",
  amber: "bg-warning-500/10 border-warning-500/20",
  purple: "bg-purple-500/10 border-purple-500/20",
  pink: "bg-pink-500/10 border-pink-500/20",
  cyan: "bg-cyan-500/10 border-cyan-500/20",
};

const colorIcon: Record<string, string> = {
  accent: "bg-accent-500/20 text-accent-400",
  green: "bg-success-500/20 text-success-400",
  amber: "bg-warning-500/20 text-warning-400",
  purple: "bg-purple-500/20 text-purple-400",
  pink: "bg-pink-500/20 text-pink-400",
  cyan: "bg-cyan-500/20 text-cyan-400",
};

export default function LaporanPage() {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ReportResult | null>(null);
  const [reportSearch, setReportSearch] = useState("");
  const [reportFilter, setReportFilter] = useState("semua");
  const [dataLoaded, setDataLoaded] = useState(false);
  const [allAnggota, setAllAnggota] = useState<Anggota[]>([]);
  const [allTransaksi, setAllTransaksi] = useState<TransaksiSimpanan[]>([]);
  const [allPinjaman, setAllPinjaman] = useState<Pinjaman[]>([]);
  const [allPotongan, setAllPotongan] = useState<Potongan[]>([]);
  const [selectedBulan, setSelectedBulan] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const printRef = useRef<HTMLDivElement>(null);

  const loadAllData = useCallback(async () => {
    if (dataLoaded) return;
    setLoading(true);
    try {
      const [a, t, p, pot] = await Promise.all([
        fetchAnggota(), fetchTransaksiSimpanan(), fetchPinjaman(), fetchPotongan(),
      ]);
      setAllAnggota(a);
      setAllTransaksi(t);
      setAllPinjaman(p);
      setAllPotongan(pot);
      setDataLoaded(true);
    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      setLoading(false);
    }
  }, [dataLoaded]);

  useEffect(() => { loadAllData(); }, [loadAllData]);

  const openReport = (reportName: string) => {
    const generator = reportGenerators[reportName];
    if (!generator) return;
    const result = generator(allAnggota, allTransaksi, allPinjaman, allPotongan, selectedBulan);
    setReport(result);
    setReportSearch("");
    setReportFilter("semua");
  };

  const reportFilterOptions = useMemo(() => {
    if (!report) return [];
    const satuanIdx = report.headers.findIndex(h => h.toLowerCase() === "satuan");
    if (satuanIdx < 0) return [];
    const unique = [...new Set(report.rows.map(r => r[satuanIdx]).filter(Boolean))].sort();
    return unique;
  }, [report]);

  const filteredRows = useMemo(() => {
    if (!report) return [];
    let rows = report.rows;
    if (reportFilter !== "semua") {
      const satuanIdx = report.headers.findIndex(h => h.toLowerCase() === "satuan");
      if (satuanIdx >= 0) {
        rows = rows.filter(r => r[satuanIdx] === reportFilter);
      }
    }
    if (reportSearch.trim()) {
      const q = reportSearch.toLowerCase();
      rows = rows.filter(r => r.some(cell => cell.toLowerCase().includes(q)));
    }
    return rows;
  }, [report, reportFilter, reportSearch]);

  const filteredSummary = useMemo(() => {
    if (!report || reportFilter === "semua") return report?.summary || [];
    const satuanIdx = report.headers.findIndex(h => h.toLowerCase() === "satuan");
    if (satuanIdx < 0) return report.summary || [];
    const count = filteredRows.filter(r => r[0] !== "").length;
    return [{ label: reportFilter, value: `${count} anggota` }];
  }, [report, reportFilter, filteredRows]);

  const handleExportCSV = () => {
    if (!report) return;
    const rawRows = report.rows.map(row =>
      row.map(cell => cell.replace(/Rp\s?/g, "").replace(/\./g, ""))
    );
    exportCSV(report.headers, rawRows, `${report.title.replace(/\s+/g, "_")}.csv`);
  };

  const handlePrint = () => {
    if (!printRef.current) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html><head><title>${report?.title || "Laporan"}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; color: #111; }
        h1 { font-size: 18px; margin-bottom: 4px; }
        h2 { font-size: 13px; color: #666; margin-bottom: 16px; font-weight: normal; }
        .org { font-size: 14px; color: #333; margin-bottom: 2px; }
        table { width: 100%; border-collapse: collapse; font-size: 11px; }
        th { background: #f0f0f0; border: 1px solid #ccc; padding: 6px 8px; text-align: left; font-weight: 600; }
        td { border: 1px solid #ddd; padding: 5px 8px; }
        tr:nth-child(even) { background: #fafafa; }
        .summary { margin-top: 16px; font-size: 12px; }
        .summary span { font-weight: 600; }
        @media print { body { padding: 0; } }
      </style></head><body>
      <p class="org">PRIMKOPPOL RESOR SUBANG</p>
      <h1>${report?.title || ""}</h1>
      <h2>${report?.subtitle || ""} — Dicetak: ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</h2>
      <table>
        <thead><tr>${report?.headers.map(h => `<th>${h}</th>`).join("") || ""}</tr></thead>
        <tbody>${report?.rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join("")}</tr>`).join("") || ""}</tbody>
      </table>
      ${report?.summary ? `<div class="summary">${report.summary.map(s => `<p>${s.label}: <span>${s.value}</span></p>`).join("")}</div>` : ""}
      </body></html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); }, 300);
  };

  const bulanLabel = (() => {
    const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    const [y, m] = selectedBulan.split("-");
    return `${months[parseInt(m) - 1]} ${y}`;
  })();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-navy-900/80 rounded-2xl border border-navy-700/30 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white">Cetak Laporan</h3>
            <p className="text-sm text-navy-400">
              {loading ? "Memuat data..." : dataLoaded
                ? `${allAnggota.length} anggota · ${allTransaksi.length} transaksi · ${allPinjaman.length} pinjaman — Klik laporan untuk preview`
                : "Pilih jenis laporan untuk dicetak atau di-export"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <DatePickerID value={selectedBulan} onChange={setSelectedBulan} />
          </div>
        </div>

        {loading && !dataLoaded && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-accent-400 animate-spin" />
            <span className="ml-2 text-navy-300 text-sm">Memuat semua data dari database...</span>
          </div>
        )}

        {dataLoaded && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {laporanCategories.map((cat, i) => {
              const Icon = cat.icon;
              return (
                <div key={i} className={`rounded-2xl border p-5 ${colorBg[cat.color]}`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorIcon[cat.color]}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <h4 className="text-sm font-semibold text-white">{cat.title}</h4>
                  </div>
                  <div className="space-y-1.5">
                    {cat.items.map((item, j) => (
                      <button
                        key={j}
                        onClick={() => openReport(item)}
                        className="w-full flex items-center justify-between text-left px-3 py-2.5 rounded-xl hover:bg-navy-800/60 transition-colors group cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="w-3.5 h-3.5 text-navy-400 group-hover:text-navy-200" />
                          <span className="text-sm text-navy-200 group-hover:text-white transition-colors">{item}</span>
                        </div>
                        <Eye className="w-3.5 h-3.5 text-navy-500 group-hover:text-accent-400 transition-colors" />
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Export */}
      {dataLoaded && (
        <div className="bg-navy-900/80 rounded-2xl border border-navy-700/30 p-5">
          <h3 className="text-base font-semibold text-white mb-4">Export Cepat</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              onClick={() => {
                openReport("Nominatif Simpanan & Pinjaman");
              }}
              className="flex items-center gap-4 bg-navy-800/50 hover:bg-navy-800 border border-navy-700/30 rounded-xl p-4 transition-colors cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-xl bg-danger-500/15 flex items-center justify-center">
                <Eye className="w-6 h-6 text-danger-400" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-white">Nominatif</p>
                <p className="text-xs text-navy-400">Preview Nominatif Simpanan & Pinjaman</p>
              </div>
              <ArrowRight className="w-4 h-4 text-navy-400 ml-auto group-hover:text-white transition-colors" />
            </button>
            <button
              onClick={() => {
                openReport("Daftar Anggota Aktif");
              }}
              className="flex items-center gap-4 bg-navy-800/50 hover:bg-navy-800 border border-navy-700/30 rounded-xl p-4 transition-colors cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-xl bg-success-500/15 flex items-center justify-center">
                <FileSpreadsheet className="w-6 h-6 text-success-400" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-white">Anggota Aktif</p>
                <p className="text-xs text-navy-400">Preview Daftar Anggota Aktif</p>
              </div>
              <ArrowRight className="w-4 h-4 text-navy-400 ml-auto group-hover:text-white transition-colors" />
            </button>
            <button
              onClick={() => {
                openReport("Rekapitulasi SHU");
              }}
              className="flex items-center gap-4 bg-navy-800/50 hover:bg-navy-800 border border-navy-700/30 rounded-xl p-4 transition-colors cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-xl bg-accent-500/15 flex items-center justify-center">
                <ClipboardList className="w-6 h-6 text-accent-400" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-white">Rekap SHU</p>
                <p className="text-xs text-navy-400">Preview Rekapitulasi SHU</p>
              </div>
              <ArrowRight className="w-4 h-4 text-navy-400 ml-auto group-hover:text-white transition-colors" />
            </button>
          </div>
        </div>
      )}

      {/* Report Preview Modal */}
      {report && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-start justify-center pt-4 pb-4 overflow-y-auto">
          <div className="bg-navy-900 border border-navy-700/50 rounded-2xl w-full max-w-6xl mx-4 shadow-2xl" ref={printRef}>
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-navy-700/50">
              <div>
                <p className="text-xs text-accent-400 font-medium uppercase tracking-wider">PRIMKOPPOL RESOR SUBANG</p>
                <h3 className="text-lg font-bold text-white">{report.title}</h3>
                <p className="text-sm text-navy-400">{report.subtitle}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportCSV}
                  className="flex items-center gap-2 bg-success-600/20 hover:bg-success-600/30 text-success-400 border border-success-600/30 rounded-xl px-4 py-2 text-sm font-medium transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" /> CSV
                </button>
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 bg-accent-500/20 hover:bg-accent-500/30 text-accent-400 border border-accent-500/30 rounded-xl px-4 py-2 text-sm font-medium transition-colors cursor-pointer"
                >
                  <Printer className="w-4 h-4" /> Cetak
                </button>
                <button
                  onClick={() => setReport(null)}
                  className="p-2 rounded-xl text-navy-400 hover:bg-navy-800 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="px-5 py-3 border-b border-navy-700/50 flex flex-wrap gap-3 items-center bg-navy-800/20">
              <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-navy-400 shrink-0" />
                <input
                  type="text"
                  value={reportSearch}
                  onChange={(e) => setReportSearch(e.target.value)}
                  placeholder="Cari nama, NRP/NIP, no. anggota, pangkat..."
                  className="bg-navy-800 border border-navy-700/50 rounded-xl px-3 py-2 text-sm text-white placeholder-navy-500 outline-none w-full focus:border-accent-500/50"
                />
              </div>
              {reportFilterOptions.length > 0 && (
                <select
                  value={reportFilter}
                  onChange={(e) => setReportFilter(e.target.value)}
                  className="bg-navy-800 border border-navy-700/50 rounded-xl px-3 py-2 text-sm text-white outline-none cursor-pointer"
                >
                  <option value="semua">Semua Satuan</option>
                  {reportFilterOptions.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              )}
              {(reportSearch || reportFilter !== "semua") && (
                <button
                  type="button"
                  onClick={() => { setReportSearch(""); setReportFilter("semua"); }}
                  className="bg-navy-700 hover:bg-navy-600 text-white px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer"
                >
                  Reset
                </button>
              )}
              <p className="text-xs text-navy-400 ml-auto">
                <span className="text-white font-medium">{filteredRows.length}</span> / {report.rows.length} data
              </p>
            </div>

            {/* Table */}
            <div className="overflow-x-auto max-h-[55vh] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0">
                  <tr className="bg-navy-800">
                    {report.headers.map((h, i) => (
                      <th key={i} className="px-4 py-3 text-left text-xs font-semibold text-navy-300 uppercase tracking-wider border-b border-navy-700/50 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row, i) => (
                    <tr key={i} className={`border-b border-navy-800/50 ${row[0] === "" ? "bg-navy-800/30 font-semibold" : "hover:bg-navy-800/30"}`}>
                      {row.map((cell, j) => (
                        <td key={j} className={`px-4 py-2.5 whitespace-nowrap ${row[0] === "" ? "text-accent-300 text-xs font-semibold" : "text-navy-200"}`}>
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {filteredRows.length === 0 && (
                    <tr>
                      <td colSpan={report.headers.length} className="px-4 py-8 text-center text-navy-400 text-sm">
                        {reportSearch || reportFilter !== "semua" ? "Tidak ada data yang cocok dengan filter" : "Tidak ada data untuk laporan ini"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Summary */}
            {filteredSummary && filteredSummary.length > 0 && (
              <div className="p-5 border-t border-navy-700/50 bg-navy-800/30">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {filteredSummary.map((s, i) => (
                    <div key={i} className="bg-navy-900/80 rounded-xl p-3 border border-navy-700/30">
                      <p className="text-xs text-navy-400">{s.label}</p>
                      <p className="text-sm font-bold text-white mt-1">{s.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer info */}
            <div className="px-5 py-3 border-t border-navy-700/50 flex items-center justify-between">
              <p className="text-xs text-navy-400">{filteredRows.length} baris data{reportFilter !== "semua" ? ` (${reportFilter})` : ""}</p>
              <p className="text-xs text-navy-400">
                Periode: {bulanLabel} · Dicetak: {new Date().toLocaleDateString("id-ID")}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
