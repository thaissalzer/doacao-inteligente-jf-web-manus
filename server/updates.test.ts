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

describe("updates.lastUpdate", () => {
  it("returns last update log for public users", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.updates.lastUpdate();
    // Can be null if no updates have run, or an object with expected fields
    if (result !== null) {
      expect(result).toHaveProperty("id");
      expect(result).toHaveProperty("status");
      expect(result).toHaveProperty("startedAt");
      expect(["running", "success", "error"]).toContain(result.status);
    }
  });

  it("returns update log with numeric stats fields", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.updates.lastUpdate();
    if (result !== null && result.status === "success") {
      expect(typeof result.pontosAtualizados).toBe("number");
      expect(typeof result.necessidadesAdicionadas).toBe("number");
      expect(typeof result.necessidadesAtualizadas).toBe("number");
    }
  });
});

describe("updates.logs (admin only)", () => {
  it("returns an array of update logs for admin users", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.updates.logs({ limit: 5 });
    expect(Array.isArray(result)).toBe(true);
  });

  it("rejects logs access from regular user", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.updates.logs({ limit: 5 })).rejects.toThrow();
  });

  it("rejects logs access from public user", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.updates.logs({ limit: 5 })).rejects.toThrow();
  });
});

describe("updates.triggerUpdate (admin only)", () => {
  it("rejects trigger from regular user", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.updates.triggerUpdate()).rejects.toThrow();
  });

  it("rejects trigger from public user", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.updates.triggerUpdate()).rejects.toThrow();
  });

  it("allows admin to trigger update and returns success", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.updates.triggerUpdate();
    expect(result).toHaveProperty("success", true);
    expect(result).toHaveProperty("message");
  });
});
