-- Add DELETE policies (missing from initial setup)
CREATE POLICY "Allow public delete anggota" ON anggota FOR DELETE USING (true);
CREATE POLICY "Allow public delete transaksi_simpanan" ON transaksi_simpanan FOR DELETE USING (true);
CREATE POLICY "Allow public delete pinjaman" ON pinjaman FOR DELETE USING (true);
CREATE POLICY "Allow public delete potongan" ON potongan FOR DELETE USING (true);

-- Delete old demo data
DELETE FROM potongan WHERE id IN ('PT001','PT002','PT003','PT004','PT005','PT006','PT007','PT008');
DELETE FROM transaksi_simpanan WHERE id IN ('TS001','TS002','TS003','TS004','TS005','TS006','TS007','TS008');
DELETE FROM pinjaman WHERE id IN ('P001','P002','P003','P004','P005','P006','P007','P008','P009','P010');
DELETE FROM anggota WHERE id IN ('A001','A002','A003','A004','A005','A006','A007','A008','A009','A010','A011','A012');
