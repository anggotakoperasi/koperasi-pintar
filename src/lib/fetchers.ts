import { supabase } from "./supabase";
import type { Anggota, TransaksiSimpanan, Pinjaman, Potongan } from "@/data/mock";

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
  const { error } = await supabase.from("anggota").update(mapped).eq("id", id);
  if (error) throw error;
}

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

  await supabase.from("anggota").update({
    sisa_pinjaman: Math.max(0, (pinj.sisa_pinjaman || 0) - jumlahPokok),
  }).eq("id", pinj.anggota_id);
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
