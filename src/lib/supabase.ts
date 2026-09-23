import { config, isSupabaseConfigured } from "../config.js";

export type Session = {
  access_token: string;
  refresh_token?: string;
  user?: { email?: string; app_metadata?: Record<string, unknown> };
};

const storageKey = "hairmagic_owner_session";

function headers(token?: string, json = true): HeadersInit {
  const h: Record<string, string> = {
    apikey: config.supabaseAnonKey,
    Authorization: `Bearer ${token || config.supabaseAnonKey}`
  };
  if (json) h["Content-Type"] = "application/json";
  return h;
}

async function request<T>(path: string, init: RequestInit = {}, token?: string): Promise<T> {
  if (!isSupabaseConfigured()) throw new Error("Supabase belum dikonfigurasi.");
  const res = await fetch(`${config.supabaseUrl}${path}`, {
    ...init,
    headers: { ...headers(token), ...(init.headers || {}) }
  });
  const text = await res.text();
  const body = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(body?.message || body?.error_description || body?.error || `HTTP ${res.status}`);
  return body as T;
}

export async function rpc<T>(name: string, payload: unknown, token?: string): Promise<T> {
  return request<T>(`/rest/v1/rpc/${name}`, { method: "POST", body: JSON.stringify(payload) }, token);
}

export async function rest<T>(path: string, init: RequestInit = {}, token?: string): Promise<T> {
  return request<T>(`/rest/v1/${path}`, init, token);
}

export async function ownerLogin(email: string, password: string): Promise<Session> {
  const session = await request<Session>(
    "/auth/v1/token?grant_type=password",
    { method: "POST", body: JSON.stringify({ email, password }) }
  );
  sessionStorage.setItem(storageKey, JSON.stringify(session));
  return session;
}

export function getSession(): Session | null {
  try {
    const raw = sessionStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) as Session : null;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  sessionStorage.removeItem(storageKey);
}

export async function uploadMedia(path: string, file: File, token: string): Promise<void> {
  if (!isSupabaseConfigured()) throw new Error("Supabase belum dikonfigurasi.");
  const res = await fetch(`${config.supabaseUrl}/storage/v1/object/website-media/${encodeURIComponent(path)}`, {
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

export async function deleteMediaObject(path: string, token: string): Promise<void> {
  if (!isSupabaseConfigured()) throw new Error("Supabase belum dikonfigurasi.");
  const objectPath = path.split("/").map(encodeURIComponent).join("/");
  const res = await fetch(`${config.supabaseUrl}/storage/v1/object/website-media/${objectPath}`, {
    method: "DELETE",
    headers: headers(token, false)
  });
  if (!res.ok && res.status !== 404) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.message || `Hapus media gagal (${res.status}).`);
  }
}

export function publicMediaUrl(path: string): string {
  return `${config.supabaseUrl}/storage/v1/object/public/website-media/${path.split("/").map(encodeURIComponent).join("/")}`;
}
