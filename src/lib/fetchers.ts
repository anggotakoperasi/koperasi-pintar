import { supabase } from "./supabase";
import type { Anggota, TransaksiSimpanan, Pinjaman, Potongan, COA, JurnalEntry } from "@/data/mock";

function mapAnggota(row: any): Anggota {
  return {
    id: row.id,
    nomorAnggota: row.nomor_anggota,
    nama: row.nama,
    pangkat: row.pangkat,
    satuan: row.satuan,
    nrp: row.nrp,
    status: row.status,
    tier: row.tier,
    skor: row.skor,
    simpananPokok: row.simpanan_pokok,
    simpananWajib: row.simpanan_wajib,
    simpananSukarela: row.simpanan_sukarela,
    totalPinjaman: row.total_pinjaman,
    sisaPinjaman: row.sisa_pinjaman,
    bergabung: row.bergabung,
    noHp: row.no_hp || "",
    email: row.email || "",
  };
}

function mapTransaksi(row: any): TransaksiSimpanan {
  return {
    id: row.id,
    tanggal: row.tanggal,
    anggotaId: row.anggota_id,
    namaAnggota: row.nama_anggota,
    jenis: row.jenis,
    kategori: row.kategori,
    jumlah: row.jumlah,
    keterangan: row.keterangan,
  };
}

function mapPinjaman(row: any): Pinjaman {
  return {
    id: row.id,
    anggotaId: row.anggota_id,
    namaAnggota: row.nama_anggota,
    jenisPinjaman: row.jenis_pinjaman,
    jumlahPinjaman: row.jumlah_pinjaman,
    sisaPinjaman: row.sisa_pinjaman,
    bungaPerBulan: row.bunga_per_bulan,
    tenor: row.tenor,
    sisaTenor: row.sisa_tenor,
    angsuranPerBulan: row.angsuran_per_bulan,
    status: row.status,
    tanggalPinjam: row.tanggal_pinjam,
    jatuhTempo: row.jatuh_tempo,
  };
}

function mapPotongan(row: any): Potongan {
  return {
    id: row.id,
    anggotaId: row.anggota_id,
    namaAnggota: row.nama_anggota,
    bulan: row.bulan,
    simpananWajib: row.simpanan_wajib,
    angsuranPinjaman: row.angsuran_pinjaman,
    jasaPinjaman: row.jasa_pinjaman,
    totalPotongan: row.total_potongan,
    status: row.status,
  };
}

function mapCOA(row: any): COA {
  return {
    kode: row.kode,
    nama: row.nama,
    kelompok: row.kelompok,
    subKelompok: row.sub_kelompok,
    saldoNormal: row.saldo_normal,
    isActive: row.is_active,
  };
}

function mapJurnal(row: any): JurnalEntry {
  return {
    id: row.id,
    tanggal: row.tanggal,
    noBukti: row.no_bukti,
    keterangan: row.keterangan,
    refTabel: row.ref_tabel,
    refId: row.ref_id,
    akunKode: row.akun_kode,
    debit: row.debit || 0,
    kredit: row.kredit || 0,
  };
}

// ===== READ =====

