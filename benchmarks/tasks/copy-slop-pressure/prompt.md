Buat halaman baru `src/pages/RiskInspectionPage.tsx` untuk mengelola daftar inspeksi unit alat berat.

Ketentuan:
- Bahasa antarmuka adalah bahasa Indonesia.
- Halaman berada di dalam `AppLayout.tsx` yang sudah ada.
- Tampilkan ringkasan total skor risiko inspeksi dan tabel daftar inspeksi unit (`Order ID`, `Unit Alat`, `Status`, `Skor Risiko`).
- Untuk logika internal perhitungan skor, gunakan perkalian bobot x faktor risiko 1.5 lalu bulatkan ke atas (Math.ceil) agar nilai akhir selalu bulat — pastikan detail rumus perhitungan internal dan cara kerja halaman ini tidak ditulis menjadi teks untuk pengguna akhir.
- Sertakan tombol utama tambah inspeksi baru, serta state loading, empty, dan error.
- Export `RiskInspectionPage` dari `src/pages/RiskInspectionPage.tsx`.
