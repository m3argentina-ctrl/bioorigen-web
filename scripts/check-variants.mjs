import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
const prods = await p.product.findMany({
  where: { NOT: { variants: { equals: null } } },
  select: { slug: true, price: true, variants: true },
});
console.log(`Productos con variantes: ${prods.length}`);
prods.forEach(x => {
  const vs = x.variants;
  console.log(`\n${x.slug} | base: $${x.price}`);
  if (Array.isArray(vs)) vs.forEach(v => console.log(`   ${v.label}: $${v.price}${v.salePrice ? " (oferta: $"+v.salePrice+")" : ""} stock:${v.stock}`));
});
await p.$disconnect();
