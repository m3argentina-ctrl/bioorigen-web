import { NextResponse } from "next/server";
import { z } from "zod";
import type { Equipo } from "@prisma/client";
import { prisma } from "@/lib/db";
import { notifyAlert } from "@/lib/notify";
import {
  HIST_EVERY_MS,
  K,
  META_TTL_S,
  RedisError,
  flushDue,
  liveEnabled,
  metaFromEquipo,
  nextPushS,
  muestraData,
  parseJson,
  progsHash,
  redis,
  sha256,
  type EqMeta,
  type LiveSample,
  type LiveState,
} from "@/lib/live";

// Prisma necesita el runtime Node (no edge); y nunca cachear.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// run_state == 5 → RUN_STATE_ALARM (ver firmware app_state.h)
const RUN_ALARM = 5;

// El firmware manda booleanos como 0/1; aceptamos ambos.
const boolish = z.union([z.boolean(), z.number()]).optional();
const toBool = (v: unknown) => v === true || v === 1;

// Espejo del JSON de cloud_telemetry.c. Campos opcionales y passthrough para no
// romper si el firmware agrega claves nuevas (históricos, etc.).
const schema = z
  .object({
    id: z.string().min(1).max(64),
    reason: z.enum(["boot", "state", "alarm", "heartbeat"]).default("heartbeat"),
    temp: z.number(),
    raw_temp: z.number().optional(),
    fault: boolish,
    sp_eff: z.number().optional(),
    sp_cfg: z.number().optional(),
    drv: z.number().optional(),
    fan: z.number().optional(),
    aux: z.number().optional(),
    hum: z.number().optional(),
    hum_tgt: z.number().optional(),
    hum_fault: boolish,
    op_mode: z.number().optional(),
    run_state: z.number().optional(),
    warmup: boolish,
    etapa: z.number().optional(),
    elapsed_s: z.number().optional(),
    total_s: z.number().optional(),
    remaining_s: z.number().optional(),
    t_min: z.number().optional(),
    t_max: z.number().optional(),
    prog: z.string().max(64).optional(),
    modelo: z.string().max(32).optional(),
    serie: z.string().max(32).optional(),
    uptime_s: z.number().optional(),
    // Consumo de energía de la sesión (acumuladores por módulo).
    res_wh: z.number().optional(),
    fan_on_s: z.number().optional(),
    num_mod: z.number().optional(),
    // Programas memorizados en el equipo (slots usados).
    progs: z.array(z.object({ s: z.number(), n: z.string() })).optional(),
  })
  .passthrough();

type Datos = z.infer<typeof schema>;

