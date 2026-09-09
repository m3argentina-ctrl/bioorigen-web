import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { token: string; id: string } },
) {
  const { token, id } = params;
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

  const lote = await prisma.lote.findUnique({ where: { id } });
  if (!lote || !equipoIds.includes(lote.equipoId)) {
    return NextResponse.json({ error: "lote no encontrado" }, { status: 404 });
  }

  const equipo = cliente.equipos.find((e) => e.id === lote.equipoId);

  const muestras = await prisma.muestra.findMany({
    where: {
      equipoId: lote.equipoId,
      createdAt: { gte: lote.startedAt, lte: lote.completedAt },
    },
    orderBy: { createdAt: "asc" },
    select: {
      createdAt: true,
      temp: true,
      spEff: true,
      drv: true,
      fan: true,
      aux: true,
      hum: true,
      humFault: true,
      runState: true,
      etapa: true,
      elapsedS: true,
      resWh: true,
      fanOnS: true,
    },
  });

  const header =
    "Fecha/Hora,Temperatura °C,Setpoint °C,Resistencia %,Turbinas %,Extractor %,Humedad %,Hum Falla,Estado,Etapa,Transcurrido s,Consumo Wh,Turbina s";
  const rows = muestras.map((m) => {
    const ts = m.createdAt.toISOString().replace("T", " ").replace("Z", "");
    return [
      ts,
      m.temp?.toFixed(1) ?? "",
      m.spEff?.toFixed(1) ?? "",
      m.drv?.toFixed(1) ?? "",
      m.fan?.toFixed(1) ?? "",
      m.aux?.toFixed(1) ?? "",
      m.hum?.toFixed(1) ?? "",
      m.humFault ? "SI" : "",
      m.runState ?? "",
      m.etapa !== null ? m.etapa + 1 : "",
      m.elapsedS ?? "",
      m.resWh?.toFixed(2) ?? "",
      m.fanOnS?.toFixed(0) ?? "",
    ].join(",");
  });

  const csv = [header, ...rows].join("\n");

  const nombre = equipo?.nombre ?? equipo?.deviceId ?? "equipo";
  const fecha = lote.completedAt.toISOString().slice(0, 10);
  const prog = lote.programa ? `_${lote.programa.replace(/\s+/g, "-")}` : "_manual";
  const filename = `lote_${nombre}${prog}_${fecha}.csv`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
