import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, decimal } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const pontos = mysqlTable("pontos", {
  id: int("id").autoincrement().primaryKey(),
  nome: varchar("nome", { length: 255 }).notNull(),
  tipo: mysqlEnum("tipo", ["Ponto de arrecadação", "Abrigo"]).default("Ponto de arrecadação").notNull(),
  bairro: varchar("bairro", { length: 255 }).notNull(),
  endereco: varchar("endereco", { length: 500 }).default(""),
  horario: varchar("horario", { length: 255 }).default(""),
  descricao: text("descricao"),
  contatoNome: varchar("contatoNome", { length: 255 }).default(""),
  contatoWhats: varchar("contatoWhats", { length: 50 }).default(""),
  contatoEmail: varchar("contatoEmail", { length: 320 }).default(""),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  ativo: boolean("ativo").default(true).notNull(),
  lastAutoUpdate: timestamp("lastAutoUpdate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Ponto = typeof pontos.$inferSelect;
export type InsertPonto = typeof pontos.$inferInsert;

export const necessidades = mysqlTable("necessidades", {
  id: int("id").autoincrement().primaryKey(),
  pontoId: int("pontoId").notNull(),
  categoria: mysqlEnum("categoria", [
    "Alimentos",
    "Roupas",
    "Produtos de Higiene",
    "Material de Limpeza",
    "Colchões e Cobertores",
    "Água",
    "Medicamentos",
    "Outros",
  ]).notNull(),
  item: varchar("item", { length: 255 }).notNull(),
  status: mysqlEnum("status", ["URGENTE", "PRECISA", "OK"]).default("PRECISA").notNull(),
  observacao: text("observacao"),
  updatedBy: varchar("updatedBy", { length: 255 }).default(""),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Necessidade = typeof necessidades.$inferSelect;
export type InsertNecessidade = typeof necessidades.$inferInsert;

export const updateLogs = mysqlTable("updateLogs", {
  id: int("id").autoincrement().primaryKey(),
  status: mysqlEnum("status", ["running", "success", "error"]).default("running").notNull(),
  pontosAtualizados: int("pontosAtualizados").default(0),
  necessidadesAdicionadas: int("necessidadesAdicionadas").default(0),
  necessidadesAtualizadas: int("necessidadesAtualizadas").default(0),
  resumo: text("resumo"),
  erro: text("erro"),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  finishedAt: timestamp("finishedAt"),
});

export type UpdateLog = typeof updateLogs.$inferSelect;
export type InsertUpdateLog = typeof updateLogs.$inferInsert;
