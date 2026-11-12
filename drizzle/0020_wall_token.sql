ALTER TABLE `events` ADD `wall_token` text;--> statement-breakpoint
CREATE UNIQUE INDEX `events_wall_token_unique` ON `events` (`wall_token`);