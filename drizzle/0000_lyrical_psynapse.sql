CREATE TABLE `assets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`displayName` varchar(255) NOT NULL,
	`mediaKind` enum('video','audio','image','other') NOT NULL DEFAULT 'video',
	`storageKey` varchar(1024),
	`storageUrl` varchar(1200),
	`mimeType` varchar(160),
	`byteSize` int NOT NULL DEFAULT 0,
	`durationMs` int,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `assets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `beatMarkers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`timestampMs` int NOT NULL,
	`strength` int NOT NULL DEFAULT 50,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `beatMarkers_id` PRIMARY KEY(`id`),
	CONSTRAINT `beat_marker_project_timestamp_unique` UNIQUE(`projectId`,`timestampMs`)
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`name` varchar(160) NOT NULL,
	`aspectRatio` enum('9:16','1:1','4:5','16:9') NOT NULL DEFAULT '9:16',
	`canvasMode` enum('fit','fill') NOT NULL DEFAULT 'fit',
	`activePreset` varchar(64) NOT NULL DEFAULT 'clean',
	`captionStyle` varchar(64) NOT NULL DEFAULT 'halo',
	`motionIntensity` int NOT NULL DEFAULT 68,
	`status` enum('draft','ready','archived') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `renderJobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`requestedFormat` enum('mp4','webm','mov') NOT NULL DEFAULT 'mp4',
	`planJson` json NOT NULL,
	`status` enum('draft','queued','processing','review','completed','failed') NOT NULL DEFAULT 'draft',
	`progress` int NOT NULL DEFAULT 0,
	`workerId` int,
	`outputKey` varchar(1024),
	`outputUrl` varchar(1200),
	`errorMessage` text,
	`requestedAt` timestamp NOT NULL DEFAULT (now()),
	`startedAt` timestamp,
	`completedAt` timestamp,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `renderJobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transcriptTokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`lineIndex` int NOT NULL,
	`tokenIndex` int NOT NULL,
	`text` varchar(512) NOT NULL,
	`startMs` int,
	`endMs` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `transcriptTokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `transcript_token_position_unique` UNIQUE(`projectId`,`lineIndex`,`tokenIndex`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
--> statement-breakpoint
CREATE TABLE `workers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`label` varchar(120) NOT NULL,
	`mode` enum('pull') NOT NULL DEFAULT 'pull',
	`tokenHash` varchar(128) NOT NULL,
	`tokenHint` varchar(12) NOT NULL,
	`lastSeenAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `assets_project_sort_idx` ON `assets` (`projectId`,`sortOrder`);--> statement-breakpoint
CREATE INDEX `beat_markers_project_idx` ON `beatMarkers` (`projectId`,`timestampMs`);--> statement-breakpoint
CREATE INDEX `projects_owner_updated_idx` ON `projects` (`ownerId`,`updatedAt`);--> statement-breakpoint
CREATE INDEX `render_jobs_project_updated_idx` ON `renderJobs` (`projectId`,`updatedAt`);--> statement-breakpoint
CREATE INDEX `transcript_tokens_project_idx` ON `transcriptTokens` (`projectId`,`lineIndex`,`tokenIndex`);--> statement-breakpoint
CREATE INDEX `workers_owner_idx` ON `workers` (`ownerId`,`updatedAt`);