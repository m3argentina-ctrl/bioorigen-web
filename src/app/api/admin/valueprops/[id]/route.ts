import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

type Params = { params: { id: string } };

export async function GET(_req: Request, { params }: Params) {
  const prop = await prisma.valueProp.findUnique({ where: { id: params.id } });
  if (!prop) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json(prop);
}

const UpdateSchema = z.object({
  icon: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  text: z.string().min(1).optional(),
  order: z.number().int().optional(),
  active: z.boolean().optional(),
});

export async function PUT(request: Request, { params }: Params) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const body = UpdateSchema.parse(await request.json());
    const prop = await prisma.valueProp.update({ where: { id: params.id }, data: body });
    return NextResponse.json(prop);
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.issues }, { status: 400 });
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  const authError = await requireAdmin();
  if (authError) return authError;

  await prisma.valueProp.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
