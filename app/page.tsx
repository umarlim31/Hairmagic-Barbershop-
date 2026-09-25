import { ArrowDown, ArrowUpRight, CalendarDays, MapPin, MessageCircle, Scissors, Check, Camera } from "lucide-react";
import { BookingForm } from "./booking-form";
import { SiteHeader } from "./site-header";
import { BrandFilm } from "./brand-film";
import { ServiceMenu } from "./service-menu";
import { PageMotion } from "./page-motion";
import { Gallery } from "./gallery";
import { TeamMoments } from "./team-moments";
import { BARBERS } from "@/lib/booking-config";
import { SHOP_NAME, SHOP_ADDRESS, MAPS_URL, MAPS_EMBED_URL, INSTAGRAM_URL, whatsappLink } from "@/lib/site-config";

export default function Home() {
  return (
    <div className="hm-site">
      <PageMotion />
      <a className="hm-skip-link" href="#main-content">Langsung ke konten</a>
      <SiteHeader />
      <main id="main-content">
        <section className="hm-hero-stage" id="home" aria-labelledby="hero-title">
          <div className="hm-hero hm-container">
            <div className="hm-hero-copy">
              <p className="hm-eyebrow hm-hero-kicker"><span className="hm-brand-mark" aria-hidden="true" /> BARBERSHOP / EST. 2023</p>
              <h1 id="hero-title" className="hm-hero-title" aria-label="Hairmagic Barbershop"><span className="hm-title-line" aria-hidden="true"><span>HAIR</span></span><span className="hm-title-line hm-title-magic" aria-hidden="true"><span>MAGIC<span className="hm-title-period">.</span></span></span></h1>
              <div className="hm-hero-message">
                <p className="hm-hero-tagline">Gaya punya kamu. Magic dari kami.</p>
                <p className="hm-hero-description">Dari potongan rutin sampai eksplorasi warna. Duduk santai, biarkan kami mengerjakan detailnya.</p>
              </div>
              <div className="hm-hero-actions">
                <a className="hm-button hm-button-primary" href="#booking">Booking sekarang <ArrowUpRight aria-hidden="true" /></a>
                <a className="hm-hero-service-link" href="#services">Lihat layanan <ArrowDown aria-hidden="true" /></a>
              </div>
            </div>
            <BrandFilm />
          </div>
          <div className="hm-essentials hm-container" aria-label="Sekilas Hairmagic" data-reveal>
            <div><span>HAIRCUT MULAI</span><strong aria-label="40 ribu rupiah"><small>Rp</small>40<span>rb</span></strong></div>
            <div><span>KAPSTER PILIHAN</span><strong>{String(BARBERS.length).padStart(2, "0")}</strong></div>
            <div><span>DURASI HAIRCUT</span><strong>40<span>menit</span></strong></div>
          </div>
        </section>
        <section className="hm-details-section hm-services" id="services" aria-labelledby="services-title">
          <div className="hm-container">
            <div className="hm-section-heading" data-reveal>
              <div><p className="hm-eyebrow"><span className="hm-section-index">01</span> LAYANAN</p><h2 id="services-title">Pilih gayamu.<br /><span className="hm-heading-secondary">Kami urus detailnya.</span></h2></div>
              <p>Dari potongan rutin sampai tampilan baru. Lihat pilihan layanan dan harga sebelum reservasi.</p>
            </div>
            <ServiceMenu />
          </div>
        </section>
        <section className="hm-details-section hm-booking-section" id="booking" aria-labelledby="booking-title">
          <div className="hm-container">
            <div className="hm-section-heading" data-reveal>
              <div><p className="hm-eyebrow"><span className="hm-section-index">02</span> RESERVASI</p><h2 id="booking-title">Waktu cukur,<br /><span className="hm-heading-secondary">sesuai rencanamu.</span></h2></div>
              <p>Pilih jadwal haircut, isi kontak, lalu teruskan ringkasannya ke WhatsApp untuk konfirmasi kasir.</p>
            </div>
            <div className="hm-booking-layout">
              <BookingForm />
              <aside className="hm-booking-guide" aria-label="Panduan reservasi">
                <div className="hm-guide-heading"><CalendarDays aria-hidden="true" /><h3>Sebelum reservasi</h3></div>
                <dl>
                  <div><dt>Booking lebih awal</dt><dd>Minimal 5 jam sebelum cukur.</dd></div>
                  <div><dt>Konfirmasi dari kasir</dt><dd>Jadwal final setelah dikonfirmasi melalui WhatsApp.</dd></div>
                  <div><dt>Perlu ubah jadwal?</dt><dd>Hubungi kasir paling lambat 1 jam sebelum cukur.</dd></div>
                  <div><dt>Toleransi kedatangan</dt><dd>Maksimal 10 menit dari jadwal.</dd></div>
                </dl>
                <div className="hm-help-card"><MessageCircle aria-hidden="true" /><h4>Mau cukur lebih cepat?</h4><p>Chat kasir untuk menanyakan ketersediaan di luar booking online.</p><a href={whatsappLink()} target="_blank" rel="noreferrer">Tanya lewat WhatsApp <ArrowUpRight aria-hidden="true" /></a></div>
              </aside>
            </div>
          </div>
        </section>
        <section className="hm-about-section hm-container" id="about" aria-labelledby="about-title">
          <div className="hm-about-intro" data-reveal>
            <div><p className="hm-eyebrow"><span className="hm-section-index">03</span> TENTANG HAIRMAGIC</p><h2 id="about-title">Datang untuk cukur.<br /><span className="hm-heading-secondary">Pulang lebih percaya diri.</span></h2></div>
            <div className="hm-about-text">
              <p>Sejak 2023, Hairmagic tumbuh dengan satu keyakinan sederhana: pengalaman yang baik bukan hanya soal hasil potongan rambut.</p>
              <p>Kami ingin setiap orang yang datang merasa nyaman, didengarkan, dan pulang dengan penampilan yang membuat mereka lebih percaya diri.</p>
              <p>Tapi Hairmagic juga dibangun oleh orang-orang di balik kursi barber. Karena itu, kami ingin tempat ini menjadi lingkungan yang menyenangkan untuk bekerja, berkembang, dan bertumbuh bersama.</p>
              <p>Kami bekerja bersama, belajar bersama, dan sesekali meninggalkan kursi barber untuk jalan-jalan dan menikmati waktu sebagai satu tim.</p>
              <p>Karena bagi kami, Hairmagic bukan hanya tentang merawat rambut.</p>
              <p className="hm-about-emphasis">Kami merawat orang-orangnya juga.</p>
              <ul>
                <li><Check aria-hidden="true" /> Pelayanan yang nyaman dan personal</li>
                <li><Check aria-hidden="true" /> Kapster yang terus berkembang bersama</li>
                <li><Check aria-hidden="true" /> Tim yang bekerja, tumbuh, dan menikmati perjalanan bersama</li>
              </ul>
            </div>
          </div>
          <div className="hm-gallery-heading" id="gallery"><h3>Di dalam Hairmagic</h3><a className="hm-inline-link" href={INSTAGRAM_URL} target="_blank" rel="noreferrer"><Camera aria-hidden="true" /> Instagram <ArrowUpRight aria-hidden="true" /></a></div>
          <Gallery />
        </section>
        <section className="hm-team-section hm-container" id="team" aria-labelledby="team-title">
          <div className="hm-section-heading" data-reveal>
            <div><p className="hm-eyebrow"><span className="hm-section-index">04</span> OUR TEAM</p><h2 id="team-title">Bukan cuma tempat kerja.<br /><span className="hm-heading-secondary">Ini tim Hairmagic.</span></h2></div>
            <p>Di balik setiap potongan rambut, ada tim yang tumbuh bersama. Dari hari-hari sibuk di barbershop sampai perjalanan dan momen seru di luar Hairmagic—semuanya menjadi bagian dari cerita kami.</p>
          </div>
          <TeamMoments />
          <div className="hm-team-closing">
            <p>Good hair starts with a <span>good team.</span></p>
            <a className="hm-inline-link" href={INSTAGRAM_URL} target="_blank" rel="noreferrer">Lihat keseharian Hairmagic di Instagram <ArrowUpRight aria-hidden="true" /></a>
          </div>
        </section>
        <section className="hm-location-section hm-container" id="location" aria-labelledby="location-title">
          <div className="hm-section-heading" data-reveal><div><p className="hm-eyebrow"><span className="hm-section-index">05</span> KUNJUNGI KAMI</p><h2 id="location-title">Hairmagic Barbershop<span className="hm-brand-period">.</span></h2></div><p>Sudah siap untuk potongan baru?<br />Temukan kami lewat Google Maps.</p></div>
          <div className="hm-location-card">
            <div className="hm-location-details">
              <p className="hm-location-name"><MapPin aria-hidden="true" /> {SHOP_NAME}</p>
              <address>{SHOP_ADDRESS}</address>
              <dl className="hm-hours">
                <div><dt>Selasa–Minggu</dt><dd>10.00–22.00 WITA</dd></div>
                <div><dt>Senin</dt><dd>Libur</dd></div>
                <div><dt>Istirahat</dt><dd>12.00–13.00<br />18.00–19.00</dd></div>
              </dl>
              <a className="hm-button hm-button-primary" href={MAPS_URL} target="_blank" rel="noreferrer">Petunjuk arah <ArrowUpRight aria-hidden="true" /></a>
              <a className="hm-location-phone" href={whatsappLink()} target="_blank" rel="noreferrer"><MessageCircle aria-hidden="true" /> 0895 3740 34221</a>
            </div>
            <div className="hm-map-panel">
              <iframe title="Google Maps — Hairmagic Barbershop" src={MAPS_EMBED_URL} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
              <div className="hm-map-caption"><span>Hairmagic Barbershop</span><a href={MAPS_URL} target="_blank" rel="noreferrer">Buka Maps <ArrowUpRight aria-hidden="true" /></a></div>
            </div>
          </div>
        </section>
      </main>
      <footer className="hm-footer hm-container">
        <div className="hm-footer-main"><a className="hm-footer-wordmark" href="#home">Hairmagic<span>.</span></a><p>Haircuts & shaves.<br />Made personal, since 2023.</p><div><a href={INSTAGRAM_URL} target="_blank" rel="noreferrer">Instagram <ArrowUpRight aria-hidden="true" /></a><a href={whatsappLink()} target="_blank" rel="noreferrer">WhatsApp <ArrowUpRight aria-hidden="true" /></a></div></div>
        <div className="hm-footer-bottom"><p>© 2026 Hairmagic Barbershop</p><div className="hm-footer-utility"><a href="/penilaian">Beri penilaian</a><a href="/owner/feedback">Ruang owner</a><a href="#home">Kembali ke atas ↑</a></div></div>
      </footer>
      <nav className="hm-bottom-nav" aria-label="Akses cepat">
        <a href="#services"><Scissors aria-hidden="true" /><span>Layanan</span></a>
        <a href="#booking" className="hm-bottom-book"><CalendarDays aria-hidden="true" /><span>Booking</span></a>
        <a href="#location"><MapPin aria-hidden="true" /><span>Lokasi</span></a>
      </nav>
    </div>
  );
}