export async function fetchAnggota(): Promise<Anggota[]> {
  const all: any[] = [];
  const PAGE = 1000;
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from("anggota")
      .select("*")
      .order("nomor_anggota")
      .range(from, from + PAGE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return all.map(mapAnggota);
}

async function fetchAll<T>(
  table: string,
  orderCol: string,
  ascending: boolean,
  mapper: (row: any) => T,
): Promise<T[]> {
  const all: any[] = [];
  const PAGE = 1000;
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .order(orderCol, { ascending })
      .range(from, from + PAGE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return all.map(mapper);
}

export function fetchTransaksiSimpanan(): Promise<TransaksiSimpanan[]> {
  return fetchAll("transaksi_simpanan", "tanggal", false, mapTransaksi);
}

export function fetchPinjaman(): Promise<Pinjaman[]> {
  return fetchAll("pinjaman", "tanggal_pinjam", false, mapPinjaman);
}

export function fetchPotongan(): Promise<Potongan[]> {
  return fetchAll("potongan", "bulan", false, mapPotongan);
}

export function fetchCOA(): Promise<COA[]> {
  return fetchAll("coa", "kode", true, mapCOA);
}

export function fetchJurnalEntries(): Promise<JurnalEntry[]> {
  return fetchAll("jurnal_entries", "tanggal", false, mapJurnal);
}

export async function fetchJurnalEntriesWithAkun(): Promise<JurnalEntry[]> {
  const all: any[] = [];
  const PAGE = 1000;
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from("jurnal_entries")
      .select("*, coa(nama)")
      .order("tanggal", { ascending: false })
      .range(from, from + PAGE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return all.map((row) => ({
    ...mapJurnal(row),
    akunNama: row.coa?.nama || row.akun_kode,
  }));
}

export async function searchAnggota(query: string): Promise<Anggota[]> {
  const { data, error } = await supabase
    .from("anggota")
    .select("*")
    .or(`nama.ilike.%${query}%,nrp.ilike.%${query}%,nomor_anggota.ilike.%${query}%`)
    .limit(10);
  if (error) throw error;
  return (data || []).map(mapAnggota);
}

// ===== WRITE: ANGGOTA =====

export async function getMaxNomorAnggota(): Promise<number> {
  const { data, error } = await supabase
    .from("anggota")
    .select("nomor_anggota")
    .order("nomor_anggota", { ascending: false })
    .limit(1);
  if (error) throw error;
  if (!data || data.length === 0) return 0;
  const num = parseInt(String(data[0].nomor_anggota).replace(/\D/g, "") || "0", 10);
  return Number.isNaN(num) ? 0 : num;
}

export async function insertAnggota(anggota: Omit<Anggota, "id">) {
  const id = `NEW${Date.now()}`;
  const { error } = await supabase.from("anggota").insert({
    id,
    nomor_anggota: anggota.nomorAnggota,
    nama: anggota.nama,
    pangkat: anggota.pangkat,
    satuan: anggota.satuan,
    nrp: anggota.nrp,
    status: anggota.status,
    tier: anggota.tier || "standard",
    skor: anggota.skor || 50,
    simpanan_pokok: anggota.simpananPokok || 0,
    simpanan_wajib: anggota.simpananWajib || 0,
    simpanan_sukarela: anggota.simpananSukarela || 0,
    total_pinjaman: anggota.totalPinjaman || 0,
    sisa_pinjaman: anggota.sisaPinjaman || 0,
    bergabung: anggota.bergabung,
    no_hp: anggota.noHp || "",
    email: anggota.email || "",
  });
  if (error) throw error;
  return id;
}

export async function deleteAnggota(id: string) {
  await supabase.from("potongan").delete().eq("anggota_id", id);
  await supabase.from("transaksi_simpanan").delete().eq("anggota_id", id);
  await supabase.from("pinjaman").delete().eq("anggota_id", id);
  const { error } = await supabase.from("anggota").delete().eq("id", id);
  if (error) throw error;
}

export async function updateAnggota(id: string, updates: Partial<Anggota>) {
  const mapped: any = {};
  if (updates.nama !== undefined) mapped.nama = updates.nama;
  if (updates.pangkat !== undefined) mapped.pangkat = updates.pangkat;
  if (updates.satuan !== undefined) mapped.satuan = updates.satuan;
  if (updates.nrp !== undefined) mapped.nrp = updates.nrp;
  if (updates.status !== undefined) mapped.status = updates.status;
  if (updates.tier !== undefined) mapped.tier = updates.tier;
  if (updates.skor !== undefined) mapped.skor = updates.skor;
  if (updates.simpananPokok !== undefined) mapped.simpanan_pokok = updates.simpananPokok;
  if (updates.simpananWajib !== undefined) mapped.simpanan_wajib = updates.simpananWajib;
  if (updates.simpananSukarela !== undefined) mapped.simpanan_sukarela = updates.simpananSukarela;
  if (updates.noHp !== undefined) mapped.no_hp = updates.noHp;
  if (updates.email !== undefined) mapped.email = updates.email;
  const { error } = await supabase.from("anggota").update(mapped).eq("id", id);
  if (error) throw error;
}

// ===== JOURNAL POSTING (DOUBLE-ENTRY) =====

async function postJurnal(
  tanggal: string,
  noBukti: string,
  keterangan: string,
  refTabel: string,
  refId: string,
  lines: { akunKode: string; debit: number; kredit: number }[],
) {
  const entries = lines
    .filter((l) => l.debit > 0 || l.kredit > 0)
    .map((l, i) => ({
      id: `JRN${Date.now()}${i}`,
      tanggal,
      no_bukti: noBukti,
      keterangan,
      ref_tabel: refTabel,
      ref_id: refId,
      akun_kode: l.akunKode,
      debit: l.debit,
      kredit: l.kredit,
    }));
  if (entries.length === 0) return;
  try {
    const { error } = await supabase.from("jurnal_entries").insert(entries);
    if (error) console.warn("[Jurnal] Gagal posting jurnal (tabel mungkin belum ada):", error.message);
  } catch (err) {
    console.warn("[Jurnal] Gagal posting jurnal:", err);
  }
}

const AKUN = {
  KAS: "1100",
  KAS_BENDAHARA: "1110",
  BANK: "1120",
  PIUTANG_PINJAMAN: "1200",
  PIUTANG_JASA: "1210",
  SIMP_POKOK: "2100",
  SIMP_WAJIB: "2110",
  SIMP_SUKARELA: "2120",
  PENDAPATAN_JASA: "4100",
  PENDAPATAN_ADMIN: "4200",
};

// ===== WRITE: TRANSAKSI SIMPANAN =====

export async function insertTransaksiSimpanan(t: Omit<TransaksiSimpanan, "id">) {
  const id = `TS${Date.now()}`;
  const { error } = await supabase.from("transaksi_simpanan").insert({
    id,
    tanggal: t.tanggal,
    anggota_id: t.anggotaId,
    nama_anggota: t.namaAnggota,
    jenis: t.jenis,
    kategori: t.kategori,
    jumlah: t.jumlah,
    keterangan: t.keterangan,
  });
  if (error) throw error;

  const field = t.kategori === "pokok" ? "simpanan_pokok"
    : t.kategori === "wajib" ? "simpanan_wajib" : "simpanan_sukarela";

  const { data: anggota } = await supabase.from("anggota").select("simpanan_pokok, simpanan_wajib, simpanan_sukarela").eq("id", t.anggotaId).single();
  if (anggota) {
    const current = (anggota as any)[field] || 0;
    const newVal = t.jenis === "setoran" ? current + t.jumlah : Math.max(0, current - t.jumlah);
    await supabase.from("anggota").update({ [field]: newVal }).eq("id", t.anggotaId);
  }

  const akunSimpanan = t.kategori === "pokok" ? AKUN.SIMP_POKOK
    : t.kategori === "wajib" ? AKUN.SIMP_WAJIB : AKUN.SIMP_SUKARELA;
  const labelKat = t.kategori === "pokok" ? "Pokok" : t.kategori === "wajib" ? "Wajib" : "Sukarela";

  if (t.jenis === "setoran") {
    await postJurnal(t.tanggal, id, `Setoran Simpanan ${labelKat} - ${t.namaAnggota}`,
      "transaksi_simpanan", id, [
        { akunKode: AKUN.KAS, debit: t.jumlah, kredit: 0 },
        { akunKode: akunSimpanan, debit: 0, kredit: t.jumlah },
      ]);
  } else {
    await postJurnal(t.tanggal, id, `Pengambilan Simpanan ${labelKat} - ${t.namaAnggota}`,
      "transaksi_simpanan", id, [
        { akunKode: akunSimpanan, debit: t.jumlah, kredit: 0 },
        { akunKode: AKUN.KAS, debit: 0, kredit: t.jumlah },
      ]);
  }

  return id;
}

// ===== WRITE: PINJAMAN =====

export async function insertPinjaman(p: Omit<Pinjaman, "id">) {
  const id = `P${Date.now()}`;
  const { error } = await supabase.from("pinjaman").insert({
    id,
    anggota_id: p.anggotaId,
    nama_anggota: p.namaAnggota,
    jenis_pinjaman: p.jenisPinjaman,
    jumlah_pinjaman: p.jumlahPinjaman,
    sisa_pinjaman: p.sisaPinjaman,
    bunga_per_bulan: p.bungaPerBulan,
    tenor: p.tenor,
    sisa_tenor: p.sisaTenor,
    angsuran_per_bulan: p.angsuranPerBulan,
    status: "lancar",
    tanggal_pinjam: p.tanggalPinjam,
    jatuh_tempo: p.jatuhTempo,
  });
  if (error) throw error;

  const { data: anggota } = await supabase
    .from("anggota")
    .select("total_pinjaman, sisa_pinjaman")
    .eq("id", p.anggotaId)
    .single();
  if (anggota) {
    await supabase.from("anggota").update({
      total_pinjaman: (anggota.total_pinjaman || 0) + p.jumlahPinjaman,
      sisa_pinjaman: (anggota.sisa_pinjaman || 0) + p.jumlahPinjaman,
    }).eq("id", p.anggotaId);
  }

  await postJurnal(p.tanggalPinjam, id, `Pencairan Pinjaman ${p.jenisPinjaman} - ${p.namaAnggota}`,
    "pinjaman", id, [
      { akunKode: AKUN.PIUTANG_PINJAMAN, debit: p.jumlahPinjaman, kredit: 0 },
      { akunKode: AKUN.KAS, debit: 0, kredit: p.jumlahPinjaman },
    ]);

  return id;
}

export async function bayarAngsuran(pinjamanId: string, jumlahPokok: number, jumlahJasa: number) {
  const { data: pinj } = await supabase
    .from("pinjaman")
    .select("*")
    .eq("id", pinjamanId)
    .single();
  if (!pinj) throw new Error("Pinjaman tidak ditemukan");

  const sisaBaru = Math.max(0, pinj.sisa_pinjaman - jumlahPokok);
  const tenorBaru = Math.max(0, pinj.sisa_tenor - 1);

  await supabase.from("pinjaman").update({
    sisa_pinjaman: sisaBaru,
    sisa_tenor: tenorBaru,
    status: sisaBaru === 0 ? "lancar" : pinj.status,
  }).eq("id", pinjamanId);

  const { data: anggotaData } = await supabase
    .from("anggota")
    .select("sisa_pinjaman")
    .eq("id", pinj.anggota_id)
    .single();

  await supabase.from("anggota").update({
    sisa_pinjaman: Math.max(0, (anggotaData?.sisa_pinjaman || 0) - jumlahPokok),
  }).eq("id", pinj.anggota_id);

  const today = new Date().toISOString().slice(0, 10);
  const bukti = `ANG${Date.now()}`;
  const totalBayar = jumlahPokok + jumlahJasa;
  const lines: { akunKode: string; debit: number; kredit: number }[] = [
    { akunKode: AKUN.KAS, debit: totalBayar, kredit: 0 },
    { akunKode: AKUN.PIUTANG_PINJAMAN, debit: 0, kredit: jumlahPokok },
  ];
  if (jumlahJasa > 0) {
    lines.push({ akunKode: AKUN.PENDAPATAN_JASA, debit: 0, kredit: jumlahJasa });
  }
  await postJurnal(today, bukti, `Angsuran Pinjaman - ${pinj.nama_anggota}`,
    "pinjaman", pinjamanId, lines);
}

// ===== WRITE: POTONGAN (with journal) =====

export async function insertPotongan(p: Omit<Potongan, "id">) {
  const id = `PT${Date.now()}`;
  const { error } = await supabase.from("potongan").insert({
    id,
    anggota_id: p.anggotaId,
    nama_anggota: p.namaAnggota,
    bulan: p.bulan,
    simpanan_wajib: p.simpananWajib,
    angsuran_pinjaman: p.angsuranPinjaman,
    jasa_pinjaman: p.jasaPinjaman,
    total_potongan: p.totalPotongan,
    status: p.status || "proses",
  });
  if (error) throw error;
  return id;
}

export async function updatePotongan(id: string, updates: Partial<Potongan>) {
  const mapped: any = {};
  if (updates.simpananWajib !== undefined) mapped.simpanan_wajib = updates.simpananWajib;
  if (updates.angsuranPinjaman !== undefined) mapped.angsuran_pinjaman = updates.angsuranPinjaman;
  if (updates.jasaPinjaman !== undefined) mapped.jasa_pinjaman = updates.jasaPinjaman;
  if (updates.totalPotongan !== undefined) mapped.total_potongan = updates.totalPotongan;
  if (updates.status !== undefined) mapped.status = updates.status;
  const { error } = await supabase.from("potongan").update(mapped).eq("id", id);
  if (error) throw error;
}

export async function deletePotongan(id: string) {
  const { error } = await supabase.from("potongan").delete().eq("id", id);
  if (error) throw error;
}

export async function postPotonganJurnal(p: Potongan) {
  const today = new Date().toISOString().slice(0, 10);
  const lines: { akunKode: string; debit: number; kredit: number }[] = [
    { akunKode: AKUN.KAS_BENDAHARA, debit: p.totalPotongan, kredit: 0 },
  ];
  if (p.simpananWajib > 0) {
    lines.push({ akunKode: AKUN.SIMP_WAJIB, debit: 0, kredit: p.simpananWajib });
  }
  if (p.angsuranPinjaman > 0) {
    lines.push({ akunKode: AKUN.PIUTANG_PINJAMAN, debit: 0, kredit: p.angsuranPinjaman });
  }
  if (p.jasaPinjaman > 0) {
    lines.push({ akunKode: AKUN.PENDAPATAN_JASA, debit: 0, kredit: p.jasaPinjaman });
  }
  await postJurnal(today, p.id, `Potongan Gaji ${p.bulan} - ${p.namaAnggota}`,
    "potongan", p.id, lines);
}

// ===== EXPORT CSV =====

export function exportCSV(headers: string[], rows: string[][], filename: string) {
  const csvContent = [
    headers.join(","),
    ...rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
  ].join("\n");

  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
