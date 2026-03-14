CREATE TABLE `books` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`author` text NOT NULL,
	`cover_url` text,
	`genre` text,
	`page_count` integer,
	`status` text DEFAULT 'unread' NOT NULL,
	`added_at` text NOT NULL,
	`finished_at` text
);