function bearer(req: Request): string | null {
  const h = req.headers.get("authorization") || "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}

// Comparación de tiempo constante (evita timing attacks sobre el token).
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

function toSample(d: Datos, ts: number): LiveSample {
  return {
    ts,
    reason: d.reason,
    temp: d.temp,
    rawTemp: d.raw_temp ?? null,
    fault: toBool(d.fault),
    spEff: d.sp_eff ?? null,
    spCfg: d.sp_cfg ?? null,
    drv: d.drv ?? null,
    fan: d.fan ?? null,
    aux: d.aux ?? null,
    hum: d.hum ?? null,
    humTgt: d.hum_tgt ?? null,
    humFault: toBool(d.hum_fault),
    opMode: d.op_mode ?? null,
    runState: d.run_state ?? null,
    warmup: toBool(d.warmup),
    etapa: d.etapa ?? null,
    elapsedS: d.elapsed_s ?? null,
    totalS: d.total_s ?? null,
    remainingS: d.remaining_s ?? null,
    tMin: d.t_min ?? null,
    tMax: d.t_max ?? null,
    prog: d.prog ?? null,
    uptimeS: d.uptime_s ?? null,
    resWh: d.res_wh ?? null,
    fanOnS: d.fan_on_s ?? null,
    numMod: d.num_mod ?? null,
  };
}

export async function POST(req: Request) {
  const token = bearer(req);
  if (!token) {
    return NextResponse.json({ error: "falta el token Bearer" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "datos inválidos" },
      { status: 422 },
    );
  }
  const d = parsed.data;

  if (liveEnabled()) {
    try {
      return await ingestLive(token, d);
    } catch (e) {
      // Sólo las fallas de Redis caen a Neon directo. Toda lectura de Redis
      // ocurre antes de escribir en Neon, y las escrituras posteriores son
      // "best effort", así que no se duplican muestras ni comandos.
      if (!(e instanceof RedisError)) throw e;
      console.error("[ingest] Redis no disponible, uso Neon directo:", e.message);
    }
  }
  return ingestDb(token, d);
}

// ---------------------------------------------------------------------------
// Sin Redis: cada muestra va a Neon (comportamiento original).

async function ingestDb(token: string, d: Datos) {
  const equipo = await prisma.equipo.findUnique({ where: { deviceId: d.id } });
  if (!equipo || !equipo.activo) {
    return NextResponse.json({ error: "equipo no registrado" }, { status: 404 });
  }
  if (!safeEqual(token, equipo.token)) {
    return NextResponse.json({ error: "token inválido" }, { status: 403 });
  }
  const now = Date.now();
  const r = await persistFull(equipo, d, toSample(d, now), equipo.online);
  return NextResponse.json({ ok: true, cmds: r.cmds, next_push_s: nextPushS(d.run_state) });
}

// ---------------------------------------------------------------------------
// Con Redis: Neon sólo cuando hace falta (ver lib/live.ts).

async function ingestLive(token: string, d: Datos) {
  const nowMs = Date.now();
  // Una sola lectura (Upstash cobra por comando): ficha, último dato y marca de comandos.
  const [vals] = await redis([["MGET", K.eq(d.id), K.live(d.id), K.cmd(d.id)]]);
  const [metaRaw, liveRaw, cmdRaw] = vals as (string | null)[];

  // Autenticación con la ficha cacheada; si falta o el token no coincide
  // (p. ej. se regeneró), se relee de Neon antes de rechazar.
  let meta = parseJson<EqMeta>(metaRaw);
  let equipo: Equipo | null = null;
  if (!meta || !safeEqual(sha256(token), meta.tokenHash)) {
    equipo = await prisma.equipo.findUnique({ where: { deviceId: d.id } });
    meta = equipo ? metaFromEquipo(equipo) : null;
    if (meta) {
      await redis([["SET", K.eq(d.id), JSON.stringify(meta), "EX", META_TTL_S]]);
    }
  }
  if (!meta || !meta.activo) {
    return NextResponse.json({ error: "equipo no registrado" }, { status: 404 });
  }
  if (!safeEqual(sha256(token), meta.tokenHash)) {
    return NextResponse.json({ error: "token inválido" }, { status: 403 });
  }

  const prev = parseJson<LiveState>(liveRaw);
  const sample = toSample(d, nowMs);
  const histDue = !prev?.histTs || nowMs - prev.histTs >= HIST_EVERY_MS;
  const flush = flushDue(prev?.histStart, nowMs);

  const stateChange =
    d.reason !== "heartbeat" ||
    !meta.online ||
    cmdRaw !== null ||
    (d.run_state !== undefined && d.run_state !== meta.lastRunState) ||
    (d.op_mode !== undefined && d.op_mode !== meta.lastOpMode) ||
    (d.prog !== undefined && d.prog !== meta.lastProg) ||
    (d.modelo !== undefined && d.modelo !== meta.modelo) ||
    (d.serie !== undefined && d.serie !== meta.serie) ||
    (d.progs !== undefined && progsHash(d.progs) !== meta.progsHash);

  // A) Cambio de estado → camino completo a Neon.
  if (stateChange) {
    equipo ??= await prisma.equipo.findUnique({ where: { deviceId: d.id } });
    if (!equipo) {
      return NextResponse.json({ error: "equipo no registrado" }, { status: 404 });
    }
    // Primero el historial pendiente, así el lote que se cierre lo incluye.
    await flushHist(equipo.id, d.id, []);
    const r = await persistFull(equipo, d, sample, meta.online);
    await bestEffort([
      ["SET", K.eq(d.id), JSON.stringify(metaFromEquipo(r.updated)), "EX", META_TTL_S],
      ["SET", K.live(d.id), JSON.stringify(liveState(sample, nowMs, null))],
      ...(r.morePending ? [] : [["DEL", K.cmd(d.id)]]),
      ...(r.notifyFailed ? [["SET", K.evPending, "0"]] : []), // el watchdog reintenta ya
      ["INCR", K.panelVer],
    ]);
    return NextResponse.json({ ok: true, cmds: r.cmds, next_push_s: nextPushS(d.run_state) });
  }

  // B) Buffer de historial con más de FLUSH_EVERY_MS → un solo volcado.
  if (flush) {
    await flushHist(meta.id, d.id, histDue ? [sample] : []);
    await prisma.equipo.update({
      where: { id: meta.id },
      data: {
        lastSeenAt: new Date(nowMs),
        online: true,
        lastReason: d.reason,
        lastTemp: d.temp,
      },
    });
    const c = await deliverCommands(meta.id, new Date(nowMs));
    await bestEffort([
      [
        "SET",
        K.live(d.id),
        JSON.stringify(liveState(sample, histDue ? nowMs : prev?.histTs ?? null, null)),
      ],
    ]);
    return NextResponse.json({ ok: true, cmds: c.cmds, next_push_s: nextPushS(d.run_state) });
  }

  // C) Heartbeat normal → sólo Redis.
  const histStart = prev?.histStart ?? (histDue ? nowMs : null);
  await redis([
    [
      "SET",
      K.live(d.id),
      JSON.stringify(liveState(sample, histDue ? nowMs : prev?.histTs ?? null, histStart)),
    ],
    ...(histDue ? [["RPUSH", K.hist(d.id), JSON.stringify(sample)]] : []),
  ]);
  return NextResponse.json({ ok: true, cmds: [], next_push_s: nextPushS(d.run_state) });
}

function liveState(s: LiveSample, histTs: number | null, histStart: number | null): LiveState {
  return { ...s, histTs, histStart };
}

/** Escrituras en Redis que no deben romper la respuesta (Neon ya se escribió). */
async function bestEffort(cmds: (string | number)[][]) {
  try {
    await redis(cmds);
  } catch (e) {
    console.error("[ingest] Redis (post-Neon):", (e as Error).message);
  }
}

/** Vuelca el buffer de historial (+ muestras extra) a Neon y lo vacía. */
async function flushHist(equipoId: string, deviceId: string, extra: LiveSample[]) {
  const [raw] = await redis([["LRANGE", K.hist(deviceId), 0, -1]]);
  const buffered = ((raw as unknown[]) ?? [])
    .map((v) => parseJson<LiveSample>(v))
    .filter((s): s is LiveSample => s !== null);
  const all = [...buffered, ...extra];
  if (all.length > 0) {
    await prisma.muestra.createMany({ data: all.map((s) => muestraData(equipoId, s)) });
  }
  if (buffered.length > 0) await bestEffort([["DEL", K.hist(deviceId)]]);
}

// ---------------------------------------------------------------------------
// Camino completo a Neon: muestra, cache del equipo, lotes, eventos, comandos.

async function persistFull(
  equipo: Equipo,
  d: Datos,
  sample: LiveSample,
  wasOnline: boolean,
) {
  const now = new Date(sample.ts);
  const wasOffline = !wasOnline;
  const wasAlarm = equipo.lastRunState === RUN_ALARM;
  const isAlarm = d.reason === "alarm" || d.run_state === RUN_ALARM;
  let notifyFailed = false;

  // 1) Persistir la muestra.
  await prisma.muestra.create({ data: muestraData(equipo.id, sample) });

  // 2) Actualizar el cache de estado en vivo del equipo.
  const updated = await prisma.equipo.update({
    where: { id: equipo.id },
    data: {
      lastSeenAt: now,
      online: true,
      lastReason: d.reason,
      lastRunState: d.run_state ?? equipo.lastRunState,
      lastTemp: d.temp,
      lastOpMode: d.op_mode ?? equipo.lastOpMode,
      lastProg: d.prog ?? equipo.lastProg,
      modelo: d.modelo ?? equipo.modelo,
      serie: d.serie ?? equipo.serie,
      ...(d.progs ? { programs: d.progs } : {}),
    },
  });

  // 3) Lote de producción: detectar transición a COMPLETED o ALARM.
  const wasRunning =
    equipo.lastRunState === 2 || equipo.lastRunState === 3; // RUNNING | PAUSED
  const justCompleted = d.run_state === 4 && wasRunning; // → COMPLETED
  const justAlarmed = d.run_state === 5 && wasRunning;   // → ALARM
  if (justCompleted || justAlarmed) {
    const durationS = d.elapsed_s ?? 0;
    const startedAt = new Date(now.getTime() - durationS * 1000);
    await prisma.lote.create({
      data: {
        equipoId: equipo.id,
        programa: d.prog || null,
        opMode: d.op_mode ?? equipo.lastOpMode ?? 1,
        result: justCompleted ? "ok" : "alarm",
        startedAt,
        completedAt: now,
        tempMax: d.t_max ?? null,
        tempMin: d.t_min ?? null,
        spEff: d.sp_eff ?? null,
        humFinal: d.hum ?? null,
        durationS,
        resWh: d.res_wh ?? null,
        fanOnS: d.fan_on_s ?? null,
        numMod: d.num_mod ?? null,
      },
    });
  }

  // 4) Eventos accionables.
  //    - Alarma: sólo en el flanco.
  if (isAlarm && !wasAlarm) {
    const evento = await prisma.evento.create({
      data: {
        equipoId: equipo.id,
        kind: "alarm",
        message: `ALARMA — T=${d.temp.toFixed(1)}°C`,
      },
    });
    // Aviso inmediato por Telegram. No bloquea ni rompe el ingest: si falla,
    // queda notified=false y el watchdog lo reintenta en su próximo barrido.
    try {
      const cli = equipo.clienteId
        ? await prisma.cliente.findUnique({
            where: { id: equipo.clienteId },
            select: { email: true, telegramChatId: true, notifyChannel: true },
          })
        : null;
      const ok = await notifyAlert({
        kind: "alarm",
        nombre: equipo.nombre || equipo.deviceId,
        deviceId: equipo.deviceId,
        detail: `Temperatura ${d.temp.toFixed(1)} °C`,
        cliente: cli,
      });
      if (ok) {
        await prisma.evento.update({
          where: { id: evento.id },
          data: { notified: true },
        });
      } else {
        notifyFailed = true;
      }
    } catch {
      notifyFailed = true; // el watchdog reintentará (notified sigue en false)
    }
  }
  //    - Recuperación: si estaba offline, cerrar el evento offline abierto.
  if (wasOffline) {
    await prisma.evento.updateMany({
      where: { equipoId: equipo.id, kind: "offline", resolvedAt: null },
      data: { resolvedAt: now },
    });
  }

  // 5) Comandos pendientes → viajan en la respuesta del heartbeat.
  const c = await deliverCommands(equipo.id, now);
  return { ...c, notifyFailed, updated };
}

async function deliverCommands(equipoId: string, now: Date) {
  const pendingCmds = await prisma.comando.findMany({
    where: {
      equipoId,
      status: "pending",
      expiresAt: { gt: now },
    },
    orderBy: { createdAt: "asc" },
    take: 5,
  });

  if (pendingCmds.length > 0) {
    await prisma.comando.updateMany({
      where: { id: { in: pendingCmds.map((c) => c.id) } },
      data: { status: "sent", sentAt: now },
    });
  }

  // Expirar comandos viejos (no bloquea; fire-and-forget).
  prisma.comando.updateMany({
    where: {
      equipoId,
      status: "pending",
      expiresAt: { lte: now },
    },
    data: { status: "expired" },
  }).catch(() => {});

  const cmds = pendingCmds.map((c) => ({
    id: c.id,
    type: c.type,
    ...(c.payload ? { payload: c.payload } : {}),
  }));

  return { cmds, morePending: pendingCmds.length === 5 };
}
