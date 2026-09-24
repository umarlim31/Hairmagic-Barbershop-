import { getFeedbackOwnerAccess } from "@/lib/owner-auth";
import { supabaseRpc } from "@/lib/supabase-rest";
import type { FeedbackReport, FeedbackRow } from "@/lib/feedback-config";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store, max-age=0", "Vary": "Cookie" };

export async function GET(request: Request) {
  const access = await getFeedbackOwnerAccess();
  if (access !== 200) return Response.json({ error: access === 503 ? "Akses owner belum tersedia." : "Hanya akun owner yang dapat membaca penilaian." }, { status: access, headers });
  const cursor = new URL(request.url).searchParams.get("cursor");
  if (cursor && !/^\d{4}-\d{2}-\d{2}~[0-9a-f-]{36}$/i.test(cursor)) return Response.json({ error: "Halaman tidak valid." }, { status: 400, headers });
  try {
    const [day, id] = cursor?.split("~") ?? [];
    const result = await supabaseRpc<{ counts: { rating: number; count: number }[]; rows: FeedbackRow[] }>("hm_feedback_report", { p_day: day ?? null, p_id: id ?? null });
    const { counts, rows } = result;
    const distribution = [1, 2, 3, 4, 5].map(rating => ({ rating, count: Number(counts.find(row => row.rating === rating)?.count ?? 0) }));
    const total = distribution.reduce((sum, row) => sum + row.count, 0);
    const score = distribution.reduce((sum, row) => sum + row.rating * row.count, 0);
    const satisfied = distribution.filter(row => row.rating >= 4).reduce((sum, row) => sum + row.count, 0);
    const items = rows.slice(0, 20);
    const last = items.at(-1);
    const report: FeedbackReport = {
      summary: { total, average: total ? score / total : 0, satisfied, distribution },
      items,
      nextCursor: rows.length > 20 && last ? `${last.submittedDay}~${last.id}` : null,
    };
    return Response.json(report, { headers });
  } catch {
    console.error("Owner feedback report unavailable.");
    return Response.json({ error: "Penilaian belum dapat dimuat. Silakan coba lagi." }, { status: 503, headers });
  }
}
