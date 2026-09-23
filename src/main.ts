import { isSupabaseConfigured } from "./config.js";
import { generateDailySlots, isBookableSlot, MAX_SIMULTANEOUS_BARBERS } from "./lib/booking.js";
import { publicMediaUrl, rest, rpc } from "./lib/supabase.js";

type ActiveBooking = { barber_id: string | null; start_time: string };
type MediaItem = {
  id: string;
  storage_bucket: string;
  storage_path: string;
  kind: "image" | "video";
  title?: string;
  caption?: string;
  alt_text?: string;
  sort_order: number;
  published: boolean;
  is_hero: boolean;
};

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

function selectedBarberId(): string | null {
  return barberSelect?.value ? barberSelect.value.toLowerCase() : null;
}

function renderSlots(rows?: ActiveBooking[]) {
  if (!dateInput || !timeSelect || !dateInput.value) return;
  const totalByTime = new Map<string, number>();
  const barberByTime = new Map<string, number>();
  const selected = selectedBarberId();

  for (const row of rows || []) {
    const time = row.start_time.slice(0, 5);
    totalByTime.set(time, (totalByTime.get(time) || 0) + 1);
    if (selected && row.barber_id === selected) barberByTime.set(time, (barberByTime.get(time) || 0) + 1);
  }

  timeSelect.innerHTML = '<option value="">Pilih jam</option>';

  for (const time of generateDailySlots()) {
    const totalRemaining = MAX_SIMULTANEOUS_BARBERS - (totalByTime.get(time) || 0);
    const remaining = selected ? Math.min(totalRemaining, 1 - (barberByTime.get(time) || 0)) : totalRemaining;
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
    const rows = await rpc<ActiveBooking[]>("hm_active_bookings", { p_date: dateInput.value });
    renderSlots(rows);
    setStatus("Jam tersedia sudah diperbarui.", "ok");
  } catch (error) {
    renderSlots();
    setStatus(error instanceof Error ? error.message : "Gagal memuat ketersediaan.", "error");
  }
}

function cleanPhone(value: string): string {
  return value.replace(/\D/g, "");
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

  const name = String(data.get("name") || "").trim();
  const phone = cleanPhone(String(data.get("phone") || ""));
  const barberName = String(data.get("barber") || "").trim();
  const barberId = barberName ? barberName.toLowerCase() : null;
  const notes = String(data.get("notes") || "").trim();

  try {
    const accepted = await rpc<boolean>("hm_create_booking", {
      payload: {
        id: crypto.randomUUID(),
        customer_name: name,
        customer_phone: phone,
        service_code: "haircut",
        service_name: "Haircut",
        barber_id: barberId,
        barber_name: barberName || null,
        booking_date: dateInput.value,
        start_time: timeSelect.value,
        notes
      }
    });

    if (!accepted) {
      setStatus("Slot baru saja terisi. Pilih jam atau kapster lain.", "error");
      await refreshAvailability();
      return;
    }

    const text = `Halo Hairmagic, saya ${name} sudah mengirim permintaan booking untuk ${dateInput.value} pukul ${timeSelect.value} WITA${barberName ? ` dengan kapster ${barberName}` : ""}. Mohon konfirmasi jadwalnya.`;

    setStatus("Permintaan tersimpan. Lanjutkan konfirmasi ke WhatsApp kasir.", "ok");
    window.open(`https://wa.me/62895374034221?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");

    form.reset();
    timeSelect.innerHTML = '<option value="">Pilih tanggal dulu</option>';
  } catch (error) {
    setStatus(error instanceof Error ? error.message : "Booking gagal dikirim.", "error");
    await refreshAvailability();
  }
}

function mediaMarkup(item: MediaItem): string {
  const url = escapeHtml(publicMediaUrl(item.storage_bucket, item.storage_path));
  const alt = escapeHtml(item.alt_text || item.title || "Hairmagic Barbershop");

  if (item.kind === "video") {
    return `<video src="${url}" muted loop autoplay playsinline preload="metadata" aria-label="${alt}"></video>`;
  }

  return `<img src="${url}" alt="${alt}" loading="lazy">`;
}

let galleryTimer: number | undefined;

function startGalleryRotation(): void {
  const slides = Array.from(document.querySelectorAll<HTMLElement>(".gallery-slide"));
  if (!slides.length) return;

  const count = $("#gallery-count");
  const caption = $("#gallery-caption");
  const progress = document.querySelector<HTMLElement>(".gallery-progress");
  let index = Math.max(0, slides.findIndex(slide => slide.classList.contains("is-active")));

  const render = () => {
    slides.forEach((slide, i) => slide.classList.toggle("is-active", i === index));
    if (count) count.textContent = `${String(index + 1).padStart(2, "0")} / ${String(slides.length).padStart(2, "0")}`;

    const figcaption = slides[index]?.querySelector("figcaption")?.textContent?.trim();
    if (caption) caption.textContent = figcaption || "Hairmagic Barbershop";

    if (progress) {
      progress.style.animation = "none";
      void progress.offsetWidth;
      progress.style.animation = "galleryProgress 5.5s linear infinite";
    }
  };

  render();

  if (galleryTimer) window.clearInterval(galleryTimer);
  if (slides.length > 1) {
    galleryTimer = window.setInterval(() => {
      index = (index + 1) % slides.length;
      render();
    }, 5500);
  }
}

async function loadMedia() {
  startGalleryRotation();

  if (!isSupabaseConfigured()) return;

  try {
    const items = await rest<MediaItem[]>(
      "media_assets?select=id,storage_bucket,storage_path,kind,title,caption,alt_text,sort_order,published,is_hero&published=eq.true&order=sort_order.asc"
    );

    const hero = $("#hero-media");
    const heroItem = items.find(item => item.is_hero);

    if (hero && heroItem) {
      hero.innerHTML = mediaMarkup(heroItem);
    }

    const gallery = $("#gallery-grid");
    const galleryItems = items.filter(item => !item.is_hero);

    if (!gallery || !galleryItems.length) return;

    gallery.innerHTML = "";

    for (const item of galleryItems) {
      const figure = document.createElement("figure");
      figure.className = "gallery-slide";
      figure.innerHTML = `${mediaMarkup(item)}<figcaption>${escapeHtml(item.caption || item.title || "Hairmagic")}</figcaption>`;
      gallery.append(figure);
    }

    gallery.querySelector<HTMLElement>(".gallery-slide")?.classList.add("is-active");
    startGalleryRotation();
  } catch {
    // Keep the recovered Astra-style fallback visual when public media is unavailable.
  }
}

dateInput?.addEventListener("change", refreshAvailability);
barberSelect?.addEventListener("change", refreshAvailability);
form?.addEventListener("submit", submitBooking);

loadMedia();
