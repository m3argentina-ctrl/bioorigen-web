import { NextResponse } from "next/server";
import { z } from "zod";
import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { shapeEquipo, summarize } from "@/lib/fleet";
import { K, cachedPanel, invalidateFleet, overlayLive, readLiveSafe } from "@/lib/live";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function genEquipoToken() {
  return randomBytes(32).toString("base64url");
}

export async function GET() {
  const authError = await requireAdmin();
  if (authError) return authError;

  // Parte fija cacheada (1 h o hasta que cambie algo); el estado en vivo se
  // superpone desde Redis (ver lib/live.ts).
  const equipos = (await cachedPanel(K.panelAdmin, queryEquipos)) ?? [];
  const live = await readLiveSafe(equipos.map((e) => e.deviceId));

  const now = Date.now();
  const items = equipos.map((e) => ({
    ...shapeEquipo(overlayLive(e, live.get(e.deviceId) ?? null), now),
    clienteToken: e.cliente?.accessToken ?? null,
  }));

  return NextResponse.json({ items, summary: summarize(items) });
}

// Sin el token de cada equipo: esta lista se cachea en Redis y no lo necesita.
async function queryEquipos() {
  const rows = await prisma.equipo.findMany({
    include: {
      cliente: { select: { nombre: true, accessToken: true } },
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
    orderBy: [{ activo: "desc" }, { lastSeenAt: "desc" }],
  });
  return rows.map((r) => {
    const { token, ...rest } = r;
    void token;
    return rest;
  });
}

const CreateSchema = z.object({
  deviceId: z
    .string()
    .trim()
    .min(1, "El deviceId es obligatorio")
    .max(64)
    .regex(/^[A-Za-z0-9_-]+$/, "Solo letras, números, guión y guión bajo"),
  nombre: z.string().trim().max(100).optional().nullable(),
  clienteId: z.string().trim().optional().nullable(),
});

export async function POST(request: Request) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const body = CreateSchema.parse(await request.json());
    const token = genEquipoToken();

    const equipo = await prisma.equipo.create({
      data: {
        deviceId: body.deviceId,
        token,
        nombre: body.nombre || null,
        activo: true,
        clienteId: body.clienteId || null,
      },
    });

    await invalidateFleet();
    return NextResponse.json(
      { id: equipo.id, deviceId: equipo.deviceId, token },
      { status: 201 },
    );
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.issues[0]?.message }, { status: 400 });
    }
    const msg = (e as Error).message || "";
    if (msg.includes("Unique constraint")) {
      return NextResponse.json(
        { error: "Ya existe un equipo con ese deviceId" },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: "Error al crear equipo" }, { status: 500 });
  }
}
