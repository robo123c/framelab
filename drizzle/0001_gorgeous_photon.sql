CREATE TABLE `exports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`renderJobId` int NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`storageKey` varchar(1024),
	`storageUrl` varchar(1200) NOT NULL,
	`mimeType` varchar(160) NOT NULL DEFAULT 'video/mp4',
	`byteSize` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `exports_id` PRIMARY KEY(`id`),
	CONSTRAINT `exports_render_job_unique` UNIQUE(`renderJobId`)
);
--> statement-breakpoint
CREATE TABLE `presets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int,
	`slug` varchar(80) NOT NULL,
	`label` varchar(120) NOT NULL,
	`description` text,
	`configJson` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `presets_id` PRIMARY KEY(`id`),
	CONSTRAINT `preset_owner_slug_unique` UNIQUE(`ownerId`,`slug`)
);
--> statement-breakpoint
CREATE INDEX `exports_project_created_idx` ON `exports` (`projectId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `presets_owner_updated_idx` ON `presets` (`ownerId`,`updatedAt`);