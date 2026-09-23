export const SLOT_MINUTES = 40;
export const MIN_ADVANCE_HOURS = 5;
export const MAX_SIMULTANEOUS_BARBERS = 3;
const segments = [
    [10 * 60, 12 * 60],
    [13 * 60, 18 * 60],
    [19 * 60, 22 * 60]
];
export function minutesToTime(total) {
    const h = Math.floor(total / 60).toString().padStart(2, "0");
    const m = (total % 60).toString().padStart(2, "0");
    return `${h}:${m}`;
}
export function generateDailySlots() {
    const slots = [];
    for (const [start, end] of segments) {
        for (let cursor = start; cursor + SLOT_MINUTES <= end; cursor += SLOT_MINUTES) {
            slots.push(minutesToTime(cursor));
        }
    }
    return slots;
}
export function isOperatingDate(date) {
    const weekday = new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Makassar",
        weekday: "short"
    }).format(date);
    return weekday !== "Mon";
}
export function isAllowedSlot(time) {
    return generateDailySlots().includes(time);
}
export function witaDateTime(dateIso, time) {
    return new Date(`${dateIso}T${time}:00+08:00`);
}
export function meetsMinimumAdvance(dateIso, time, now = new Date()) {
    const visit = witaDateTime(dateIso, time).getTime();
    return visit - now.getTime() >= MIN_ADVANCE_HOURS * 60 * 60 * 1000;
}
export function isBookableSlot(dateIso, time, now = new Date()) {
    const date = new Date(`${dateIso}T00:00:00+08:00`);
    return isOperatingDate(date) && isAllowedSlot(time) && meetsMinimumAdvance(dateIso, time, now);
}
