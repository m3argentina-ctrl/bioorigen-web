import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

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
  })
  .passthrough();

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

  // Resolver el equipo por su deviceId y verificar el token.
  const equipo = await prisma.equipo.findUnique({ where: { deviceId: d.id } });
  if (!equipo || !equipo.activo) {
    return NextResponse.json({ error: "equipo no registrado" }, { status: 404 });
  }
  if (!safeEqual(token, equipo.token)) {
    return NextResponse.json({ error: "token inválido" }, { status: 403 });
  }

  const now = new Date();
  const wasOffline = !equipo.online;
  const wasAlarm = equipo.lastRunState === RUN_ALARM;
  const isAlarm = d.reason === "alarm" || d.run_state === RUN_ALARM;

  // 1) Persistir la muestra.
  await prisma.muestra.create({
    data: {
      equipoId: equipo.id,
      reason: d.reason,
      temp: d.temp,
      rawTemp: d.raw_temp,
      fault: toBool(d.fault),
      spEff: d.sp_eff,
      spCfg: d.sp_cfg,
      drv: d.drv,
      fan: d.fan,
      aux: d.aux,
      hum: d.hum,
      humFault: toBool(d.hum_fault),
      opMode: d.op_mode,
      runState: d.run_state,
      warmup: toBool(d.warmup),
      etapa: d.etapa,
      elapsedS: d.elapsed_s,
      totalS: d.total_s,
      remainingS: d.remaining_s,
      tMin: d.t_min,
      tMax: d.t_max,
      prog: d.prog,
      uptimeS: d.uptime_s,
    },
  });

  // 2) Actualizar el cache de estado en vivo del equipo.
  await prisma.equipo.update({
    where: { id: equipo.id },
    data: {
      lastSeenAt: now,
      online: true,
      lastReason: d.reason,
      lastRunState: d.run_state ?? equipo.lastRunState,
      lastTemp: d.temp,
      modelo: d.modelo ?? equipo.modelo,
      serie: d.serie ?? equipo.serie,
    },
  });

  // 3) Eventos accionables.
  //    - Alarma: sólo en el flanco (estado previo no era alarma) → no duplica.
  if (isAlarm && !wasAlarm) {
    await prisma.evento.create({
      data: {
        equipoId: equipo.id,
        kind: "alarm",
        message: `ALARMA — T=${d.temp.toFixed(1)}°C`,
      },
    });
  }
  //    - Recuperación: si estaba offline, cerrar el evento offline abierto.
  if (wasOffline) {
    await prisma.evento.updateMany({
      where: { equipoId: equipo.id, kind: "offline", resolvedAt: null },
      data: { resolvedAt: now },
    });
  }

  return NextResponse.json({ ok: true });
}
