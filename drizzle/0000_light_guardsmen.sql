CREATE TABLE `auth_tokens` (
	`id` integer PRIMARY KEY DEFAULT 1 NOT NULL,
	`access_token` text NOT NULL,
	`refresh_token` text NOT NULL,
	`expiry` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `excluded_folders` (
	`drive_folder_id` text PRIMARY KEY NOT NULL,
	`folder_name` text NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP)
);
--> statement-breakpoint
CREATE TABLE `financial_movements` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`type` text NOT NULL,
	`category` text NOT NULL,
	`date` text NOT NULL,
	`description` text NOT NULL,
	`amount` real NOT NULL,
	`tax_base` real,
	`vat_rate` real,
	`vat_amount` real,
	`currency` text DEFAULT 'EUR' NOT NULL,
	`trimestre` text NOT NULL,
	`reference` text,
	`vendor_id` text,
	`notes` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP),
	FOREIGN KEY (`vendor_id`) REFERENCES `vendors`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`drive_file_id` text NOT NULL,
	`file_name` text NOT NULL,
	`drive_path` text NOT NULL,
	`folder_type` text NOT NULL,
	`trimestre` text NOT NULL,
	`subfolder` text,
	`raw_text` text,
	`extracted_data` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`warning_message` text,
	`vendor_id` text,
	`project_id` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP),
	FOREIGN KEY (`vendor_id`) REFERENCES `vendors`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `invoices_drive_file_id_unique` ON `invoices` (`drive_file_id`);--> statement-breakpoint
CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP)
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `vendors` (
	`id` text PRIMARY KEY NOT NULL,
	`raw_name` text NOT NULL,
	`label` text,
	`type` text DEFAULT 'provider' NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP)
);
