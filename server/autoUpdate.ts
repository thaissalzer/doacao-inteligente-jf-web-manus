import { invokeLLM } from "./_core/llm";
import { getDb } from "./db";
import { pontos, necessidades, updateLogs, sugestoes, type InsertSugestao } from "../drizzle/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { notifyOwner } from "./_core/notification";

const CATEGORIAS_VALIDAS = [
  "Alimentos", "Roupas", "Produtos de Higiene", "Material de Limpeza",
  "Colchões e Cobertores", "Água", "Medicamentos", "Outros",
] as const;

const STATUS_VALIDOS = ["URGENTE", "PRECISA", "OK"] as const;

type NecessidadeUpdate = {
  pontoNome: string;
  categoria: typeof CATEGORIAS_VALIDAS[number];
  item: string;
  status: typeof STATUS_VALIDOS[number];
  observacao?: string;
};

type LLMResponse = {
  atualizacoes: NecessidadeUpdate[];
  novosPontos: Array<{
    nome: string;
    tipo: "Ponto de arrecadação" | "Abrigo";
    bairro: string;
    cidade?: string;
    endereco?: string;
    horario?: string;
    descricao?: string;
  }>;
  resumo: string;
};

/**
 * Busca informações atualizadas sobre pontos de doação em Juiz de Fora
 * usando LLM com instruções para pesquisar na web.
 */
async function fetchUpdatesFromLLM(existingPontos: string[]): Promise<LLMResponse> {
  const pontosListStr = existingPontos.map((n, i) => `${i + 1}. ${n}`).join("\n");

  // Timeout real de 90 segundos usando Promise.race
  const TIMEOUT_MS = 90 * 1000;

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Timeout: a busca de atualizações excedeu 90 segundos')), TIMEOUT_MS);
  });

  const llmPromise = invokeLLM({
    messages: [
      {
        role: "system",
        content: `Você é um assistente especializado em monitorar campanhas de doação e pontos de arrecadação em Juiz de Fora, MG, Brasil.

Sua tarefa é fornecer informações atualizadas sobre:
1. Necessidades atuais dos pontos de doação existentes (o que estão precisando receber)
2. Novos pontos de doação ou abrigos que possam ter sido criados recentemente
3. Mudanças de status (pontos que fecharam, mudaram de endereço, etc.)

Considere fontes como:
- Prefeitura de Juiz de Fora (pjf.mg.gov.br)
- Defesa Civil de Juiz de Fora
- Notícias locais (Tribuna de Minas, G1 Zona da Mata, Acessa.com)
- Redes sociais de organizações locais
- Campanhas de solidariedade ativas na cidade
- Threads (threads.com) - buscar posts de perfis locais como @petcaeseciabh, @hdembalagens, @ricardoribeirojornalista, @leonardo.barretovargas
- Instagram - buscar posts com hashtags como #doacoesjf, #juizdefora, #enchentejf, #solidariedadejf
- Posts de igrejas, escolas, ONGs e comércios locais que estejam recebendo doações
- Abrigos temporários e pontos de apoio criados pela Defesa Civil ou comunidade

Dicas para encontrar informações relevantes:
- Procure por posts recentes mencionando "doação", "arrecadação", "enchente", "abrigo" em Juiz de Fora
- Verifique se há novos pontos de coleta em lojas, igrejas, escolas ou instituições
- Identifique itens específicos que cada ponto está precisando (ex: fraldas, ração, cadeira de rodas)
- Verifique se algum ponto parou de receber doações ou mudou de endereço

IMPORTANTE: Retorne APENAS informações que você tenha confiança razoável de serem verdadeiras e atuais. Não invente dados. Se não houver informações novas, retorne listas vazias.

Categorias válidas para necessidades: ${CATEGORIAS_VALIDAS.join(", ")}
Status válidos: URGENTE (precisa com urgência), PRECISA (precisa mas não é urgente), OK (já tem o suficiente)`,
      },
      {
        role: "user",
        content: `Pesquise as últimas informações sobre pontos de doação e necessidades em Juiz de Fora, MG.

Estes são os pontos de doação que já temos cadastrados:
${pontosListStr}

Por favor, forneça:
1. Atualizações de necessidades para os pontos existentes (o que cada um está precisando receber atualmente)
2. Novos pontos de doação ou abrigos que possam ter surgido recentemente em JF
3. Um resumo breve das informações encontradas

Responda APENAS com JSON válido no formato especificado.`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "donation_updates",
        strict: true,
        schema: {
          type: "object",
          properties: {
            atualizacoes: {
              type: "array",
              description: "Lista de necessidades atualizadas para pontos existentes",
              items: {
                type: "object",
                properties: {
                  pontoNome: { type: "string", description: "Nome exato do ponto de doação (deve corresponder a um dos pontos listados)" },
                  categoria: { type: "string", enum: [...CATEGORIAS_VALIDAS], description: "Categoria da necessidade" },
                  item: { type: "string", description: "Descrição do item necessário" },
                  status: { type: "string", enum: [...STATUS_VALIDOS], description: "Status da necessidade" },
                  observacao: { type: "string", description: "Observação adicional" },
                },
                required: ["pontoNome", "categoria", "item", "status", "observacao"],
                additionalProperties: false,
              },
            },
            novosPontos: {
              type: "array",
              description: "Novos pontos de doação encontrados",
              items: {
                type: "object",
                properties: {
                  nome: { type: "string" },
                  tipo: { type: "string", enum: ["Ponto de arrecadação", "Abrigo"] },
                  bairro: { type: "string" },
                  cidade: { type: "string" },
                  endereco: { type: "string" },
                  horario: { type: "string" },
                  descricao: { type: "string" },
                },
                required: ["nome", "tipo", "bairro", "cidade", "endereco", "horario", "descricao"],
                additionalProperties: false,
              },
            },
            resumo: {
              type: "string",
              description: "Resumo breve das informações encontradas e atualizações realizadas",
            },
          },
          required: ["atualizacoes", "novosPontos", "resumo"],
          additionalProperties: false,
        },
      },
    },
  });

  const response = await Promise.race([llmPromise, timeoutPromise]);

  const content = response.choices[0]?.message?.content;
  if (!content || typeof content !== "string") {
    throw new Error("LLM retornou resposta vazia");
  }

  return JSON.parse(content) as LLMResponse;
}

