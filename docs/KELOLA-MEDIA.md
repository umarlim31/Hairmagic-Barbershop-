# Panduan mengganti media Hairmagic

Desain Astra September dipertahankan. Panduan ini khusus foto/video website marketing.

| Media | File / konfigurasi |
| --- | --- |
| Video utama | `public/media/hairmagic-film.mp4` |
| Poster video utama | `public/media/hairmagic-film-poster.webp` |
| Logo | `public/media/hair-magic-logo.webp` |
| Galeri haircut/customer | `lib/gallery.ts` dan `public/media/` |
| Galeri tim Hairmagic | `lib/team-moments.ts` dan `public/media/team/` |

Untuk mengganti video, siapkan MP4 H.264 dengan ukuran web, gunakan nama yang sama, lalu build dan deploy. Video diputar otomatis, mute, loop, dan inline di ponsel. Hindari mengganti class atau struktur `app/brand-film.tsx`.

Untuk menambah foto, simpan WebP ke `public/media/` dan tambahkan item di `lib/gallery.ts` dengan src, alt, category, title, description, position. Galeri mengikuti jumlah item dan berputar otomatis setiap sekitar 5,5 detik saat terlihat.

## Foto tim Hairmagic

Galeri tim terpisah dari galeri haircut/customer. Dua foto perjalanan tim yang sudah terpasang ada di `public/media/team/`. Untuk menambah foto asli lain, simpan JPEG/WebP berukuran web di folder tersebut lalu tambahkan satu objek ke daftar `TEAM_MOMENTS` di `lib/team-moments.ts`. Isi `src` dengan path `/media/team/nama-file.jpg`, `alt` dengan deskripsi foto, `category` dengan salah satu dari `Di Barbershop`, `Hairmagic Trip`, `Behind the Scenes`, atau `Our Moments`, serta `title` dan `caption`. Jika framing perlu digeser, isi `position` (contoh `center 40%`).

Untuk mengganti foto, timpa filenya menggunakan nama yang sama, atau ganti `src` pada satu objek. Untuk mengubah teks atau kategori, edit objek yang sama; untuk menghapusnya, hapus objek dari daftar. Foto asli untuk tiga kategori selain Hairmagic Trip masih perlu ditambahkan. Setelah itu jalankan build dan periksa hasilnya di ponsel. Jangan tempatkan hasil potong rambut customer di daftar ini.

Setelah perubahan: `npm test`, `npm run build`, buka preview dari ponsel, kemudian terbitkan melalui GitHub/Vercel. Periksa pemotongan foto, video, teks, dan booking.

Saat ini belum ada UI upload Kelola Media. Tabel media dan RPC pengurutan di Supabase adalah fondasi lanjutan; mengubah tabel itu belum mengubah visual pada rilis ini. Jangan menghapus aset asli hingga penggantinya terverifikasi.
