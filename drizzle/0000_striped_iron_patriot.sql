CREATE TABLE `bookings` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_name` text NOT NULL,
	`customer_phone` text NOT NULL,
	`service_code` text NOT NULL,
	`service_name` text NOT NULL,
	`barber_id` text,
	`barber_name` text,
	`booking_date` text NOT NULL,
	`start_time` text NOT NULL,
	`end_time` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`source` text DEFAULT 'website' NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_bookings_date_time_status` ON `bookings` (`booking_date`,`start_time`,`status`);--> statement-breakpoint
CREATE UNIQUE INDEX `uq_bookings_barber_active_slot` ON `bookings` (`barber_id`,`booking_date`,`start_time`) WHERE "bookings"."barber_id" IS NOT NULL AND "bookings"."status" IN ('pending', 'confirmed', 'checked_in');