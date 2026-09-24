# Migrasi Hairmagic Website ke Supabase

## Tujuan dan batas tahap ini

Simpan kode di GitHub, gunakan Codespaces untuk editor, dan pindahkan penyimpanan
website ke proyek Supabase khusus. Tampilan versi 6 tetap menjadi baseline.
Adapter dan migrasi tidak otomatis mengaktifkan Supabase, membuat akun owner,
atau menerbitkan menu Kelola Media / formulir QR baru.

## Konfigurasi server

Proyek tujuan sudah dibuat: **hairmagic-website**, ref `lrhggtctzwhujjmngmvr`, region
`ap-southeast-1`. URL API: `https://lrhggtctzwhujjmngmvr.supabase.co`.
Schema dan aturan akses sudah diterapkan; pengalihan database website belum aktif.

| Kunci | Isi |
| --- | --- |
| `DATA_BACKEND` | `d1` sebelum cutover; `supabase` setelah verifikasi |
| `SUPABASE_URL` | URL HTTPS proyek Supabase tujuan |
| `SUPABASE_SECRET_KEY` | Secret key server, disimpan sebagai secret hosting |
| `FEEDBACK_OWNER_EMAIL` | Akun owner yang sudah terdaftar pada website |
| `OWNER_AUTH_MODE` | `sites` untuk website aktif; `disabled` untuk preview Codespaces |

Tidak ada secret yang memakai awalan `NEXT_PUBLIC_`. Koneksi memakai HTTP Data API
agar kompatibel dengan Cloudflare Workers. Modern secret key dikirim sebagai
`apikey`; JWT `service_role` lama didukung hanya untuk kompatibilitas.

## Langkah pemindahan data

1. Gunakan proyek Supabase **hairmagic-website** yang sudah dibuat dalam organisasi
   yang disetujui. Tidak perlu membuat proyek pengganti lagi.
2. Dua migrasi berikut sudah diterapkan pada proyek tujuan. Jangan menjalankannya
   ulang secara manual: `20260919061249_hairmagic_website_foundation.sql` dan
   `20260919061515_consolidate_media_read_policy.sql` di `supabase/migrations/`.
   Versi file diselaraskan dengan riwayat migrasi Supabase setelah penerapan.
   Jangan menerapkan schema ini pada Hairmagic POS atau English Micro Coach.
3. Ekspor seluruh baris `bookings` dan `feedback` dari database Sites. Pastikan semua
   halaman export terambil tanpa baris atau nilai yang terpotong. Simpan hasil di
   `backups/` atau penyimpanan privat; jangan commit ke GitHub.
4. Bentuk JSON `{ "bookings": [...], "feedback": [...] }`. Pertahankan ID, teks
   kritik, status booking, dan tanggal seperti sumber. `created_at` D1 adalah UTC;
   interpretasikan nilai tanpa offset sebagai UTC.
5. Jalankan import dry-run. Import nyata membutuhkan URL/key server dan `--apply`.
   Import tidak menghapus baris tujuan dan tidak menimpa ID yang sudah ada.
6. Cocokkan jumlah dan isi setiap baris setelah import, lalu uji slot, konflik
   booking, pengiriman penilaian, dan laporan owner. Jumlah baris saja belum cukup.
7. Saat cutover, hentikan penerimaan tulisan sebentar melalui maintenance terkontrol,
   ekspor/import ulang perubahan terakhir, dan verifikasi. Maintenance belum
   diimplementasikan oleh paket ini: jangan ganti backend saat ada tulisan yang
   belum tersalin.
8. Atur secret hosting, ubah `DATA_BACKEND` ke `supabase`, lalu terbitkan.
   Website hanya menulis ke satu backend; tidak ada dual write tersembunyi.
9. Pertahankan D1 sebagai salinan sebelum migrasi. Untuk rollback setelah ada data
   baru di Supabase, reconcile data baru dahulu agar tidak hilang.

```sh
node scripts/import-supabase.mjs backups/hairmagic-export.json
node --env-file=.env.local scripts/import-supabase.mjs backups/hairmagic-export.json --apply
```

## Akses dan privasi

- Semua tabel aplikasi mengaktifkan RLS dan memiliki GRANT eksplisit.
- Browser anonim tidak boleh membaca booking/feedback, menambah owner, atau
  mengunggah/mengubah media.
- RPC server hanya dapat dijalankan `service_role` dan memakai `SECURITY INVOKER`.
  Key server melewati RLS; pengecekan akun owner pada route laporan tetap wajib.
- `owner_accounts` hanya dapat diisi administrator database / server tepercaya.
  Pendaftaran biasa atau perubahan profil tidak memberikan hak owner.
- Penilaian menyimpan UUID acak, skor, pesan, dan tanggal WITA saja; tidak dikaitkan
  dengan booking, telepon, identitas pelanggan, IP, atau perangkat.
- Draft disimpan di bucket privat `hairmagic-media-drafts`. Hanya aset yang
  diterbitkan disalin ke bucket publik `hairmagic-media`.

## Tahap selanjutnya

1. Integrasikan Supabase Auth, provision akun owner, dan uji pengunjung tanpa login,
   akun lain, serta owner dari server sampai database.
2. Bangun Kelola Media: upload, video utama, urutan, draft, pratinjau, terbitkan.
   Verifikasi upload pengganti sebelum mengganti media lama.
3. Buat formulir QR kritik tertulis. Perlu migrasi berikutnya agar teks dapat dikirim
   tanpa rating wajib dan sumber QR terpisah dari penilaian di kasir.
4. Tambahkan laporan sumber penilaian dan uji akses publik sebelum mencetak stiker.

Fondasi schema ini belum berarti seluruh fitur UI tersebut sudah aktif.
