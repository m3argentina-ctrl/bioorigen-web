import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
const r = await p.paymentConfig.updateMany({ where: {}, data: { openpayEnabled: false } });
console.log("OpenPay deshabilitado. Filas actualizadas:", r.count);
await p.$disconnect();
