import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COMMAND_TTL_MS = 5 * 60 * 1000; // 5 minutos

const CommandSchema = z.object({
  equipoId: z.string().min(1),
  type: z.enum(["stop", "pause", "resume", "start_manual", "start_program"]),
  payload: z
    .object({
      sp: z.number().min(20).max(90).optional(),
      dur_s: z.number().min(60).max(86400).optional(),
      hum: z.number().min(0).max(100).optional(),
      slot: z.number().int().min(0).max(5).optional(),
    })
    .optional(),
});

export async function POST(
  req: Request,
  { params }: { params: { token: string } },
) {
  const token = params.token;
  if (!token || token.length < 12) {
    return NextResponse.json({ error: "no encontrado" }, { status: 404 });
  }

  const cliente = await prisma.cliente.findUnique({
    where: { accessToken: token },
    include: { equipos: { where: { activo: true }, select: { id: true } } },
  });
  if (!cliente) {
    return NextResponse.json({ error: "no encontrado" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = CommandSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "datos inválidos" },
      { status: 422 },
    );
  }
  const { equipoId, type, payload } = parsed.data;

  // Verificar que el equipo pertenece a este cliente.
  if (!cliente.equipos.some((e) => e.id === equipoId)) {
    return NextResponse.json({ error: "equipo no asociado" }, { status: 403 });
  }

  // start_manual requiere payload con sp y dur_s.
  if (type === "start_manual") {
    if (!payload?.sp || !payload?.dur_s) {
      return NextResponse.json(
        { error: "start_manual requiere sp y dur_s" },
        { status: 422 },
      );
    }
  }

  // start_program requiere payload con slot.
  if (type === "start_program") {
    if (payload?.slot === undefined || payload.slot === null) {
      return NextResponse.json(
        { error: "start_program requiere slot" },
        { status: 422 },
      );
    }
  }

  const now = new Date();
  const comando = await prisma.comando.create({
    data: {
      equipoId,
      type,
      payload: payload ?? undefined,
      source: "cliente",
      expiresAt: new Date(now.getTime() + COMMAND_TTL_MS),
    },
  });

  return NextResponse.json({ id: comando.id, status: "pending" }, { status: 201 });
}
