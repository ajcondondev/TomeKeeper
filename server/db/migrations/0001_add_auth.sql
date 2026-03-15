CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL UNIQUE,
	`password_hash` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
DROP TABLE IF EXISTS `books`;
--> statement-breakpoint
CREATE TABLE `books` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL REFERENCES `users`(`id`),
	`title` text NOT NULL,
	`author` text NOT NULL,
	`cover_url` text,
	`genre` text,
	`page_count` integer,
	`status` text NOT NULL DEFAULT 'unread',
	`added_at` text NOT NULL,
	`finished_at` text
);
