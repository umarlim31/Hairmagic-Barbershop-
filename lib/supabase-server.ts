import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "./supabase-config";

export async function createServerSupabase() {
  const jar = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() { return jar.getAll(); },
      setAll(values) {
        try { values.forEach(({ name, value, options }) => jar.set(name, value, options)); }
        catch { /* Server Components cannot write cookies; proxy refreshes them. */ }
      },
    },
  });
}
