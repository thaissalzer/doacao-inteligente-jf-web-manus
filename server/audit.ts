import { getDb } from "./db";
import { auditLogs, type User } from "../drizzle/schema";

export interface AuditLogInput {
  user: User;
  action: string;
  resourceType?: string;
  resourceId?: number;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Registra uma ação de auditoria no banco de dados
 */
export async function logAuditAction(input: AuditLogInput) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    await db.insert(auditLogs).values({
      userId: input.user.id,
      userName: input.user.name || "Unknown",
      userEmail: input.user.email || "unknown@example.com",
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      details: input.details ? JSON.stringify(input.details) : null,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    });
  } catch (error) {
    console.error("[Audit] Erro ao registrar ação:", error);
    // Não lançar erro para não impactar a operação principal
  }
}

/**
 * Busca logs de auditoria com filtros opcionais
 */
export async function getAuditLogs(filters?: {
  userId?: number;
  action?: string;
  resourceType?: string;
  limit?: number;
  offset?: number;
}) {
  try {
    const db = await getDb();
    if (!db) return [];
    
    let query = db.select().from(auditLogs) as any;

    // Aplicar filtros se fornecidos
    if (filters?.userId) {
      query = query.where((logs: any) => logs.userId === filters.userId);
    }
    if (filters?.action) {
      query = query.where((logs: any) => logs.action === filters.action);
    }
    if (filters?.resourceType) {
      query = query.where((logs: any) => logs.resourceType === filters.resourceType);
    }

    // Ordenar por data descendente
    query = query.orderBy(auditLogs.createdAt);

    // Aplicar limite e offset
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    if (filters?.offset) {
      query = query.offset(filters.offset);
    }

    return await query;
  } catch (error) {
    console.error("[Audit] Erro ao buscar logs:", error);
    return [];
  }
}

/**
 * Busca resumo de ações por usuário
 */
export async function getAuditSummaryByUser() {
  try {
    const db = await getDb();
    if (!db) return [];
    
    const logs = await db.select().from(auditLogs).orderBy(auditLogs.createdAt);

    const summary: Record<
      string,
      {
        userName: string;
        userEmail: string;
        actionCount: number;
        lastAction: Date;
        actions: Record<string, number>;
      }
    > = {};

    for (const log of logs) {
      if (!summary[log.userId]) {
        summary[log.userId] = {
          userName: log.userName,
          userEmail: log.userEmail,
          actionCount: 0,
          lastAction: log.createdAt,
          actions: {},
        };
      }

      summary[log.userId].actionCount++;
      summary[log.userId].lastAction = log.createdAt;
      summary[log.userId].actions[log.action] = (summary[log.userId].actions[log.action] || 0) + 1;
    }

    return Object.values(summary);
  } catch (error) {
    console.error("[Audit] Erro ao buscar resumo:", error);
    return [];
  }
}
