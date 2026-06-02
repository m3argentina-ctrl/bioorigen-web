// Lectura puntual para verificar que el equipo FA10T-0001 esta persistiendo
// muestras en Neon. Uso: npx tsx scripts/check-muestras.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const eq = await prisma.equipo.findUnique({ where: { deviceId: "FA10T-0001" } });
  if (!eq) {
    console.log("NO existe el Equipo FA10T-0001 en la DB");
    return;
  }
  console.log("== Equipo (cache) ==");
  console.log("  deviceId     :", eq.deviceId);
  console.log("  online       :", eq.online);
  console.log("  lastSeenAt   :", eq.lastSeenAt?.toISOString());
  console.log("  lastReason   :", eq.lastReason);
  console.log("  lastRunState :", eq.lastRunState);
  console.log("  lastTemp     :", eq.lastTemp);
  console.log("  modelo/serie :", eq.modelo, "/", eq.serie);

  const total = await prisma.muestra.count({ where: { equipoId: eq.id } });
  console.log("\n== Muestras ==");
  console.log("  total        :", total);

  const last = await prisma.muestra.findMany({
    where: { equipoId: eq.id },
    orderBy: { createdAt: "desc" },
    take: 6,
  });
  console.log("\n== Ultimas 6 (mas reciente primero) ==");
  for (const m of last) {
    console.log(
      `  ${m.createdAt.toISOString()}  reason=${m.reason.padEnd(9)} temp=${m.temp} sp=${m.spEff} rs=${m.runState} drv=${m.drv} fan=${m.fan} uptime=${m.uptimeS}s`
    );
  }
}

main()
  .catch((e) => { console.error(e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
