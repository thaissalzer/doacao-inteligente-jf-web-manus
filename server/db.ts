import { eq, and, sql, inArray, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, pontos, necessidades, pageViews, type InsertPonto, type InsertNecessidade } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ==================== PONTOS ====================

export async function listPontos(filters?: { ativo?: boolean; bairro?: string; tipo?: string }) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];
  if (filters?.ativo !== undefined) {
    conditions.push(eq(pontos.ativo, filters.ativo));
  }
  if (filters?.bairro) {
    conditions.push(eq(pontos.bairro, filters.bairro));
  }
  if (filters?.tipo) {
    conditions.push(eq(pontos.tipo, filters.tipo as "Ponto de arrecadação" | "Abrigo"));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  return db.select().from(pontos).where(where).orderBy(
    sql`CASE WHEN ${pontos.lastAutoUpdate} IS NULL THEN 1 ELSE 0 END`,
    sql`${pontos.lastAutoUpdate} DESC`,
    pontos.nome
  );
}

export async function getPontoById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(pontos).where(eq(pontos.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createPonto(data: InsertPonto) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Garantir que campos opcionais com defaults tenham valores válidos
  const sanitized = {
    ...data,
    cidade: data.cidade || "Juiz de Fora",
    endereco: data.endereco || "",
    horario: data.horario || "",
    descricao: data.descricao || null,
    contatoNome: data.contatoNome || "",
    contatoWhats: data.contatoWhats || "",
    contatoEmail: data.contatoEmail || "",
  };

  const result = await db.insert(pontos).values(sanitized);
  return result[0].insertId;
}

export async function updatePonto(id: number, data: Partial<InsertPonto>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(pontos).set(data).where(eq(pontos.id, id));
}

export async function deletePonto(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(necessidades).where(eq(necessidades.pontoId, id));
  await db.delete(pontos).where(eq(pontos.id, id));
}

export async function getBairros() {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .selectDistinct({ bairro: pontos.bairro, cidade: pontos.cidade })
    .from(pontos)
    .where(eq(pontos.ativo, true))
    .orderBy(pontos.cidade, pontos.bairro);

  return result.map(r => ({ bairro: r.bairro, cidade: r.cidade }));
}

// ==================== NECESSIDADES ====================

export async function listNecessidades(filters?: { pontoId?: number; categoria?: string; status?: string }) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];
  if (filters?.pontoId) {
    conditions.push(eq(necessidades.pontoId, filters.pontoId));
  }
  if (filters?.categoria) {
    conditions.push(eq(necessidades.categoria, filters.categoria as any));
  }
  if (filters?.status) {
    conditions.push(eq(necessidades.status, filters.status as any));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  return db.select().from(necessidades).where(where).orderBy(desc(necessidades.updatedAt));
}

export async function getNecessidadesByPontoId(pontoId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(necessidades).where(eq(necessidades.pontoId, pontoId)).orderBy(necessidades.categoria);
}

export async function createNecessidade(data: InsertNecessidade) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(necessidades).values(data);
  return result[0].insertId;
}

export async function updateNecessidade(id: number, data: Partial<InsertNecessidade>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(necessidades).set(data).where(eq(necessidades.id, id));
}

export async function deleteNecessidade(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(necessidades).where(eq(necessidades.id, id));
}

