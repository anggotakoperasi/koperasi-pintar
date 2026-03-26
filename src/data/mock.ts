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

export const anggotaList: Anggota[] = [
  { id: "A001", nomorAnggota: "001", nama: "BRIPKA AHMAD SURYANA", pangkat: "BRIPKA", satuan: "SATRESKRIM", nrp: "78120345", status: "aktif", tier: "platinum", skor: 95, simpananPokok: 500000, simpananWajib: 12000000, simpananSukarela: 8500000, totalPinjaman: 25000000, sisaPinjaman: 5000000, bergabung: "2018-03-15" },
  { id: "A002", nomorAnggota: "002", nama: "BRIGADIR DEDI KUSNADI", pangkat: "BRIGADIR", satuan: "SATLANTAS", nrp: "82040198", status: "aktif", tier: "gold", skor: 87, simpananPokok: 500000, simpananWajib: 10500000, simpananSukarela: 3200000, totalPinjaman: 20000000, sisaPinjaman: 8500000, bergabung: "2019-07-22" },
  { id: "A003", nomorAnggota: "003", nama: "AIPTU HENDRA WIJAYA", pangkat: "AIPTU", satuan: "SABHARA", nrp: "75080567", status: "aktif", tier: "gold", skor: 82, simpananPokok: 500000, simpananWajib: 15000000, simpananSukarela: 5000000, totalPinjaman: 30000000, sisaPinjaman: 12000000, bergabung: "2017-01-10" },
  { id: "A004", nomorAnggota: "004", nama: "BRIPTU SITI NURHALIZA", pangkat: "BRIPTU", satuan: "SATINTELKAM", nrp: "85060234", status: "aktif", tier: "silver", skor: 74, simpananPokok: 500000, simpananWajib: 8000000, simpananSukarela: 1500000, totalPinjaman: 15000000, sisaPinjaman: 9000000, bergabung: "2020-05-18" },
  { id: "A005", nomorAnggota: "005", nama: "IPDA RIZKY PRATAMA", pangkat: "IPDA", satuan: "SPK", nrp: "80030456", status: "aktif", tier: "platinum", skor: 92, simpananPokok: 500000, simpananWajib: 18000000, simpananSukarela: 12000000, totalPinjaman: 35000000, sisaPinjaman: 3000000, bergabung: "2016-11-05" },
  { id: "A006", nomorAnggota: "006", nama: "BRIPKA RINA AGUSTINA", pangkat: "BRIPKA", satuan: "SATBINMAS", nrp: "79050678", status: "aktif", tier: "silver", skor: 71, simpananPokok: 500000, simpananWajib: 9500000, simpananSukarela: 2000000, totalPinjaman: 18000000, sisaPinjaman: 10500000, bergabung: "2019-02-28" },
  { id: "A007", nomorAnggota: "007", nama: "AIPDA BAMBANG IRAWAN", pangkat: "AIPDA", satuan: "SATRESKOBA", nrp: "77090123", status: "aktif", tier: "standard", skor: 58, simpananPokok: 500000, simpananWajib: 6000000, simpananSukarela: 500000, totalPinjaman: 20000000, sisaPinjaman: 15000000, bergabung: "2020-09-12" },
  { id: "A008", nomorAnggota: "008", nama: "BRIGADIR YUSUF MAULANA", pangkat: "BRIGADIR", satuan: "SATLANTAS", nrp: "84070890", status: "aktif", tier: "risk", skor: 35, simpananPokok: 500000, simpananWajib: 4500000, simpananSukarela: 0, totalPinjaman: 25000000, sisaPinjaman: 22000000, bergabung: "2021-04-07" },
  { id: "A009", nomorAnggota: "009", nama: "IPTU FARHAN HIDAYAT", pangkat: "IPTU", satuan: "SATRESKRIM", nrp: "74020345", status: "aktif", tier: "gold", skor: 85, simpananPokok: 500000, simpananWajib: 20000000, simpananSukarela: 7500000, totalPinjaman: 40000000, sisaPinjaman: 10000000, bergabung: "2015-08-20" },
  { id: "A010", nomorAnggota: "010", nama: "BRIPTU WULAN DARI", pangkat: "BRIPTU", satuan: "SIUM", nrp: "86010567", status: "aktif", tier: "standard", skor: 62, simpananPokok: 500000, simpananWajib: 5500000, simpananSukarela: 800000, totalPinjaman: 12000000, sisaPinjaman: 7500000, bergabung: "2022-01-15" },
  { id: "A011", nomorAnggota: "011", nama: "AIPTU JOKO WIDODO", pangkat: "AIPTU", satuan: "SABHARA", nrp: "76040789", status: "aktif", tier: "silver", skor: 76, simpananPokok: 500000, simpananWajib: 14000000, simpananSukarela: 4000000, totalPinjaman: 28000000, sisaPinjaman: 14000000, bergabung: "2017-06-30" },
  { id: "A012", nomorAnggota: "012", nama: "BRIPKA ENDANG SURYANI", pangkat: "BRIPKA", satuan: "SATINTELKAM", nrp: "80080234", status: "pasif", tier: "standard", skor: 45, simpananPokok: 500000, simpananWajib: 7000000, simpananSukarela: 0, totalPinjaman: 10000000, sisaPinjaman: 6000000, bergabung: "2019-11-25" },
];

