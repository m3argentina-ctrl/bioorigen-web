import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const search = searchParams.get("search") ?? "";

  const products = await prisma.product.findMany({
    where: {
      ...(category && category !== "all" ? { category } : {}),
      ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
    },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(products);
}

const ProductSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().min(1),
  price: z.number().positive(),
  salePrice: z.number().positive().optional().nullable(),
  stock: z.number().int().min(0),
  category: z.string().min(1),
  linea: z.string().optional().nullable(),
  featured: z.boolean().default(false),
  images: z.array(z.string()).default([]),
  specs: z.record(z.string(), z.string()).optional().nullable(),
  dataSheet: z.string().optional().nullable(),
  videoUrl: z.string().optional().nullable(),
  rating: z.number().min(0).max(5).optional().nullable(),
  reviewCount: z.number().int().min(0).default(0),
  weightGrams: z.number().int().positive().optional().nullable(),
  heightCm: z.number().positive().optional().nullable(),
  widthCm: z.number().positive().optional().nullable(),
  lengthCm: z.number().positive().optional().nullable(),
});

export async function POST(request: Request) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const body = ProductSchema.parse(await request.json());
    const { specs, ...rest } = body;
    const product = await prisma.product.create({
      data: {
        ...rest,
        ...(specs != null ? { specs: specs as Prisma.InputJsonValue } : {}),
      },
    });
    return NextResponse.json(product, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.issues }, { status: 400 });
    return NextResponse.json({ error: "Error al crear (¿slug duplicado?)" }, { status: 409 });
  }
}
