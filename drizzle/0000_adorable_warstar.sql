CREATE TABLE IF NOT EXISTS `audit` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`record_id` text,
	`actor` text NOT NULL,
	`action` text NOT NULL,
	`detail` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_audit_workspace_created` ON `audit` (`workspace_id`,`created_at`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `invitations` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`role` text NOT NULL,
	`expires` text NOT NULL,
	`used` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `members` (
	`user_id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`role` text NOT NULL,
	`label` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_members_workspace` ON `members` (`workspace_id`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `records` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`payload` text NOT NULL,
	`evaluation` text NOT NULL,
	`status` text NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`created_by` text NOT NULL,
	`updated_at` text NOT NULL,
	`sample` integer DEFAULT 0 NOT NULL,
	`review_note` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_records_workspace_updated` ON `records` (`workspace_id`,`updated_at`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `reference_profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`payload` text NOT NULL,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_reference_workspace` ON `reference_profiles` (`workspace_id`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `workspaces` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `workspaces_owner_id_unique` ON `workspaces` (`owner_id`);
