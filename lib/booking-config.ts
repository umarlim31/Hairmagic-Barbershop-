export const TIME_ZONE = "Asia/Makassar";
export const WHATSAPP_NUMBER = "62895374034221";
export const HAIRCUT_DURATION_MINUTES = 40;
export const MINIMUM_ADVANCE_HOURS = 5;

export const BARBERS = [
  { id: "abibayu", name: "Abibayu", haircutPrice: 40_000 },
  { id: "rival", name: "Rival", haircutPrice: 40_000 },
  { id: "umar", name: "Umar", haircutPrice: 60_000 },
] as const;

export const MAX_BARBERS_PER_SLOT = BARBERS.length;

const BOOKING_WINDOWS = [
  [10 * 60, 12 * 60],
  [13 * 60, 18 * 60],
  [19 * 60, 22 * 60],
] as const;

export function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function toTime(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function getHaircutSlots() {
  return BOOKING_WINDOWS.flatMap(([start, end]) => {
    const slots: string[] = [];
    for (
      let cursor = start;
      cursor + HAIRCUT_DURATION_MINUTES <= end;
      cursor += HAIRCUT_DURATION_MINUTES
    ) {
      slots.push(toTime(cursor));
    }
    return slots;
  });
}

export function getEndTime(startTime: string) {
  const [hours, minutes] = startTime.split(":").map(Number);
  return toTime(hours * 60 + minutes + HAIRCUT_DURATION_MINUTES);
}

export function isValidDateString(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

export function isMonday(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay() === 1;
}

export function appointmentUtcMs(date: string, time: string) {
  const [year, month, day] = date.split("-").map(Number);
  const [hours, minutes] = time.split(":").map(Number);
  return Date.UTC(year, month - 1, day, hours - 8, minutes);
}

export function meetsAdvanceWindow(date: string, time: string, now = Date.now()) {
  return (
    appointmentUtcMs(date, time) - now >= MINIMUM_ADVANCE_HOURS * 60 * 60 * 1000
  );
}

export function getBarber(barberId: string | null | undefined) {
  return BARBERS.find((barber) => barber.id === barberId) ?? null;
}

export function getTodayInWita() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}
