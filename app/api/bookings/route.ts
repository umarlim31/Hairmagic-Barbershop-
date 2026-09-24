import { z } from "zod";
import { databaseAvailable, supabaseRpc } from "@/lib/supabase-rest";
import {
  getBarber,
  getEndTime,
  getHaircutSlots,
  isMonday,
  isValidDateString,
  meetsAdvanceWindow,
  WHATSAPP_NUMBER,
} from "@/lib/booking-config";

const bookingSchema = z.object({
  customerName: z.string().trim().min(2).max(80),
  customerPhone: z
    .string()
    .trim()
    .min(8)
    .max(24)
    .refine((value) => {
      const digits = value.replace(/\D/g, "");
      return digits.length >= 8 && digits.length <= 15;
    }),
  bookingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  barberId: z.string().trim().max(40).nullable().optional(),
  notes: z.string().trim().max(500).optional().default(""),
  website: z.string().max(0).optional().default(""),
});

function makeBookingCode(date: string) {
  const datePart = date.replaceAll("-", "").slice(2);
  const randomPart = crypto.randomUUID().replaceAll("-", "").slice(0, 5).toUpperCase();
  return `HM-${datePart}-${randomPart}`;
}

function normalizePhone(value: string) {
  return value.replace(/\D/g, "");
}

function bookingError(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (message.includes("UNIQUE constraint failed")) {
    return "Slot tersebut baru saja dipilih pelanggan lain. Silakan pilih jam lain.";
  }
  return "Permintaan booking belum dapat disimpan. Silakan coba lagi atau hubungi WhatsApp Hair Magic.";
}

export async function POST(request: Request) {
  if (!databaseAvailable()) {
    return Response.json(
      { error: "Booking online sedang tidak tersedia. Silakan lanjut melalui WhatsApp." },
      { status: 503 },
    );
  }

  try {
    const payload = bookingSchema.parse(await request.json());
    const barber = payload.barberId ? getBarber(payload.barberId) : null;

    if (payload.barberId && !barber) {
      return Response.json({ error: "Kapster yang dipilih tidak ditemukan." }, { status: 400 });
    }

    if (!isValidDateString(payload.bookingDate)) {
      return Response.json({ error: "Tanggal booking tidak valid." }, { status: 400 });
    }

    if (isMonday(payload.bookingDate)) {
      return Response.json({ error: "Hair Magic libur setiap hari Senin." }, { status: 400 });
    }

    if (!getHaircutSlots().includes(payload.startTime)) {
      return Response.json({ error: "Jam booking berada di luar slot operasional." }, { status: 400 });
    }

    if (!meetsAdvanceWindow(payload.bookingDate, payload.startTime)) {
      return Response.json(
        { error: "Booking harus dibuat paling lambat 5 jam sebelum jadwal cukur." },
        { status: 400 },
      );
    }

    const bookingCode = makeBookingCode(payload.bookingDate);
    const endTime = getEndTime(payload.startTime);
    const barberId = barber?.id ?? null;
    const barberName = barber?.name ?? null;

    const saved = await supabaseRpc<boolean>("hm_create_booking", {
      payload: {
        id: bookingCode, customer_name: payload.customerName,
        customer_phone: normalizePhone(payload.customerPhone),
        barber_id: barberId, barber_name: barberName,
        booking_date: payload.bookingDate, start_time: payload.startTime,
        end_time: endTime, notes: payload.notes,
      },
    });

    if (!saved) {
      return Response.json(
        { error: "Slot tersebut sudah penuh. Silakan pilih jam lain." },
        { status: 409 },
      );
    }

    const barberLabel = barberName ?? "Kapster tersedia";
    const message = [
      "Halo Hair Magic, saya sudah mengirim permintaan booking dari website.",
      "",
      `Kode: ${bookingCode}`,
      `Nama: ${payload.customerName}`,
      "Layanan: Haircut (40 menit)",
      `Kapster: ${barberLabel}`,
      `Tanggal: ${payload.bookingDate}`,
      `Jam: ${payload.startTime} WITA`,
      "Status: Menunggu konfirmasi kasir.",
    ].join("\n");

    return Response.json(
      {
        booking: {
          code: bookingCode,
          customerName: payload.customerName,
          bookingDate: payload.bookingDate,
          startTime: payload.startTime,
          endTime,
          barberName: barberLabel,
          status: "pending",
        },
        whatsappUrl: `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: "Periksa kembali nama, nomor WhatsApp, tanggal, dan jam booking." },
        { status: 400 },
      );
    }
    return Response.json({ error: bookingError(error) }, { status: 500 });
  }
}
