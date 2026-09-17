// Estado en vivo de la flota en Upstash Redis (API REST), para que Neon pueda
// suspenderse entre usos.
//
// Por qué: Neon (plan por uso) cobra el tiempo que la base está despierta y la
// duerme a los 5 min sin consultas. Con el ingest escribiendo cada 10 s y el
// watchdog consultando cada 5 min, la base no se dormía nunca.
//
// Cómo queda el flujo con Redis configurado:
//   - Heartbeat sin cambios → sólo Redis: estado en vivo + 1 muestra por minuto
//     a un buffer. NO toca Neon.
//   - Cambio de estado, equipo que vuelve de offline, comandos pendientes,
//     programas/modelo distintos → camino completo a Neon (igual que antes).
//   - Buffer con más de 1 h → se vuelca a Neon en un solo createMany.
//   - Paneles: la parte que casi no cambia (equipos, clientes, programas) se
//     cachea 1 h en Redis; los datos en vivo se superponen desde Redis.
//   - Watchdog: mira el último dato en Redis; sólo toca Neon si un equipo pasa
//     a offline o si hay avisos pendientes.
//
// Sin variables de Redis (dev local, o si Upstash falla) todo cae al
// comportamiento anterior: cada muestra va directo a Neon.

import { createHash } from "node:crypto";

const REDIS_URL = (
  process.env.UPSTASH_REDIS_REST_URL ||
  process.env.KV_REST_API_URL ||
  ""
).replace(/\/+$/, "");
const REDIS_TOKEN =
  process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || "";

export function liveEnabled(): boolean {
  return REDIS_URL !== "" && REDIS_TOKEN !== "";
}

// Intervalos (configurables sólo para pruebas).
const envS = (name: string, def: number) => {
  const v = Number(process.env[name]);
  return Number.isFinite(v) && v > 0 ? v : def;
};
/** Cada cuánto se guarda una muestra de historial (antes: cada heartbeat). */
export const HIST_EVERY_MS = envS("LIVE_HIST_EVERY_S", 60) * 1000;
/** Cada cuánto se vuelca el buffer de historial a Neon. */
export const FLUSH_EVERY_MS = envS("LIVE_FLUSH_EVERY_S", 3600) * 1000;
/** Vida de la ficha del equipo (auth + último estado persistido). */
export const META_TTL_S = envS("LIVE_META_TTL_S", 24 * 3600);
/** Vida de la parte cacheada de los paneles. */
export const PANEL_TTL_S = envS("LIVE_PANEL_TTL_S", 3600);
/** Vida del índice de equipos que usa el watchdog. */
export const INDEX_TTL_S = envS("LIVE_INDEX_TTL_S", 24 * 3600);
/** Vida de la marca "hay comandos pendientes" (el comando vence a los 5 min). */
export const CMD_FLAG_TTL_S = 600;

// ---------------------------------------------------------------------------
// Cliente REST mínimo (pipeline): sin dependencias.

type Cmd = (string | number)[];

/** Falla de Redis (red, HTTP o comando). Permite caer a Neon sin confundirla con errores de la base. */
export class RedisError extends Error {}

