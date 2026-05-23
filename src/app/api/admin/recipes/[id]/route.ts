import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

type Params = { params: { id: string } };

export async function GET(_req: Request, { params }: Params) {
  const recipe = await prisma.recipe.findUnique({ where: { id: params.id } });
  if (!recipe) return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  return NextResponse.json(recipe);
}

const UpdateSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  emoji: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  difficulty: z.string().optional(),
  time: z.string().optional(),
  temperature: z.string().optional(),
  ingredients: z.array(z.string()).optional(),
  equipment: z.array(z.string()).optional(),
  steps: z.array(z.string()).optional(),
  variations: z.array(z.string()).optional(),
  uses: z.array(z.string()).optional(),
  image: z.string().optional(),
  images: z.array(z.string()).optional(),
  featured: z.boolean().optional(),
  season: z.string().optional().nullable(),
});

export async function PUT(request: Request, { params }: Params) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const body = UpdateSchema.parse(await request.json());
    const recipe = await prisma.recipe.update({ where: { id: params.id }, data: body });
    return NextResponse.json(recipe);
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.issues }, { status: 400 });
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  const authError = await requireAdmin();
  if (authError) return authError;

  await prisma.recipe.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
