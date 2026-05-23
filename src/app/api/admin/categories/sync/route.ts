import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

function slugify(t: string) {
  return t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export async function POST() {
  const authError = await requireAdmin();
  if (authError) return authError;

  const products = await prisma.product.findMany({ select: { category: true } });
  const unique = Array.from(new Set(products.map((p) => p.category))).sort();

  let created = 0;
  for (let i = 0; i < unique.length; i++) {
    const name = unique[i];
    const slug = slugify(name);
    await prisma.category.upsert({
      where: { slug },
      update: {},
      create: { name, slug, order: i, active: true },
    });
    created++;
  }

  return NextResponse.json({ synced: created, categories: unique });
}
