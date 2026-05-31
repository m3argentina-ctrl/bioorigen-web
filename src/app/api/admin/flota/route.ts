import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

// Umbral para considerar un equipo "online": el firmware empuja heartbeat
// cada 60s, así que damos margen de 3 latidos perdidos (180s).
const OFFLINE_THRESHOLD_MS = 180_000;
const RUN_ALARM = 5;

export async function GET() {
  const authError = await requireAdmin();
  if (authError) return authError;

  const equipos = await prisma.equipo.findMany({
    include: { cliente: { select: { id: true, nombre: true } } },
    orderBy: [{ activo: "desc" }, { lastSeenAt: "desc" }],
  });

  const now = Date.now();

  const items = equipos.map((e) => {
    const lastSeenMs = e.lastSeenAt ? e.lastSeenAt.getTime() : null;
    const secondsSinceSeen =
      lastSeenMs !== null ? Math.floor((now - lastSeenMs) / 1000) : null;
    // "online" derivado en vivo desde lastSeenAt (no del flag cacheado).
    const online =
      lastSeenMs !== null && now - lastSeenMs < OFFLINE_THRESHOLD_MS;
    const alarm = online && e.lastRunState === RUN_ALARM;

    return {
      id: e.id,
      deviceId: e.deviceId,
      nombre: e.nombre,
      modelo: e.modelo,
      serie: e.serie,
      activo: e.activo,
      clienteId: e.clienteId,
      clienteNombre: e.cliente?.nombre ?? null,
      online,
      alarm,
      lastSeenAt: e.lastSeenAt ? e.lastSeenAt.toISOString() : null,
      secondsSinceSeen,
      lastReason: e.lastReason,
      lastRunState: e.lastRunState,
      lastTemp: e.lastTemp,
      lastOpMode: e.lastOpMode,
      lastProg: e.lastProg,
    };
  });

  const summary = {
    total: items.length,
    online: items.filter((i) => i.online).length,
    offline: items.filter((i) => !i.online).length,
    alarm: items.filter((i) => i.alarm).length,
  };

  return NextResponse.json({ items, summary });
}
