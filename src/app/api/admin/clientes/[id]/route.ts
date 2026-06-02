import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Params = { params: { id: string } };

function genAccessToken() {
  return randomBytes(24).toString("base64url");
}

// Detalle del cliente + sus equipos + equipos sin dueño (para asignar).
export async function GET(_req: Request, { params }: Params) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const cliente = await prisma.cliente.findUnique({
    where: { id: params.id },
    include: {
      equipos: {
        orderBy: { deviceId: "asc" },
        select: {
          id: true,
          deviceId: true,
          nombre: true,
          modelo: true,
          activo: true,
          online: true,
          lastSeenAt: true,
        },
      },
    },
  });
  if (!cliente) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const equiposDisponibles = await prisma.equipo.findMany({
    where: { clienteId: null },
    select: { id: true, deviceId: true, nombre: true },
    orderBy: { deviceId: "asc" },
  });

  return NextResponse.json({ cliente, equiposDisponibles });
}

const UpdateSchema = z.object({
  nombre: z.string().trim().min(1).optional(),
  email: z.union([z.string().trim().email(), z.literal(""), z.null()]).optional(),
  telegramChatId: z.string().trim().optional().nullable(),
  notas: z.string().trim().optional().nullable(),
  regenerateToken: z.boolean().optional(),
});

export async function PUT(request: Request, { params }: Params) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const body = UpdateSchema.parse(await request.json());
    const data: Prisma.ClienteUpdateInput = {};
    if (body.nombre !== undefined) data.nombre = body.nombre;
    if (body.email !== undefined) data.email = body.email ? body.email : null;
    if (body.telegramChatId !== undefined)
      data.telegramChatId = body.telegramChatId || null;
    if (body.notas !== undefined) data.notas = body.notas || null;
    if (body.regenerateToken) data.accessToken = genAccessToken();

    const cliente = await prisma.cliente.update({
      where: { id: params.id },
      data,
    });
    return NextResponse.json(cliente);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.issues }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Error al actualizar (¿email duplicado?)" },
      { status: 409 },
    );
  }
}

// Al borrar, primero desasignamos sus equipos (clienteId -> null) y luego
// eliminamos el cliente, en una transacción.
export async function DELETE(_req: Request, { params }: Params) {
  const authError = await requireAdmin();
  if (authError) return authError;

  await prisma.$transaction([
    prisma.equipo.updateMany({
      where: { clienteId: params.id },
      data: { clienteId: null },
    }),
    prisma.cliente.delete({ where: { id: params.id } }),
  ]);
  return NextResponse.json({ ok: true });
}
