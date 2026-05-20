ALTER TABLE `books` ADD `external_ref` text;--> statement-breakpoint
ALTER TABLE `books` ADD `source` text DEFAULT 'manual' NOT NULL;--> statement-breakpoint
ALTER TABLE `books` ADD `updated_at` text;--> statement-breakpoint
ALTER TABLE `books` ADD `archived_at` text;--> statement-breakpoint
ALTER TABLE `books` ADD `validation_status` text DEFAULT 'valid' NOT NULL;--> statement-breakpoint
ALTER TABLE `reviews` ADD `rating` integer;--> statement-breakpoint
ALTER TABLE `reviews` ADD `status` text DEFAULT 'published' NOT NULL;