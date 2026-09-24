import Link from "next/link";
import type { Metadata } from "next";
import Image from "next/image";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { FeedbackForm } from "./feedback-form";

export const metadata: Metadata = { title: "Penilaian Anonim | Hairmagic Barbershop", robots: { index: false, follow: false } };

export default function FeedbackPage() {
  return (
    <main className="hm-feedback-page">
      <div className="hm-feedback-shell">
        <header className="hm-feedback-header"><Link href="/" className="hm-logo-link" aria-label="Hairmagic Barbershop, kembali ke website"><Image src="/media/hair-magic-logo.webp" alt="" width={48} height={48} /><span><strong>HAIRMAGIC<span className="hm-brand-period">.</span></strong><small>BARBERSHOP</small></span></Link><Link href="/" className="hm-feedback-back"><ArrowLeft aria-hidden="true" /><span>Beranda</span></Link></header>
        <div className="hm-feedback-intro"><p className="hm-eyebrow"><span className="hm-brand-mark" aria-hidden="true" /> SUARA KAMU BERARTI</p><h1>Bagaimana pengalaman<br /><span>cukurmu hari ini?</span></h1><p>Jangan ragu untuk jujur. Kritik dan saranmu membantu kami meningkatkan pelayanan Hairmagic.</p><div className="hm-feedback-private"><ShieldCheck aria-hidden="true" /><span>Anonim. Jawaban hanya dapat dibaca owner.</span></div></div>
        <FeedbackForm />
        <p className="hm-feedback-footer">Terima kasih sudah menjadi bagian dari Hairmagic.</p>
      </div>
    </main>
  );
}
