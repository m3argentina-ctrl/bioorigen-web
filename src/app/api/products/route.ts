import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(products);
  } catch (error) {
    console.error("[GET /api/products]", error);
    return NextResponse.json(
      { error: "No se pudieron obtener los productos" },
      { status: 500 },
    );
  }
}

type ProductInput = {
  name?: unknown;
  slug?: unknown;
  description?: unknown;
  price?: unknown;
  stock?: unknown;
  category?: unknown;
  linea?: unknown;
  featured?: unknown;
  images?: unknown;
  specs?: unknown;
  rating?: unknown;
  reviewCount?: unknown;
};

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === "string");
}

export async function POST(request: Request) {
  let body: ProductInput;
  try {
    body = (await request.json()) as ProductInput;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const { name, slug, description, price, stock, category } = body;

  if (
    typeof name !== "string" ||
    typeof slug !== "string" ||
    typeof description !== "string" ||
    typeof category !== "string" ||
    typeof price !== "number" ||
    !Number.isFinite(price) ||
    price < 0 ||
    typeof stock !== "number" ||
    !Number.isInteger(stock) ||
    stock < 0
  ) {
    return NextResponse.json(
      {
        error:
          "Campos requeridos: name, slug, description, category, price (Float ≥ 0), stock (entero ≥ 0)",
      },
      { status: 400 },
    );
  }

  const data: Prisma.ProductCreateInput = {
    name,
    slug,
    description,
    price,
    stock,
    category,
    featured: body.featured === true,
    images: isStringArray(body.images) ? body.images : [],
    reviewCount:
      typeof body.reviewCount === "number" && Number.isInteger(body.reviewCount)
        ? body.reviewCount
        : 0,
  };

  if (typeof body.rating === "number" && Number.isFinite(body.rating)) {
    data.rating = body.rating;
  }
  if (
    body.specs &&
    typeof body.specs === "object" &&
    !Array.isArray(body.specs)
  ) {
    data.specs = body.specs as Prisma.InputJsonValue;
  }
  if (typeof body.linea === "string") {
    data.linea = body.linea;
  }

  try {
    const product = await prisma.product.create({ data });
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("[POST /api/products]", error);
    return NextResponse.json(
      { error: "No se pudo crear el producto (¿slug duplicado?)" },
      { status: 409 },
    );
  }
}