export const transaksiSimpananList: TransaksiSimpanan[] = [
  { id: "TS001", tanggal: "2026-03-01", anggotaId: "A001", namaAnggota: "BRIPKA AHMAD SURYANA", jenis: "setoran", kategori: "wajib", jumlah: 500000, keterangan: "Simpanan wajib Maret 2026" },
  { id: "TS002", tanggal: "2026-03-01", anggotaId: "A002", namaAnggota: "BRIGADIR DEDI KUSNADI", jenis: "setoran", kategori: "wajib", jumlah: 500000, keterangan: "Simpanan wajib Maret 2026" },
  { id: "TS003", tanggal: "2026-03-02", anggotaId: "A001", namaAnggota: "BRIPKA AHMAD SURYANA", jenis: "setoran", kategori: "sukarela", jumlah: 2000000, keterangan: "Simpanan sukarela" },
  { id: "TS004", tanggal: "2026-03-03", anggotaId: "A004", namaAnggota: "BRIPTU SITI NURHALIZA", jenis: "pengambilan", kategori: "sukarela", jumlah: 500000, keterangan: "Pengambilan simpanan sukarela" },
  { id: "TS005", tanggal: "2026-03-05", anggotaId: "A005", namaAnggota: "IPDA RIZKY PRATAMA", jenis: "setoran", kategori: "sukarela", jumlah: 3000000, keterangan: "Simpanan sukarela" },
  { id: "TS006", tanggal: "2026-03-07", anggotaId: "A003", namaAnggota: "AIPTU HENDRA WIJAYA", jenis: "setoran", kategori: "wajib", jumlah: 500000, keterangan: "Simpanan wajib Maret 2026" },
  { id: "TS007", tanggal: "2026-03-10", anggotaId: "A009", namaAnggota: "IPTU FARHAN HIDAYAT", jenis: "setoran", kategori: "sukarela", jumlah: 1500000, keterangan: "Simpanan sukarela" },
  { id: "TS008", tanggal: "2026-03-12", anggotaId: "A006", namaAnggota: "BRIPKA RINA AGUSTINA", jenis: "setoran", kategori: "wajib", jumlah: 500000, keterangan: "Simpanan wajib Maret 2026" },
];

