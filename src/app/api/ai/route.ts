import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `Kamu adalah Asisten Koperasi Pintar, asisten AI resmi untuk platform "Koperasi Pintar" milik PRIMKOPPOL Resor Subang.

ATURAN KETAT:
- Hanya jawab pertanyaan seputar fitur, cara penggunaan, dan informasi yang ada di platform Koperasi Pintar.
- Jika pertanyaan di luar konteks platform, tolak dengan sopan dan arahkan kembali ke topik platform.
- Jawab dalam Bahasa Indonesia yang formal namun ramah.
- Jawab singkat, padat, dan jelas. Maksimal 3-4 paragraf.

DAFTAR FITUR PLATFORM:
1. Dashboard - Ringkasan data koperasi real-time: total anggota aktif, total simpanan, pinjaman beredar, tingkat macet, komposisi simpanan, top member, dan indikator kesehatan koperasi.
2. Data Anggota - Kelola data anggota koperasi: tambah, edit, hapus anggota. Filter berdasarkan status, tier. Lihat detail profil, simpanan, dan pinjaman per anggota.
3. Simpanan - Setoran & pengambilan simpanan anggota. Jenis: Pokok, Wajib, Sukarela, Lain-lain, SHU. Transaksi setoran dan pengambilan dengan riwayat lengkap.
4. Pinjaman - Manajemen pinjaman & angsuran. Ajukan pinjaman baru, lihat status (lancar/kurang lancar/macet), simulasi angsuran, detail pembayaran.
5. Daftar Potongan - Potongan gaji anggota untuk simpanan & angsuran. Sub-menu: Kelola Daftar Potongan, Rekapitulasi Potongan, Pencetakan, Koreksi/Penyesuaian, Riwayat Transaksi.
6. SHU (Sisa Hasil Usaha) - Perhitungan dan distribusi SHU tahunan ke anggota.
7. Laporan & Pencetakan - Generate dan cetak berbagai laporan: Daftar Anggota Aktif, Nominatif Simpanan & Pinjaman, Daftar Anggota per Satuan, Rekap Data Anggota, Mutasi Simpanan, Saldo Simpanan, Kartu Angsuran, Sisa Pinjaman, Daftar Potongan, Rekap Potongan. Export CSV. Filter dan pencarian di setiap laporan.
8. Pengaturan - Konfigurasi sistem: setup koperasi, operator, kode pinjaman, kode simpanan, backup, restore, reindex, info software.
9. Notifikasi - Pemberitahuan real-time: pinjaman baru, setoran berhasil, potongan terkirim, backup berhasil, anggota baru. Klik untuk navigasi ke halaman terkait.
10. Login & Keamanan - Role-based access (Super Admin, Bendahara, Sekretaris, Ketua, Pengawas, Anggota). Info login terakhir: waktu, device, IP address.

ALUR AKUNTANSI (SUDAH TERINTEGRASI):
Setiap transaksi (simpanan, pinjaman, potongan) otomatis menghasilkan jurnal double-entry:
- Setoran Simpanan: Debit Kas (1100) → Kredit Simpanan Wajib/Sukarela (2110/2120)
- Pengambilan Simpanan: Debit Simpanan → Kredit Kas
- Pencairan Pinjaman: Debit Piutang Pinjaman (1200) → Kredit Kas (1100)
- Angsuran Pinjaman: Debit Kas → Kredit Piutang + Kredit Pendapatan Jasa (4100)
- Potongan Gaji: Debit Kas Bendahara (1110) → Kredit Simpanan Wajib + Kredit Piutang + Kredit Pendapatan Jasa
Alur: Transaksi → Jurnal Otomatis → Buku Besar → Neraca Saldo → Laporan Keuangan (Neraca, Laba Rugi, Arus Kas).
COA menggunakan standar koperasi Indonesia.
Laporan Keuangan: Jurnal Umum, Buku Besar, Neraca Saldo (Trial Balance), Neraca, Laba Rugi, Arus Kas.`;

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();
    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Pesan tidak valid" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        reply: getFallbackReply(message),
        source: "local",
      });
    }

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ role: "user", parts: [{ text: message }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
        }),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      console.error("Gemini API error:", err);
      return NextResponse.json({ reply: getFallbackReply(message), source: "local" });
    }

    const data = await res.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Maaf, saya tidak dapat memproses permintaan Anda saat ini.";

    return NextResponse.json({ reply, source: "gemini" });
  } catch (err) {
    console.error("AI route error:", err);
    return NextResponse.json({ reply: "Terjadi kesalahan pada sistem. Silakan coba lagi.", source: "error" }, { status: 500 });
  }
}

