import Link from "next/link";
import type { Metadata } from "next";
import Image from "next/image";
import { ArrowLeft, ArrowUpRight, LockKeyhole, ShieldCheck } from "lucide-react";
import { getFeedbackOwnerAccess } from "@/lib/owner-auth";
import { FeedbackReportView } from "./report";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Suara Pelanggan | Owner Hairmagic", robots: { index: false, follow: false } };

export default async function OwnerFeedbackPage() {
  const access = await getFeedbackOwnerAccess();
  if (access !== 200) return (
    <main className="hm-owner-gate"><div><LockKeyhole aria-hidden="true" /><p className="hm-eyebrow">RUANG OWNER</p><h1>Masukan pelanggan,<br />khusus untuk owner.</h1><p>{access === 503 ? "Ruang owner belum tersedia. Silakan coba kembali nanti." : "Masuk dengan akun owner Hairmagic untuk membaca penilaian dan kritik pelanggan."}</p>
      {access === 401 && <a className="hm-button hm-button-blue" href="/owner/login" target="_top">Masuk sebagai owner <ArrowUpRight aria-hidden="true" /></a>}
      {access === 403 && <><p className="hm-feedback-error">Akun ini tidak memiliki akses ke hasil penilaian.</p><form action="/api/owner/logout" method="post"><button className="hm-button hm-button-blue">Keluar dan ganti akun</button></form></>}
      <Link href="/" className="hm-gate-back"><ArrowLeft aria-hidden="true" /> Kembali ke website</Link>
    </div></main>
  );
  return (
    <main className="hm-owner-page hm-container">
      <header className="hm-owner-header"><Link href="/" className="hm-logo-link"><Image src="/media/hair-magic-logo.webp" alt="" width={48} height={48} /><span><strong>HAIRMAGIC<span className="hm-brand-period">.</span></strong><small>RUANG OWNER</small></span></Link><form action="/api/owner/logout" method="post"><button className="hm-owner-signout">Keluar</button></form></header>
      <div className="hm-owner-heading"><div><p className="hm-eyebrow"><ShieldCheck aria-hidden="true" /> HANYA UNTUK OWNER</p><h1>Suara pelanggan.</h1><p>Penilaian jujur untuk pelayanan yang lebih baik.</p></div><a className="hm-button hm-button-blue" href="/penilaian" target="_blank" rel="noreferrer">Buka layar penilaian <ArrowUpRight aria-hidden="true" /></a></div>
      <FeedbackReportView />
    </main>
  );
}