export const pinjamanList: Pinjaman[] = [
  { id: "P001", anggotaId: "A001", namaAnggota: "BRIPKA AHMAD SURYANA", jenisPinjaman: "Reguler", jumlahPinjaman: 25000000, sisaPinjaman: 5000000, bungaPerBulan: 1.0, tenor: 24, sisaTenor: 4, angsuranPerBulan: 1145833, status: "lancar", tanggalPinjam: "2024-04-15", jatuhTempo: "2026-04-15" },
  { id: "P002", anggotaId: "A002", namaAnggota: "BRIGADIR DEDI KUSNADI", jenisPinjaman: "Reguler", jumlahPinjaman: 20000000, sisaPinjaman: 8500000, bungaPerBulan: 1.0, tenor: 24, sisaTenor: 10, angsuranPerBulan: 916667, status: "lancar", tanggalPinjam: "2024-06-20", jatuhTempo: "2026-06-20" },
  { id: "P003", anggotaId: "A003", namaAnggota: "AIPTU HENDRA WIJAYA", jenisPinjaman: "Menengah", jumlahPinjaman: 30000000, sisaPinjaman: 12000000, bungaPerBulan: 1.0, tenor: 36, sisaTenor: 14, angsuranPerBulan: 1083333, status: "lancar", tanggalPinjam: "2024-01-10", jatuhTempo: "2027-01-10" },
  { id: "P004", anggotaId: "A004", namaAnggota: "BRIPTU SITI NURHALIZA", jenisPinjaman: "Reguler", jumlahPinjaman: 15000000, sisaPinjaman: 9000000, bungaPerBulan: 1.2, tenor: 18, sisaTenor: 10, angsuranPerBulan: 1013333, status: "kurang_lancar", tanggalPinjam: "2025-05-18", jatuhTempo: "2026-11-18" },
  { id: "P005", anggotaId: "A005", namaAnggota: "IPDA RIZKY PRATAMA", jenisPinjaman: "Besar", jumlahPinjaman: 35000000, sisaPinjaman: 3000000, bungaPerBulan: 0.8, tenor: 36, sisaTenor: 2, angsuranPerBulan: 1208333, status: "lancar", tanggalPinjam: "2023-05-05", jatuhTempo: "2026-05-05" },
  { id: "P006", anggotaId: "A006", namaAnggota: "BRIPKA RINA AGUSTINA", jenisPinjaman: "Reguler", jumlahPinjaman: 18000000, sisaPinjaman: 10500000, bungaPerBulan: 1.0, tenor: 24, sisaTenor: 14, angsuranPerBulan: 825000, status: "lancar", tanggalPinjam: "2025-02-28", jatuhTempo: "2027-02-28" },
  { id: "P007", anggotaId: "A007", namaAnggota: "AIPDA BAMBANG IRAWAN", jenisPinjaman: "Reguler", jumlahPinjaman: 20000000, sisaPinjaman: 15000000, bungaPerBulan: 1.2, tenor: 24, sisaTenor: 18, angsuranPerBulan: 1033333, status: "kurang_lancar", tanggalPinjam: "2025-09-12", jatuhTempo: "2027-09-12" },
  { id: "P008", anggotaId: "A008", namaAnggota: "BRIGADIR YUSUF MAULANA", jenisPinjaman: "Menengah", jumlahPinjaman: 25000000, sisaPinjaman: 22000000, bungaPerBulan: 1.5, tenor: 24, sisaTenor: 21, angsuranPerBulan: 1354167, status: "macet", tanggalPinjam: "2025-07-07", jatuhTempo: "2027-07-07" },
  { id: "P009", anggotaId: "A009", namaAnggota: "IPTU FARHAN HIDAYAT", jenisPinjaman: "Besar", jumlahPinjaman: 40000000, sisaPinjaman: 10000000, bungaPerBulan: 0.8, tenor: 36, sisaTenor: 8, angsuranPerBulan: 1377778, status: "lancar", tanggalPinjam: "2023-08-20", jatuhTempo: "2026-08-20" },
  { id: "P010", anggotaId: "A010", namaAnggota: "BRIPTU WULAN DARI", jenisPinjaman: "Reguler", jumlahPinjaman: 12000000, sisaPinjaman: 7500000, bungaPerBulan: 1.0, tenor: 18, sisaTenor: 11, angsuranPerBulan: 786667, status: "lancar", tanggalPinjam: "2025-06-15", jatuhTempo: "2026-12-15" },
];