function getFallbackReply(message: string): string {
  const q = message.toLowerCase();
  if (q.includes("simpanan"))
    return "Menu **Simpanan** digunakan untuk mengelola setoran dan pengambilan simpanan anggota. Terdapat 5 jenis simpanan: Pokok, Wajib, Sukarela, Lain-lain, dan SHU. Anda dapat melakukan transaksi setoran/pengambilan serta melihat riwayat lengkap setiap anggota.";
  if (q.includes("pinjaman") || q.includes("angsuran"))
    return "Menu **Pinjaman** menyediakan fitur manajemen pinjaman & angsuran. Anda bisa mengajukan pinjaman baru, melihat status pinjaman (lancar/kurang lancar/macet), melakukan simulasi angsuran, dan melihat detail pembayaran.";
  if (q.includes("potongan"))
    return "Menu **Daftar Potongan** mengelola potongan gaji anggota untuk simpanan & angsuran. Terdapat 5 sub-menu: Kelola Daftar Potongan (input harian), Rekapitulasi (monitoring), Pencetakan (cetak & export), Koreksi/Penyesuaian (kontrol), dan Riwayat Transaksi (audit log).";
  if (q.includes("anggota"))
    return "Menu **Data Anggota** digunakan untuk mengelola seluruh data anggota koperasi. Anda dapat menambah, mengedit, dan menghapus data anggota. Tersedia filter berdasarkan status dan tier, serta detail profil lengkap termasuk simpanan dan pinjaman per anggota.";
  if (q.includes("laporan") || q.includes("cetak") || q.includes("print"))
    return "Menu **Laporan & Pencetakan** menyediakan berbagai jenis laporan yang bisa dicetak atau di-export ke CSV. Termasuk: Daftar Anggota, Nominatif, Mutasi Simpanan, Kartu Angsuran, Daftar Potongan, dan lainnya. Setiap laporan dilengkapi filter dan pencarian.";
  if (q.includes("shu"))
    return "Menu **SHU (Sisa Hasil Usaha)** digunakan untuk perhitungan dan distribusi SHU tahunan kepada anggota koperasi berdasarkan kontribusi masing-masing.";
  if (q.includes("dashboard"))
    return "**Dashboard** menampilkan ringkasan data koperasi secara real-time meliputi: total anggota aktif, total simpanan, pinjaman beredar, tingkat macet, komposisi simpanan (pie chart), top member, anggota yang perlu perhatian, dan indikator kesehatan koperasi.";
  if (q.includes("pengaturan") || q.includes("setting") || q.includes("backup"))
    return "Menu **Pengaturan** berisi konfigurasi sistem koperasi: setup data koperasi, manajemen operator, kode pinjaman & simpanan, backup & restore data, reindex database, dan informasi software.";
  if (q.includes("login") || q.includes("keamanan") || q.includes("akses"))
    return "Sistem login mendukung **role-based access** dengan 6 jabatan: Super Admin, Bendahara, Sekretaris, Ketua, Pengawas, dan Anggota. Setiap login mencatat waktu, device, dan IP address untuk keamanan.";
  if (q.includes("notifikasi") || q.includes("lonceng"))
    return "Fitur **Notifikasi** menampilkan pemberitahuan real-time seperti pinjaman baru, setoran berhasil, potongan terkirim, dan lainnya. Klik notifikasi untuk langsung navigasi ke halaman terkait. Tersedia tombol 'Tandai sudah dibaca'.";

  return "Terima kasih atas pertanyaan Anda. Saya adalah Asisten Koperasi Pintar yang siap membantu Anda memahami fitur-fitur platform ini. Silakan tanyakan tentang **Dashboard, Data Anggota, Simpanan, Pinjaman, Daftar Potongan, SHU, Laporan, Pengaturan, Notifikasi,** atau **Keamanan Login**. Saya akan menjelaskan dengan senang hati.";
}
