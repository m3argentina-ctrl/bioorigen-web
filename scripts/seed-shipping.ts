import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // Config de carriers (sólo crea si no existe)
  const existing = await prisma.shippingConfig.findFirst();
  if (!existing) {
    await prisma.shippingConfig.create({
      data: {
        andreaniEnabled: true,  andreaniDomicilio: 13000, andreaniSucursal: 11000,
        andreaniDays: "2-4 días", andreaniInsurance: true,
        correoEnabled: true,   correoDomicilio: 19000,   correoSucursal: 16000,
        correoDays: "6-10 días", correoInsurance: false,
      },
    });
    console.log("ShippingConfig creada.");
  } else {
    console.log("ShippingConfig ya existe, omitida.");
  }

  // Regla de envío gratis por defecto
  const ruleCount = await prisma.freeShippingConfig.count();
  if (ruleCount === 0) {
    await prisma.freeShippingConfig.create({
      data: {
        name: "Envío gratis en compras > $90.000",
        type: "minimum_amount",
        minimumAmount: 90000,
        enabled: true,
        applyAndreani: true,
        applyCorreo: true,
        priority: 10,
      },
    });
    console.log("FreeShippingConfig por defecto creada.");
  } else {
    console.log(`Ya existen ${ruleCount} reglas, omitidas.`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