export const potonganList: Potongan[] = [
  { id: "PT001", anggotaId: "A001", namaAnggota: "BRIPKA AHMAD SURYANA", bulan: "Maret 2026", simpananWajib: 500000, angsuranPinjaman: 1041667, jasaPinjaman: 104167, totalPotongan: 1645834, status: "terkirim" },
  { id: "PT002", anggotaId: "A002", namaAnggota: "BRIGADIR DEDI KUSNADI", bulan: "Maret 2026", simpananWajib: 500000, angsuranPinjaman: 833333, jasaPinjaman: 83333, totalPotongan: 1416666, status: "terkirim" },
  { id: "PT003", anggotaId: "A003", namaAnggota: "AIPTU HENDRA WIJAYA", bulan: "Maret 2026", simpananWajib: 500000, angsuranPinjaman: 833333, jasaPinjaman: 250000, totalPotongan: 1583333, status: "terkirim" },
  { id: "PT004", anggotaId: "A004", namaAnggota: "BRIPTU SITI NURHALIZA", bulan: "Maret 2026", simpananWajib: 500000, angsuranPinjaman: 833333, jasaPinjaman: 150000, totalPotongan: 1483333, status: "proses" },
  { id: "PT005", anggotaId: "A005", namaAnggota: "IPDA RIZKY PRATAMA", bulan: "Maret 2026", simpananWajib: 500000, angsuranPinjaman: 972222, jasaPinjaman: 236111, totalPotongan: 1708333, status: "terkirim" },
  { id: "PT006", anggotaId: "A006", namaAnggota: "BRIPKA RINA AGUSTINA", bulan: "Maret 2026", simpananWajib: 500000, angsuranPinjaman: 750000, jasaPinjaman: 75000, totalPotongan: 1325000, status: "terkirim" },
  { id: "PT007", anggotaId: "A007", namaAnggota: "AIPDA BAMBANG IRAWAN", bulan: "Maret 2026", simpananWajib: 500000, angsuranPinjaman: 833333, jasaPinjaman: 200000, totalPotongan: 1533333, status: "proses" },
  { id: "PT008", anggotaId: "A008", namaAnggota: "BRIGADIR YUSUF MAULANA", bulan: "Maret 2026", simpananWajib: 500000, angsuranPinjaman: 1041667, jasaPinjaman: 312500, totalPotongan: 1854167, status: "gagal" },
];

export const arusKasBulanan = [
  { bulan: "Jan", masuk: 185000000, keluar: 142000000 },
  { bulan: "Feb", masuk: 192000000, keluar: 155000000 },
  { bulan: "Mar", masuk: 205000000, keluar: 148000000 },
  { bulan: "Apr", masuk: 178000000, keluar: 160000000 },
  { bulan: "Mei", masuk: 210000000, keluar: 165000000 },
  { bulan: "Jun", masuk: 195000000, keluar: 170000000 },
  { bulan: "Jul", masuk: 220000000, keluar: 158000000 },
  { bulan: "Agu", masuk: 198000000, keluar: 162000000 },
  { bulan: "Sep", masuk: 215000000, keluar: 172000000 },
  { bulan: "Okt", masuk: 225000000, keluar: 180000000 },
  { bulan: "Nov", masuk: 235000000, keluar: 175000000 },
  { bulan: "Des", masuk: 250000000, keluar: 190000000 },
];

export const komposisiSimpanan = [
  { name: "Simpanan Pokok", value: 6000000, color: "#3b82f6" },
  { name: "Simpanan Wajib", value: 130000000, color: "#22c55e" },
  { name: "Simpanan Sukarela", value: 45000000, color: "#f59e0b" },
];

export const trendAnggota = [
  { tahun: "2022", jumlah: 180 },
  { tahun: "2023", jumlah: 210 },
  { tahun: "2024", jumlah: 245 },
  { tahun: "2025", jumlah: 278 },
  { tahun: "2026", jumlah: 312 },
];

export const shuData = {
  totalSHU: 485000000,
  shuTahunLalu: 420000000,
  pertumbuhan: 15.5,
  distribusi: [
    { kategori: "Jasa Simpanan", persentase: 40, jumlah: 194000000 },
    { kategori: "Jasa Pinjaman", persentase: 30, jumlah: 145500000 },
    { kategori: "Dana Cadangan", persentase: 15, jumlah: 72750000 },
    { kategori: "Dana Pengurus", persentase: 10, jumlah: 48500000 },
    { kategori: "Dana Sosial", persentase: 5, jumlah: 24250000 },
  ],
};

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