/**
 * Salva as atualizações como sugestões pendentes de aprovação.
 */
async function saveAsSugestoes(data: LLMResponse, logId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  let totalSugestoes = 0;

  // Buscar todos os pontos existentes
  const allPontos = await db.select().from(pontos).where(eq(pontos.ativo, true));
  const pontosByName = new Map(allPontos.map((p) => [p.nome.toLowerCase().trim(), p]));

  // Salvar atualizações de necessidades como sugestões
  for (const update of data.atualizacoes) {
    const ponto = pontosByName.get(update.pontoNome.toLowerCase().trim());
    if (!ponto) continue;

    // Validar categoria e status
    if (!CATEGORIAS_VALIDAS.includes(update.categoria as any)) continue;
    if (!STATUS_VALIDOS.includes(update.status as any)) continue;

    // Verificar se já existe uma necessidade similar
    const existingNecs = await db
      .select()
      .from(necessidades)
      .where(eq(necessidades.pontoId, ponto.id));

    const existingNec = existingNecs.find(
      (n) =>
        n.categoria === update.categoria &&
        n.item.toLowerCase().trim() === update.item.toLowerCase().trim()
    );

    if (existingNec) {
      // Sugestão de atualização de necessidade existente
      if (existingNec.status !== update.status) {
        await db.insert(sugestoes).values({
          tipo: "atualizar_necessidade",
          pontoId: ponto.id,
          pontoRefNome: ponto.nome,
          necessidadeId: existingNec.id,
          necessidadeCategoria: update.categoria,
          necessidadeItem: update.item,
          necessidadeStatus: update.status,
          fonte: update.observacao || "",
          updateLogId: logId,
        });
        totalSugestoes++;
      }
    } else {
      // Sugestão de nova necessidade
      await db.insert(sugestoes).values({
        tipo: "nova_necessidade",
        pontoId: ponto.id,
        pontoRefNome: ponto.nome,
        necessidadeCategoria: update.categoria,
        necessidadeItem: update.item,
        necessidadeStatus: update.status,
        fonte: update.observacao || "",
        updateLogId: logId,
      });
      totalSugestoes++;
    }
  }

  // Salvar novos pontos como sugestões
  for (const novoPonto of data.novosPontos) {
    const exists = pontosByName.has(novoPonto.nome.toLowerCase().trim());
    if (exists) continue;

    await db.insert(sugestoes).values({
      tipo: "novo_ponto",
      pontoNome: novoPonto.nome,
      pontoTipo: novoPonto.tipo,
      pontoBairro: novoPonto.bairro,
      pontoCidade: novoPonto.cidade || "Juiz de Fora",
      pontoEndereco: novoPonto.endereco || "",
      pontoDescricao: novoPonto.descricao || "",
      fonte: "",
      updateLogId: logId,
    });
    totalSugestoes++;
  }

  return totalSugestoes;
}

