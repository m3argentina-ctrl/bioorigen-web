import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

type Params = { params: { id: string } };

export async function GET(_req: Request, { params }: Params) {
  const category = await prisma.category.findUnique({ where: { id: params.id } });
  if (!category) return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  return NextResponse.json(category);
}

const UpdateSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
  order: z.number().int().optional(),
  active: z.boolean().optional(),
});

export async function PUT(request: Request, { params }: Params) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const body = UpdateSchema.parse(await request.json());

    // Si se renombra la categoría, propagamos el nuevo nombre a todos los productos
    const [category] = await prisma.$transaction(async (tx) => {
      const current = await tx.category.findUnique({ where: { id: params.id } });
      const updated = await tx.category.update({ where: { id: params.id }, data: body });

      if (body.name && current && body.name !== current.name) {
        await tx.product.updateMany({
          where: { category: current.name },
          data: { category: body.name },
        });
      }

      return [updated];
    });

    return NextResponse.json(category);
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.issues }, { status: 400 });
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  const authError = await requireAdmin();
  if (authError) return authError;

  await prisma.category.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
