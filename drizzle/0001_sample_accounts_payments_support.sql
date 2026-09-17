CREATE TABLE `profiles` (`user_id` text PRIMARY KEY NOT NULL,`email` text NOT NULL,`role` text NOT NULL,`data` text NOT NULL,`created_at` text NOT NULL,`updated_at` text NOT NULL);
--> statement-breakpoint
CREATE TABLE `technician_applications` (`id` text PRIMARY KEY NOT NULL,`user_id` text NOT NULL UNIQUE,`email` text NOT NULL,`name` text NOT NULL,`skills` text NOT NULL,`status` text NOT NULL,`created_at` text NOT NULL,`updated_at` text NOT NULL);
--> statement-breakpoint
CREATE INDEX `idx_applications_status` ON `technician_applications` (`status`,`created_at`);
--> statement-breakpoint
CREATE TABLE `support_tickets` (`id` text PRIMARY KEY NOT NULL,`user_id` text NOT NULL,`subject` text NOT NULL,`message` text NOT NULL,`status` text NOT NULL,`created_at` text NOT NULL,`updated_at` text NOT NULL);
--> statement-breakpoint
CREATE INDEX `idx_tickets_user` ON `support_tickets` (`user_id`,`created_at`);
--> statement-breakpoint
CREATE TABLE `ratings` (`id` text PRIMARY KEY NOT NULL,`booking_id` text NOT NULL UNIQUE,`customer_id` text NOT NULL,`rating` integer NOT NULL,`comment` text NOT NULL,`created_at` text NOT NULL);
--> statement-breakpoint
CREATE TABLE `payments` (`id` text PRIMARY KEY NOT NULL,`booking_id` text NOT NULL UNIQUE,`customer_id` text NOT NULL,`provider` text NOT NULL,`status` text NOT NULL,`amount` real NOT NULL,`reference` text NOT NULL,`created_at` text NOT NULL);
--> statement-breakpoint
CREATE INDEX `idx_payments_customer` ON `payments` (`customer_id`,`created_at`);
