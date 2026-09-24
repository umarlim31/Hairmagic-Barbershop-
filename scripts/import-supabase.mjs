import { readFile, stat } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { z } from "zod";

const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
});
const clock = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
export function utcTimestamp(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?$/.test(value)) throw new Error("Invalid UTC timestamp");
  const normalized = value.replace(" ", "T");
  const date = new Date(/(Z|[+-]\d{2}:\d{2})$/.test(normalized) ? normalized : `${normalized}Z`);
  if (!Number.isFinite(date.getTime())) throw new Error("Invalid UTC timestamp");
  return date.toISOString();
}
const booking = z.object({
  id: z.string().regex(/^[A-Za-z0-9-]{1,80}$/),
  customer_name: z.string().min(2).max(80), customer_phone: z.string().regex(/^\d{8,15}$/),
  service_code: z.string().min(1), service_name: z.string().min(1),
  barber_id: z.string().nullable(), barber_name: z.string().nullable(),
  booking_date: day, start_time: clock, end_time: clock,
  status: z.string().min(1), source: z.string().min(1), notes: z.string().max(500),
  created_at: z.string().transform(utcTimestamp),
}).strict();
const feedback = z.object({
  id: z.string().uuid(), rating: z.number().int().min(1).max(5),
  message: z.string().max(1500), submitted_day: day,
}).strict();
export function validateExport(value) {
  const parsed = z.object({ bookings: z.array(booking), feedback: z.array(feedback) }).strict().safeParse(value);
  if (!parsed.success) throw new Error("Export tidak valid. Periksa struktur kolom, panjang nilai, UUID, dan tanggal; isi pelanggan tidak ditampilkan.");
  for (const rows of Object.values(parsed.data)) {
    if (new Set(rows.map(row => row.id)).size !== rows.length) throw new Error("Ada ID duplikat pada export sumber.");
  }
  return parsed.data;
}

async function main() {
  const [file, flag, ...extra] = process.argv.slice(2);
  if (!file || (flag && flag !== "--apply") || extra.length) throw new Error("Gunakan: node scripts/import-supabase.mjs <export.json> [--apply]");
  if ((await stat(file)).size > 100 * 1024 * 1024) throw new Error("Export terlalu besar; gunakan proses migrasi bertahap.");
  const data = validateExport(JSON.parse(await readFile(file, "utf8")));
  console.log(JSON.stringify({ mode: flag === "--apply" ? "import" : "dry-run", bookings: data.bookings.length, feedback: data.feedback.length }));
  if (flag !== "--apply") return;
  const base = new URL(process.env.SUPABASE_URL || "https://unconfigured.invalid");
  const key = process.env.SUPABASE_SECRET_KEY;
  if (base.protocol !== "https:" || base.pathname !== "/" || base.search || base.hash || base.username || base.password || !process.env.SUPABASE_URL || !key) {
    throw new Error("Konfigurasi server Supabase belum lengkap.");
  }
  const headers = { apikey: key, "Content-Type": "application/json" };
  if (key.startsWith("eyJ")) headers.Authorization = `Bearer ${key}`;
  async function api(url, options = {}) {
    const response = await fetch(url, { ...options, headers: { ...headers, ...options.headers }, signal: AbortSignal.timeout(30000) });
    if (!response.ok) {
      await response.body?.cancel();
      throw new Error(`Supabase menolak operasi (${response.status}); detail pelanggan tidak ditampilkan.`);
    }
    return response;
  }
  for (const table of ["bookings", "feedback"]) {
    const rows = data[table];
    for (let index = 0; index < rows.length; index += 50) {
      const batch = rows.slice(index, index + 50);
      const insertUrl = new URL(`/rest/v1/${table}`, base);
      insertUrl.searchParams.set("on_conflict", "id");
      const inserted = await api(insertUrl, {
        method: "POST", headers: { Prefer: "resolution=ignore-duplicates,return=minimal" }, body: JSON.stringify(batch),
      });
      await inserted.body?.cancel();
      const verifyUrl = new URL(`/rest/v1/${table}`, base);
      verifyUrl.searchParams.set("select", Object.keys(batch[0]).join(","));
      verifyUrl.searchParams.set("id", `in.(${batch.map(row => row.id).join(",")})`);
      const stored = await (await api(verifyUrl)).json();
      if (!Array.isArray(stored) || stored.length !== batch.length) throw new Error(`Verifikasi jumlah ${table} gagal; backend aktif tidak boleh diganti.`);
      for (const expected of batch) {
        const actual = stored.find(row => row.id === expected.id);
        if (actual && table === "bookings") actual.created_at = utcTimestamp(actual.created_at);
        if (!actual || Object.entries(expected).some(([field, value]) => actual[field] !== value)) {
          throw new Error(`Verifikasi isi ${table} gagal; baris existing tidak ditimpa. Periksa migrasi sebelum cutover.`);
        }
      }
    }
    console.log(`${table}: ${rows.length} baris sumber terverifikasi. Tidak ada penghapusan atau penggantian backend.`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => { console.error(error instanceof SyntaxError ? "Export JSON tidak valid." : error.message); process.exitCode = 1; });
}
