import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const recipes = await prisma.recipe.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(recipes);
}

const RecipeSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  emoji: z.string().default("🌿"),
  description: z.string().min(1),
  category: z.string().min(1),
  difficulty: z.string().min(1),
  time: z.string().min(1),
  temperature: z.string().min(1),
  ingredients: z.array(z.string()),
  equipment: z.array(z.string()).default([]),
  steps: z.array(z.string()),
  variations: z.array(z.string()).default([]),
  uses: z.array(z.string()).default([]),
  image: z.string().default(""),
  images: z.array(z.string()).default([]),
  featured: z.boolean().default(false),
  season: z.string().optional().nullable(),
});

export async function POST(request: Request) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const body = RecipeSchema.parse(await request.json());
    const recipe = await prisma.recipe.create({ data: body });
    return NextResponse.json(recipe, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.issues }, { status: 400 });
    return NextResponse.json({ error: "Error al crear (¿slug duplicado?)" }, { status: 409 });
  }
}
