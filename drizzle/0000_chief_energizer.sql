CREATE TABLE `urls` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`url` text NOT NULL,
	`url_hash` text NOT NULL,
	`first_seen` text NOT NULL,
	`category` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `urls_url_unique` ON `urls` (`url`);--> statement-breakpoint
CREATE UNIQUE INDEX `urls_url_hash_unique` ON `urls` (`url_hash`);