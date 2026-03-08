import { describe, it, expect } from "vitest";
import { logAuditAction, getAuditLogs, getAuditSummaryByUser } from "./audit";
import type { User } from "../drizzle/schema";

const mockUser: User = {
  id: 1,
  openId: "test-user-123",
  name: "Test User",
  email: "test@example.com",
  loginMethod: "google",
  role: "admin",
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

describe("Audit Logs", () => {
  it("should log an audit action", async () => {
    await logAuditAction({
      user: mockUser,
      action: "approve_sugestao",
      resourceType: "sugestao",
      resourceId: 1,
      details: { status: "approved" },
      ipAddress: "192.168.1.1",
      userAgent: "Mozilla/5.0",
    });

    // Verificar se o log foi criado
    const logs = await getAuditLogs({ userId: mockUser.id });
    expect(logs.length).toBeGreaterThan(0);
    expect(logs[0].action).toBe("approve_sugestao");
  });

  it("should retrieve audit logs with filters", async () => {
    await logAuditAction({
      user: mockUser,
      action: "create_ponto",
      resourceType: "ponto",
      resourceId: 5,
    });

    const logs = await getAuditLogs({
      userId: mockUser.id,
    });

    expect(logs.length).toBeGreaterThan(0);
    // Verificar que pelo menos um log contém a ação esperada
    const hasCreatePonto = logs.some((log) => log.action === "create_ponto");
    expect(hasCreatePonto).toBe(true);
  });

  it("should get audit summary by user", async () => {
    await logAuditAction({
      user: mockUser,
      action: "login",
    });

    const summary = await getAuditSummaryByUser();
    expect(summary.length).toBeGreaterThan(0);
    expect(summary[0].userName).toBe(mockUser.name);
  });

  it("should handle empty filters gracefully", async () => {
    const logs = await getAuditLogs({});
    expect(Array.isArray(logs)).toBe(true);
  });
});