/**
 * Executa o job completo de atualização automática.
 * Agora salva como sugestões pendentes ao invés de aplicar diretamente.
 */
export async function runAutoUpdate(): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.error("[AutoUpdate] Database not available");
    return;
  }

  // Auto-recovery: limpar logs travados (running há mais de 10 minutos)
  try {
    const staleThreshold = new Date(Date.now() - 10 * 60 * 1000);
    await db
      .update(updateLogs)
      .set({
        status: "error",
        erro: "Atualização expirou (timeout de 10 minutos)",
        finishedAt: new Date(),
      })
      .where(and(eq(updateLogs.status, "running"), sql`${updateLogs.startedAt} < ${staleThreshold}`));
  } catch (e) {
    console.warn("[AutoUpdate] Falha ao limpar logs travados:", e);
  }

  // Verificar se já existe uma atualização em andamento recente
  const [currentRunning] = await db
    .select()
    .from(updateLogs)
    .where(eq(updateLogs.status, "running"))
    .limit(1);
  if (currentRunning) {
    console.log("[AutoUpdate] Já existe uma atualização em andamento. Ignorando.");
    return;
  }

  console.log("[AutoUpdate] Iniciando atualização automática...");

  // Criar log de execução
  const [logResult] = await db.insert(updateLogs).values({
    status: "running",
    startedAt: new Date(),
  });
  const logId = logResult.insertId;

  try {
    // Buscar nomes dos pontos existentes
    const allPontos = await db.select({ nome: pontos.nome }).from(pontos).where(eq(pontos.ativo, true));
    const pontoNames = allPontos.map((p) => p.nome);

    // Buscar atualizações via LLM
    const updates = await fetchUpdatesFromLLM(pontoNames);

    // Salvar como sugestões pendentes
    const totalSugestoes = await saveAsSugestoes(updates, logId);

    // Atualizar log com sucesso
    await db
      .update(updateLogs)
      .set({
        status: "success",
        pontosAtualizados: 0,
        necessidadesAdicionadas: 0,
        necessidadesAtualizadas: 0,
        resumo: `${totalSugestoes} sugestões pendentes de aprovação. ${updates.resumo}`,
        finishedAt: new Date(),
      })
      .where(eq(updateLogs.id, logId));

    console.log(`[AutoUpdate] Concluído: ${totalSugestoes} sugestões pendentes de aprovação.`);

    // Notificar owner
    if (totalSugestoes > 0) {
      try {
        await notifyOwner({
          title: `${totalSugestoes} sugestões de atualização aguardando aprovação`,
          content: `A busca automática encontrou ${totalSugestoes} atualizações para os pontos de doação.\n\nResumo: ${updates.resumo}\n\nAcesse o painel admin para revisar e aprovar as sugestões.`,
        });
      } catch (e) {
        console.warn("[AutoUpdate] Falha ao notificar owner:", e);
      }
    }
  } catch (error: any) {
    console.error("[AutoUpdate] Erro:", error);

    await db
      .update(updateLogs)
      .set({
        status: "error",
        erro: error.message || String(error),
        finishedAt: new Date(),
      })
      .where(eq(updateLogs.id, logId));
  }
}

// ==================== SUGESTÕES ====================

/**
 * Lista sugestões pendentes.
 */
export async function listSugestoes(statusFilter?: string) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];
  if (statusFilter) {
    conditions.push(eq(sugestoes.status, statusFilter as any));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  return db.select().from(sugestoes).where(where).orderBy(desc(sugestoes.createdAt));
}

