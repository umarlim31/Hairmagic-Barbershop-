import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

const hairMagicSans = localFont({
  src: "./fonts/geist-latin.woff2",
  weight: "100 900",
  display: "swap",
  variable: "--font-hm-sans",
});

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#0b1425" };

export const metadata: Metadata = {
  title: "Hairmagic Barbershop | Layanan & Booking",
  description:
    "Kenali Hairmagic Barbershop, lihat layanan dan harga, lalu pilih jadwal haircut. Kunjungi kami di Jl. Belibis Raya No. 06. Konfirmasi reservasi melalui WhatsApp.",
  icons: {
    icon: "/media/hair-magic-logo.webp",
    shortcut: "/media/hair-magic-logo.webp",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="dark">
      <body className={`${hairMagicSans.variable} antialiased`}>{children}</body>
    </html>
  );
}
