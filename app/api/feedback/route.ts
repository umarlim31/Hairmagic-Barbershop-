import { z } from "zod";
import { supabaseRpc } from "@/lib/supabase-rest";
import { getTodayInWita } from "@/lib/booking-config";
import { FEEDBACK_MAX_LENGTH } from "@/lib/feedback-config";

const inputSchema = z.object({
  submissionId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  message: z.string().trim().max(FEEDBACK_MAX_LENGTH).default(""),
  website: z.string().max(0).default(""),
}).strict();
const responseHeaders = { "Cache-Control": "no-store" };

async function readSmallJson(request: Request) {
  const reader = request.body?.getReader();
  if (!reader) throw new SyntaxError("Missing body");
  const decoder = new TextDecoder();
  let bytes = 0;
  let text = "";
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 8192) { await reader.cancel(); throw new RangeError("Body too large"); }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
    return JSON.parse(text);
  } finally { reader.releaseLock(); }
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (request.headers.get("sec-fetch-site") === "cross-site" || (origin && origin !== new URL(request.url).origin)) {
    return Response.json({ error: "Silakan kirim penilaian dari halaman Hairmagic." }, { status: 403, headers: responseHeaders });
  }
  try {
    const input = inputSchema.parse(await readSmallJson(request));
    // Retrying an interrupted submission cannot insert a second copy.
      await supabaseRpc("hm_submit_feedback", { payload: {
        id: input.submissionId, rating: input.rating, message: input.message,
        submitted_day: getTodayInWita(),
      } });

    return Response.json({ ok: true }, { status: 201, headers: responseHeaders });
  } catch (error) {
    if (error instanceof RangeError) return Response.json({ error: "Pesan terlalu panjang. Maksimal 1.500 karakter." }, { status: 413, headers: responseHeaders });
    if (error instanceof z.ZodError || error instanceof SyntaxError) return Response.json({ error: "Pilih tingkat kepuasan dan periksa kembali pesanmu." }, { status: 400, headers: responseHeaders });
    // Never log the message or any customer/transport identity.
    console.error("Anonymous feedback could not be saved.");
    return Response.json({ error: "Penilaian belum tersimpan. Pesanmu tetap ada; silakan coba kirim lagi." }, { status: 503, headers: responseHeaders });
  }
}
