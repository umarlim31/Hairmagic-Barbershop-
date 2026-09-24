"use client";

import { useRef, useState } from "react";
import { Annoyed, Check, CheckCircle2, Frown, Laugh, LoaderCircle, Meh, Send, Smile } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { FEEDBACK_MAX_LENGTH, FEEDBACK_RATINGS } from "@/lib/feedback-config";

const faces = [Frown, Annoyed, Meh, Smile, Laugh];

function newSubmissionId() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 15) | 64;
  bytes[8] = (bytes[8] & 63) | 128;
  const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function FeedbackForm() {
  const [rating, setRating] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [sent, setSent] = useState(false);
  const submissionId = useRef<string | null>(null);
  const inFlight = useRef(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current) return;
    if (!rating) { setError("Pilih salah satu ekspresi untuk menilai pengalamanmu."); return; }
    const website = String(new FormData(event.currentTarget).get("website") ?? "");
    inFlight.current = true;
    setSaving(true);
    setError("");
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 20000);
    try {
      submissionId.current ??= newSubmissionId();
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId: submissionId.current, rating: Number(rating), message, website }),
        signal: controller.signal,
      });
      const payload = await response.json() as { ok?: boolean; error?: string };
      if (!response.ok || payload.ok !== true) throw new Error(payload.error || "Penilaian belum tersimpan. Silakan coba lagi.");
      // Clear the answer immediately so the next customer cannot see it.
      setMessage(""); setRating(""); submissionId.current = null; setSent(true);
    } catch (reason) {
      setError(reason instanceof Error && !/fetch|network|json|abort|signal/i.test(reason.message) ? reason.message : "Koneksi terputus. Jawabanmu belum dihapus; silakan coba kirim lagi.");
    } finally { window.clearTimeout(timeout); setSaving(false); inFlight.current = false; }
  }

  if (sent) return (
    <section className="hm-feedback-thanks" role="status" aria-live="polite"><CheckCircle2 aria-hidden="true" /><h2>Terima kasih sudah jujur.</h2><p>Penilaianmu sudah tersimpan untuk owner. Masukanmu membantu kami jadi lebih baik.</p><button type="button" className="hm-button hm-button-blue" onClick={() => { setSent(false); setError(""); }}>Siap untuk pelanggan berikutnya</button></section>
  );

  return (
    <form className="hm-feedback-form" onSubmit={submit} autoComplete="off" aria-busy={saving}>
      <fieldset disabled={saving} className="hm-feedback-rating"><legend>Seberapa puas kamu?</legend>
        <RadioGroup className="hm-rating-options" value={rating} onValueChange={value => { setRating(value); setError(""); }} aria-label="Tingkat kepuasan" disabled={saving} required>
          {FEEDBACK_RATINGS.map((choice, index) => {
            const Face = faces[index];
            return <div key={choice.value} className="hm-rating-option" data-rating={choice.value} data-selected={rating === String(choice.value)}>
              <RadioGroupItem id={`rating-${choice.value}`} value={String(choice.value)} className="hm-rating-input" aria-label={choice.description} />
              <label htmlFor={`rating-${choice.value}`}><Face aria-hidden="true" /><span>{choice.label}</span>{rating === String(choice.value) && <Check className="hm-rating-check" aria-hidden="true" />}</label>
            </div>;
          })}
        </RadioGroup>
      </fieldset>
      <div className="hm-feedback-message"><label htmlFor="feedback-message">Kritik &amp; Saran mu sangat membantu cessku <span>Opsional</span></label><Textarea id="feedback-message" name="message" className="hm-feedback-textarea" placeholder="Tentang hasil cukur, pelayanan, atau hal yang bisa kami perbaiki…" value={message} disabled={saving} maxLength={FEEDBACK_MAX_LENGTH} onChange={event => setMessage(event.target.value)} aria-describedby="feedback-privacy feedback-length" /><div className="hm-feedback-hints"><p id="feedback-privacy">Tidak perlu nama atau nomor telepon. Hindari menuliskannya di pesan agar tetap anonim.</p><span id="feedback-length">{message.length}/1.500</span></div></div>
      <div className="hm-honeypot" aria-hidden="true"><label htmlFor="feedback-website">Website</label><input id="feedback-website" name="website" type="text" tabIndex={-1} autoComplete="off" /></div>
      {error && <p className="hm-feedback-error" role="alert">{error}</p>}
      <button type="submit" disabled={saving || !rating} className="hm-button hm-button-blue hm-feedback-submit">{saving ? <LoaderCircle className="hm-spin" aria-hidden="true" /> : <Send aria-hidden="true" />}{saving ? "Menyimpan penilaian…" : "Kirim penilaian anonim"}</button>
      <p className="hm-feedback-note">Jawaban tidak dipublikasikan dan tidak dihubungkan dengan data booking.</p>
    </form>
  );
}
