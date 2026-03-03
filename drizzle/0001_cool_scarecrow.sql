CREATE TABLE `necessidades` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pontoId` int NOT NULL,
	`categoria` enum('Alimentos','Roupas','Produtos de Higiene','Material de Limpeza','Colchões e Cobertores','Água','Medicamentos','Outros') NOT NULL,
	`item` varchar(255) NOT NULL,
	`status` enum('URGENTE','PRECISA','OK') NOT NULL DEFAULT 'PRECISA',
	`observacao` text,
	`updatedBy` varchar(255) DEFAULT '',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `necessidades_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pontos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nome` varchar(255) NOT NULL,
	`tipo` enum('Ponto de arrecadação','Abrigo') NOT NULL DEFAULT 'Ponto de arrecadação',
	`bairro` varchar(255) NOT NULL,
	`endereco` varchar(500) DEFAULT '',
	`horario` varchar(255) DEFAULT '',
	`descricao` text,
	`contatoNome` varchar(255) DEFAULT '',
	`contatoWhats` varchar(50) DEFAULT '',
	`contatoEmail` varchar(320) DEFAULT '',
	`latitude` decimal(10,7),
	`longitude` decimal(10,7),
	`ativo` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pontos_id` PRIMARY KEY(`id`)
);
