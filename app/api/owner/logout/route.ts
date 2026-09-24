import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { sameOrigin } from "@/lib/same-origin";
export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "Permintaan ditolak." }, { status: 403 });
  const client = await createServerSupabase();
  await client.auth.signOut({ scope: "local" });
  const response = NextResponse.redirect(new URL("/owner/login", request.url), 303);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
