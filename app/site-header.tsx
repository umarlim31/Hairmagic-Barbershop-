"use client";

import Image from "next/image";
import { Menu, ArrowUpRight, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetTrigger, SheetContent, SheetTitle, SheetDescription, SheetClose } from "@/components/ui/sheet";

const links = [
  ["Layanan", "#services"],
  ["Booking", "#booking"],
  ["Tentang", "#about"],
  ["Galeri", "#gallery"],
  ["Lokasi", "#location"],
  ["Penilaian", "/penilaian"],
] as const;

export function SiteHeader() {
  return (
    <header className="hm-header">
      <div className="hm-container hm-header-inner">
        <a href="#home" className="hm-logo-link" aria-label="Hairmagic Barbershop, beranda">
          <Image src="/media/hair-magic-logo.webp" alt="" width={52} height={52} priority />
          <span><strong>HAIRMAGIC<span className="hm-brand-period">.</span></strong><small>BARBERSHOP</small></span>
        </a>
        <nav className="hm-nav" aria-label="Navigasi utama">
          {links.map(([label, href]) => <a key={href} href={href}>{label}</a>)}
        </nav>
        <div className="hm-header-actions">
          <a className="hm-button hm-button-primary hm-header-book" href="#booking">Booking <ArrowUpRight aria-hidden="true" /></a>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="hm-menu-toggle" aria-label="Buka menu navigasi"><Menu aria-hidden="true" /></Button>
            </SheetTrigger>
            <SheetContent className="hm-menu-panel">
              <SheetTitle className="hm-menu-title">Hairmagic Barbershop</SheetTitle>
              <SheetDescription>Haircut, warna, dan perawatan rambut.</SheetDescription>
              <nav className="hm-mobile-nav" aria-label="Menu navigasi HP">
                {links.map(([label, href], index) => (
                  <SheetClose asChild key={href}><a href={href}><span>0{index + 1}</span>{label}<ArrowUpRight aria-hidden="true" /></a></SheetClose>
                ))}
              </nav>
              <p className="hm-menu-address"><MapPin aria-hidden="true" /> Jl. Belibis Raya No. 06</p>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
