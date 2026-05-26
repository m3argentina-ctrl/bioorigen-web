import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
const cfg = await p.paymentConfig.findFirst();
console.log("PaymentConfig:", JSON.stringify(cfg, null, 2));
await p.$disconnect();
