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
  link: z.string().optional().nullable(),
  order: z.number().int().optional(),
  active: z.boolean().optional(),
  paused: z.boolean().optional(),
});

export async function PUT(request: Request, { params }: Params) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const body = UpdateSchema.parse(await request.json());

    // Strip `paused` before passing to Prisma — stored in SiteConfig instead
    const { paused: isPaused, ...categoryFields } = body;

    const [category] = await prisma.$transaction(async (tx) => {
      const current = await tx.category.findUnique({ where: { id: params.id } });
      const updated = await tx.category.update({ where: { id: params.id }, data: categoryFields });

      // Propagate name change to all products
      if (categoryFields.name && current && categoryFields.name !== current.name) {
        await tx.product.updateMany({
          where: { category: current.name },
          data: { category: categoryFields.name },
        });
      }

      // Propagate pause/unpause directly to products
      if (isPaused !== undefined && current) {
        const catName = updated.name; // use new name in case of rename+pause in same request
        if (isPaused) {
          await tx.product.updateMany({
            where: { category: catName, active: true },
            data: { active: false },
          });
        } else {
          await tx.product.updateMany({
            where: { category: catName, active: false },
            data: { active: true },
          });
        }

        // Persist paused state in SiteConfig
        const cfg = await tx.siteConfig.findUnique({ where: { key: "paused_categories" } });
        const names: string[] = cfg ? JSON.parse(cfg.value) : [];
        const newNames = isPaused
          ? Array.from(new Set([...names, current.name]))
          : names.filter((n) => n !== current.name);
        await tx.siteConfig.upsert({
          where: { key: "paused_categories" },
          update: { value: JSON.stringify(newNames) },
          create: { key: "paused_categories", value: JSON.stringify(newNames) },
        });
      }

      return [updated];
    });

    return NextResponse.json(category);
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.issues }, { status: 400 });
    console.error("[categories PUT]", e);
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  const authError = await requireAdmin();
  if (authError) return authError;

  await prisma.category.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
