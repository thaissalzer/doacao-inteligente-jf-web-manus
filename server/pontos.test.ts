import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@example.com",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

function createUserContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "regular-user",
    email: "user@example.com",
    name: "Regular User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("pontos.list", () => {
  it("returns an array of pontos for public users", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.pontos.list({ ativo: true });
    expect(Array.isArray(result)).toBe(true);
  });

  it("returns pontos with expected fields", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.pontos.list({ ativo: true });
    if (result.length > 0) {
      const ponto = result[0];
      expect(ponto).toHaveProperty("id");
      expect(ponto).toHaveProperty("nome");
      expect(ponto).toHaveProperty("bairro");
      expect(ponto).toHaveProperty("tipo");
      expect(ponto).toHaveProperty("ativo");
    }
  });
});

describe("pontos.getStats", () => {
  it("returns stats object with expected fields", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.pontos.getStats();
    expect(result).toHaveProperty("totalPontos");
    expect(result).toHaveProperty("totalUrgentes");
    expect(result).toHaveProperty("totalNecessidades");
    expect(result).toHaveProperty("totalBairros");
    expect(typeof result.totalPontos).toBe("number");
    expect(typeof result.totalUrgentes).toBe("number");
  });
});

describe("pontos.getBairros", () => {
  it("returns an array of bairro/cidade objects", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.pontos.getBairros();
    expect(Array.isArray(result)).toBe(true);
    if (result.length > 0) {
      expect(result[0]).toHaveProperty("bairro");
      expect(result[0]).toHaveProperty("cidade");
      expect(typeof result[0].bairro).toBe("string");
      expect(typeof result[0].cidade).toBe("string");
    }
  });
});

describe("necessidades.list", () => {
  it("returns an array of necessidades for public users", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.necessidades.list({});
    expect(Array.isArray(result)).toBe(true);
  });

  it("returns necessidades with expected fields", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.necessidades.list({});
    if (result.length > 0) {
      const nec = result[0];
      expect(nec).toHaveProperty("id");
      expect(nec).toHaveProperty("pontoId");
      expect(nec).toHaveProperty("categoria");
      expect(nec).toHaveProperty("item");
      expect(nec).toHaveProperty("status");
    }
  });
});

describe("admin access control", () => {
  it("rejects ponto creation from regular user", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.pontos.create({
        nome: "Test Ponto",
        tipo: "Abrigo",
        bairro: "Centro",
      })
    ).rejects.toThrow();
  });

  it("rejects necessidade creation from regular user", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.necessidades.create({
        pontoId: 1,
        categoria: "Alimentos",
        item: "Test Item",
        status: "PRECISA",
      })
    ).rejects.toThrow();
  });

  it("rejects ponto deletion from regular user", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.pontos.delete({ id: 1 })).rejects.toThrow();
  });
});
