import { databaseAvailable, supabaseRpc } from "@/lib/supabase-rest";
import {
  BARBERS,
  getBarber,
  getHaircutSlots,
  isMonday,
  isValidDateString,
  MAX_BARBERS_PER_SLOT,
  meetsAdvanceWindow,
} from "@/lib/booking-config";

type ActiveBooking = {
  barber_id: string | null;
  start_time: string;
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const date = url.searchParams.get("date") ?? "";
  const barberId = url.searchParams.get("barber") || null;

  if (!isValidDateString(date)) {
    return Response.json({ error: "Tanggal booking tidak valid." }, { status: 400 });
  }

  if (barberId && !getBarber(barberId)) {
    return Response.json({ error: "Kapster tidak ditemukan." }, { status: 400 });
  }

  if (isMonday(date)) {
    return Response.json({
      date,
      slots: [],
      message: "Hair Magic libur setiap hari Senin.",
    });
  }

  if (!databaseAvailable()) {
    return Response.json(
      { error: "Jadwal online sedang tidak tersedia. Silakan cek melalui WhatsApp." },
      { status: 503 },
    );
  }

  let rows: ActiveBooking[];
  try {
    rows = await supabaseRpc<ActiveBooking[]>("hm_active_bookings", { p_date: date });
  } catch {
    return Response.json({ error: "Jadwal belum dapat dimuat. Silakan coba lagi atau hubungi kasir." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
  const slots = getHaircutSlots().filter((slot) => {
    if (!meetsAdvanceWindow(date, slot)) return false;
    const bookingsAtSlot = rows.filter((row) => row.start_time === slot);
    if (bookingsAtSlot.length >= MAX_BARBERS_PER_SLOT) return false;
    if (!barberId) return true;
    return !bookingsAtSlot.some((booking) => booking.barber_id === barberId);
  });

  return Response.json(
    {
      date,
      barberId,
      capacity: BARBERS.length,
      slots,
      message:
        slots.length === 0
          ? "Belum ada slot yang dapat dipesan. Coba tanggal lain atau chat kasir."
          : null,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
