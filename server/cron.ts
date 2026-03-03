import { runAutoUpdate } from "./autoUpdate";

let cronTimer: ReturnType<typeof setInterval> | null = null;

/**
 * Calcula os milissegundos até a próxima execução às 9h (horário de Brasília, UTC-3).
 */
function msUntilNext9amBRT(): number {
  const now = new Date();
  // Horário de Brasília = UTC - 3
  const brtOffsetMs = -3 * 60 * 60 * 1000;
  const nowBRT = new Date(now.getTime() + brtOffsetMs);

  // Próxima 9h BRT
  const next9am = new Date(nowBRT);
  next9am.setUTCHours(9, 0, 0, 0);

  // Se já passou das 9h hoje, agendar para amanhã
  if (nowBRT.getUTCHours() >= 9) {
    next9am.setUTCDate(next9am.getUTCDate() + 1);
  }

  // Converter de volta para UTC
  const next9amUTC = new Date(next9am.getTime() - brtOffsetMs);
  return next9amUTC.getTime() - now.getTime();
}

/**
 * Agenda a próxima execução às 9h BRT.
 */
function scheduleNext() {
  const ms = msUntilNext9amBRT();
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));

  console.log(`[Cron] Próxima atualização em ${hours}h${minutes}min (às 9h BRT).`);

  cronTimer = setTimeout(async () => {
    console.log("[Cron] Executando atualização automática das 9h...");
    try {
      await runAutoUpdate();
    } catch (e) {
      console.error("[Cron] Erro na execução agendada:", e);
    }
    // Agendar a próxima execução
    scheduleNext();
  }, ms);
}

/**
 * Inicia o cron job de atualização automática diária às 9h BRT.
 */
export function startCronJobs() {
  console.log("[Cron] Agendando atualização automática diária às 9h (horário de Brasília)...");
  scheduleNext();
}

export function stopCronJobs() {
  if (cronTimer) {
    clearTimeout(cronTimer);
    cronTimer = null;
    console.log("[Cron] Jobs parados.");
  }
}