/**
 * Conta sugestões pendentes.
 */
export async function countPendingSugestoes() {
  const db = await getDb();
  if (!db) return 0;

  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(sugestoes)
    .where(eq(sugestoes.status, "pendente"));

  return result?.count ?? 0;
}

/**
 * Aprova uma sugestão e aplica a mudança no banco.
 */
export async function aproveSugestao(id: number, reviewerName: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [sugestao] = await db.select().from(sugestoes).where(eq(sugestoes.id, id)).limit(1);
  if (!sugestao) throw new Error("Sugestão não encontrada");
  if (sugestao.status !== "pendente") throw new Error("Sugestão já foi processada");

  if (sugestao.tipo === "novo_ponto") {
    // Criar novo ponto
    await db.insert(pontos).values({
      nome: sugestao.pontoNome!,
      tipo: (sugestao.pontoTipo as any) || "Ponto de arrecadação",
      bairro: sugestao.pontoBairro!,
      cidade: sugestao.pontoCidade || "Juiz de Fora",
      endereco: sugestao.pontoEndereco || "",
      descricao: sugestao.pontoDescricao || "",
      ativo: true,
      lastAutoUpdate: new Date(),
    });
  } else if (sugestao.tipo === "nova_necessidade") {
    // Criar nova necessidade
    if (sugestao.pontoId) {
      await db.insert(necessidades).values({
        pontoId: sugestao.pontoId,
        categoria: sugestao.necessidadeCategoria as any,
        item: sugestao.necessidadeItem!,
        status: (sugestao.necessidadeStatus as any) || "PRECISA",
        updatedBy: "Aprovação automática",
      });
      await db.update(pontos).set({ lastAutoUpdate: new Date() }).where(eq(pontos.id, sugestao.pontoId));
    }
  } else if (sugestao.tipo === "atualizar_necessidade") {
    // Atualizar necessidade existente
    if (sugestao.necessidadeId) {
      await db
        .update(necessidades)
        .set({
          status: (sugestao.necessidadeStatus as any) || "PRECISA",
          updatedBy: "Aprovação automática",
        })
        .where(eq(necessidades.id, sugestao.necessidadeId));
      if (sugestao.pontoId) {
        await db.update(pontos).set({ lastAutoUpdate: new Date() }).where(eq(pontos.id, sugestao.pontoId));
      }
    }
  }

  // Marcar como aprovada
  await db
    .update(sugestoes)
    .set({
      status: "aprovada",
      reviewedAt: new Date(),
      reviewedBy: reviewerName,
    })
    .where(eq(sugestoes.id, id));

  return { success: true };
}

/**
 * Rejeita uma sugestão.
 */
export async function rejectSugestao(id: number, reviewerName: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [sugestao] = await db.select().from(sugestoes).where(eq(sugestoes.id, id)).limit(1);
  if (!sugestao) throw new Error("Sugestão não encontrada");
  if (sugestao.status !== "pendente") throw new Error("Sugestão já foi processada");

  await db
    .update(sugestoes)
    .set({
      status: "rejeitada",
      reviewedAt: new Date(),
      reviewedBy: reviewerName,
    })
    .where(eq(sugestoes.id, id));

  return { success: true };
}

/**
 * Aprova todas as sugestões pendentes de uma vez.
 */
export async function approveAllPending(reviewerName: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const pending = await db.select().from(sugestoes).where(eq(sugestoes.status, "pendente"));
  let approved = 0;

  for (const s of pending) {
    try {
      await aproveSugestao(s.id, reviewerName);
      approved++;
    } catch (e) {
      console.warn(`[Sugestões] Falha ao aprovar sugestão ${s.id}:`, e);
    }
  }

  return { approved, total: pending.length };
}

/**
 * Retorna o último log de atualização.
 */
export async function getLastUpdateLog() {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(updateLogs)
    .orderBy(desc(updateLogs.startedAt))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

/**
 * Retorna os últimos N logs de atualização.
 */
export async function getUpdateLogs(limit: number = 10) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(updateLogs)
    .orderBy(desc(updateLogs.startedAt))
    .limit(limit);
}
