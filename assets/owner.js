import { isSupabaseConfigured } from "./config.js";
import { clearSession, deleteMediaObject, getSession, ownerLogin, publicMediaUrl, rest, uploadMedia } from "./lib/supabase.js";
const loginForm = document.querySelector("#owner-login-form");
const app = document.querySelector("#owner-app");
const gate = document.querySelector("#owner-gate");
const message = document.querySelector("#owner-message");
function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[char] || char));
}
function token() { return getSession()?.access_token || null; }
function showMessage(text) { if (message)
    message.textContent = text; }
function todayWita() {
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Makassar", year: "numeric", month: "2-digit", day: "2-digit"
    }).formatToParts(new Date());
    const map = Object.fromEntries(parts.map(part => [part.type, part.value]));
    return `${map.year}-${map.month}-${map.day}`;
}
async function assertOwner(t) {
    const rows = await rest("owner_accounts?select=user_id&limit=1", {}, t);
    if (!rows.length)
        throw new Error("Akun ini bukan Owner Hairmagic.");
}
async function loadSummary() {
    const t = token();
    if (!t)
        return;
    const today = todayWita();
    const [bookings, feedback, media] = await Promise.all([
        rest(`bookings?select=booking_date,status&booking_date=gte.${today}`, {}, t),
        rest("feedback?select=id,rating,message,submitted_day", {}, t),
        rest("media_assets?select=id,storage_bucket,storage_path,kind,title,alt_text,caption,sort_order,published,is_hero", {}, t)
    ]);
    const active = bookings.filter(b => b.status !== "cancelled");
    const upcoming = bookings.filter(b => ["pending", "confirmed", "checked_in"].includes(b.status));
    const avg = feedback.length ? feedback.reduce((sum, row) => sum + row.rating, 0) / feedback.length : null;
    const values = {
        "kpi-bookings": active.filter(b => b.booking_date === today).length,
        "kpi-upcoming": upcoming.length,
        "kpi-rating": avg == null ? "—" : avg.toFixed(1),
        "kpi-media": media.filter(m => m.published).length
    };
    for (const [id, value] of Object.entries(values)) {
        const el = document.getElementById(id);
        if (el)
            el.textContent = String(value);
    }
}
async function loadMedia() {
    const t = token();
    if (!t)
        return;
    const items = await rest("media_assets?select=*&order=sort_order.asc", {}, t);
    const list = document.querySelector("#owner-media-list");
    if (!list)
        return;
    list.innerHTML = items.map(item => {
        const preview = item.kind === "image" && item.storage_bucket === "hairmagic-media"
            ? `<img src="${escapeHtml(publicMediaUrl(item.storage_bucket, item.storage_path))}" alt="${escapeHtml(item.alt_text || "Media Hairmagic")}">`
            : `<div class="media-kind">${escapeHtml(item.kind.toUpperCase())}</div>`;
        const placement = item.is_hero ? "hero" : "galeri";
        return `<article class="owner-row">${preview}<div><strong>${escapeHtml(item.title || item.caption || item.storage_path)}</strong><small>${placement} · urutan ${item.sort_order} · ${item.published ? "publik" : "draft"}</small></div><button data-delete-media="${escapeHtml(item.id)}" data-bucket="${escapeHtml(item.storage_bucket)}" data-path="${escapeHtml(item.storage_path)}" class="button ghost">Hapus</button></article>`;
    }).join("") || "<p>Belum ada media.</p>";
    list.querySelectorAll("[data-delete-media]").forEach(btn => btn.addEventListener("click", async () => {
        const bucket = btn.dataset.bucket || "hairmagic-media";
        const path = btn.dataset.path || "";
        if (path)
            await deleteMediaObject(bucket, path, t);
        await rest(`media_assets?id=eq.${encodeURIComponent(btn.dataset.deleteMedia || "")}`, { method: "DELETE", headers: { Prefer: "return=minimal" } }, t);
        await loadMedia();
        await loadSummary();
    }));
}
async function loadRatings() {
    const t = token();
    if (!t)
        return;
    const rows = await rest("feedback?select=id,rating,message,submitted_day&order=submitted_day.desc&limit=30", {}, t);
    const list = document.querySelector("#owner-ratings-list");
    if (!list)
        return;
    list.innerHTML = rows.map(r => `<article class="feedback-row"><strong>${"★".repeat(r.rating)}${"☆".repeat(5 - r.rating)}</strong><p>${escapeHtml(r.message || "Tanpa komentar")}</p><small>${escapeHtml(r.submitted_day)} · anonim</small></article>`).join("") || "<p>Belum ada penilaian.</p>";
}
async function enterOwner() {
    const t = token();
    if (!t)
        return;
    await assertOwner(t);
    gate?.classList.add("hidden");
    app?.classList.remove("hidden");
    await Promise.all([loadSummary(), loadMedia(), loadRatings()]);
}
loginForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!isSupabaseConfigured()) {
        showMessage("Supabase belum dikonfigurasi.");
        return;
    }
    const data = new FormData(loginForm);
    try {
        const session = await ownerLogin(String(data.get("email") || ""), String(data.get("password") || ""));
        await assertOwner(session.access_token);
        showMessage("");
        await enterOwner();
    }
    catch (error) {
        clearSession();
        showMessage(error instanceof Error ? error.message : "Login gagal.");
    }
});
document.querySelector("#owner-logout")?.addEventListener("click", () => { clearSession(); location.reload(); });
document.querySelector("#media-upload-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const t = token();
    if (!t)
        return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const file = data.get("file");
    if (!(file instanceof File) || !file.size)
        return showMessage("Pilih file media terlebih dahulu.");
    if (file.size > 12 * 1024 * 1024)
        return showMessage("Ukuran media maksimal 12 MB.");
    const placement = String(data.get("section") || "gallery");
    const bucket = "hairmagic-media";
    const kind = file.type.startsWith("video/") ? "video" : "image";
    const safeName = file.name.toLowerCase().replace(/[^a-z0-9._-]+/g, "-");
    const path = `${placement}/${Date.now()}-${safeName}`;
    try {
        await uploadMedia(bucket, path, file, t);
        await rest("media_assets", {
            method: "POST",
            headers: { Prefer: "return=minimal" },
            body: JSON.stringify({
                storage_bucket: bucket,
                storage_path: path,
                kind,
                title: String(data.get("caption") || "").trim(),
                caption: String(data.get("caption") || "").trim(),
                alt_text: String(data.get("alt_text") || "").trim() || "Hairmagic Barbershop",
                sort_order: Number(data.get("sort_order") || 0),
                published: true,
                is_hero: placement === "hero"
            })
        }, t);
        form.reset();
        showMessage("Media berhasil ditambahkan.");
        await loadMedia();
        await loadSummary();
    }
    catch (error) {
        showMessage(error instanceof Error ? error.message : "Upload gagal.");
    }
});
if (token())
    enterOwner().catch(() => { clearSession(); });
