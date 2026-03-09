
import { getSessionCookieOptions } from "./_core/cookies";
import { COOKIE_NAME } from "@shared/const";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  listPontos,
  getPontoById,
  createPonto,
  updatePonto,
  deletePonto,
  getBairros,
  listNecessidades,
  getNecessidadesByPontoId,
  createNecessidade,
  updateNecessidade,
  deleteNecessidade,
  getStats,
  seedPontosOficiais,
} from "./db";
import { notifyOwner } from "./_core/notification";
import { getPageViews } from "./analytics";
import { runAutoUpdate, getLastUpdateLog, getUpdateLogs, listSugestoes, countPendingSugestoes, aproveSugestao, rejectSugestao, approveAllPending } from "./autoUpdate";

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito a administradores" });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // Verificar que o usuário logado é Thais Salzer
  verifyAdmin: protectedProcedure.query(({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Apenas administradores podem acessar" });
    }
    return {
      isAdmin: true,
      name: ctx.user.name,
      email: ctx.user.email,
    };
  }),

  pontos: router({
    list: publicProcedure
      .input(z.object({
        ativo: z.boolean().optional(),
        bairro: z.string().optional(),
        tipo: z.string().optional(),
      }).optional())
      .query(({ input }) => listPontos(input ?? { ativo: true })),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => getPontoById(input.id)),

    getBairros: publicProcedure.query(() => getBairros()),

    getStats: publicProcedure.query(() => getStats()),

    create: adminProcedure
      .input(z.object({
        nome: z.string().min(1),
        tipo: z.enum(["Ponto de arrecadação", "Abrigo"]),
        bairro: z.string().min(1),
        cidade: z.string().optional(),
        endereco: z.string().optional(),
        horario: z.string().optional(),
        descricao: z.string().optional(),
        contatoNome: z.string().optional(),
        contatoWhats: z.string().optional(),
        contatoEmail: z.string().optional(),
        latitude: z.string().optional(),
        longitude: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await createPonto(input);
        try {
          await notifyOwner({
            title: "Novo ponto de doação cadastrado",
            content: `O ponto "${input.nome}" foi cadastrado no bairro ${input.bairro}${input.cidade ? " - " + input.cidade : ""}. Endereço: ${input.endereco || "não informado"}.`,
          });
        } catch (e) {
          console.warn("Failed to notify owner:", e);
        }
        return { id };
      }),

    update: adminProcedure
      .input(z.object({
        id: z.number(),
        nome: z.string().min(1).optional(),
        tipo: z.enum(["Ponto de arrecadação", "Abrigo"]).optional(),
        bairro: z.string().min(1).optional(),
        cidade: z.string().optional(),
        endereco: z.string().optional(),
        horario: z.string().optional(),
        descricao: z.string().optional(),
        contatoNome: z.string().optional(),
        contatoWhats: z.string().optional(),
        contatoEmail: z.string().optional(),
        latitude: z.string().optional(),
        longitude: z.string().optional(),
        ativo: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updatePonto(id, data);
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deletePonto(input.id);
        return { success: true };
      }),

    seed: adminProcedure.mutation(async () => {
      await seedPontosOficiais();
      return { success: true };
    }),
  }),

  necessidades: router({
    list: publicProcedure
      .input(z.object({
        pontoId: z.number().optional(),
        categoria: z.string().optional(),
        status: z.string().optional(),
      }).optional())
      .query(({ input }) => listNecessidades(input ?? {})),

    getByPonto: publicProcedure
      .input(z.object({ pontoId: z.number() }))
      .query(({ input }) => getNecessidadesByPontoId(input.pontoId)),

    create: adminProcedure
      .input(z.object({
        pontoId: z.number(),
        categoria: z.enum([
          "Alimentos", "Roupas", "Produtos de Higiene", "Material de Limpeza",
          "Colchões e Cobertores", "Água", "Medicamentos", "Outros",
        ]),
        item: z.string().min(1),
        status: z.enum(["URGENTE", "PRECISA", "OK"]),
        observacao: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const id = await createNecessidade({ ...input, updatedBy: ctx.user.name ?? "Admin" });
        return { id };
      }),

    update: adminProcedure
      .input(z.object({
        id: z.number(),
        categoria: z.enum([
          "Alimentos", "Roupas", "Produtos de Higiene", "Material de Limpeza",
          "Colchões e Cobertores", "Água", "Medicamentos", "Outros",
        ]).optional(),
        item: z.string().min(1).optional(),
        status: z.enum(["URGENTE", "PRECISA", "OK"]).optional(),
        observacao: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { id, ...data } = input;
        await updateNecessidade(id, { ...data, updatedBy: ctx.user.name ?? "Admin" });
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteNecessidade(input.id);
        return { success: true };
      }),
  }),

  updates: router({
    lastUpdate: publicProcedure.query(() => getLastUpdateLog()),

    logs: adminProcedure
      .input(z.object({ limit: z.number().min(1).max(50).optional() }).optional())
      .query(({ input }) => getUpdateLogs(input?.limit ?? 10)),

    triggerUpdate: adminProcedure.mutation(async () => {
      runAutoUpdate().catch((e) => console.error("[ManualUpdate] Erro:", e));
      return { success: true, message: "Busca iniciada. As sugestões aparecerão na aba de aprovação." };
    }),
  }),

  sugestoes: router({
    // Rota PÚBLICA para visitantes sugerirem novos pontos
    submit: publicProcedure
      .input(z.object({
        nome: z.string().min(1, "Nome é obrigatório"),
        tipo: z.enum(["Ponto de arrecadação", "Abrigo"]),
        bairro: z.string().min(1, "Bairro é obrigatório"),
        cidade: z.string().optional(),
        endereco: z.string().optional(),
        descricao: z.string().optional(),
        necessidades: z.string().optional(),
        contatoNome: z.string().optional(),
        contatoEmail: z.string().optional(),
        contatoWhats: z.string().optional(),
        fonte: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await import("./db").then(m => m.getDb());
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco indisponível" });

        const { sugestoes: sugestoesTable } = await import("../drizzle/schema");
        await db.insert(sugestoesTable).values({
          tipo: "novo_ponto",
          pontoNome: input.nome,
          pontoTipo: input.tipo,
          pontoBairro: input.bairro,
          pontoCidade: input.cidade || "Juiz de Fora",
          pontoEndereco: input.endereco || "",
          pontoDescricao: [input.descricao, input.necessidades ? `Necessidades: ${input.necessidades}` : ""].filter(Boolean).join("\n"),
          fonte: [input.fonte || "Sugestão de visitante", input.contatoNome ? `Contato: ${input.contatoNome}` : "", input.contatoEmail ? `Email: ${input.contatoEmail}` : "", input.contatoWhats ? `WhatsApp: ${input.contatoWhats}` : ""].filter(Boolean).join(" | "),
        });

        // Notificar owner
        try {
          await notifyOwner({
            title: "Nova sugestão de ponto de coleta",
            content: `Um visitante sugeriu o ponto "${input.nome}" no bairro ${input.bairro}${input.cidade && input.cidade !== "Juiz de Fora" ? " - " + input.cidade : ""}.\n\nAcesse o painel admin > aba Aprovação para revisar.`,
          });
        } catch (e) {
          console.warn("Failed to notify owner:", e);
        }

        return { success: true, message: "Sugestão enviada! Ela será revisada pela equipe antes de ser publicada." };
      }),

    list: adminProcedure
      .input(z.object({ status: z.string().optional() }).optional())
      .query(({ input }) => listSugestoes(input?.status)),

    countPending: adminProcedure.query(() => countPendingSugestoes()),

    approve: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user.name) throw new TRPCError({ code: "UNAUTHORIZED", message: "Nome do usuário não disponível" });
        return aproveSugestao(input.id, ctx.user.name);
      }),

    reject: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user.name) throw new TRPCError({ code: "UNAUTHORIZED", message: "Nome do usuário não disponível" });
        return rejectSugestao(input.id, ctx.user.name);
      }),

    approveAll: adminProcedure.mutation(async ({ ctx }) => {
      if (!ctx.user.name) throw new TRPCError({ code: "UNAUTHORIZED", message: "Nome do usuário não disponível" });
      return approveAllPending(ctx.user.name);
    }),
  }),

  analytics: router({
    pageViews: publicProcedure.query(async () => {
      const { getPageViewCount, incrementPageView, initializePageViews } = await import("./db");
      // Inicializar se necessário
      await initializePageViews();
      // Incrementar visualização
      await incrementPageView("home");
      // Retornar o novo valor
      const views = await getPageViewCount("home");
      return { pageViews: views };
    }),
  }),
});

export type AppRouter = typeof appRouter;
