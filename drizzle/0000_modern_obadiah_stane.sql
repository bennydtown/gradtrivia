CREATE TABLE `grad_images` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`grad_slug` text NOT NULL,
	`filename` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `grads` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`graduation_level` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `grads_slug_unique` ON `grads` (`slug`);--> statement-breakpoint
CREATE TABLE `player_answers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`player_id` integer NOT NULL,
	`question_id` integer NOT NULL,
	`selected_answer` text NOT NULL,
	`is_correct` integer NOT NULL,
	`attributed_grad_slug` text NOT NULL,
	`answered_at` integer NOT NULL,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `players` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`display_name` text NOT NULL,
	`session_token` text NOT NULL,
	`question_order` text NOT NULL,
	`created_at` integer NOT NULL,
	`completed_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `players_session_token_unique` ON `players` (`session_token`);--> statement-breakpoint
CREATE TABLE `questions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`grad_slug` text NOT NULL,
	`question_text` text NOT NULL,
	`correct_answer` text NOT NULL,
	`wrong_answers` text NOT NULL,
	`type` text NOT NULL
);
