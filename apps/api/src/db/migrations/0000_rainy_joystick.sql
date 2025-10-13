CREATE TABLE `component_controls` (
	`id` text PRIMARY KEY NOT NULL,
	`component_id` text NOT NULL,
	`control_type` text NOT NULL,
	`label` text,
	`config` text,
	`order_index` integer NOT NULL,
	FOREIGN KEY (`component_id`) REFERENCES `components`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `components` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`type` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	`team_id` text,
	`created_by` text
);
--> statement-breakpoint
CREATE TABLE `teams` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP
);
