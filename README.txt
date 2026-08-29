ARC - Admin Reporting and Certification V3

FITUR STAFF
- Login
- Absensi Masuk
- Kebersihan LAB
- Laporan Harian
- Hitung pencapaian otomatis
- Foto via kamera HP / galeri
- Salin laporan & buka WhatsApp

FITUR ADMIN
- Dashboard ringkasan hari ini
- Data Staff: tambah / edit / hapus
- Rekap Absensi
- Rekap Kebersihan
- Rekap Laporan Harian
- Rekap Pencapaian Harian: pilih tanggal, tampil seluruh staff, status 100%, Kurang, OFF, atau Belum Lapor
- Admin dapat Tandai OFF / Batalkan OFF
- Filter tanggal / nama / bulan
- Export CSV
- Arsip semua data
- Hapus data lebih dari 6 bulan
- Data staff tidak ikut terhapus

AREA
- Ruangan Timbang
- Office LAB
- Ruangan XRF
- Ruangan CV & TS
- Ruangan Fuse
- Ruangan Oven
- Ruangan
- Store Sample
- Lorong

LOGIN DEMO
Admin: admin / admin123
Staff: hasan / 123456

PENTING
Versi V3 ini masih versi static GitHub Pages dan menyimpan data di localStorage browser.
Artinya, data yang dimasukkan dari HP A tidak otomatis muncul di laptop/HP Admin B.

Agar semua perangkat tersinkron, sambungkan ke Firebase Authentication + Firestore.
Struktur tampilan dan fitur admin V3 ini sudah disiapkan agar mudah dipindahkan ke Firebase.

RETENSI
Retensi operasional: 6 bulan.
Gunakan menu Admin > Arsip & Retensi > Export Semua Data sebelum menghapus data lama.

UPLOAD GITHUB PAGES
1. Buat repository.
2. Upload index.html, folder css, folder js.
3. Settings > Pages.
4. Deploy from a branch.
5. main / root.
6. Save.

VERSI V4
- Rekap pencapaian bulanan diganti menjadi Rekap Pencapaian Harian.
- Export CSV mengikuti tanggal yang dipilih.
- Status OFF disimpan per staff per tanggal.
