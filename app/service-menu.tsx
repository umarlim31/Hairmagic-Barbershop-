"use client";

import { ArrowUpRight, Clock3, Scissors, MessageCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BARBERS, formatRupiah } from "@/lib/booking-config";
import { whatsappLink } from "@/lib/site-config";

const groups = [
  { id: "color", title: "Coloring", heading: "Warna yang kamu inginkan.", note: "Ceritakan warna pilihanmu. Kasir akan membantu konsultasi dan menyesuaikan waktu pengerjaan.", services: [["Bleaching", 80000], ["Highlight", 220000], ["Full color", 350000], ["Platinum", 300000]] },
  { id: "perm", title: "Perm", heading: "Bentuk dan tekstur baru.", note: "Pilih treatment sesuai hasil yang kamu inginkan. Durasi ditentukan setelah konsultasi kondisi rambut.", services: [["Cold perm", 250000], ["Design perm", 300000], ["Down perm", 150000], ["Rootlift", 50000]] },
  { id: "care", title: "Perawatan", heading: "Rambut lebih mudah ditata.", note: "Konsultasikan kebutuhan rambutmu sebelum menentukan jadwal smoothing atau keratin.", services: [["Smoothing", 250000], ["Keratin", 300000]] },
] as const;

export function ServiceMenu() {
  return (
    <Tabs defaultValue="haircut" className="hm-service-tabs">
      <TabsList className="hm-service-tablist" aria-label="Kategori layanan">
        <TabsTrigger className="hm-service-tab" value="haircut">Haircut</TabsTrigger>
        {groups.map(group => <TabsTrigger className="hm-service-tab" key={group.id} value={group.id}>{group.title}</TabsTrigger>)}
      </TabsList>
      <TabsContent value="haircut" className="hm-service-content">
        <div className="hm-menu-intro">
          <div className="hm-service-icon"><Scissors aria-hidden="true" /></div>
          <p className="hm-eyebrow">THE EVERYDAY ESSENTIAL</p>
          <h3>Haircut</h3>
          <p>Pilih kapster favoritmu, atau percayakan pilihan pada kasir.</p>
          <span className="hm-duration"><Clock3 aria-hidden="true" /> 40 menit per sesi</span>
        </div>
        <div className="hm-menu-prices">
          <div className="hm-price-table-head"><span>Kapster</span><span>Harga haircut</span></div>
          <ul className="hm-price-list">
            {BARBERS.map(barber => <li key={barber.id}><span>{barber.name}</span><strong>{formatRupiah(barber.haircutPrice)}</strong></li>)}
          </ul>
          <div className="hm-addons"><span>Tambahan layanan</span><p>Keramas <strong>Rp10.000</strong><span aria-hidden="true"> / </span>Shaving <strong>Rp10.000</strong></p><small>Chat kasir untuk menyesuaikan durasi tambahan.</small></div>
          <a className="hm-button hm-button-primary" href="#booking">Booking haircut <ArrowUpRight aria-hidden="true" /></a>
        </div>
      </TabsContent>
      {groups.map(group => (
        <TabsContent key={group.id} value={group.id} className="hm-service-content">
          <div className="hm-menu-intro"><div className="hm-service-icon"><MessageCircle aria-hidden="true" /></div><p className="hm-eyebrow">KONSULTASI PERSONAL</p><h3>{group.heading}</h3><p>{group.note}</p><span className="hm-duration">Reservasi melalui WhatsApp</span></div>
          <div className="hm-menu-prices"><div className="hm-price-table-head"><span>Layanan</span><span>Harga</span></div>
            <ul className="hm-price-list">{group.services.map(([name, price]) => <li key={name}><span>{name}</span><strong>{formatRupiah(price)}</strong></li>)}</ul>
            <a className="hm-button hm-button-primary" href={whatsappLink(`Halo Hairmagic, saya ingin konsultasi layanan ${group.title} dan jadwal reservasinya.`)} target="_blank" rel="noreferrer">Konsultasi {group.title.toLowerCase()} <ArrowUpRight aria-hidden="true" /></a>
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}
