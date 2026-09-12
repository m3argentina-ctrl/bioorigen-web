/**
 * Borra todos los pedidos de prueba.
 * Orden: SupplierOrder → Order (proveedores no se tocan)
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🗑️  Borrando SupplierOrders...");
  const { count: so } = await prisma.supplierOrder.deleteMany();
  console.log(`   ${so} supplierOrder(s) eliminados`);

  console.log("🗑️  Borrando Orders...");
  const { count: o } = await prisma.order.deleteMany();
  console.log(`   ${o} order(s) eliminados`);

  console.log("✅ Listo. Proveedores y productos intactos.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
