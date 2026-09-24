import { test } from "node:test";
import assert from "node:assert/strict";
import { utcTimestamp, validateExport } from "../scripts/import-supabase.mjs";

test("migration retains historical data and interprets D1 timestamps as UTC", () => {
  const source = {
    bookings: [{ id: "HM-260901-ABCDE", customer_name: "Test Customer", customer_phone: "08123456789", service_code: "haircut", service_name: "Haircut", barber_id: "erdi", barber_name: "Erdi", booking_date: "2026-09-01", start_time: "10:00", end_time: "10:40", status: "completed", source: "website", notes: "", created_at: "2026-08-31 22:05:00" }],
    feedback: [{ id: crypto.randomUUID(), rating: 1, message: "  Preserve this criticism exactly.  ", submitted_day: "2026-09-01" }],
  };
  const data = validateExport(source);
  assert.equal(data.bookings[0].created_at, "2026-08-31T22:05:00.000Z");
  assert.equal(data.bookings[0].barber_id, "erdi"); // historical records must not be rewritten
  assert.equal(data.feedback[0].message, source.feedback[0].message);
  assert.equal(utcTimestamp("2026-09-01T06:05:00+08:00"), data.bookings[0].created_at);
});

test("migration rejects duplicate IDs, invalid dates, and identities attached to anonymous feedback", () => {
  const row = { id: crypto.randomUUID(), rating: 4, message: "Test", submitted_day: "2026-09-01" };
  assert.throws(() => validateExport({ bookings: [], feedback: [row, row] }), /duplikat/);
  for (const invalid of [{ ...row, submitted_day: "2026-02-30" }, { ...row, customer_phone: "08123456789" }, { ...row, rating: 8 }]) {
    assert.throws(() => validateExport({ bookings: [], feedback: [invalid] }), /Export tidak valid/);
  }
  assert.throws(() => utcTimestamp("September 18"), /Invalid/);
});
