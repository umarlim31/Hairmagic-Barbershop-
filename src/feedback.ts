import { isSupabaseConfigured } from "./config.js";
import { rpc } from "./lib/supabase.js";

const form = document.querySelector<HTMLFormElement>("#feedback-form");
const status = document.querySelector<HTMLElement>("#feedback-status");

function todayWita(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Makassar", year: "numeric", month: "2-digit", day: "2-digit"
  }).formatToParts(new Date());
  const map = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${map.year}-${map.month}-${map.day}`;
}

form?.addEventListener("submit", async event => {
  event.preventDefault();
  if (!isSupabaseConfigured()) {
    if (status) status.textContent = "Supabase belum terhubung. Penilaian belum terkirim.";
    return;
  }
  const data = new FormData(form);
  const category = String(data.get("category") || "lainnya");
  const rawMessage = String(data.get("message") || "").trim();
  const message = rawMessage ? `[${category}] ${rawMessage}` : `[${category}]`;
  try {
    await rpc<void>("hm_submit_feedback", {
      payload: {
        id: crypto.randomUUID(),
        rating: Number(data.get("rating")),
        message,
        submitted_day: todayWita()
      }
    });
    form.reset();
    if (status) status.textContent = "Terima kasih. Penilaianmu sudah terkirim secara anonim.";
  } catch (error) {
    if (status) status.textContent = error instanceof Error ? error.message : "Gagal mengirim penilaian.";
  }
});
