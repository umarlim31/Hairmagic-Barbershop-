import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "./supabase-config";
import { createServerSupabase } from "./supabase-server";

export function databaseAvailable() { return Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY); }

export async function supabaseRpc<T>(
  name: "hm_create_booking" | "hm_active_bookings" | "hm_submit_feedback" | "hm_feedback_report",
  payload: Record<string, unknown>,
): Promise<T> {
  if (name === "hm_feedback_report") {
    // Forward the user's verified session. Never substitute a service-role key.
    const client = await createServerSupabase();
    const { data, error } = await client.rpc(name, payload);
    if (error) throw new Error("Owner report unavailable");
    return data as T;
  }
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: { apikey: SUPABASE_PUBLISHABLE_KEY, "Content-Type": "application/json" },
    body: JSON.stringify(payload), cache: "no-store", signal: AbortSignal.timeout(12_000),
  });
  if (!response.ok) {
    await response.body?.cancel();
    throw new Error(`Database request failed (${response.status})`);
  }
  if (response.status === 204) return undefined as T;
  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}
