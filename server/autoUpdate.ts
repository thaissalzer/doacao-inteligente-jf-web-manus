import { invokeLLM } from "./_core/llm";
import { getDb } from "./db";
import { pontos, necessidades, updateLogs } from "../drizzle/schema";
import { eq, desc, sql } from "drizzle-orm";
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

  const response = await invokeLLM({
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
                  endereco: { type: "string" },
                  horario: { type: "string" },
                  descricao: { type: "string" },
                },
                required: ["nome", "tipo", "bairro", "endereco", "horario", "descricao"],
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

  const content = response.choices[0]?.message?.content;
  if (!content || typeof content !== "string") {
    throw new Error("LLM retornou resposta vazia");
  }

  return JSON.parse(content) as LLMResponse;
}

/**
 * Aplica as atualizações retornadas pelo LLM no banco de dados.
 */
async function applyUpdates(data: LLMResponse) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  let pontosAtualizados = 0;
  let necessidadesAdicionadas = 0;
  let necessidadesAtualizadas = 0;

  // Buscar todos os pontos existentes
  const allPontos = await db.select().from(pontos).where(eq(pontos.ativo, true));
  const pontosByName = new Map(allPontos.map((p) => [p.nome.toLowerCase().trim(), p]));

  // Aplicar atualizações de necessidades
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
      // Atualizar status se diferente
      if (existingNec.status !== update.status) {
        await db
          .update(necessidades)
          .set({
            status: update.status as any,
            observacao: update.observacao || existingNec.observacao,
            updatedBy: "Atualização automática",
          })
          .where(eq(necessidades.id, existingNec.id));
        necessidadesAtualizadas++;
      }
    } else {
      // Criar nova necessidade
      await db.insert(necessidades).values({
        pontoId: ponto.id,
        categoria: update.categoria as any,
        item: update.item,
        status: update.status as any,
        observacao: update.observacao || "",
        updatedBy: "Atualização automática",
      });
      necessidadesAdicionadas++;
    }

    // Marcar ponto como atualizado
    await db
      .update(pontos)
      .set({ lastAutoUpdate: new Date() })
      .where(eq(pontos.id, ponto.id));
    pontosAtualizados++;
  }

  // Adicionar novos pontos
  for (const novoPonto of data.novosPontos) {
    // Verificar se já existe
    const exists = pontosByName.has(novoPonto.nome.toLowerCase().trim());
    if (exists) continue;

    await db.insert(pontos).values({
      nome: novoPonto.nome,
      tipo: novoPonto.tipo as any,
      bairro: novoPonto.bairro,
      endereco: novoPonto.endereco || "",
      horario: novoPonto.horario || "",
      descricao: novoPonto.descricao || "",
      ativo: true,
      lastAutoUpdate: new Date(),
    });
  }

  return { pontosAtualizados, necessidadesAdicionadas, necessidadesAtualizadas };
}

/**
 * Executa o job completo de atualização automática.
 */
export async function runAutoUpdate(): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.error("[AutoUpdate] Database not available");
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

    // Aplicar atualizações
    const stats = await applyUpdates(updates);

    // Atualizar log com sucesso
    await db
      .update(updateLogs)
      .set({
        status: "success",
        pontosAtualizados: stats.pontosAtualizados,
        necessidadesAdicionadas: stats.necessidadesAdicionadas,
        necessidadesAtualizadas: stats.necessidadesAtualizadas,
        resumo: updates.resumo,
        finishedAt: new Date(),
      })
      .where(eq(updateLogs.id, logId));

    console.log(
      `[AutoUpdate] Concluído: ${stats.pontosAtualizados} pontos atualizados, ` +
      `${stats.necessidadesAdicionadas} necessidades adicionadas, ` +
      `${stats.necessidadesAtualizadas} necessidades atualizadas.`
    );

    // Notificar owner
    try {
      await notifyOwner({
        title: "Atualização automática concluída",
        content: `Resumo: ${updates.resumo}\n\nPontos atualizados: ${stats.pontosAtualizados}\nNecessidades adicionadas: ${stats.necessidadesAdicionadas}\nNecessidades atualizadas: ${stats.necessidadesAtualizadas}`,
      });
    } catch (e) {
      console.warn("[AutoUpdate] Falha ao notificar owner:", e);
    }
  } catch (error: any) {
    console.error("[AutoUpdate] Erro:", error);

    // Atualizar log com erro
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
