export interface Anggota {
  id: string;
  nomorAnggota: string;
  nama: string;
  pangkat: string;
  satuan: string;
  nrp: string;
  status: "aktif" | "pasif" | "keluar";
  tier: "platinum" | "gold" | "silver" | "standard" | "risk";
  skor: number;
  simpananPokok: number;
  simpananWajib: number;
  simpananSukarela: number;
  totalPinjaman: number;
  sisaPinjaman: number;
  bergabung: string;
}

export interface TransaksiSimpanan {
  id: string;
  tanggal: string;
  anggotaId: string;
  namaAnggota: string;
  jenis: "setoran" | "pengambilan";
  kategori: "pokok" | "wajib" | "sukarela";
  jumlah: number;
  keterangan: string;
}

export interface Pinjaman {
  id: string;
  anggotaId: string;
  namaAnggota: string;
  jenisPinjaman: string;
  jumlahPinjaman: number;
  sisaPinjaman: number;
  bungaPerBulan: number;
  tenor: number;
  sisaTenor: number;
  angsuranPerBulan: number;
  status: "lancar" | "kurang_lancar" | "macet";
  tanggalPinjam: string;
  jatuhTempo: string;
}

export interface Potongan {
  id: string;
  anggotaId: string;
  namaAnggota: string;
  bulan: string;
  simpananWajib: number;
  angsuranPinjaman: number;
  jasaPinjaman: number;
  totalPotongan: number;
  status: "terkirim" | "proses" | "gagal";
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat("id-ID").format(num);
}

export function getTierColor(tier: string): string {
  switch (tier) {
    case "platinum": return "bg-gradient-to-r from-gray-300 to-gray-100 text-gray-800";
    case "gold": return "bg-gradient-to-r from-yellow-500 to-amber-300 text-amber-900";
    case "silver": return "bg-gradient-to-r from-slate-400 to-slate-300 text-slate-800";
    case "standard": return "bg-navy-600 text-navy-100";
    case "risk": return "bg-gradient-to-r from-red-600 to-red-400 text-white";
    default: return "bg-navy-700 text-navy-200";
  }
}

export function getTierLabel(tier: string): string {
  switch (tier) {
    case "platinum": return "PLATINUM";
    case "gold": return "GOLD";
    case "silver": return "SILVER";
    case "standard": return "STANDARD";
    case "risk": return "RISK";
    default: return tier.toUpperCase();
  }
}

export function getStatusPinjamanColor(status: string): string {
  switch (status) {
    case "lancar": return "text-success-400";
    case "kurang_lancar": return "text-warning-400";
    case "macet": return "text-danger-400";
    default: return "text-navy-200";
  }
}

export function getStatusPinjamanBg(status: string): string {
  switch (status) {
    case "lancar": return "bg-success-600/20 text-success-400 border border-success-600/30";
    case "kurang_lancar": return "bg-warning-600/20 text-warning-400 border border-warning-600/30";
    case "macet": return "bg-danger-600/20 text-danger-400 border border-danger-600/30";
    default: return "bg-navy-700 text-navy-200";
  }
}
