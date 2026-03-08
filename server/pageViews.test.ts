import { describe, it, expect, beforeAll } from "vitest";
import { getPageViewCount, incrementPageView, initializePageViews } from "./db";

describe("Page Views", () => {
  beforeAll(async () => {
    // Inicializar antes dos testes
    await initializePageViews();
  });

  it("should initialize page views with 1400 for home", async () => {
    const count = await getPageViewCount("home");
    expect(count).toBeGreaterThanOrEqual(1400);
  });

  it("should increment page views", async () => {
    const beforeCount = await getPageViewCount("home");
    await incrementPageView("home");
    const afterCount = await getPageViewCount("home");
    expect(afterCount).toBe(beforeCount + 1);
  });

  it("should handle multiple increments", async () => {
    const beforeCount = await getPageViewCount("home");
    await incrementPageView("home");
    await incrementPageView("home");
    await incrementPageView("home");
    const afterCount = await getPageViewCount("home");
    expect(afterCount).toBe(beforeCount + 3);
  });

  it("should return 0 for non-existent pages before initialization", async () => {
    // Tentar obter uma página que não existe
    const count = await getPageViewCount("nonexistent");
    expect(count).toBe(0);
  });
});
