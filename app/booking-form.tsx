"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { ArrowRight, CalendarCheck2, CheckCircle2, Clock3, LoaderCircle, MessageCircle, RotateCcw, Scissors } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { BARBERS, formatRupiah, getTodayInWita } from "@/lib/booking-config";
import { whatsappLink } from "@/lib/site-config";

type BookingResult = {
  booking: { code: string; customerName: string; bookingDate: string; startTime: string; endTime: string; barberName: string; status: "pending" };
  whatsappUrl: string;
};
type FormState = {
  customerName: string; customerPhone: string; bookingDate: string;
  barberId: string; startTime: string; notes: string; website: string;
};
const emptyForm: FormState = {
  customerName: "", customerPhone: "", bookingDate: "", barberId: "",
  startTime: "", notes: "", website: "",
};
const initialSlotMessage = "Pilih tanggal untuk melihat jam yang tersedia.";
function formatBookingDate(date: string) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "long", timeZone: "Asia/Makassar" }).format(new Date(date + "T00:00:00+08:00"));
}

export function BookingForm() {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [slots, setSlots] = useState<string[]>([]);
  const [slotMessage, setSlotMessage] = useState(initialSlotMessage);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [availabilityVersion, setAvailabilityVersion] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<BookingResult | null>(null);
  const successHeading = useRef<HTMLHeadingElement>(null);
  const selectedBarber = BARBERS.find(barber => barber.id === form.barberId);
  const priceLabel = selectedBarber ? formatRupiah(selectedBarber.haircutPrice) : "Rp40.000–Rp60.000";

  useEffect(() => {
    if (result) successHeading.current?.focus();
  }, [result]);

  useEffect(() => {
    if (!form.bookingDate) return;
    const controller = new AbortController();
    let active = true;
    const params = new URLSearchParams({ date: form.bookingDate });
    if (form.barberId) params.set("barber", form.barberId);
    async function loadAvailability() {
      try {
        const response = await fetch("/api/availability?" + params.toString(), { signal: controller.signal, cache: "no-store" });
        const data = await response.json() as { slots?: string[]; message?: string | null; error?: string };
        if (!response.ok) throw new Error(data.error || "Jadwal belum dapat dimuat.");
        if (!active) return;
        setSlots(data.slots ?? []);
        setSlotMessage(data.message || (data.slots?.length ?? 0) + " jam tersedia. Semua waktu dalam WITA.");
      } catch (caught) {
        if (!active) return;
        if (caught instanceof DOMException && caught.name === "AbortError") return;
        setSlotMessage(caught instanceof Error ? caught.message : "Jadwal belum dapat dimuat. Silakan chat kasir.");
      } finally {
        if (active) setLoadingSlots(false);
      }
    }
    void loadAvailability();
    return () => { active = false; controller.abort(); };
  }, [form.bookingDate, form.barberId, availabilityVersion]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(current => ({ ...current, [key]: value }));
  }
  function updateSchedule(key: "bookingDate" | "barberId", value: string) {
    if (form[key] === value) return;
    const nextDate = key === "bookingDate" ? value : form.bookingDate;
    setForm(current => ({ ...current, [key]: value, startTime: "" }));
    setSlots([]);
    setError("");
    setLoadingSlots(Boolean(nextDate));
    setSlotMessage(nextDate ? "Memeriksa jadwal..." : initialSlotMessage);
  }
  function resetBooking() {
    setResult(null);
    setForm(emptyForm);
    setSlots([]);
    setError("");
    setSlotMessage(initialSlotMessage);
    setLoadingSlots(false);
  }
  async function submitBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!form.startTime) { setError("Pilih salah satu jam yang tersedia."); return; }
    setSubmitting(true);
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, barberId: form.barberId || null }),
      });
      const data = await response.json() as BookingResult & { error?: string };
      if (!response.ok) {
        if (response.status === 409) {
          setForm(current => ({ ...current, startTime: "" }));
          setSlots([]);
          setLoadingSlots(true);
          setSlotMessage("Memperbarui jadwal...");
          setAvailabilityVersion(current => current + 1);
        }
        throw new Error(data.error || "Booking belum dapat disimpan.");
      }
      setResult(data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Booking belum dapat disimpan. Silakan coba kembali.");
    } finally { setSubmitting(false); }
  }

  if (result) {
    return (
      <div className="hm-booking-success">
        <div className="hm-success-icon"><CheckCircle2 aria-hidden="true" /></div>
        <p className="hm-eyebrow">PERMINTAAN TERSIMPAN</p>
        <h3 ref={successHeading} tabIndex={-1}>Satu langkah lagi.</h3>
        <p>Kirim ringkasan ke WhatsApp Hairmagic. Booking kamu masih menunggu konfirmasi kasir.</p>
        <dl className="hm-booking-ticket">
          <div><dt>Kode booking</dt><dd>{result.booking.code}</dd></div>
          <div><dt>Jadwal</dt><dd>{formatBookingDate(result.booking.bookingDate)}<br />{result.booking.startTime} WITA</dd></div>
          <div><dt>Kapster</dt><dd>{result.booking.barberName}</dd></div>
          <div><dt>Status</dt><dd className="hm-pending">Menunggu konfirmasi</dd></div>
        </dl>
        <Button asChild size="lg" className="hm-button hm-button-primary hm-submit">
          <a href={result.whatsappUrl} target="_blank" rel="noreferrer"><MessageCircle aria-hidden="true" /> Lanjutkan ke WhatsApp <ArrowRight aria-hidden="true" /></a>
        </Button>
        <Button type="button" variant="ghost" className="hm-reset-button" onClick={resetBooking}><RotateCcw aria-hidden="true" /> Buat booking lain</Button>
      </div>
    );
  }

  return (
    <form className="hm-booking-form" onSubmit={submitBooking}>
      <div className="hm-form-heading">
        <div className="hm-form-service"><span><Scissors aria-hidden="true" /></span><div><h3>Booking haircut</h3><p>{priceLabel}</p></div></div>
        <span className="hm-duration-chip"><Clock3 aria-hidden="true" /> 40 menit</span>
      </div>
      <fieldset className="hm-form-section">
        <legend><span>01</span> Pilih jadwal</legend>
        <div className="hm-form-grid">
          <div className="hm-field">
            <Label htmlFor="barber">Kapster <span className="hm-optional">opsional</span></Label>
            <Select value={form.barberId || "any"} onValueChange={value => updateSchedule("barberId", value === "any" ? "" : value)} disabled={submitting}>
              <SelectTrigger id="barber" className="hm-control"><SelectValue /></SelectTrigger>
              <SelectContent className="hm-select-menu" position="popper" align="start">
                <SelectItem value="any">Bebas, sesuai ketersediaan</SelectItem>
                {BARBERS.map(barber => <SelectItem key={barber.id} value={barber.id}>{barber.name} · {formatRupiah(barber.haircutPrice)}</SelectItem>)}
              </SelectContent>
            </Select>
            <span className="hm-field-help">{selectedBarber ? "Haircut bersama " + selectedBarber.name + "." : "Kasir akan membantu memilihkan kapster."}</span>
          </div>
          <div className="hm-field">
            <Label htmlFor="booking-date">Tanggal</Label>
            <Input id="booking-date" name="bookingDate" type="date" min={getTodayInWita()} value={form.bookingDate} onChange={event => updateSchedule("bookingDate", event.target.value)} required className="hm-control" disabled={submitting} aria-describedby="date-help" />
            <span className="hm-field-help" id="date-help">Selasa–Minggu. Minimal 5 jam sebelum cukur.</span>
          </div>
        </div>
        <fieldset className="hm-slot-fieldset">
          <legend>Jam kunjungan <span className="hm-optional">WITA</span></legend>
          <div className="hm-slot-status" role="status" aria-live="polite">{loadingSlots ? <LoaderCircle className="hm-spin" aria-hidden="true" /> : <CalendarCheck2 aria-hidden="true" />}<span>{slotMessage}</span></div>
          {slots.length > 0 && (
            <RadioGroup value={form.startTime} onValueChange={value => update("startTime", value)} className="hm-slot-grid" aria-label="Jam kunjungan dalam WITA" disabled={submitting}>
              {slots.map(slot => (
                <div key={slot} className={"hm-slot-option" + (form.startTime === slot ? " is-selected" : "")}>
                  <RadioGroupItem id={"slot-" + slot} value={slot} className="hm-slot-input" />
                  <Label htmlFor={"slot-" + slot}>{slot}</Label>
                </div>
              ))}
            </RadioGroup>
          )}
        </fieldset>
      </fieldset>
      <fieldset className="hm-form-section hm-contact-fields">
        <legend><span>02</span> Kontak kamu</legend>
        <div className="hm-form-grid">
          <div className="hm-field"><Label htmlFor="customer-name">Nama</Label><Input id="customer-name" name="customerName" value={form.customerName} onChange={event => update("customerName", event.target.value)} placeholder="Nama kamu" autoComplete="name" required minLength={2} maxLength={80} className="hm-control" disabled={submitting} /></div>
          <div className="hm-field"><Label htmlFor="customer-phone">Nomor WhatsApp</Label><Input id="customer-phone" name="customerPhone" type="tel" value={form.customerPhone} onChange={event => update("customerPhone", event.target.value)} placeholder="08xxxxxxxxxx" inputMode="tel" autoComplete="tel" required minLength={8} maxLength={24} className="hm-control" disabled={submitting} /></div>
        </div>
        <div className="hm-field hm-notes-field"><Label htmlFor="booking-notes">Catatan <span className="hm-optional">opsional</span></Label><Textarea id="booking-notes" name="notes" value={form.notes} onChange={event => update("notes", event.target.value)} placeholder="Misalnya, ingin konsultasi model rambut." maxLength={500} rows={2} className="hm-control hm-textarea" disabled={submitting} /></div>
      </fieldset>
      <div className="hm-honeypot" aria-hidden="true"><Label htmlFor="website">Website</Label><Input id="website" name="website" value={form.website} onChange={event => update("website", event.target.value)} autoComplete="off" tabIndex={-1} /></div>
      {error && <p className="hm-form-error" role="alert">{error}</p>}
      <Button type="submit" size="lg" className="hm-button hm-button-primary hm-submit" disabled={submitting || loadingSlots || !form.startTime}>{submitting ? <><LoaderCircle className="hm-spin" aria-hidden="true" /> Menyimpan...</> : <>Kirim permintaan booking <ArrowRight aria-hidden="true" /></>}</Button>
      <p className="hm-policy-copy">Jadwal final setelah dikonfirmasi kasir melalui WhatsApp.<br />Butuh bantuan? <a href={whatsappLink()} target="_blank" rel="noreferrer">Chat Hairmagic</a></p>
    </form>
  );
}
