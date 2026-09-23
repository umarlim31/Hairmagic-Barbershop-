import { isSupabaseConfigured } from "./config.js";
import { generateDailySlots, isBookableSlot, MAX_SIMULTANEOUS_BARBERS } from "./lib/booking.js";
import { publicMediaUrl, rest, rpc } from "./lib/supabase.js";

type Availability = { slot_time: string; remaining: number };
type MediaItem = { id: string; storage_path: string; section: string; caption?: string; alt_text?: string; sort_order: number };

function escapeHtml(value: unknown): string {
  return String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char] || char));
}

const $ = <T extends HTMLElement>(selector: string) => document.querySelector<T>(selector);
const form = $("#booking-form") as HTMLFormElement | null;
const dateInput = $("#booking-date") as HTMLInputElement | null;
const timeSelect = $("#booking-time") as HTMLSelectElement | null;
const barberSelect = $("#booking-barber") as HTMLSelectElement | null;
const status = $("#booking-status");

function setStatus(message: string, kind: "ok" | "error" | "muted" = "muted") {
  if (!status) return;
  status.textContent = message;
  status.dataset.kind = kind;
}

function renderSlots(rows?: Availability[]) {
  if (!dateInput || !timeSelect || !dateInput.value) return;
  const byTime = new Map((rows || []).map(r => [r.slot_time.slice(0, 5), r.remaining]));
  timeSelect.innerHTML = '<option value="">Pilih jam</option>';
  for (const time of generateDailySlots()) {
    const remaining = rows ? (byTime.get(time) ?? MAX_SIMULTANEOUS_BARBERS) : MAX_SIMULTANEOUS_BARBERS;
    const enabled = isBookableSlot(dateInput.value, time) && remaining > 0;
    const option = document.createElement("option");
    option.value = time;
    option.disabled = !enabled;
    option.textContent = enabled ? `${time} WITA · ${remaining} slot` : `${time} WITA · tidak tersedia`;
    timeSelect.append(option);
  }
}

async function refreshAvailability() {
  if (!dateInput?.value) return;
  if (!isSupabaseConfigured()) {
    renderSlots();
    setStatus("Mode preview: hubungkan Supabase untuk ketersediaan real-time.");
    return;
  }
  try {
    const rows = await rpc<Availability[]>("public_booking_availability", {
      p_visit_date: dateInput.value,
      p_barber: barberSelect?.value || null
    });
    renderSlots(rows);
    setStatus("Jam tersedia sudah diperbarui.", "ok");
  } catch (error) {
    renderSlots();
    setStatus(error instanceof Error ? error.message : "Gagal memuat ketersediaan.", "error");
  }
}

async function submitBooking(event: SubmitEvent) {
  event.preventDefault();
  if (!form || !dateInput || !timeSelect) return;
  const data = new FormData(form);
  if (!isBookableSlot(dateInput.value, timeSelect.value)) {
    setStatus("Pilih jadwal yang valid dan minimal 5 jam dari sekarang.", "error");
    return;
  }
  if (!isSupabaseConfigured()) {
    setStatus("Supabase belum terhubung. Booking belum dikirim.", "error");
    return;
  }
  try {
    const result = await rpc<{ booking_id: string; whatsapp_text: string }[]>("public_create_booking", {
      p_name: String(data.get("name") || "").trim(),
      p_phone: String(data.get("phone") || "").trim(),
      p_barber: String(data.get("barber") || "").trim() || null,
      p_visit_date: dateInput.value,
      p_visit_time: timeSelect.value,
      p_notes: String(data.get("notes") || "").trim() || null
    });
    const text = result[0]?.whatsapp_text || "Halo Hairmagic, saya sudah mengirim permintaan booking melalui website.";
    setStatus("Permintaan tersimpan. Lanjutkan konfirmasi ke WhatsApp kasir.", "ok");
    window.open(`https://wa.me/62895374034221?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
    form.reset();
    if (timeSelect) timeSelect.innerHTML = '<option value="">Pilih tanggal dulu</option>';
  } catch (error) {
    setStatus(error instanceof Error ? error.message : "Booking gagal dikirim.", "error");
    await refreshAvailability();
  }
}

async function loadMedia() {
  if (!isSupabaseConfigured()) return;
  try {
    const items = await rest<MediaItem[]>("media_items?select=id,storage_path,section,caption,alt_text,sort_order&is_active=eq.true&order=sort_order.asc");
    const gallery = $("#gallery-grid");
    if (!gallery || !items.length) return;
    const galleryItems = items.filter(item => item.section === "gallery");
    if (!galleryItems.length) return;
    gallery.innerHTML = "";
    for (const item of galleryItems) {
      const figure = document.createElement("figure");
      figure.className = "gallery-card";
      figure.innerHTML = `<img src="${escapeHtml(publicMediaUrl(item.storage_path))}" alt="${escapeHtml(item.alt_text || "Hairmagic Barbershop")}" loading="lazy"><figcaption>${escapeHtml(item.caption || "Hairmagic")}</figcaption>`;
      gallery.append(figure);
    }
  } catch {
    // Keep recovery fallback cards when media is unavailable.
  }
}

dateInput?.addEventListener("change", refreshAvailability);
barberSelect?.addEventListener("change", refreshAvailability);
form?.addEventListener("submit", submitBooking);
loadMedia();
