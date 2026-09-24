import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase-server";
import { getFeedbackOwnerAccess } from "@/lib/owner-auth";
import { sameOrigin } from "@/lib/same-origin";
const headers = { "Cache-Control": "private, no-store" };
export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "Permintaan ditolak." }, { status: 403, headers });
  try {
    const text = await request.text();
    if (text.length > 8192) return Response.json({ error: "Permintaan terlalu besar." }, { status: 413, headers });
    const input = z.object({ email: z.string().trim().email().max(254), password: z.string().min(1).max(1024) }).strict().parse(JSON.parse(text));
    const client = await createServerSupabase();
    const { error } = await client.auth.signInWithPassword(input);
    if (error) return Response.json({ error: "Email atau password tidak cocok, atau akses sementara dibatasi." }, { status: 401, headers });
    if (await getFeedbackOwnerAccess() !== 200) {
      await client.auth.signOut({ scope: "local" });
      return Response.json({ error: "Akun ini tidak memiliki akses owner." }, { status: 403, headers });
    }
    return Response.json({ ok: true }, { headers });
  } catch { return Response.json({ error: "Tidak dapat masuk. Periksa isian atau coba kembali." }, { status: 400, headers }); }
}
