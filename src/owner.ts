import { isSupabaseConfigured } from "./config.js";
import { clearSession, deleteMediaObject, getSession, ownerLogin, publicMediaUrl, rest, rpc, uploadMedia } from "./lib/supabase.js";

type Summary = { bookings_today: number; bookings_upcoming: number; ratings_count: number; average_rating: number | null; active_media: number };
type MediaItem = { id: string; storage_path: string; section: string; caption?: string; alt_text?: string; sort_order: number; is_active: boolean };
type Rating = { id: string; rating: number; category: string; message?: string; source: string; created_at: string };

const loginForm = document.querySelector<HTMLFormElement>("#owner-login-form");
const app = document.querySelector<HTMLElement>("#owner-app");
const gate = document.querySelector<HTMLElement>("#owner-gate");
const message = document.querySelector<HTMLElement>("#owner-message");

function escapeHtml(value: unknown): string {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[char] || char));
}

function token(): string | null { return getSession()?.access_token || null; }
function showMessage(text: string) { if (message) message.textContent = text; }

async function loadSummary() {
  const t = token(); if (!t) return;
  const rows = await rpc<Summary[]>("owner_report_summary", {}, t);
  const s = rows[0]; if (!s) return;
  for (const [id, value] of Object.entries({
    "kpi-bookings": s.bookings_today,
    "kpi-upcoming": s.bookings_upcoming,
    "kpi-rating": s.average_rating == null ? "—" : s.average_rating.toFixed(1),
    "kpi-media": s.active_media
  })) {
    const el = document.getElementById(id); if (el) el.textContent = String(value);
  }
}

async function loadMedia() {
  const t = token(); if (!t) return;
  const items = await rest<MediaItem[]>("media_items?select=*&order=sort_order.asc", {}, t);
  const list = document.querySelector<HTMLElement>("#owner-media-list"); if (!list) return;
  list.innerHTML = items.map(item => `<article class="owner-row"><img src="${escapeHtml(publicMediaUrl(item.storage_path))}" alt="${escapeHtml(item.alt_text || "Media Hairmagic")}"><div><strong>${escapeHtml(item.caption || item.storage_path)}</strong><small>${escapeHtml(item.section)} · urutan ${item.sort_order} · ${item.is_active ? "aktif" : "nonaktif"}</small></div><button data-delete-media="${escapeHtml(item.id)}" data-path="${escapeHtml(item.storage_path)}" class="button ghost">Hapus</button></article>`).join("") || "<p>Belum ada media.</p>";
  list.querySelectorAll<HTMLButtonElement>("[data-delete-media]").forEach(btn => btn.addEventListener("click", async () => {
    const path = btn.dataset.path || "";
    await rest(`media_items?id=eq.${encodeURIComponent(btn.dataset.deleteMedia || "")}`, { method: "DELETE", headers: { Prefer: "return=minimal" } }, t);
    if (path) await deleteMediaObject(path, t);
    await loadMedia(); await loadSummary();
  }));
}

async function loadRatings() {
  const t = token(); if (!t) return;
  const rows = await rest<Rating[]>("ratings?select=id,rating,category,message,source,created_at&order=created_at.desc&limit=30", {}, t);
  const list = document.querySelector<HTMLElement>("#owner-ratings-list"); if (!list) return;
  list.innerHTML = rows.map(r => `<article class="feedback-row"><strong>${"★".repeat(r.rating)}${"☆".repeat(5-r.rating)}</strong><span>${escapeHtml(r.category)} · ${escapeHtml(r.source)}</span><p>${escapeHtml(r.message || "Tanpa komentar")}</p><small>${escapeHtml(new Date(r.created_at).toLocaleString("id-ID", { timeZone: "Asia/Makassar" }))} WITA</small></article>`).join("") || "<p>Belum ada penilaian.</p>";
}

async function enterOwner() {
  gate?.classList.add("hidden"); app?.classList.remove("hidden");
  await Promise.all([loadSummary(), loadMedia(), loadRatings()]);
}

loginForm?.addEventListener("submit", async event => {
  event.preventDefault();
  if (!isSupabaseConfigured()) { showMessage("Supabase belum dikonfigurasi."); return; }
  const data = new FormData(loginForm);
  try {
    const session = await ownerLogin(String(data.get("email") || ""), String(data.get("password") || ""));
    if (session.user?.app_metadata?.role !== "owner") {
      clearSession(); throw new Error("Akun ini bukan Owner Hairmagic.");
    }
    showMessage(""); await enterOwner();
  } catch (error) { showMessage(error instanceof Error ? error.message : "Login gagal."); }
});

document.querySelector("#owner-logout")?.addEventListener("click", () => { clearSession(); location.reload(); });

document.querySelector<HTMLFormElement>("#media-upload-form")?.addEventListener("submit", async event => {
  event.preventDefault();
  const t = token(); if (!t) return;
  const form = event.currentTarget as HTMLFormElement;
  const data = new FormData(form);
  const file = data.get("file");
  if (!(file instanceof File) || !file.size) return showMessage("Pilih file media terlebih dahulu.");
  if (file.size > 12 * 1024 * 1024) return showMessage("Ukuran media maksimal 12 MB.");
  const section = String(data.get("section") || "gallery");
  const safeName = file.name.toLowerCase().replace(/[^a-z0-9._-]+/g, "-");
  const path = `${section}/${Date.now()}-${safeName}`;
  try {
    await uploadMedia(path, file, t);
    await rest("media_items", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        storage_path: path,
        section,
        caption: String(data.get("caption") || "").trim() || null,
        alt_text: String(data.get("alt_text") || "").trim() || "Hairmagic Barbershop",
        sort_order: Number(data.get("sort_order") || 0),
        is_active: true
      })
    }, t);
    form.reset(); showMessage("Media berhasil ditambahkan."); await loadMedia(); await loadSummary();
  } catch (error) { showMessage(error instanceof Error ? error.message : "Upload gagal."); }
});

if (token()) enterOwner().catch(() => { clearSession(); });
