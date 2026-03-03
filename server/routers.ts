import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
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
import { runAutoUpdate, getLastUpdateLog, getUpdateLogs } from "./autoUpdate";

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
            content: `O ponto "${input.nome}" foi cadastrado no bairro ${input.bairro}. Endereço: ${input.endereco || "não informado"}.`,
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
      // Executar em background para não bloquear a resposta
      runAutoUpdate().catch((e) => console.error("[ManualUpdate] Erro:", e));
      return { success: true, message: "Atualização iniciada em background." };
    }),
  }),
});

export type AppRouter = typeof appRouter;
