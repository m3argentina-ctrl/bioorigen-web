import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

const PatchSchema = z.object({
  nombre: z.string().trim().max(100).optional().nullable(),
  clienteId: z.string().trim().optional().nullable(),
  activo: z.boolean().optional(),
});

export async function PATCH(request: Request, ctx: Ctx) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const { id } = await ctx.params;
  const body = PatchSchema.safeParse(await request.json());
  if (!body.success) {
    return NextResponse.json({ error: body.error.issues[0]?.message }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (body.data.nombre !== undefined) data.nombre = body.data.nombre || null;
  if (body.data.clienteId !== undefined) data.clienteId = body.data.clienteId || null;
  if (body.data.activo !== undefined) data.activo = body.data.activo;

  try {
    const equipo = await prisma.equipo.update({ where: { id }, data });
    return NextResponse.json({ id: equipo.id, deviceId: equipo.deviceId });
  } catch {
    return NextResponse.json({ error: "Equipo no encontrado" }, { status: 404 });
  }
}

export async function DELETE(_request: Request, ctx: Ctx) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const { id } = await ctx.params;

  try {
    await prisma.equipo.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Equipo no encontrado" }, { status: 404 });
  }
}
