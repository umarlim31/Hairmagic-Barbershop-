"use client";
import Link from "next/link";
import { useState } from "react";
import { LockKeyhole } from "lucide-react";
export function OwnerLogin() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return <main className="hm-owner-gate"><div><LockKeyhole aria-hidden="true" /><p className="hm-eyebrow">RUANG OWNER</p><h1>Masuk ke Hairmagic.</h1><p>Gunakan akun owner website Hairmagic.</p>
    <form className="hm-booking-form" onSubmit={async event => {
      event.preventDefault(); setBusy(true); setError("");
      const form = new FormData(event.currentTarget);
      try {
        const response = await fetch("/api/owner/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: form.get("email"), password: form.get("password") }) });
        if (!response.ok) { const result = await response.json() as { error?: string }; throw new Error(result.error || "Tidak dapat masuk."); }
        window.location.assign("/owner/feedback");
      } catch (reason) { setError(reason instanceof Error ? reason.message : "Koneksi terputus."); setBusy(false); }
    }}>
      <label className="hm-field">Email<input name="email" type="email" autoComplete="username" required /></label>
      <label className="hm-field">Password<input name="password" type="password" autoComplete="current-password" required /></label>
      {error && <p className="hm-feedback-error" role="alert">{error}</p>}
      <button className="hm-button hm-button-blue" disabled={busy}>{busy ? "Memeriksa akun…" : "Masuk"}</button>
    </form><Link href="/" className="hm-gate-back">Kembali ke website</Link></div></main>;
}
