// Watchdog de flota: detecta equipos que dejaron de reportar (offline = ausencia
// de datos, no se puede ver en el ingest) y envía/reintenta avisos por Telegram.
//
// Lo dispara un cron externo (GitHub Actions, ver .github/workflows/watchdog.yml)
// cada ~5 min con:  Authorization: Bearer <CRON_SECRET>.
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

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false; // sin secreto configurado, el endpoint queda cerrado
  const h = req.headers.get("authorization") || "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() === secret : false;
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

  return { checked: stale.length, newOffline, pending: pending.length, sent };
}

export async function POST(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "no autorizado" }, { status: 401 });
  }
  const result = await run();
  return NextResponse.json({ ok: true, ...result });
}

// Permitimos GET además de POST: algunos schedulers sólo hacen GET.
export async function GET(req: Request) {
  return POST(req);
}
