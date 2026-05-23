import { NextResponse } from "next/server";
import { z } from "zod";
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
  price: z.number().positive().optional(),
  salePrice: z.number().positive().optional().nullable(),
  stock: z.number().int().min(0).optional(),
  category: z.string().optional(),
  linea: z.string().optional().nullable(),
  featured: z.boolean().optional(),
  images: z.array(z.string()).optional(),
  specs: z.record(z.string(), z.string()).optional().nullable(),
  dataSheet: z.string().optional().nullable(),
  videoUrl: z.string().optional().nullable(),
  rating: z.number().min(0).max(5).optional().nullable(),
  reviewCount: z.number().int().min(0).optional(),
  weightGrams: z.number().int().positive().optional().nullable(),
  heightCm: z.number().positive().optional().nullable(),
  widthCm: z.number().positive().optional().nullable(),
  lengthCm: z.number().positive().optional().nullable(),
});

export async function PUT(request: Request, { params }: Params) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const body = UpdateSchema.parse(await request.json());
    const { specs, ...rest } = body;
    const product = await prisma.product.update({
      where: { id: params.id },
      data: {
        ...rest,
        ...(specs !== undefined ? { specs: specs != null ? (specs as Prisma.InputJsonValue) : Prisma.DbNull } : {}),
      },
    });
    return NextResponse.json(product);
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.issues }, { status: 400 });
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  const authError = await requireAdmin();
  if (authError) return authError;

  await prisma.product.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
