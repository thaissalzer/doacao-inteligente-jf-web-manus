import { runAutoUpdate } from "./autoUpdate";

const INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 horas
const INITIAL_DELAY_MS = 60 * 1000; // 1 minuto após iniciar o servidor

let cronTimer: ReturnType<typeof setInterval> | null = null;

/**
 * Inicia o cron job de atualização automática diária.
 * Executa a primeira vez após 1 minuto e depois a cada 24 horas.
 */
export function startCronJobs() {
  console.log("[Cron] Agendando atualização automática diária...");

  // Primeira execução após delay inicial
  setTimeout(async () => {
    console.log("[Cron] Executando primeira atualização automática...");
    try {
      await runAutoUpdate();
    } catch (e) {
      console.error("[Cron] Erro na primeira execução:", e);
    }

    // Agendar execuções subsequentes a cada 24 horas
    cronTimer = setInterval(async () => {
      console.log("[Cron] Executando atualização automática agendada...");
      try {
        await runAutoUpdate();
      } catch (e) {
        console.error("[Cron] Erro na execução agendada:", e);
      }
    }, INTERVAL_MS);
  }, INITIAL_DELAY_MS);

  console.log(
    `[Cron] Primeira execução em ${INITIAL_DELAY_MS / 1000}s, ` +
    `depois a cada ${INTERVAL_MS / 1000 / 60 / 60}h.`
  );
}

export function stopCronJobs() {
  if (cronTimer) {
    clearInterval(cronTimer);
    cronTimer = null;
    console.log("[Cron] Jobs parados.");
  }
}
