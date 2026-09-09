import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

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
        select: { id: true, deviceId: true, nombre: true },
      },
    },
  });
  if (!cliente) {
    return NextResponse.json({ error: "no encontrado" }, { status: 404 });
  }

  const equipoIds = cliente.equipos.map((e) => e.id);
  if (equipoIds.length === 0) {
    return NextResponse.json({ lotes: [] });
  }

  const lotes = await prisma.lote.findMany({
    where: { equipoId: { in: equipoIds } },
    orderBy: { completedAt: "desc" },
    take: 50,
    select: {
      id: true,
      equipoId: true,
      programa: true,
      opMode: true,
      result: true,
      startedAt: true,
      completedAt: true,
      tempMax: true,
      tempMin: true,
      spEff: true,
      humFinal: true,
      durationS: true,
      resWh: true,
      fanOnS: true,
      numMod: true,
    },
  });

  const equipoMap = Object.fromEntries(
    cliente.equipos.map((e) => [e.id, e.nombre ?? e.deviceId]),
  );

  return NextResponse.json({
    lotes: lotes.map((l) => ({
      ...l,
      equipoNombre: equipoMap[l.equipoId] ?? l.equipoId,
      startedAt: l.startedAt.toISOString(),
      completedAt: l.completedAt.toISOString(),
    })),
  });
}
