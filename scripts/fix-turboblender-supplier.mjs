import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const supplier = await prisma.supplier.findFirst({ where: { name: "Turboblender" } });
  if (!supplier) { console.error("❌ Supplier Turboblender no encontrado"); process.exit(1); }
  console.log(`Supplier: ${supplier.name} (${supplier.id})`);

  const categories = [
    "Mesadas, Bachas y Estantes Acero Inoxidable",
    "Licuadoras Profesionales",
  ];

  for (const cat of categories) {
    const r = await prisma.product.updateMany({
      where: { category: cat, supplierId: null },
      data: { supplierId: supplier.id },
    });
    console.log(`  ${r.count} producto(s) actualizados en "${cat}"`);
  }

  const total = await prisma.product.count({ where: { supplierId: supplier.id } });
  console.log(`\n✅ Total vinculados a Turboblender: ${total}`);
}

main()
  .catch((e) => { console.error("❌", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
