import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
const cats = await p.category.findMany({ orderBy: { order: "asc" }, select: { name: true, slug: true, active: true, order: true } });
cats.forEach(c => console.log(`${c.order} ${c.active ? "ON " : "OFF"} | ${c.name} | ${c.slug}`));
await p.$disconnect();
