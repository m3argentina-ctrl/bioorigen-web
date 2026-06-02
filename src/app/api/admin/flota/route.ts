import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { shapeEquipo, summarize } from "@/lib/fleet";

export const dynamic = "force-dynamic";

export async function GET() {
  const authError = await requireAdmin();
  if (authError) return authError;

  const equipos = await prisma.equipo.findMany({
    include: {
      cliente: { select: { nombre: true, accessToken: true } },
      // Última muestra → tiempo y etapa de la sesión en curso (no cacheados en Equipo).
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
        },
      },
    },
    orderBy: [{ activo: "desc" }, { lastSeenAt: "desc" }],
  });

  const now = Date.now();
  const items = equipos.map((e) => ({
    ...shapeEquipo(e, now),
    // Sólo para el admin: link de acceso del cliente (para copiar/compartir).
    clienteToken: e.cliente?.accessToken ?? null,
  }));

  return NextResponse.json({ items, summary: summarize(items) });
}
