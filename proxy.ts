import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "./lib/supabase-config";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const client = createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(values) {
        values.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        values.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  try { await client.auth.getUser(); } catch { /* Route authorization fails closed. */ }
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  return response;
}
export const config = { matcher: ["/owner/:path*", "/api/owner/:path*"] };
