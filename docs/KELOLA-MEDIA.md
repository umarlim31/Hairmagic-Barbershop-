# Panduan mengganti media Hairmagic

Desain Astra September dipertahankan. Panduan ini khusus foto/video website marketing.

| Media | File / konfigurasi |
| --- | --- |
| Video utama | `public/media/hairmagic-film.mp4` |
| Poster video utama | `public/media/hairmagic-film-poster.webp` |
| Logo | `public/media/hair-magic-logo.webp` |
| Galeri | `lib/gallery.ts` dan `public/media/` |

Untuk mengganti video, siapkan MP4 H.264 dengan ukuran web, gunakan nama yang sama, lalu build dan deploy. Video diputar otomatis, mute, loop, dan inline di ponsel. Hindari mengganti class atau struktur `app/brand-film.tsx`.

Untuk menambah foto, simpan WebP ke `public/media/` dan tambahkan item di `lib/gallery.ts` dengan src, alt, category, title, description, position. Galeri mengikuti jumlah item dan berputar otomatis setiap sekitar 5,5 detik saat terlihat.

Setelah perubahan: `npm test`, `npm run build`, buka preview dari ponsel, kemudian terbitkan melalui GitHub/Vercel. Periksa pemotongan foto, video, teks, dan booking.

Saat ini belum ada UI upload Kelola Media. Tabel media dan RPC pengurutan di Supabase adalah fondasi lanjutan; mengubah tabel itu belum mengubah visual pada rilis ini. Jangan menghapus aset asli hingga penggantinya terverifikasi.
