const { DBFFile } = require('dbffile');
const { createClient } = require('@supabase/supabase-js');

const DB_PATH = 'D:/BUSINESS/2026/KOPERASI/Program Koperasi/Koperasi Old/mysql/data/DB';
const supabase = createClient(
  'https://oxjqrquesenwqepuoqtb.supabase.co',
  'sb_publishable_4lSAEqlYOSze3-OfBBZEHA_KjSK-G4M'
);

async function readDBF(filename) {
  const dbf = await DBFFile.open(`${DB_PATH}/${filename}`);
  return dbf.readRecords();
}

function trim(val) {
  return val ? String(val).trim() : '';
}

function toDateStr(val) {
  if (!val) return null;
  const d = new Date(val);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().split('T')[0];
}

async function batchUpsert(table, rows, batchSize = 200) {
  let inserted = 0;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error } = await supabase.from(table).upsert(batch, { onConflict: 'id' });
    if (error) {
      console.error(`  Error batch ${i}-${i + batch.length} on ${table}:`, error.message);
    } else {
      inserted += batch.length;
    }
  }
  console.log(`  ✓ ${table}: ${inserted}/${rows.length} rows inserted`);
  return inserted;
}

async function main() {
  console.log('========================================');
  console.log('MIGRASI DATA KOPERASI PINTAR');
  console.log('========================================\n');

  // 1. Read reference tables
  console.log('[1/7] Membaca tabel referensi...');
  const grang1Raw = await readDBF('GRANG1.DBF');
  const grang2Raw = await readDBF('GRANG2.DBF');

  const satuanMap = {};
  grang1Raw.forEach(r => { satuanMap[trim(r.NO_KODE)] = trim(r.NAMA); });

  const pangkatMap = {};
  grang2Raw.forEach(r => { pangkatMap[trim(r.NO_KODE)] = trim(r.NAMA); });

  console.log(`  ✓ ${Object.keys(satuanMap).length} satuan, ${Object.keys(pangkatMap).length} pangkat\n`);

  // 2. Read all source data
  console.log('[2/7] Membaca data dari DBF files...');
  const anggotaRaw = await readDBF('ANGGOTA.DBF');
  const simpananRaw = await readDBF('SIMPANAN.DBF');
  const pinjamanRaw = await readDBF('PINJAMAN.DBF');
  const sptransRaw = await readDBF('SPTRANS.DBF');
  console.log(`  ✓ Anggota: ${anggotaRaw.length}`);
  console.log(`  ✓ Simpanan: ${simpananRaw.length}`);
  console.log(`  ✓ Pinjaman: ${pinjamanRaw.length}`);
  console.log(`  ✓ SP Trans: ${sptransRaw.length}\n`);

  // 3. Build simpanan lookup (NO_ANG -> {pokok, wajib, sukarela})
  console.log('[3/7] Mengolah data simpanan per anggota...');
  const simpananLookup = {};
  simpananRaw.forEach(r => {
    const noAng = trim(r.NO_ANG);
    if (!noAng) return;
    if (!simpananLookup[noAng]) simpananLookup[noAng] = { pokok: 0, wajib: 0, sukarela: 0 };
    const kode = trim(r.KODE_SIMP);
    const saldo = r.SALDOSIMP || 0;
    if (kode === 'Po') simpananLookup[noAng].pokok += saldo;
    else if (kode === 'Wa') simpananLookup[noAng].wajib += saldo;
    else if (kode === 'Ss') simpananLookup[noAng].sukarela += saldo;
  });
  console.log(`  ✓ ${Object.keys(simpananLookup).length} anggota memiliki simpanan\n`);

  // 4. Build pinjaman lookup (NO_ANG -> {total, sisa})
  console.log('[4/7] Mengolah data pinjaman per anggota...');
  const pinjamanLookup = {};
  pinjamanRaw.forEach(r => {
    const noAng = trim(r.NO_ANG);
    if (!noAng) return;
    if (!pinjamanLookup[noAng]) pinjamanLookup[noAng] = { total: 0, sisa: 0 };
    pinjamanLookup[noAng].total += (r.JML_PINJAM || 0);
    pinjamanLookup[noAng].sisa += (r.SALDOPINJ || 0);
  });
  console.log(`  ✓ ${Object.keys(pinjamanLookup).length} anggota memiliki pinjaman\n`);

  // 5. Build anggota rows
  console.log('[5/7] Menyiapkan data anggota...');
  const anggotaRows = [];
  const seenIds = new Set();

  anggotaRaw.forEach((r, idx) => {
    const noAng = trim(r.NO_ANG);
    const nip = trim(r.NIP);
    if (!noAng || seenIds.has(noAng)) return;
    seenIds.add(noAng);

    const nama = trim(r.NAMA_ANG);
    if (!nama) return;

    const g1 = trim(r.GROUP1);
    const g2 = trim(r.GROUP2);
    const satuan = satuanMap[g1] || 'POLRES';
    const pangkat = pangkatMap[g2] || '-';

    const simp = simpananLookup[noAng] || { pokok: 0, wajib: 0, sukarela: 0 };
    const pinj = pinjamanLookup[noAng] || { total: 0, sisa: 0 };

    const totalSimpanan = simp.pokok + simp.wajib + simp.sukarela;
    const isKeluar = g1 === '038';

    let tier = 'standard';
    if (isKeluar) tier = 'risk';
    else if (totalSimpanan >= 5000000) tier = 'platinum';
    else if (totalSimpanan >= 2000000) tier = 'gold';
    else if (totalSimpanan >= 1000000) tier = 'silver';

    let skor = 50;
    if (isKeluar) skor = 0;
    else {
      skor = Math.min(100, Math.round(
        (totalSimpanan > 0 ? 30 : 0) +
        (simp.wajib > 500000 ? 20 : (simp.wajib > 0 ? 10 : 0)) +
        (pinj.sisa === 0 ? 30 : (pinj.sisa < pinj.total * 0.5 ? 20 : 10)) +
        (simp.sukarela > 0 ? 20 : 0)
      ));
    }

    const bergabung = toDateStr(r.TGL_MASUK) || '2020-01-01';

    const nomorAnggota = String(idx + 1).padStart(4, '0');

    anggotaRows.push({
      id: noAng,
      nomor_anggota: nomorAnggota,
      nama,
      pangkat,
      satuan,
      nrp: nip || noAng,
      status: isKeluar ? 'keluar' : 'aktif',
      tier,
      skor,
      simpanan_pokok: Math.round(simp.pokok),
      simpanan_wajib: Math.round(simp.wajib),
      simpanan_sukarela: Math.round(simp.sukarela),
      total_pinjaman: Math.round(pinj.total),
      sisa_pinjaman: Math.round(pinj.sisa),
      bergabung,
    });
  });

  console.log(`  ✓ ${anggotaRows.length} anggota siap di-import\n`);

  // 6. Build pinjaman detail rows (active loans only, saldo > 0)
  const pinjamanRows = [];
  const pinjamanIds = new Set();
  pinjamanRaw.forEach((r, idx) => {
    const noAng = trim(r.NO_ANG);
    if (!noAng || !seenIds.has(noAng)) return;
    if ((r.SALDOPINJ || 0) <= 0) return;

    const id = `P${String(idx + 1).padStart(5, '0')}`;
    if (pinjamanIds.has(id)) return;
    pinjamanIds.add(id);

    const kodePinj = trim(r.KODE_PINJ);
    const jenisPinjaman =
      kodePinj === 'SP' ? 'Simpan Pinjam' :
      kodePinj === 'KS' ? 'Kredit Serba Guna' :
      kodePinj === 'SD' ? 'Saldo Dagang' :
      kodePinj === 'BM' ? 'Bank Mandiri' :
      kodePinj || 'Lainnya';

    const tglPinjam = toDateStr(r.TGL_MULAI) || '2024-01-01';
    const tglJatuhTempo = toDateStr(r.TGL_JT) || '2026-12-31';
    const tenor = r.JKW || 12;
    const sisaTenor = Math.max(0, r.JKW ? Math.round(r.JKW * (r.SALDOPINJ || 0) / Math.max(r.JML_PINJAM || 1, 1)) : 0);
    const bungaPct = (r.SUKU_BNG || 0) > 0 ? (r.SUKU_BNG / 12) : 1.0;

    let statusPinj = 'lancar';
    if (r.SALDOPINJ > r.JML_PINJAM * 0.9 && r.ANGSUR_KE > 3) statusPinj = 'macet';
    else if (r.SALDOPINJ > r.JML_PINJAM * 0.7 && r.ANGSUR_KE > 2) statusPinj = 'kurang_lancar';

    const namaAnggota = anggotaRows.find(a => a.id === noAng)?.nama || '';

    pinjamanRows.push({
      id,
      anggota_id: noAng,
      nama_anggota: namaAnggota,
      jenis_pinjaman: jenisPinjaman,
      jumlah_pinjaman: Math.round(r.JML_PINJAM || 0),
      sisa_pinjaman: Math.round(r.SALDOPINJ || 0),
      bunga_per_bulan: bungaPct,
      tenor,
      sisa_tenor: sisaTenor,
      angsuran_per_bulan: Math.round(r.CICILPOKOK || 0) + Math.round(r.CICILJASA || 0),
      status: statusPinj,
      tanggal_pinjam: tglPinjam,
      jatuh_tempo: tglJatuhTempo,
    });
  });
  console.log(`  ✓ ${pinjamanRows.length} pinjaman aktif siap di-import`);

  // 7. Build transaksi simpanan rows from SPTRANS
  const transaksiRows = [];
  sptransRaw.forEach((r, idx) => {
    const noAng = trim(r.NO_ANG);
    if (!noAng || !seenIds.has(noAng)) return;
    if (trim(r.SP) !== 'S') return;

    const id = `TS${String(idx + 1).padStart(5, '0')}`;
    const tgl = toDateStr(r.TGL_TRANS) || '2025-01-01';
    const kode = trim(r.KODE_SP);
    const kategori = kode === 'Wa' ? 'wajib' : kode === 'Po' ? 'pokok' : 'sukarela';
    const dk = trim(r.DK);
    const jenis = dk === 'D' ? 'pengambilan' : 'setoran';
    const namaAnggota = anggotaRows.find(a => a.id === noAng)?.nama || '';

    transaksiRows.push({
      id,
      tanggal: tgl,
      anggota_id: noAng,
      nama_anggota: namaAnggota,
      jenis,
      kategori,
      jumlah: Math.round(r.JML_POKOK || 0),
      keterangan: trim(r.DESKRIPSI) || `${jenis} ${kategori}`,
    });
  });
  console.log(`  ✓ ${transaksiRows.length} transaksi simpanan siap di-import`);

  // 8. Build potongan rows from SPTRANS (pinjaman transactions as potongan)
  const potonganMap = {};
  sptransRaw.forEach(r => {
    const noAng = trim(r.NO_ANG);
    if (!noAng || !seenIds.has(noAng)) return;

    const tgl = toDateStr(r.TGL_TRANS);
    if (!tgl) return;
    const bulanKey = tgl.substring(0, 7);
    const mapKey = `${noAng}_${bulanKey}`;

    if (!potonganMap[mapKey]) {
      const namaAnggota = anggotaRows.find(a => a.id === noAng)?.nama || '';
      const [y, m] = bulanKey.split('-');
      const bulanNames = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
      potonganMap[mapKey] = {
        anggota_id: noAng,
        nama_anggota: namaAnggota,
        bulan: `${bulanNames[parseInt(m)]} ${y}`,
        simpanan_wajib: 0,
        angsuran_pinjaman: 0,
        jasa_pinjaman: 0,
        total_potongan: 0,
        status: 'terkirim',
      };
    }

    const sp = trim(r.SP);
    const kode = trim(r.KODE_SP);
    if (sp === 'S' && kode === 'Wa') {
      potonganMap[mapKey].simpanan_wajib += (r.JML_POKOK || 0);
    } else if (sp === 'P') {
      potonganMap[mapKey].angsuran_pinjaman += (r.JML_POKOK || 0);
      potonganMap[mapKey].jasa_pinjaman += (r.JML_BNG || 0);
    }
  });

  const potonganRows = Object.entries(potonganMap).map(([key, val], idx) => ({
    id: `PT${String(idx + 1).padStart(5, '0')}`,
    ...val,
    simpanan_wajib: Math.round(val.simpanan_wajib),
    angsuran_pinjaman: Math.round(val.angsuran_pinjaman),
    jasa_pinjaman: Math.round(val.jasa_pinjaman),
    total_potongan: Math.round(val.simpanan_wajib + val.angsuran_pinjaman + val.jasa_pinjaman),
  }));
  console.log(`  ✓ ${potonganRows.length} potongan siap di-import\n`);

  // 9. Clear demo data
  console.log('[6/7] Menghapus data demo...');
  await supabase.from('potongan').delete().neq('id', '');
  await supabase.from('transaksi_simpanan').delete().neq('id', '');
  await supabase.from('pinjaman').delete().neq('id', '');
  await supabase.from('anggota').delete().neq('id', '');
  console.log('  ✓ Data demo dihapus\n');

  // 10. Insert real data
  console.log('[7/7] Memasukkan data asli ke Supabase...');
  await batchUpsert('anggota', anggotaRows);
  await batchUpsert('pinjaman', pinjamanRows);
  await batchUpsert('transaksi_simpanan', transaksiRows);
  await batchUpsert('potongan', potonganRows);

  console.log('\n========================================');
  console.log('MIGRASI SELESAI!');
  console.log('========================================');
  console.log(`Anggota   : ${anggotaRows.length}`);
  console.log(`Pinjaman  : ${pinjamanRows.length}`);
  console.log(`Transaksi : ${transaksiRows.length}`);
  console.log(`Potongan  : ${potonganRows.length}`);
}

main().catch(console.error);
