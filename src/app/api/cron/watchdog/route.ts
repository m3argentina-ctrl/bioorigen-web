// Watchdog de flota: detecta equipos que dejaron de reportar (offline = ausencia
// de datos, no se puede ver en el ingest) y envía/reintenta avisos por Telegram.
//
// Lo dispara Upstash QStash cada 5 min (programación creada por este mismo
// endpoint, ver lib/qstash.ts) y, de respaldo, GitHub Actions
// (.github/workflows/watchdog.yml), ambos con:  Authorization: Bearer <CRON_SECRET>.
//
// Hace dos cosas:
//   1) Marca offline a los equipos online cuyo último dato superó el umbral, y
//      crea un Evento "offline" (uno por corte, sin duplicar).
//   2) Barrido de notificación: manda por Telegram TODO evento sin notificar y
//      sin resolver (offline recién creados + alarmas cuyo envío falló en el
//      ingest), y los marca notified=true. El flag evita duplicados.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { OFFLINE_THRESHOLD_MS } from "@/lib/fleet";
import { offlineDetail } from "@/lib/telegram";
import { notifyAlert } from "@/lib/notify";
import { ensureWatchdogSchedule } from "@/lib/qstash";
import {
  INDEX_TTL_S,
  K,
  META_TTL_S,
  RedisError,
  liveEnabled,
  metaFromEquipo,
  parseJson,
  redis,
  type EqMeta,
  type IndexEntry,
  type LiveState,
} from "@/lib/live";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Con Redis: espera entre reintentos de avisos que no se pudieron enviar. */
const NOTIFY_RETRY_MS = 15 * 60 * 1000;

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false; // sin secreto configurado, el endpoint queda cerrado
  const h = req.headers.get("authorization") || "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() === secret : false;
}

// Con Redis (ver lib/live.ts): el último dato de cada equipo está en Redis y
// Neon sólo se consulta si un equipo pasa a offline o si hay avisos pendientes.
// Así el watchdog, que corre cada ~5 min, deja de mantener despierta la base.
async function runLive() {
  const now = Date.now();

  // Índice de equipos activos (se reconstruye desde Neon a lo sumo 1 vez por día
  // o cuando el admin cambia equipos).
  const [first] = await redis([["MGET", K.index, K.evPending]]);
  const [idxRaw, pendingFlag] = first as (string | null)[];
  let index = parseJson<IndexEntry[]>(idxRaw);
  if (!index) {
    const rows = await prisma.equipo.findMany({
      where: { activo: true },
      select: { id: true, deviceId: true, lastSeenAt: true },
    });
    index = rows.map((r) => ({
      id: r.id,
      deviceId: r.deviceId,
      lastSeenMs: r.lastSeenAt ? r.lastSeenAt.getTime() : null,
    }));
    await redis([["SET", K.index, JSON.stringify(index), "EX", INDEX_TTL_S]]);
  }

  // Último dato y ficha de todos los equipos en un solo MGET.
  const [both] =
    index.length > 0
      ? await redis([
          [
            "MGET",
            ...index.map((e) => K.live(e.deviceId)),
            ...index.map((e) => K.eq(e.deviceId)),
          ],
        ])
      : [[]];
  const lives = (both as unknown[]).slice(0, index.length);
  const metas = (both as unknown[]).slice(index.length);

  let checked = 0;
  let newOffline = 0;
  for (let i = 0; i < index.length; i++) {
    const e = index[i];
    const live = parseJson<LiveState>(lives[i]);
    const meta = parseJson<EqMeta>(metas[i]);
    const seenMs = live?.ts ?? e.lastSeenMs;
    if (seenMs === null || now - seenMs < OFFLINE_THRESHOLD_MS) continue;
    // Ya marcado offline (la ficha lo dice) → nada que hacer sin tocar Neon.
    if (meta && !meta.online) continue;
    // Pasó el umbral y la ficha dice online (o no hay ficha) → confirmar en
    // Neon. Ocurre una vez por corte (o una vez por día si la ficha venció).
    checked++;
    const eq = await prisma.equipo.findUnique({ where: { id: e.id } });
    if (!eq) continue;
    if (eq.online) {
      await prisma.equipo.update({
        where: { id: e.id },
        data: { online: false, lastSeenAt: new Date(seenMs) },
      });
      const open = await prisma.evento.findFirst({
        where: { equipoId: e.id, kind: "offline", resolvedAt: null },
        select: { id: true },
      });
      if (!open) {
        await prisma.evento.create({
          data: { equipoId: e.id, kind: "offline", message: "Sin conexión" },
        });
        newOffline++;
      }
    }
    // Ficha con online=false: los próximos barridos no vuelven a Neon y el
    // ingest, al volver el equipo, toma el camino completo y cierra el evento.
    await redis([
      [
        "SET",
        K.eq(e.deviceId),
        JSON.stringify(metaFromEquipo({ ...eq, online: false })),
        "EX",
        META_TTL_S,
      ],
      ...(eq.online ? [["INCR", K.panelVer]] : []),
    ]);
  }

  // Barrido de avisos sólo si hay algo pendiente: evento offline recién creado,
  // o marca de pendientes (valor = cuándo reintentar; "0" = ya). Si un aviso no
  // sale (p. ej. Telegram caído) se reintenta cada NOTIFY_RETRY_MS y no en cada
  // barrido, para no mantener despierta la base.
  const retryDue = pendingFlag !== null && now >= Number(pendingFlag);
  if (newOffline === 0 && !retryDue) {
    return { mode: "live", checked, newOffline, pending: 0, sent: 0 };
  }
  const r = await notifySweep(now);
  if (r.pending === r.sent) await redis([["DEL", K.evPending]]);
  else await redis([["SET", K.evPending, String(now + NOTIFY_RETRY_MS)]]);
  return { mode: "live", checked, newOffline, ...r };
}

