import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { shapeEquipo, summarize } from "@/lib/fleet";
import { K, cachedPanel, overlayLive, readLiveSafe } from "@/lib/live";

export const dynamic = "force-dynamic";

// Acceso público por link secreto: el propio token es la credencial.
export async function GET(
  _req: Request,
  { params }: { params: { token: string } },
) {
  const token = params.token;
  if (!token || token.length < 12) {
    return NextResponse.json({ error: "no encontrado" }, { status: 404 });
  }

  // Parte fija cacheada (1 h o hasta que cambie algo); el estado en vivo se
  // superpone desde Redis (ver lib/live.ts).
  const cliente = await cachedPanel(K.panelCliente(token), () => queryCliente(token));

  if (!cliente) {
    return NextResponse.json({ error: "no encontrado" }, { status: 404 });
  }

  const live = await readLiveSafe(cliente.equipos.map((e) => e.deviceId));
  const now = Date.now();
  const items = cliente.equipos.map((e) =>
    shapeEquipo(
      { ...overlayLive(e, live.get(e.deviceId) ?? null), cliente: { nombre: cliente.nombre } },
      now,
    ),
  );

  return NextResponse.json({
    cliente: { nombre: cliente.nombre },
    items,
    summary: summarize(items),
  });
}

function queryCliente(token: string) {
  return prisma.cliente.findUnique({
    where: { accessToken: token },
    include: {
      equipos: {
        where: { activo: true },
        orderBy: [{ lastSeenAt: "desc" }],
        select: {
          id: true,
          deviceId: true,
          nombre: true,
          modelo: true,
          serie: true,
          activo: true,
          clienteId: true,
          lastSeenAt: true,
          lastReason: true,
          lastRunState: true,
          lastTemp: true,
          lastOpMode: true,
          lastProg: true,
          programs: true,
          // Última muestra → tiempo y etapa de la sesión en curso.
          muestras: {
            take: 1,
            orderBy: { createdAt: "desc" },
            select: {
              warmup: true,
              etapa: true,
              elapsedS: true,
              totalS: true,
              remainingS: true,
              spEff: true,
              drv: true,
              fan: true,
              tMin: true,
              tMax: true,
              resWh: true,
              fanOnS: true,
              numMod: true,
              hum: true,
              humTgt: true,
              humFault: true,
            },
          },
        },
      },
    },
  });
}
