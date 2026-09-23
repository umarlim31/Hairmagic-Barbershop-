import { config, isSupabaseConfigured } from "../config.js";
const storageKey = "hairmagic_owner_session";
function headers(token, json = true) {
    const h = { apikey: config.supabasePublishableKey };
    if (token)
        h.Authorization = `Bearer ${token}`;
    if (json)
        h["Content-Type"] = "application/json";
    return h;
}
async function request(path, init = {}, token) {
    if (!isSupabaseConfigured())
        throw new Error("Supabase belum dikonfigurasi.");
    const res = await fetch(`${config.supabaseUrl}${path}`, {
        ...init,
        headers: { ...headers(token), ...(init.headers || {}) }
    });
    const text = await res.text();
    const body = text ? JSON.parse(text) : null;
    if (!res.ok)
        throw new Error(body?.message || body?.error_description || body?.error || `HTTP ${res.status}`);
    return body;
}
export async function rpc(name, payload, token) {
    return request(`/rest/v1/rpc/${name}`, { method: "POST", body: JSON.stringify(payload) }, token);
}
export async function rest(path, init = {}, token) {
    return request(`/rest/v1/${path}`, init, token);
}
export async function ownerLogin(email, password) {
    const session = await request("/auth/v1/token?grant_type=password", { method: "POST", body: JSON.stringify({ email, password }) });
    sessionStorage.setItem(storageKey, JSON.stringify(session));
    return session;
}
export function getSession() {
    try {
        const raw = sessionStorage.getItem(storageKey);
        return raw ? JSON.parse(raw) : null;
    }
    catch {
        return null;
    }
}
export function clearSession() {
    sessionStorage.removeItem(storageKey);
}
function storageObjectPath(bucket, path) {
    return `${encodeURIComponent(bucket)}/${path.split("/").map(encodeURIComponent).join("/")}`;
}
export async function uploadMedia(bucket, path, file, token) {
    if (!isSupabaseConfigured())
        throw new Error("Supabase belum dikonfigurasi.");
    const res = await fetch(`${config.supabaseUrl}/storage/v1/object/${storageObjectPath(bucket, path)}`, {
        method: "POST",
        headers: {
            ...headers(token, false),
            "Content-Type": file.type || "application/octet-stream",
            "x-upsert": "true"
        },
        body: file
    });
    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message || `Upload gagal (${res.status}).`);
    }
}
export async function deleteMediaObject(bucket, path, token) {
    if (!isSupabaseConfigured())
        throw new Error("Supabase belum dikonfigurasi.");
    const res = await fetch(`${config.supabaseUrl}/storage/v1/object/${storageObjectPath(bucket, path)}`, {
        method: "DELETE",
        headers: headers(token, false)
    });
    if (!res.ok && res.status !== 404) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message || `Hapus media gagal (${res.status}).`);
    }
}
export function publicMediaUrl(bucket, path) {
    return `${config.supabaseUrl}/storage/v1/object/public/${storageObjectPath(bucket, path)}`;
}
