// Disparador confiable del watchdog con Upstash QStash.
//
// Por qué: el cron "*/5" de GitHub Actions en la práctica corría cada ~5 h, y
// los avisos de "equipo sin conexión" llegaban con horas de atraso. QStash llama
// al endpoint cada 5 min (288 mensajes/día; el plan gratis permite 1.000).
//
// El propio watchdog crea/actualiza la programación (id fijo, así que repetirlo
// no duplica nada) cuando existen QSTASH_TOKEN y CRON_SECRET. QStash reenvía el
// header Authorization, así el endpoint mantiene la misma autenticación.
// GitHub Actions queda como disparador de respaldo.

import { K, liveEnabled, redis, sha256 } from "@/lib/live";

const SCHEDULE_ID = "bioorigen-watchdog";
const CRON = "*/5 * * * *";
/** Cada cuánto se vuelve a confirmar la programación en QStash. */
const RECHECK_S = 24 * 3600;

export function watchdogUrl(): string {
  return (
    process.env.WATCHDOG_URL?.trim() ||
    "https://bioorigen-web.vercel.app/api/cron/watchdog"
  );
}

/**
 * Crea o actualiza la programación del watchdog en QStash, a lo sumo una vez
 * por día. Nunca rompe el watchdog: devuelve un texto de estado para el log.
 */
export async function ensureWatchdogSchedule(): Promise<string> {
  const token = process.env.QSTASH_TOKEN;
  const secret = process.env.CRON_SECRET;
  if (!token || !secret) return "sin QSTASH_TOKEN";

  const base = (process.env.QSTASH_URL || "https://qstash.upstash.io").replace(/\/+$/, "");
  // Si cambia la configuración, la marca cambia y se vuelve a programar.
  const marker = K.qsched(sha256(`${SCHEDULE_ID}|${CRON}|${watchdogUrl()}|${base}`).slice(0, 16));

  try {
    if (liveEnabled()) {
      const [set] = await redis([["SET", marker, "1", "EX", RECHECK_S, "NX"]]);
      if (set === null) return "programación vigente";
    }
    const res = await fetch(`${base}/v2/schedules/${watchdogUrl()}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Upstash-Cron": CRON,
        "Upstash-Schedule-Id": SCHEDULE_ID,
        "Upstash-Method": "POST",
        "Upstash-Retries": "0", // el próximo barrido llega en 5 min
        "Upstash-Forward-Authorization": `Bearer ${secret}`,
      },
      cache: "no-store",
    });
    if (!res.ok) {
      const txt = (await res.text()).slice(0, 160);
      if (liveEnabled()) await redis([["DEL", marker]]).catch(() => {});
      return `QStash HTTP ${res.status}: ${txt}`;
    }
    return `programación ${SCHEDULE_ID} ${CRON} OK`;
  } catch (e) {
    return `QStash no disponible: ${(e as Error).message}`;
  }
}
