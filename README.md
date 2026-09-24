# Hairmagic Barbershop — Astra September recovery

Website marketing Hairmagic, dari sumber asli Astra `fd58e2cc3febdd8e55e691c5b29e32e1d91af8d1`. Baseline visual versi 6 tetap dipertahankan: halaman, Geist, hitam–biru–merah, video asli, galeri otomatis, menu layanan dan booking WhatsApp.

## Menjalankan

Node.js 22.13+ (CI: Node 24), lalu `npm ci`, `npm test`, `npm run build`, `npm start`.
Untuk pengembangan: `npm run dev` (port 3000).

## Vercel

Repository `umarlim31/Hairmagic-Barbershop-`, root proyek di `/`.
`vercel.json` memakai framework Next.js, `npm run build`, output `.next`.
Cabang `recovery/astra-september-2026` menghasilkan preview. Cabang `main` menghasilkan production melalui integrasi Git yang sudah ada.

## Database dan owner

Supabase khusus website: `lrhggtctzwhujjmngmvr`. Tidak menggunakan atau mengubah Hairmagic POS.
Booking, ketersediaan, dan penilaian memakai RPC terbatas dengan publishable key. Semua kredensial yang ada dalam source merupakan identifier publik; tidak ada service-role key.
Owner masuk melalui `/owner/login` memakai Supabase Auth. Server memverifikasi user ke Auth dan tabel `owner_accounts`; metadata profil atau header kiriman pengunjung tidak memberikan hak owner. Laporan diteruskan memakai sesi pengguna sehingga RLS tetap berlaku. Session refresh ditangani proxy dan laporan tidak di-cache.
Akun biasa tidak dapat menaikkan dirinya menjadi owner. Provisioning owner dilakukan administrator, bukan melalui halaman publik.

## Media

Semua aset asli disertakan di `public/media/`; font Geist di `app/fonts/`.
Lihat [panduan media](docs/KELOLA-MEDIA.md). Versi pemulihan ini memakai aset yang disertakan source. Metadata media di Supabase belum otomatis mengubah halaman. UI Kelola Media belum menjadi bagian rilis ini.

## Riwayat dan batas verifikasi

Sumber Sites asli dipertahankan. Cabang `archive/july-2026-legacy` mempertahankan versi Juli.
Catatan dalam `docs/STATUS-PERSIAPAN.md`, `docs/MIGRASI-SUPABASE.md`, dan `docs/runtime.md` adalah riwayat persiapan sebelum recovery; konfigurasi operasional terbaru dijelaskan pada README ini.
Build produksi dan 15 pengujian lulus. Login menggunakan password owner nyata perlu diuji oleh pemilik akun; kredensial tidak diambil dari database atau dimasukkan ke source.
Tidak ada migrasi/penyalinan data pelanggan dalam pemulihan source ini. Situs Sites lama masih memakai backend historisnya dan tidak otomatis dialihkan.
