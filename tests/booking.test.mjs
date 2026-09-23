import test from "node:test";
import assert from "node:assert/strict";
import { generateDailySlots, isAllowedSlot, isBookableSlot, isOperatingDate } from "../.test-build/booking.js";

test("booking slots respect business breaks and 40-minute duration", () => {
  const slots = generateDailySlots();
  assert.deepEqual(slots.slice(0,3), ["10:00","10:40","11:20"]);
  assert.ok(slots.includes("13:00"));
  assert.ok(slots.includes("19:00"));
  assert.equal(slots.includes("12:00"), false);
  assert.equal(slots.includes("18:00"), false);
  assert.equal(isAllowedSlot("21:00"), true);
  assert.equal(isAllowedSlot("21:40"), false);
});

test("Monday is closed; Tuesday and Sunday operate", () => {
  assert.equal(isOperatingDate(new Date("2026-09-21T00:00:00+08:00")), false);
  assert.equal(isOperatingDate(new Date("2026-09-22T00:00:00+08:00")), true);
  assert.equal(isOperatingDate(new Date("2026-09-27T00:00:00+08:00")), true);
});

test("minimum five-hour booking lead time is enforced", () => {
  const now = new Date("2026-09-23T10:00:00+08:00");
  assert.equal(isBookableSlot("2026-09-23", "13:00", now), false);
  assert.equal(isBookableSlot("2026-09-23", "15:00", now), true);
});
