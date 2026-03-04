import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { createPonto, getDb, getPontoById } from "./db";
import type { InsertPonto } from "../drizzle/schema";

describe("createPonto", () => {
  beforeAll(async () => {
    // Garantir que o banco está disponível
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available for tests");
    }
  });

  it("deve criar um ponto com cidade Juiz de Fora (padrão)", async () => {
    const data: InsertPonto = {
      nome: "Teste Ponto JF",
      tipo: "Ponto de arrecadação",
      bairro: "Centro",
      // cidade não fornecida - deve usar padrão
    };

    const id = await createPonto(data);
    expect(id).toBeGreaterThan(0);

    const ponto = await getPontoById(id);
    expect(ponto).toBeDefined();
    expect(ponto?.nome).toBe("Teste Ponto JF");
    expect(ponto?.cidade).toBe("Juiz de Fora");
    expect(ponto?.endereco).toBe("");
  });

  it("deve criar um ponto com cidade diferente (Itabira)", async () => {
    const data: InsertPonto = {
      nome: "Ginásio Poliesportivo Maestro Silvério Faustino",
      tipo: "Ponto de arrecadação",
      bairro: "Ponto de arrecadação",
      cidade: "Itabira",
      endereco: "Rua Irmãos D'Caux, s/n",
    };

    const id = await createPonto(data);
    expect(id).toBeGreaterThan(0);

    const ponto = await getPontoById(id);
    expect(ponto).toBeDefined();
    expect(ponto?.nome).toBe("Ginásio Poliesportivo Maestro Silvério Faustino");
    expect(ponto?.cidade).toBe("Itabira");
    expect(ponto?.endereco).toBe("Rua Irmãos D'Caux, s/n");
  });

  it("deve criar um ponto com todos os campos opcionais preenchidos", async () => {
    const data: InsertPonto = {
      nome: "Teste Completo",
      tipo: "Abrigo",
      bairro: "Vitorino Braga",
      cidade: "Juiz de Fora",
      endereco: "Av. Garibaldi, 169",
      horario: "08:00 - 18:00",
      descricao: "Abrigo de emergência",
      contatoNome: "João Silva",
      contatoWhats: "32999999999",
      contatoEmail: "joao@example.com",
      latitude: "-21.7580",
      longitude: "-43.3380",
    };

    const id = await createPonto(data);
    expect(id).toBeGreaterThan(0);

    const ponto = await getPontoById(id);
    expect(ponto).toBeDefined();
    expect(ponto?.nome).toBe("Teste Completo");
    expect(ponto?.horario).toBe("08:00 - 18:00");
    expect(ponto?.contatoNome).toBe("João Silva");
    expect(ponto?.contatoWhats).toBe("32999999999");
  });

  it("deve criar um ponto com campos opcionais vazios", async () => {
    const data: InsertPonto = {
      nome: "Teste Mínimo",
      tipo: "Ponto de arrecadação",
      bairro: "São Mateus",
      endereco: undefined,
      horario: undefined,
      descricao: undefined,
      contatoNome: undefined,
      contatoWhats: undefined,
      contatoEmail: undefined,
    };

    const id = await createPonto(data);
    expect(id).toBeGreaterThan(0);

    const ponto = await getPontoById(id);
    expect(ponto).toBeDefined();
    expect(ponto?.nome).toBe("Teste Mínimo");
    expect(ponto?.endereco).toBe("");
    expect(ponto?.horario).toBe("");
    expect(ponto?.contatoNome).toBe("");
  });
});
