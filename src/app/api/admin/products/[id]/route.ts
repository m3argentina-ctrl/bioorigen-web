import { NextResponse } from "next/server";
import { z } from "zod";

// Medidas con precio propio (ver src/lib/variants.ts). null = precio unico.
const VariantSchema = z
  .array(
    z.object({
      id: z.string().min(1),
      label: z.string().min(1),
      price: z.number().positive(),
      salePrice: z.number().positive().nullable().optional(),
      stock: z.number().int().min(0).nullable().optional(),
    }),
  )
  .nullable()
  .optional();
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

type Params = { params: { id: string } };

export async function GET(_req: Request, { params }: Params) {
  const product = await prisma.product.findUnique({ where: { id: params.id } });
  if (!product) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json(product);
}

const UpdateSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  description: z.string().optional(),
  // 0 = "a convenir" (ver isQuotePrice en src/lib/format.ts)
  price: z.number().min(0).optional(),
  salePrice: z.number().positive().optional().nullable(),
  stock: z.number().int().min(0).optional(),
  category: z.string().optional(),
  linea: z.string().optional().nullable(),
  featured: z.boolean().optional(),
  images: z.array(z.string()).optional(),
  specs: z.record(z.string(), z.string()).optional().nullable(),
  variants: VariantSchema,
  dataSheet: z.string().optional().nullable(),
  videoUrl: z.string().optional().nullable(),
  rating: z.number().min(0).max(5).optional().nullable(),
  reviewCount: z.number().int().min(0).optional(),
  weightGrams: z.number().int().positive().optional().nullable(),
  heightCm: z.number().positive().optional().nullable(),
  widthCm: z.number().positive().optional().nullable(),
  lengthCm: z.number().positive().optional().nullable(),
  supplierId: z.string().optional().nullable(),
  supplierCost: z.number().positive().optional().nullable(),
  active: z.boolean().optional(),
});

export async function PUT(request: Request, { params }: Params) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const body = UpdateSchema.parse(await request.json());
    const { specs, variants, ...rest } = body;
    const product = await prisma.product.update({
      where: { id: params.id },
      data: {
        ...rest,
        ...(specs !== undefined ? { specs: specs != null ? (specs as Prisma.InputJsonValue) : Prisma.DbNull } : {}),
        // Quitar todas las medidas vuelve el producto a precio único.
        ...(variants !== undefined
          ? { variants: variants != null ? (variants as Prisma.InputJsonValue) : Prisma.DbNull }
          : {}),
      },
    });
    return NextResponse.json(product);
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.issues }, { status: 400 });
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const body = await request.json();
  if (typeof body.active !== "boolean") {
    return NextResponse.json({ error: "Campo 'active' requerido (boolean)" }, { status: 400 });
  }
  const product = await prisma.product.update({
    where: { id: params.id },
    data: { active: body.active },
    select: { id: true, active: true },
  });
  return NextResponse.json(product);
}

export async function DELETE(_req: Request, { params }: Params) {
  const authError = await requireAdmin();
  if (authError) return authError;

  await prisma.product.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
