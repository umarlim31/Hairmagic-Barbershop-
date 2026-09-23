import { isSupabaseConfigured } from "./config.js";
import { rpc } from "./lib/supabase.js";

const form = document.querySelector<HTMLFormElement>("#feedback-form");
const status = document.querySelector<HTMLElement>("#feedback-status");

form?.addEventListener("submit", async event => {
  event.preventDefault();
  if (!isSupabaseConfigured()) {
    if (status) status.textContent = "Supabase belum terhubung. Penilaian belum terkirim.";
    return;
  }
  const data = new FormData(form);
  try {
    await rpc("public_submit_rating", {
      p_rating: Number(data.get("rating")),
      p_category: String(data.get("category") || "lainnya"),
      p_message: String(data.get("message") || "").trim() || null,
      p_source: new URLSearchParams(location.search).get("source") === "qr" ? "qr" : "website"
    });
    form.reset();
    if (status) status.textContent = "Terima kasih. Penilaianmu sudah terkirim secara anonim.";
  } catch (error) {
    if (status) status.textContent = error instanceof Error ? error.message : "Gagal mengirim penilaian.";
  }
});
