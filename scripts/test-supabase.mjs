import { PrismaClient } from "@prisma/client";

const src = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:Moni%402365@db.rqtccnimnqesxtgkceub.supabase.co:5432/postgres?sslmode=require",
    },
  },
});

try {
  const result = await src.$queryRaw`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`;
  console.log("Conectado a Supabase OK. Tablas:", result.map(r => r.table_name).join(", "));
} catch (e) {
  console.error("Error de conexión:", e.message);
} finally {
  await src.$disconnect();
}
