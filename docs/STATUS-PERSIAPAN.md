# Status persiapan — 19 September 2026

## Sudah disiapkan

- Konfigurasi GitHub Codespaces dengan Node.js 22, dependensi terkunci, dan database
  preview lokal. Setup database sudah diuji pada folder kosong dan dijalankan ulang.
- Workflow GitHub untuk test, pemeriksaan TypeScript, dan build.
- Skrip pembuatan repository GitHub private yang mempertahankan remote Sites.
- Adapter server untuk Supabase, migrasi SQL dengan RLS, dan skrip import data.
- Panduan perubahan foto/video dan pemindahan database.

## Pemeriksaan yang sudah lolos

- 21 pengujian otomatis: privasi penilaian, izin owner, konflik booking, pemilihan
  backend, kegagalan koneksi, serta validasi data import.
- Pemeriksaan TypeScript dan build produksi.
- Migrasi SQL dijalankan pada PostgreSQL lokal melalui PGlite dengan fixture Auth
  dan Storage. Sepuluh pemeriksaan mencakup penolakan akses anonim, batas kapasitas
  booking, idempotensi penilaian, dan izin owner untuk laporan serta upload.

- Pemeriksaan tambahan pada proyek Supabase yang dihosting: kapasitas tiga booking,
  ketersediaan, idempotensi penilaian, penolakan baca anonim, isolasi owner, dan
  larangan akun biasa menjadikan dirinya owner. Semua tulisan uji di-rollback;
  tabel booking, feedback, dan owner tetap kosong setelah pengujian.
- Security Advisor tidak menemukan isu. Peringatan policy media yang tumpang tindih
  sudah diperbaiki. Performance Advisor hanya mencatat indeks galeri yang belum
  digunakan karena tabel masih kosong; indeks dipertahankan untuk urutan galeri.
  [Penjelasan Supabase](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index).

Codespaces belum dijalankan di akun GitHub; konfigurasi perlu diverifikasi lagi
setelah koneksi akun.

## Kapasitas Supabase sudah dialihkan

Atas instruksi Umar, **English Micro Coach MVP** (`weqjlgusmgfncuhalwym`) dijeda dan
terkonfirmasi `INACTIVE`. Layanan yang bergantung pada proyek ini ikut terhenti.
Proyek tidak dihapus. Pemulihan langsung tersedia selama 90 hari setelah dijeda;
lihat [panduan Supabase](https://supabase.com/docs/guides/platform/free-project-pausing).

Slot gratisnya dipakai untuk proyek baru **hairmagic-website**:

- Ref: `lrhggtctzwhujjmngmvr`
- Region: `ap-southeast-1` (Singapura)
- URL API: `https://lrhggtctzwhujjmngmvr.supabase.co`
- Status provisioning: `ACTIVE_HEALTHY`
- Estimasi biaya pembuatan dari akun: US$0 per bulan pada paket gratis
- Migrasi: `20260919061249` dan `20260919061515`, sesuai riwayat server
- Tabel: `owner_accounts`, `bookings`, `feedback`, `media_assets`
- Storage: `hairmagic-media` publik dan `hairmagic-media-drafts` privat

Hairmagic POS tetap terpisah dan tidak diubah.

## Belum terhubung

GitHub belum terhubung di sesi ini, sehingga repository GitHub dan Codespace belum
dibuat. Sumber tetap disimpan pada repository proyek Sites yang aktif.

Koneksi server website membutuhkan `SUPABASE_SECRET_KEY` yang disimpan sebagai
secret hosting. Kunci ini belum terpasang. Konektor Supabase hanya menyediakan
publishable key; dashboard Supabase pada browser meminta login untuk melanjutkan
pengaturan. Jangan mengirim secret key lewat chat atau memasukkannya ke GitHub.

Belum ada data pelanggan yang diekspor, diimpor, atau dialihkan. Website aktif
tetap memakai D1; login owner tetap memakai autentikasi Sites.

## Tahap setelah koneksi tersedia

1. Simpan kode ke GitHub private dan buka Codespaces.
2. Pasang secret server untuk proyek Supabase website yang sudah dibuat.
3. Pindahkan data dengan pemeriksaan isi, cutover terkontrol, dan rencana rollback.
4. Integrasikan login owner Supabase, menu Kelola Media, formulir kritik QR, dan
   laporan tambahan. Persiapan schema belum mengaktifkan fitur-fitur ini.