export async function redis(cmds: Cmd[]): Promise<unknown[]> {
  if (cmds.length === 0) return [];
  let out: { result?: unknown; error?: string }[];
  try {
    const res = await fetch(`${REDIS_URL}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${REDIS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(cmds.map((c) => c.map(String))),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    out = (await res.json()) as { result?: unknown; error?: string }[];
  } catch (e) {
    throw new RedisError(`redis: ${(e as Error).message}`);
  }
  return out.map((r) => {
    if (r.error) throw new RedisError(`redis: ${r.error}`);
    return r.result;
  });
}

export function parseJson<T>(v: unknown): T | null {
  if (typeof v !== "string") return null;
  try {
    return JSON.parse(v) as T;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Claves

const P = "bo:";
export const K = {
  /** Ficha del equipo por deviceId (EqMeta). */
  eq: (deviceId: string) => `${P}eq:${deviceId}`,
  /** Último dato del equipo por deviceId (LiveState). */
  live: (deviceId: string) => `${P}live:${deviceId}`,
  /** Buffer de historial por deviceId (lista de LiveSample). */
  hist: (deviceId: string) => `${P}hist:${deviceId}`,
  /** Marca de comandos pendientes por deviceId. */
  cmd: (deviceId: string) => `${P}cmd:${deviceId}`,
  /** Índice de equipos activos (IndexEntry[]) para el watchdog. */
  index: `${P}equipos`,
  /** Marca "hay eventos sin notificar" para el watchdog. */
  evPending: `${P}evpending`,
  /** Versión de la caché de paneles (se incrementa al cambiar datos). */
  panelVer: `${P}panelver`,
  panelCliente: (token: string) => `${P}panel:cli:${token}`,
  panelAdmin: `${P}panel:admin`,
  /** Hora (epoch ms) de la última corrida del watchdog. */
  wdLast: `${P}wdlast`,
  /** Marca "programación del watchdog en QStash confirmada" (por configuración). */
  qsched: (sig: string) => `${P}qsched:${sig}`,
};

// ---------------------------------------------------------------------------
// Tipos

/** Lo mínimo del equipo que el ingest necesita sin consultar Neon. */
export type EqMeta = {
  id: string;
  deviceId: string;
  tokenHash: string;
  activo: boolean;
  online: boolean;
  lastRunState: number | null;
  lastOpMode: number | null;
  lastProg: string | null;
  modelo: string | null;
  serie: string | null;
  progsHash: string | null;
};

/** Una muestra, con los mismos nombres que el modelo Muestra de Prisma. */
export type LiveSample = {
  ts: number; // epoch ms
  reason: string;
  temp: number;
  rawTemp: number | null;
  fault: boolean;
  spEff: number | null;
  spCfg: number | null;
  drv: number | null;
  fan: number | null;
  aux: number | null;
  hum: number | null;
  humTgt: number | null;
  humFault: boolean;
  opMode: number | null;
  runState: number | null;
  warmup: boolean;
  etapa: number | null;
  elapsedS: number | null;
  totalS: number | null;
  remainingS: number | null;
  tMin: number | null;
  tMax: number | null;
  prog: string | null;
  uptimeS: number | null;
  resWh: number | null;
  fanOnS: number | null;
  numMod: number | null;
};

/** Último dato + estado del buffer de historial. */
export type LiveState = LiveSample & {
  histTs: number | null; // última muestra que entró al historial
  histStart: number | null; // muestra más vieja todavía en el buffer
};

export type IndexEntry = { id: string; deviceId: string; lastSeenMs: number | null };

// ---------------------------------------------------------------------------
// Helpers

export function sha256(s: string): string {
  return createHash("sha256").update(s).digest("hex");
}

/**
 * Huella de la lista de programas. Se normaliza a [slot, nombre] porque
 * `Equipo.programs` es jsonb y Postgres reordena las claves de cada objeto:
 * sin esto la huella del JSON del equipo nunca coincidiría con la de la base.
 */
export function progsHash(progs: unknown): string | null {
  if (!Array.isArray(progs)) return null;
  const norm = progs.map((p) => {
    const o = (p ?? {}) as { s?: unknown; n?: unknown };
    return [o.s ?? null, o.n ?? null];
  });
  return sha256(JSON.stringify(norm));
}

type EquipoForMeta = {
  id: string;
  deviceId: string;
  token: string;
  activo: boolean;
  online: boolean;
  lastRunState: number | null;
  lastOpMode: number | null;
  lastProg: string | null;
  modelo: string | null;
  serie: string | null;
  programs: unknown;
};

export function metaFromEquipo(e: EquipoForMeta): EqMeta {
  return {
    id: e.id,
    deviceId: e.deviceId,
    tokenHash: sha256(e.token),
    activo: e.activo,
    online: e.online,
    lastRunState: e.lastRunState,
    lastOpMode: e.lastOpMode,
    lastProg: e.lastProg,
    modelo: e.modelo,
    serie: e.serie,
    progsHash: progsHash(e.programs),
  };
}

/** Fila de Muestra para Prisma a partir de una muestra en vivo. */
export function muestraData(equipoId: string, s: LiveSample) {
  return {
    equipoId,
    createdAt: new Date(s.ts),
    reason: s.reason,
    temp: s.temp,
    rawTemp: s.rawTemp,
    fault: s.fault,
    spEff: s.spEff,
    spCfg: s.spCfg,
    drv: s.drv,
    fan: s.fan,
    aux: s.aux,
    hum: s.hum,
    humTgt: s.humTgt,
    humFault: s.humFault,
    opMode: s.opMode,
    runState: s.runState,
    warmup: s.warmup,
    etapa: s.etapa,
    elapsedS: s.elapsedS,
    totalS: s.totalS,
    remainingS: s.remainingS,
    tMin: s.tMin,
    tMax: s.tMax,
    prog: s.prog,
    uptimeS: s.uptimeS,
    resWh: s.resWh,
    fanOnS: s.fanOnS,
    numMod: s.numMod,
  };
}

/**
 * Invalida la caché cuando el admin cambia equipos o clientes: paneles
 * (versión nueva), índice del watchdog y, si se pasan, las fichas de equipos.
 * Nunca rompe la operación del admin si Redis falla.
 */
export async function invalidateFleet(deviceIds: string[] = []): Promise<void> {
  if (!liveEnabled()) return;
  try {
    await redis([
      ["INCR", K.panelVer],
      ["DEL", K.index],
      ...deviceIds.map((d) => ["DEL", K.eq(d)]),
    ]);
  } catch (e) {
    console.error("[live] invalidateFleet:", (e as Error).message);
  }
}

// ---------------------------------------------------------------------------
// Paneles: superponer el dato en vivo sobre la fila (posiblemente cacheada).

type RowWithLive = {
  deviceId: string;
  lastSeenAt: Date | string | null;
  lastReason?: string | null;
  lastRunState: number | null;
  lastTemp: number | null;
  lastOpMode: number | null;
  lastProg: string | null;
  muestras?: Record<string, unknown>[];
};

/**
 * Devuelve la fila con lastSeenAt como Date y, si el dato en vivo es más nuevo
 * que lo persistido, con los campos de estado y la "última muestra" tomados de
 * Redis.
 */
export function overlayLive<T extends RowWithLive>(
  row: T,
  live: LiveState | null,
): T & { lastSeenAt: Date | null } {
  const seen = row.lastSeenAt ? new Date(row.lastSeenAt) : null;
  if (!live || (seen && seen.getTime() >= live.ts)) {
    return { ...row, lastSeenAt: seen };
  }
  const muestra = {
    warmup: live.warmup,
    etapa: live.etapa,
    elapsedS: live.elapsedS,
    totalS: live.totalS,
    remainingS: live.remainingS,
    spEff: live.spEff,
    drv: live.drv,
    fan: live.fan,
    tMin: live.tMin,
    tMax: live.tMax,
    resWh: live.resWh,
    fanOnS: live.fanOnS,
    numMod: live.numMod,
    hum: live.hum,
    humTgt: live.humTgt,
    humFault: live.humFault,
  };
  return {
    ...row,
    lastSeenAt: new Date(live.ts),
    ...(row.lastReason !== undefined ? { lastReason: live.reason } : {}),
    lastRunState: live.runState ?? row.lastRunState,
    lastTemp: live.temp,
    lastOpMode: live.opMode ?? row.lastOpMode,
    lastProg: live.prog ?? row.lastProg,
    muestras: [muestra],
  };
}

/**
 * Caché de la parte "fija" de un panel (equipos, cliente, programas). Se guarda
 * como {ver, data} y vale mientras `ver` coincida con K.panelVer: la versión y
 * la caché se leen en un solo MGET. Ante una falla de Redis consulta Neon.
 */
export async function cachedPanel<T>(key: string, query: () => Promise<T | null>): Promise<T | null> {
  if (!liveEnabled()) return query();
  try {
    const [vals] = await redis([["MGET", K.panelVer, key]]);
    const [verRaw, raw] = vals as (string | null)[];
    const ver = verRaw ?? "0";
    const hit = parseJson<{ ver: string; data: T }>(raw);
    if (hit && hit.ver === ver) return hit.data;
    const data = await query();
    if (data) {
      await redis([["SET", key, JSON.stringify({ ver, data }), "EX", PANEL_TTL_S]]);
    }
    return data;
  } catch (e) {
    if (!(e instanceof RedisError)) throw e;
    console.error("[live] caché de panel no disponible:", e.message);
    return query();
  }
}

/** Dato en vivo de varios equipos; mapa vacío sin Redis o si Redis falla. */
export async function readLiveSafe(deviceIds: string[]): Promise<Map<string, LiveState>> {
  if (!liveEnabled()) return new Map();
  try {
    return await readLive(deviceIds);
  } catch (e) {
    console.error("[live] lectura en vivo no disponible:", (e as Error).message);
    return new Map();
  }
}

/** Lee el dato en vivo de varios equipos (por deviceId). */
export async function readLive(deviceIds: string[]): Promise<Map<string, LiveState>> {
  const map = new Map<string, LiveState>();
  if (deviceIds.length === 0) return map;
  const [vals] = await redis([["MGET", ...deviceIds.map((d) => K.live(d))]]);
  (vals as unknown[]).forEach((v, i) => {
    const s = parseJson<LiveState>(v);
    if (s) map.set(deviceIds[i], s);
  });
  return map;
}