export async function getStats() {
  const db = await getDb();
  if (!db) return { totalPontos: 0, totalUrgentes: 0, totalNecessidades: 0, totalBairros: 0 };

  const [pontosCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(pontos)
    .where(eq(pontos.ativo, true));

  const [urgentesCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(necessidades)
    .where(eq(necessidades.status, "URGENTE"));

  const [necessidadesCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(necessidades);

  const bairrosResult = await db
    .selectDistinct({ bairro: pontos.bairro })
    .from(pontos)
    .where(eq(pontos.ativo, true));

  return {
    totalPontos: pontosCount?.count ?? 0,
    totalUrgentes: urgentesCount?.count ?? 0,
    totalNecessidades: necessidadesCount?.count ?? 0,
    totalBairros: bairrosResult.length,
  };
}

// ==================== SEED DATA ====================

export async function seedPontosOficiais() {
  const db = await getDb();
  if (!db) return;

  const existing = await db.select({ id: pontos.id }).from(pontos).limit(1);
  if (existing.length > 0) return;

  const pontosData: InsertPonto[] = [
    { nome: "Prédio Sede da PJF", tipo: "Ponto de arrecadação", bairro: "Centro", endereco: "Av. Brasil, 2001 – térreo", latitude: "-21.7642", longitude: "-43.3496", ativo: true },
    { nome: "Casa da Mulher", tipo: "Ponto de arrecadação", bairro: "Vitorino Braga", endereco: "Av. Garibaldi Campinhos, 169", latitude: "-21.7580", longitude: "-43.3380", ativo: true },
    { nome: "Escola Municipal Murilo Mendes", tipo: "Ponto de arrecadação", bairro: "Alto Grajaú", endereco: "Rua Dr. Leonel Jaguaribe, 240", latitude: "-21.7520", longitude: "-43.3590", ativo: true },
    { nome: "Escola Municipal Professor Nilo Camilo Ayupe", tipo: "Ponto de arrecadação", bairro: "Paineiras", endereco: "Rua Almirante Barroso, 155", latitude: "-21.7730", longitude: "-43.3620", ativo: true },
    { nome: "Shopping Jardim Norte", tipo: "Ponto de arrecadação", bairro: "Mariano Procópio", endereco: "Av. Brasil, 6345", latitude: "-21.7350", longitude: "-43.3510", ativo: true },
    { nome: "Unimed Juiz de Fora", tipo: "Ponto de arrecadação", bairro: "Centro", endereco: "Av. Rio Branco, 2540", latitude: "-21.7620", longitude: "-43.3480", ativo: true },
    { nome: "Emcasa", tipo: "Ponto de arrecadação", bairro: "Costa Carvalho", endereco: "Av. Sete de Setembro, 975", latitude: "-21.7560", longitude: "-43.3540", ativo: true },
    { nome: "IF Sudeste MG", tipo: "Ponto de arrecadação", bairro: "Bairro Fábrica", endereco: "Rua Bernardo Mascarenhas, 1283", latitude: "-21.7590", longitude: "-43.3440", ativo: true },
    { nome: "Escola Municipal Paulo Rogério dos Santos", tipo: "Ponto de arrecadação", bairro: "Monte Castelo", endereco: "Rua Cel. Quintão, 136", latitude: "-21.7480", longitude: "-43.3650", ativo: true },
    { nome: "Supermercados Bahamas", tipo: "Ponto de arrecadação", bairro: "Diversas localidades", endereco: "Todas as lojas", latitude: "-21.7610", longitude: "-43.3500", ativo: true },
    { nome: "Sindicato dos Bancários", tipo: "Ponto de arrecadação", bairro: "Centro", endereco: "Rua Batista de Oliveira, 745", latitude: "-21.7615", longitude: "-43.3490", ativo: true },
    { nome: "Igreja Metodista em Bela Aurora", tipo: "Ponto de arrecadação", bairro: "Ipiranga", endereco: "Rua Dr. Costa Reis, 380", latitude: "-21.7540", longitude: "-43.3560", ativo: true },
    { nome: "UniAcademia", tipo: "Ponto de arrecadação", bairro: "Centro", endereco: "Rua Halfeld, 1.179", latitude: "-21.7630", longitude: "-43.3470", ativo: true },
    { nome: "Independência Shopping", tipo: "Ponto de arrecadação", bairro: "Cascatinha", endereco: "Av. Presidente Itamar Franco, 3600", latitude: "-21.7700", longitude: "-43.3700", ativo: true },
    { nome: "AACI", tipo: "Ponto de arrecadação", bairro: "Nova Era", endereco: "Rua Doutor Dias da Cruz, 487", latitude: "-21.7550", longitude: "-43.3520", ativo: true },
    { nome: "Secretaria Especial de Igualdade Racial", tipo: "Ponto de arrecadação", bairro: "Centro", endereco: "Av. Rio Branco, 2234", latitude: "-21.7625", longitude: "-43.3485", ativo: true },
    { nome: "Loja Maçônica", tipo: "Ponto de arrecadação", bairro: "São Mateus", endereco: "Rua Cândido Tostes, 212", latitude: "-21.7660", longitude: "-43.3530", ativo: true },
    { nome: "Mister Shopping", tipo: "Ponto de arrecadação", bairro: "Centro", endereco: "Rua Mr. Moore, 70", latitude: "-21.7635", longitude: "-43.3475", ativo: true },
    { nome: "Souza Gomes Imóveis", tipo: "Ponto de arrecadação", bairro: "São Mateus", endereco: "Av. Presidente Itamar Franco, 2.800", latitude: "-21.7670", longitude: "-43.3550", ativo: true },
    { nome: "Trade Hotel", tipo: "Ponto de arrecadação", bairro: "Cascatinha", endereco: "Av. Presidente Itamar Franco, 3800", latitude: "-21.7710", longitude: "-43.3710", ativo: true },
    { nome: "Shopping Alameda", tipo: "Ponto de arrecadação", bairro: "Passos", endereco: "R. Morais e Castro, 300", latitude: "-21.7600", longitude: "-43.3460", ativo: true },
    { nome: "Sesc Mesa Brasil", tipo: "Ponto de arrecadação", bairro: "São Mateus", endereco: "Rua Carlos Chagas, 100", latitude: "-21.7655", longitude: "-43.3525", ativo: true },
    { nome: "Escola Municipal Raymundo Hargreaves", tipo: "Ponto de arrecadação", bairro: "Bom Jardim", endereco: "Rua Luiz Fávero, 383", latitude: "-21.7450", longitude: "-43.3680", ativo: true },
    { nome: "Escola Municipal Amélia Pires", tipo: "Ponto de arrecadação", bairro: "Monte Castelo", endereco: "Rua Itatiaia, 570", latitude: "-21.7490", longitude: "-43.3660", ativo: true },
    { nome: "Escola Municipal Aurea Bicalho", tipo: "Ponto de arrecadação", bairro: "Linhares", endereco: "Rua Odilon Braga, nº 119", latitude: "-21.7510", longitude: "-43.3600", ativo: true },
    { nome: "Escola Municipal Dante Jaime Brochado", tipo: "Ponto de arrecadação", bairro: "Santo Antônio", endereco: "Rua Francisco Fontainha, 163", latitude: "-21.7570", longitude: "-43.3420", ativo: true },
    { nome: "Escola Municipal Gabriel Gonçalves", tipo: "Ponto de arrecadação", bairro: "Ipiranga", endereco: "Rua Gabriel Coimbra, nº 240", latitude: "-21.7545", longitude: "-43.3565", ativo: true },
    { nome: "Escola Municipal Belmira Duarte", tipo: "Ponto de arrecadação", bairro: "Bairro JK", endereco: "Rua Adailton Garcia, nº 110", latitude: "-21.7430", longitude: "-43.3700", ativo: true },
    { nome: "Escola Estadual Padre Frederico", tipo: "Ponto de arrecadação", bairro: "Bonfim", endereco: "Rua Carlos Alves, 133", latitude: "-21.7500", longitude: "-43.3580", ativo: true },
    { nome: "Escola Municipal Henrique José de Souza", tipo: "Ponto de arrecadação", bairro: "Cidade do Sol", endereco: "Rua Cidade do Sol, nº 370", latitude: "-21.7400", longitude: "-43.3750", ativo: true },
    { nome: "Escola Municipal Marlene Barros", tipo: "Ponto de arrecadação", bairro: "Marumbi", endereco: "Prolongamento da Rua Marumbi, nº 56", latitude: "-21.7380", longitude: "-43.3730", ativo: true },
    { nome: "Escola Municipal Adhemar Rezende", tipo: "Ponto de arrecadação", bairro: "São Pedro", endereco: "Av. Senhor dos Passos, 1596", latitude: "-21.7650", longitude: "-43.3510", ativo: true },
    { nome: "Escola Municipal Fernão Dias", tipo: "Ponto de arrecadação", bairro: "Bandeirantes", endereco: "Rua Gustavo Fernandes Barbosa, nº 155", latitude: "-21.7460", longitude: "-43.3690", ativo: true },
    { nome: "Escola Municipal Dilermando Cruz", tipo: "Ponto de arrecadação", bairro: "Vila Ideal", endereco: "Rua Dr. Altivo Halfeld, nº 44", latitude: "-21.7530", longitude: "-43.3570", ativo: true },
    { nome: "Escola Municipal Irineu Guimarães", tipo: "Ponto de arrecadação", bairro: "São Benedito", endereco: "Rua José Zacarias dos Santos, s/nº", latitude: "-21.7470", longitude: "-43.3640", ativo: true },
    { nome: "Escola Estadual Antônio Carlos", tipo: "Ponto de arrecadação", bairro: "Mariano Procópio", endereco: "Av. Cel. Vidal, 180", latitude: "-21.7360", longitude: "-43.3520", ativo: true },
    { nome: "Escola Municipal Antônio Carlos Fagundes", tipo: "Ponto de arrecadação", bairro: "Francisco Bernardino", endereco: "Rua Antônio Lopes Júnior, 35", latitude: "-21.7580", longitude: "-43.3450", ativo: true },
    { nome: "Escola Municipal Amélia Mascarenhas", tipo: "Ponto de arrecadação", bairro: "São Bernardo", endereco: "Rua Dr Maurício Guerra, 300", latitude: "-21.7440", longitude: "-43.3720", ativo: true },
  ];

  for (const ponto of pontosData) {
    await db.insert(pontos).values(ponto);
  }

  // Seed some sample necessidades
  const allPontos = await db.select({ id: pontos.id }).from(pontos).limit(10);
  const sampleNecessidades: InsertNecessidade[] = [
    { pontoId: allPontos[0]?.id ?? 1, categoria: "Alimentos", item: "Arroz, feijão e óleo", status: "URGENTE" },
    { pontoId: allPontos[0]?.id ?? 1, categoria: "Água", item: "Água mineral (garrafas de 1,5L)", status: "URGENTE" },
    { pontoId: allPontos[0]?.id ?? 1, categoria: "Produtos de Higiene", item: "Sabonete, pasta de dente", status: "PRECISA" },
    { pontoId: allPontos[1]?.id ?? 2, categoria: "Roupas", item: "Roupas femininas (todos os tamanhos)", status: "URGENTE" },
    { pontoId: allPontos[1]?.id ?? 2, categoria: "Colchões e Cobertores", item: "Cobertores e lençóis", status: "PRECISA" },
    { pontoId: allPontos[2]?.id ?? 3, categoria: "Alimentos", item: "Leite em pó e achocolatado", status: "PRECISA" },
    { pontoId: allPontos[2]?.id ?? 3, categoria: "Material de Limpeza", item: "Desinfetante e água sanitária", status: "URGENTE" },
    { pontoId: allPontos[3]?.id ?? 4, categoria: "Roupas", item: "Roupas infantis", status: "URGENTE" },
    { pontoId: allPontos[3]?.id ?? 4, categoria: "Alimentos", item: "Alimentos não perecíveis", status: "PRECISA" },
    { pontoId: allPontos[4]?.id ?? 5, categoria: "Produtos de Higiene", item: "Fraldas descartáveis", status: "URGENTE" },
    { pontoId: allPontos[5]?.id ?? 6, categoria: "Medicamentos", item: "Medicamentos básicos", status: "PRECISA" },
    { pontoId: allPontos[6]?.id ?? 7, categoria: "Alimentos", item: "Cesta básica completa", status: "URGENTE" },
    { pontoId: allPontos[7]?.id ?? 8, categoria: "Colchões e Cobertores", item: "Colchões de solteiro", status: "URGENTE" },
    { pontoId: allPontos[8]?.id ?? 9, categoria: "Material de Limpeza", item: "Rodo, vassoura e balde", status: "PRECISA" },
    { pontoId: allPontos[9]?.id ?? 10, categoria: "Outros", item: "Brinquedos e materiais escolares", status: "PRECISA" },
  ];

  for (const nec of sampleNecessidades) {
    await db.insert(necessidades).values(nec);
  }
}

export async function getPageViewCount(page: string = "home"): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select({ count: pageViews.count })
    .from(pageViews)
    .where(eq(pageViews.page, page))
    .limit(1);

  return result[0]?.count ?? 0;
}

export async function incrementPageView(page: string = "home"): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Tentar atualizar primeiro
  const existing = await db
    .select({ count: pageViews.count })
    .from(pageViews)
    .where(eq(pageViews.page, page))
    .limit(1);

  if (existing.length > 0) {
    // Atualizar
    await db
      .update(pageViews)
      .set({ count: sql`${pageViews.count} + 1` })
      .where(eq(pageViews.page, page));
  } else {
    // Inserir novo registro
    await db.insert(pageViews).values({
      page,
      count: 1,
    });
  }

  // Retornar o novo valor
  const updated = await db
    .select({ count: pageViews.count })
    .from(pageViews)
    .where(eq(pageViews.page, page))
    .limit(1);

  return updated[0]?.count ?? 1;
}

export async function initializePageViews(): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Verificar se já existe registro para "home"
  const existing = await db
    .select()
    .from(pageViews)
    .where(eq(pageViews.page, "home"))
    .limit(1);

  if (existing.length === 0) {
    // Inicializar com 1400
    await db.insert(pageViews).values({
      page: "home",
      count: 1400,
    });
  }
}
