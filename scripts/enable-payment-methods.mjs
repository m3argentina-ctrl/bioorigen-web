import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();

const existing = await p.paymentConfig.findFirst();
if (existing) {
  const updated = await p.paymentConfig.update({
    where: { id: existing.id },
    data: { openpayEnabled: true, bankTransferEnabled: true },
  });
  console.log("PaymentConfig actualizado:", updated.id, "| openpay:", updated.openpayEnabled, "| transferencia:", updated.bankTransferEnabled);
} else {
  const created = await p.paymentConfig.create({
    data: { openpayEnabled: true, bankTransferEnabled: true },
  });
  console.log("PaymentConfig creado:", created.id, "| openpay:", created.openpayEnabled, "| transferencia:", created.bankTransferEnabled);
}

await p.$disconnect();
