import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { shapeEquipo, summarize } from "@/lib/fleet";

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

  const cliente = await prisma.cliente.findUnique({
    where: { accessToken: token },
    include: {
      equipos: {
        where: { activo: true },
        orderBy: [{ lastSeenAt: "desc" }],
        include: {
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
            },
          },
        },
      },
    },
  });

  if (!cliente) {
    return NextResponse.json({ error: "no encontrado" }, { status: 404 });
  }

  const now = Date.now();
  const items = cliente.equipos.map((e) =>
    shapeEquipo({ ...e, cliente: { nombre: cliente.nombre } }, now),
  );

  return NextResponse.json({
    cliente: { nombre: cliente.nombre },
    items,
    summary: summarize(items),
  });
}
