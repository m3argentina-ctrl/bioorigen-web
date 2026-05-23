import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.valueProp.count();
  if (count > 0) {
    console.log(`Ya existen ${count} beneficios. Seed omitido.`);
    return;
  }

  await prisma.valueProp.createMany({
    data: [
      { icon: "Sprout", title: "100% Natural", text: "Sin conservantes, colorantes ni azúcar agregada.", order: 0, active: true },
      { icon: "Sun", title: "Deshidratado lento", text: "Proceso a baja temperatura que conserva nutrientes y sabor.", order: 1, active: true },
      { icon: "MapPin", title: "Producción local", text: "Elaborado en Tigre con materia prima argentina.", order: 2, active: true },
    ],
  });
  console.log("3 beneficios creados.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
