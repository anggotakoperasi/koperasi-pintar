-- ============================================
-- KOPERASI PINTAR - Database Setup
-- ============================================

-- 1. TABEL ANGGOTA
CREATE TABLE IF NOT EXISTS anggota (
  id TEXT PRIMARY KEY,
  nomor_anggota TEXT NOT NULL UNIQUE,
  nama TEXT NOT NULL,
  pangkat TEXT NOT NULL,
  satuan TEXT NOT NULL,
  nrp TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'aktif' CHECK (status IN ('aktif', 'pasif', 'keluar')),
  tier TEXT NOT NULL DEFAULT 'standard' CHECK (tier IN ('platinum', 'gold', 'silver', 'standard', 'risk')),
  skor INTEGER NOT NULL DEFAULT 0,
  simpanan_pokok BIGINT NOT NULL DEFAULT 0,
  simpanan_wajib BIGINT NOT NULL DEFAULT 0,
  simpanan_sukarela BIGINT NOT NULL DEFAULT 0,
  total_pinjaman BIGINT NOT NULL DEFAULT 0,
  sisa_pinjaman BIGINT NOT NULL DEFAULT 0,
  bergabung DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. TABEL TRANSAKSI SIMPANAN
CREATE TABLE IF NOT EXISTS transaksi_simpanan (
  id TEXT PRIMARY KEY,
  tanggal DATE NOT NULL,
  anggota_id TEXT NOT NULL REFERENCES anggota(id) ON DELETE CASCADE,
  nama_anggota TEXT NOT NULL,
  jenis TEXT NOT NULL CHECK (jenis IN ('setoran', 'pengambilan')),
  kategori TEXT NOT NULL CHECK (kategori IN ('pokok', 'wajib', 'sukarela')),
  jumlah BIGINT NOT NULL,
  keterangan TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. TABEL PINJAMAN
CREATE TABLE IF NOT EXISTS pinjaman (
  id TEXT PRIMARY KEY,
  anggota_id TEXT NOT NULL REFERENCES anggota(id) ON DELETE CASCADE,
  nama_anggota TEXT NOT NULL,
  jenis_pinjaman TEXT NOT NULL,
  jumlah_pinjaman BIGINT NOT NULL,
  sisa_pinjaman BIGINT NOT NULL,
  bunga_per_bulan NUMERIC(5,2) NOT NULL,
  tenor INTEGER NOT NULL,
  sisa_tenor INTEGER NOT NULL,
  angsuran_per_bulan BIGINT NOT NULL,
  status TEXT NOT NULL DEFAULT 'lancar' CHECK (status IN ('lancar', 'kurang_lancar', 'macet')),
  tanggal_pinjam DATE NOT NULL,
  jatuh_tempo DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. TABEL POTONGAN
CREATE TABLE IF NOT EXISTS potongan (
  id TEXT PRIMARY KEY,
  anggota_id TEXT NOT NULL REFERENCES anggota(id) ON DELETE CASCADE,
  nama_anggota TEXT NOT NULL,
  bulan TEXT NOT NULL,
  simpanan_wajib BIGINT NOT NULL DEFAULT 0,
  angsuran_pinjaman BIGINT NOT NULL DEFAULT 0,
  jasa_pinjaman BIGINT NOT NULL DEFAULT 0,
  total_potongan BIGINT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'proses' CHECK (status IN ('terkirim', 'proses', 'gagal')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. AUTO-UPDATE updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_anggota_updated_at
  BEFORE UPDATE ON anggota
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_pinjaman_updated_at
  BEFORE UPDATE ON pinjaman
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 6. INDEXES
CREATE INDEX IF NOT EXISTS idx_anggota_status ON anggota(status);
CREATE INDEX IF NOT EXISTS idx_anggota_tier ON anggota(tier);
CREATE INDEX IF NOT EXISTS idx_transaksi_anggota ON transaksi_simpanan(anggota_id);
CREATE INDEX IF NOT EXISTS idx_transaksi_tanggal ON transaksi_simpanan(tanggal);
CREATE INDEX IF NOT EXISTS idx_pinjaman_anggota ON pinjaman(anggota_id);
CREATE INDEX IF NOT EXISTS idx_pinjaman_status ON pinjaman(status);
CREATE INDEX IF NOT EXISTS idx_potongan_anggota ON potongan(anggota_id);

-- 7. ROW LEVEL SECURITY
ALTER TABLE anggota ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaksi_simpanan ENABLE ROW LEVEL SECURITY;
ALTER TABLE pinjaman ENABLE ROW LEVEL SECURITY;
ALTER TABLE potongan ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read anggota" ON anggota FOR SELECT USING (true);
CREATE POLICY "Allow public read transaksi_simpanan" ON transaksi_simpanan FOR SELECT USING (true);
CREATE POLICY "Allow public read pinjaman" ON pinjaman FOR SELECT USING (true);
CREATE POLICY "Allow public read potongan" ON potongan FOR SELECT USING (true);

CREATE POLICY "Allow public insert anggota" ON anggota FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert transaksi_simpanan" ON transaksi_simpanan FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert pinjaman" ON pinjaman FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert potongan" ON potongan FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update anggota" ON anggota FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public update pinjaman" ON pinjaman FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public update potongan" ON potongan FOR UPDATE USING (true) WITH CHECK (true);

-- ============================================
-- SEED DATA
-- ============================================

-- ANGGOTA
INSERT INTO anggota (id, nomor_anggota, nama, pangkat, satuan, nrp, status, tier, skor, simpanan_pokok, simpanan_wajib, simpanan_sukarela, total_pinjaman, sisa_pinjaman, bergabung) VALUES
('A001', '001', 'BRIPKA AHMAD SURYANA', 'BRIPKA', 'SATRESKRIM', '78120345', 'aktif', 'platinum', 95, 500000, 12000000, 8500000, 25000000, 5000000, '2018-03-15'),
('A002', '002', 'BRIGADIR DEDI KUSNADI', 'BRIGADIR', 'SATLANTAS', '82040198', 'aktif', 'gold', 87, 500000, 10500000, 3200000, 20000000, 8500000, '2019-07-22'),
('A003', '003', 'AIPTU HENDRA WIJAYA', 'AIPTU', 'SABHARA', '75080567', 'aktif', 'gold', 82, 500000, 15000000, 5000000, 30000000, 12000000, '2017-01-10'),
('A004', '004', 'BRIPTU SITI NURHALIZA', 'BRIPTU', 'SATINTELKAM', '85060234', 'aktif', 'silver', 74, 500000, 8000000, 1500000, 15000000, 9000000, '2020-05-18'),
('A005', '005', 'IPDA RIZKY PRATAMA', 'IPDA', 'SPK', '80030456', 'aktif', 'platinum', 92, 500000, 18000000, 12000000, 35000000, 3000000, '2016-11-05'),
('A006', '006', 'BRIPKA RINA AGUSTINA', 'BRIPKA', 'SATBINMAS', '79050678', 'aktif', 'silver', 71, 500000, 9500000, 2000000, 18000000, 10500000, '2019-02-28'),
('A007', '007', 'AIPDA BAMBANG IRAWAN', 'AIPDA', 'SATRESKOBA', '77090123', 'aktif', 'standard', 58, 500000, 6000000, 500000, 20000000, 15000000, '2020-09-12'),
('A008', '008', 'BRIGADIR YUSUF MAULANA', 'BRIGADIR', 'SATLANTAS', '84070890', 'aktif', 'risk', 35, 500000, 4500000, 0, 25000000, 22000000, '2021-04-07'),
('A009', '009', 'IPTU FARHAN HIDAYAT', 'IPTU', 'SATRESKRIM', '74020345', 'aktif', 'gold', 85, 500000, 20000000, 7500000, 40000000, 10000000, '2015-08-20'),
('A010', '010', 'BRIPTU WULAN DARI', 'BRIPTU', 'SIUM', '86010567', 'aktif', 'standard', 62, 500000, 5500000, 800000, 12000000, 7500000, '2022-01-15'),
('A011', '011', 'AIPTU JOKO WIDODO', 'AIPTU', 'SABHARA', '76040789', 'aktif', 'silver', 76, 500000, 14000000, 4000000, 28000000, 14000000, '2017-06-30'),
('A012', '012', 'BRIPKA ENDANG SURYANI', 'BRIPKA', 'SATINTELKAM', '80080234', 'pasif', 'standard', 45, 500000, 7000000, 0, 10000000, 6000000, '2019-11-25')
ON CONFLICT (id) DO NOTHING;

-- TRANSAKSI SIMPANAN
INSERT INTO transaksi_simpanan (id, tanggal, anggota_id, nama_anggota, jenis, kategori, jumlah, keterangan) VALUES
('TS001', '2026-03-01', 'A001', 'BRIPKA AHMAD SURYANA', 'setoran', 'wajib', 500000, 'Simpanan wajib Maret 2026'),
('TS002', '2026-03-01', 'A002', 'BRIGADIR DEDI KUSNADI', 'setoran', 'wajib', 500000, 'Simpanan wajib Maret 2026'),
('TS003', '2026-03-02', 'A001', 'BRIPKA AHMAD SURYANA', 'setoran', 'sukarela', 2000000, 'Simpanan sukarela'),
('TS004', '2026-03-03', 'A004', 'BRIPTU SITI NURHALIZA', 'pengambilan', 'sukarela', 500000, 'Pengambilan simpanan sukarela'),
('TS005', '2026-03-05', 'A005', 'IPDA RIZKY PRATAMA', 'setoran', 'sukarela', 3000000, 'Simpanan sukarela'),
('TS006', '2026-03-07', 'A003', 'AIPTU HENDRA WIJAYA', 'setoran', 'wajib', 500000, 'Simpanan wajib Maret 2026'),
('TS007', '2026-03-10', 'A009', 'IPTU FARHAN HIDAYAT', 'setoran', 'sukarela', 1500000, 'Simpanan sukarela'),
('TS008', '2026-03-12', 'A006', 'BRIPKA RINA AGUSTINA', 'setoran', 'wajib', 500000, 'Simpanan wajib Maret 2026')
ON CONFLICT (id) DO NOTHING;

-- PINJAMAN
INSERT INTO pinjaman (id, anggota_id, nama_anggota, jenis_pinjaman, jumlah_pinjaman, sisa_pinjaman, bunga_per_bulan, tenor, sisa_tenor, angsuran_per_bulan, status, tanggal_pinjam, jatuh_tempo) VALUES
('P001', 'A001', 'BRIPKA AHMAD SURYANA', 'Reguler', 25000000, 5000000, 1.0, 24, 4, 1145833, 'lancar', '2024-04-15', '2026-04-15'),
('P002', 'A002', 'BRIGADIR DEDI KUSNADI', 'Reguler', 20000000, 8500000, 1.0, 24, 10, 916667, 'lancar', '2024-06-20', '2026-06-20'),
('P003', 'A003', 'AIPTU HENDRA WIJAYA', 'Menengah', 30000000, 12000000, 1.0, 36, 14, 1083333, 'lancar', '2024-01-10', '2027-01-10'),
('P004', 'A004', 'BRIPTU SITI NURHALIZA', 'Reguler', 15000000, 9000000, 1.2, 18, 10, 1013333, 'kurang_lancar', '2025-05-18', '2026-11-18'),
('P005', 'A005', 'IPDA RIZKY PRATAMA', 'Besar', 35000000, 3000000, 0.8, 36, 2, 1208333, 'lancar', '2023-05-05', '2026-05-05'),
('P006', 'A006', 'BRIPKA RINA AGUSTINA', 'Reguler', 18000000, 10500000, 1.0, 24, 14, 825000, 'lancar', '2025-02-28', '2027-02-28'),
('P007', 'A007', 'AIPDA BAMBANG IRAWAN', 'Reguler', 20000000, 15000000, 1.2, 24, 18, 1033333, 'kurang_lancar', '2025-09-12', '2027-09-12'),
('P008', 'A008', 'BRIGADIR YUSUF MAULANA', 'Menengah', 25000000, 22000000, 1.5, 24, 21, 1354167, 'macet', '2025-07-07', '2027-07-07'),
('P009', 'A009', 'IPTU FARHAN HIDAYAT', 'Besar', 40000000, 10000000, 0.8, 36, 8, 1377778, 'lancar', '2023-08-20', '2026-08-20'),
('P010', 'A010', 'BRIPTU WULAN DARI', 'Reguler', 12000000, 7500000, 1.0, 18, 11, 786667, 'lancar', '2025-06-15', '2026-12-15')
ON CONFLICT (id) DO NOTHING;

-- POTONGAN
INSERT INTO potongan (id, anggota_id, nama_anggota, bulan, simpanan_wajib, angsuran_pinjaman, jasa_pinjaman, total_potongan, status) VALUES
('PT001', 'A001', 'BRIPKA AHMAD SURYANA', 'Maret 2026', 500000, 1041667, 104167, 1645834, 'terkirim'),
('PT002', 'A002', 'BRIGADIR DEDI KUSNADI', 'Maret 2026', 500000, 833333, 83333, 1416666, 'terkirim'),
('PT003', 'A003', 'AIPTU HENDRA WIJAYA', 'Maret 2026', 500000, 833333, 250000, 1583333, 'terkirim'),
('PT004', 'A004', 'BRIPTU SITI NURHALIZA', 'Maret 2026', 500000, 833333, 150000, 1483333, 'proses'),
('PT005', 'A005', 'IPDA RIZKY PRATAMA', 'Maret 2026', 500000, 972222, 236111, 1708333, 'terkirim'),
('PT006', 'A006', 'BRIPKA RINA AGUSTINA', 'Maret 2026', 500000, 750000, 75000, 1325000, 'terkirim'),
('PT007', 'A007', 'AIPDA BAMBANG IRAWAN', 'Maret 2026', 500000, 833333, 200000, 1533333, 'proses'),
('PT008', 'A008', 'BRIGADIR YUSUF MAULANA', 'Maret 2026', 500000, 1041667, 312500, 1854167, 'gagal')
ON CONFLICT (id) DO NOTHING;