async function run() {
  const now = Date.now();
  const cutoff = new Date(now - OFFLINE_THRESHOLD_MS);

  // 1) Equipos que figuran online pero dejaron de reportar → marcar offline.
  const stale = await prisma.equipo.findMany({
    where: { activo: true, online: true, lastSeenAt: { lt: cutoff } },
    select: { id: true },
  });

  let newOffline = 0;
  for (const e of stale) {
    await prisma.equipo.update({ where: { id: e.id }, data: { online: false } });
    // Sólo un evento offline abierto por corte (no duplica si ya existe).
    const open = await prisma.evento.findFirst({
      where: { equipoId: e.id, kind: "offline", resolvedAt: null },
      select: { id: true },
    });
    if (!open) {
      await prisma.evento.create({
        data: { equipoId: e.id, kind: "offline", message: "Sin conexión" },
      });
      newOffline++;
    }
  }

  // 2) Barrido de notificación: eventos sin notificar y sin resolver.
  const r = await notifySweep(now);
  return { checked: stale.length, newOffline, ...r };
}

async function notifySweep(now: number) {
  const pending = await prisma.evento.findMany({
    where: { notified: false, resolvedAt: null },
    include: {
      equipo: {
        select: {
          nombre: true,
          deviceId: true,
          lastSeenAt: true,
          cliente: {
            select: { email: true, telegramChatId: true, notifyChannel: true },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
    take: 50,
  });

  let sent = 0;
  for (const ev of pending) {
    const e = ev.equipo;
    const detail =
      ev.kind === "offline"
        ? offlineDetail(e.lastSeenAt, now)
        : ev.message ?? null;
    const ok = await notifyAlert({
      kind: ev.kind,
      nombre: e.nombre || e.deviceId,
      deviceId: e.deviceId,
      detail,
      cliente: e.cliente,
    });
    if (ok) {
      await prisma.evento.update({
        where: { id: ev.id },
        data: { notified: true },
      });
      sent++;
    }
  }

  return { pending: pending.length, sent };
}

export async function POST(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "no autorizado" }, { status: 401 });
  }
  const schedule = await ensureWatchdogSchedule();
  if (liveEnabled()) {
    try {
      // Hace cuánto corrió el watchdog anterior: con QStash activo, ≤ 5 min.
      const [prev] = await redis([["SET", K.wdLast, String(Date.now()), "GET"]]);
      const prevRunAgoS = prev ? Math.round((Date.now() - Number(prev)) / 1000) : null;
      return NextResponse.json({ ok: true, ...(await runLive()), schedule, prevRunAgoS });
    } catch (e) {
      if (!(e instanceof RedisError)) throw e;
      console.error("[watchdog] Redis no disponible, uso Neon directo:", e.message);
    }
  }
  const result = await run();
  return NextResponse.json({ ok: true, ...result, schedule });
}

// Permitimos GET además de POST: algunos schedulers sólo hacen GET.
export async function GET(req: Request) {
  return POST(req);
}
