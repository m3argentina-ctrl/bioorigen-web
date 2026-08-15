/**
 * Carga inicial de medidas para "Laminas antiadherentes".
 *
 * Solo siembra la medida que los productos YA tenían declarada en specs
 * (35 x 35 cm) con sus precios actuales, para que nada cambie de precio.
 * Las demás medidas las carga Emilio desde el admin:
 *   /admin/productos -> editar -> "Medidas y precios"
 *
 *   npx tsx scripts/seed-laminas-variants.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const productos = await prisma.product.findMany({
    where: { category: "Laminas antiadherentes" },
  });

  for (const p of productos) {
    if (Array.isArray(p.variants) && p.variants.length > 0) {
      console.log(`SALTEADO (ya tiene medidas): ${p.name}`);
      continue;
    }
    const variants = [
      {
        id: "35x35",
        label: "35 x 35 cm",
        price: p.price,
        salePrice: p.salePrice ?? null,
        stock: null, // usa el stock general del producto
      },
    ];
    await prisma.product.update({ where: { id: p.id }, data: { variants } });
    console.log(`OK: ${p.name} -> ${variants.length} medida(s)`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
