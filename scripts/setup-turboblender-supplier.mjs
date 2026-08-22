/**
 * Crea el proveedor Turboblender y lo linkea a todos sus productos.
 * Categorías Turboblender: Procesadoras y Cutters, Mesadas y Estantes
 * Profesionales de Acero Inoxidable, Estanterías.
 */
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // 1. Crear (o recuperar) el supplier
  let supplier = await prisma.supplier.findFirst({ where: { name: "Turboblender" } });
  if (!supplier) {
    supplier = await prisma.supplier.create({
      data: {
        name: "Turboblender",
        email: "info@turboblender.com.ar",
        notes: "Proveedor de equipamiento profesional: procesadoras, cutters, mesadas, estantes, bachas, estanterías.",
        active: true,
      },
    });
    console.log("  (creado nuevo supplier)");
  } else {
    console.log("  (supplier ya existía)");
  }
  console.log(`✓ Supplier: ${supplier.name} (${supplier.id})`);

  // 2. Linkear todas las categorías de Turboblender
  const categories = [
    "Procesadoras y Cutters",
    "Mesadas y Estantes Profesionales de Acero Inoxidable",
    "Estanterías",
  ];

  for (const cat of categories) {
    const r = await prisma.product.updateMany({
      where: { category: cat },
      data: { supplierId: supplier.id },
    });
    console.log(`  ${r.count} producto(s) en "${cat}"`);
  }

  // 3. Verificar
  const total = await prisma.product.count({ where: { supplierId: supplier.id } });
  console.log(`\n✅ Total productos vinculados a Turboblender: ${total}`);
}

main()
  .catch((e) => { console.error("❌", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
