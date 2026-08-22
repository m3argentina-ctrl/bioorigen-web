import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const tb = await prisma.supplier.findFirst({ where: { name: "Turboblender" } });
  if (!tb) { console.error("❌ Turboblender no encontrado"); process.exit(1); }

  await prisma.supplier.update({
    where: { id: tb.id },
    data: { shippingMode: "PROVEEDOR_DIRECTO" },
  });
  console.log(`✅ Turboblender → PROVEEDOR_DIRECTO`);
}

main()
  .catch((e) => { console.error("❌", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
