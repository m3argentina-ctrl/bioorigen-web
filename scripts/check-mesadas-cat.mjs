import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
const prods = await p.product.findMany({
  where: { category: { contains: "Mesada" } },
  select: { slug: true, category: true, supplierId: true },
});
console.log("Con 'Mesada':", prods.length);
prods.forEach(x => console.log(` ${x.slug} | "${x.category}" | supplierId=${x.supplierId}`));

// También buscar todos los Turboblender
const all = await p.product.findMany({
  where: { slug: { contains: "tb-" } },
  select: { slug: true, category: true, supplierId: true },
});
console.log("\nSlug contiene 'tb-':", all.length);
all.forEach(x => console.log(` ${x.slug} | "${x.category}" | supplierId=${x.supplierId}`));

await p.$disconnect();
