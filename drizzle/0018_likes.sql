CREATE TABLE `photo_likes` (
	`photo_id` text NOT NULL,
	`guest_id` text NOT NULL,
	`event_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	PRIMARY KEY(`photo_id`, `guest_id`),
	FOREIGN KEY (`photo_id`) REFERENCES `photos`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `photo_likes_event_idx` ON `photo_likes` (`event_id`);