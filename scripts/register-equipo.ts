// Alta / re-token de un equipo FA-10T en la base (flota de telemetría).
//
// Genera un token Bearer único, crea (o actualiza) el Equipo y, si se pasa un
// cliente, lo asocia. Imprime el comando exacto de provisioning para el repo de
// firmware (tools/provision/provision.ps1) que graba dev_id+token en la
// partición NVS "factory" al flashear.
//
// Uso:
//   npx tsx scripts/register-equipo.ts --device FA10T-0001 \
//       --cliente "Distribuidora Norte" --email cliente@mail.com \
//       --nombre "Deshidratador Planta 1"
//
// Opcionales:
//   --token <valor>      usar un token explícito (si no, se genera uno random)
//   --cloud-url <url>    base del backend (default https://app.bioorigen.com)
//   --regenerate         re-generar el token de un equipo ya existente

import { PrismaClient } from "@prisma/client";
import { randomBytes } from "node:crypto";

const prisma = new PrismaClient();

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
function flag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

async function main() {
  const deviceId = arg("device");
  if (!deviceId) {
    console.error("Falta --device <dev_id>, ej: --device FA10T-0001");
    process.exit(1);
  }

  const clienteNombre = arg("cliente");
  const clienteEmail = arg("email");
  const nombre = arg("nombre");
  const cloudUrl = arg("cloud-url") ?? "https://app.bioorigen.com";
  const explicitToken = arg("token");
  const regenerate = flag("regenerate");

  // Token: 32 bytes → base64url (~43 chars). Secreto compartido equipo↔backend.
  const token = explicitToken ?? randomBytes(32).toString("base64url");

  // Cliente (opcional): upsert por email si hay, si no se crea suelto.
  let clienteId: string | undefined;
  if (clienteNombre || clienteEmail) {
    const cliente = clienteEmail
      ? await prisma.cliente.upsert({
          where: { email: clienteEmail },
          update: { nombre: clienteNombre ?? undefined },
          create: { nombre: clienteNombre ?? clienteEmail, email: clienteEmail },
        })
      : await prisma.cliente.create({ data: { nombre: clienteNombre! } });
    clienteId = cliente.id;
  }

  const existing = await prisma.equipo.findUnique({ where: { deviceId } });

  const equipo = existing
    ? await prisma.equipo.update({
        where: { deviceId },
        data: {
          nombre: nombre ?? existing.nombre,
          clienteId: clienteId ?? existing.clienteId,
          ...(explicitToken || regenerate ? { token } : {}),
        },
      })
    : await prisma.equipo.create({
        data: { deviceId, token, nombre, clienteId },
      });

  const finalToken =
    existing && !(explicitToken || regenerate) ? existing.token : token;

  console.log("\n=== Equipo registrado ===");
  console.log("deviceId :", equipo.deviceId);
  console.log("token    :", finalToken);
  console.log("cliente  :", clienteId ?? "(sin asignar)");
  console.log("cloudUrl :", cloudUrl);
  if (existing && !(explicitToken || regenerate)) {
    console.log("\n(El equipo ya existía; token sin cambios. Usá --regenerate para rotarlo.)");
  }
  console.log("\n=== Provisioning del firmware (en el repo FA-10T) ===");
  console.log(
    `.\\tools\\provision\\provision.ps1 -DevId "${equipo.deviceId}" ` +
      `-Token "${finalToken}" -Port COM3 -CloudUrl "${cloudUrl}"`,
  );
  console.log("");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
