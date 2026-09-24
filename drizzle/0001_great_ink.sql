CREATE TABLE `feedback` (
	`id` text PRIMARY KEY NOT NULL,
	`rating` integer NOT NULL,
	`message` text DEFAULT '' NOT NULL,
	`submitted_day` text NOT NULL,
	CONSTRAINT "feedback_rating_range" CHECK("feedback"."rating" BETWEEN 1 AND 5),
	CONSTRAINT "feedback_message_length" CHECK(length("feedback"."message") <= 1500)
);
--> statement-breakpoint
CREATE INDEX `idx_feedback_day_id` ON `feedback` (`submitted_day`,`id`);