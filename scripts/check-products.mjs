import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
const prods = await p.product.findMany({
  where: { slug: { in: ["cutter-profesional-tb-cut800", "mesada-de-acero-inoxidable", "estanteria-tb-rackh3", "estanteria-tb-rackh5", "estanteria-profesional-tb-rackc4"] } },
  select: { slug: true, category: true, active: true, variants: true },
});
prods.forEach(p => {
  const hasV = Array.isArray(p.variants) && p.variants.length > 0;
  console.log(`${p.active ? "ON " : "OFF"} | ${p.category} | ${p.slug} | variants:${hasV ? p.variants.length : 0}`);
});
await p.$disconnect();
