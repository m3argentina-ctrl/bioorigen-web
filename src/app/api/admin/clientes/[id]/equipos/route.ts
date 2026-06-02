import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

type Params = { params: { id: string } };

const Body = z.object({ equipoId: z.string().min(1) });

// Asignar un equipo a este cliente.
export async function POST(request: Request, { params }: Params) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const { equipoId } = Body.parse(await request.json());
    await prisma.equipo.update({
      where: { id: equipoId },
      data: { clienteId: params.id },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Error al asignar el equipo" }, { status: 500 });
  }
}

// Quitar un equipo de este cliente (solo si efectivamente le pertenece).
export async function DELETE(request: Request, { params }: Params) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const { equipoId } = Body.parse(await request.json());
    await prisma.equipo.updateMany({
      where: { id: equipoId, clienteId: params.id },
      data: { clienteId: null },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Error al quitar el equipo" }, { status: 500 });
  }
}
