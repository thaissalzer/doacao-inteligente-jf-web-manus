import { callDataApi } from "./_core/dataApi";

export async function getPageViews(): Promise<number> {
  try {
    // Chamar a API interna do Manus para obter métricas de analytics
    const result = await callDataApi("Analytics/getMetrics", {
      query: {
        metric: "pageViews",
        period: "all",
      },
    });

    // Extrair o número de visualizações da resposta
    if (result && typeof result === "object") {
      const data = result as Record<string, unknown>;
      if ("pageViews" in data && typeof data.pageViews === "number") {
        return data.pageViews;
      }
      if ("pv" in data && typeof data.pv === "number") {
        return data.pv;
      }
      if ("value" in data && typeof data.value === "number") {
        return data.value;
      }
    }

    // Se não conseguir extrair, retornar 0
    console.warn("Could not extract page views from analytics API response:", result);
    return 0;
  } catch (error) {
    console.error("Failed to fetch page views from analytics:", error);
    // Retornar um valor padrão em caso de erro
    return 0;
  }
}
