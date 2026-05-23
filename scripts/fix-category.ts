import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
prisma.product.updateMany({ where: { category: "Charqui" }, data: { category: "Carros Porta bandejas" } })
  .then((r) => console.log("Productos actualizados:", r.count))
  .catch(console.error)
  .finally(() => prisma.$disconnect());
