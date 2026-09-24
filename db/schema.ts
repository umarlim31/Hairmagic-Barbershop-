import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const bookings = sqliteTable(
  "bookings",
  {
    id: text("id").primaryKey(),
    customerName: text("customer_name").notNull(),
    customerPhone: text("customer_phone").notNull(),
    serviceCode: text("service_code").notNull(),
    serviceName: text("service_name").notNull(),
    barberId: text("barber_id"),
    barberName: text("barber_name"),
    bookingDate: text("booking_date").notNull(),
    startTime: text("start_time").notNull(),
    endTime: text("end_time").notNull(),
    status: text("status").notNull().default("pending"),
    source: text("source").notNull().default("website"),
    notes: text("notes").notNull().default(""),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("idx_bookings_date_time_status").on(
      table.bookingDate,
      table.startTime,
      table.status,
    ),
    uniqueIndex("uq_bookings_barber_active_slot")
      .on(table.barberId, table.bookingDate, table.startTime)
      .where(
        sql`${table.barberId} IS NOT NULL AND ${table.status} IN ('pending', 'confirmed', 'checked_in')`,
      ),
  ],
);

// Deliberately separate from bookings: no customer, account, device or IP identifiers.
// A day is enough for reporting; precise submission times are not retained.
export const feedback = sqliteTable("feedback", {
  id: text("id").primaryKey(),
  rating: integer("rating").notNull(),
  message: text("message").notNull().default(""),
  submittedDay: text("submitted_day").notNull(),
}, table => [
  check("feedback_rating_range", sql`${table.rating} BETWEEN 1 AND 5`),
  check("feedback_message_length", sql`length(${table.message}) <= 1500`),
  index("idx_feedback_day_id").on(table.submittedDay, table.id),
]);
