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
  cidade: varchar("cidade", { length: 255 }).default("Juiz de Fora").notNull(),
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

// Sugestões pendentes de aprovação (geradas pelo autoUpdate)
export const sugestoes = mysqlTable("sugestoes", {
  id: int("id").autoincrement().primaryKey(),
  tipo: mysqlEnum("tipo", ["novo_ponto", "nova_necessidade", "atualizar_necessidade"]).notNull(),
  status: mysqlEnum("statusAprovacao", ["pendente", "aprovada", "rejeitada"]).default("pendente").notNull(),
  // Dados do ponto (para novo_ponto)
  pontoNome: varchar("pontoNome", { length: 255 }),
  pontoTipo: varchar("pontoTipo", { length: 50 }),
  pontoBairro: varchar("pontoBairro", { length: 255 }),
  pontoCidade: varchar("pontoCidade", { length: 255 }),
  pontoEndereco: varchar("pontoEndereco", { length: 500 }),
  pontoDescricao: text("pontoDescricao"),
  // Dados da necessidade (para nova_necessidade / atualizar_necessidade)
  pontoId: int("pontoId"),
  pontoRefNome: varchar("pontoRefNome", { length: 255 }),
  necessidadeCategoria: varchar("necessidadeCategoria", { length: 100 }),
  necessidadeItem: varchar("necessidadeItem", { length: 255 }),
  necessidadeStatus: varchar("necessidadeStatus", { length: 20 }),
  necessidadeId: int("necessidadeId"),
  // Metadados
  fonte: varchar("fonte", { length: 500 }),
  updateLogId: int("updateLogId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  reviewedAt: timestamp("reviewedAt"),
  reviewedBy: varchar("reviewedBy", { length: 255 }),
});

export type Sugestao = typeof sugestoes.$inferSelect;
export type InsertSugestao = typeof sugestoes.$inferInsert;

export const pageViews = mysqlTable("pageViews", {
  id: int("id").autoincrement().primaryKey(),
  page: varchar("page", { length: 255 }).notNull(),
  count: int("count").default(0).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PageView = typeof pageViews.$inferSelect;
export type InsertPageView = typeof pageViews.$inferInsert;
