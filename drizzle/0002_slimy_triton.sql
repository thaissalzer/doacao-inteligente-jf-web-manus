CREATE TABLE `updateLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`status` enum('running','success','error') NOT NULL DEFAULT 'running',
	`pontosAtualizados` int DEFAULT 0,
	`necessidadesAdicionadas` int DEFAULT 0,
	`necessidadesAtualizadas` int DEFAULT 0,
	`resumo` text,
	`erro` text,
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`finishedAt` timestamp,
	CONSTRAINT `updateLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `pontos` ADD `lastAutoUpdate` timestamp;