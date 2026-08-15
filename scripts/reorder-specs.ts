/**
 * Reescribe las especificaciones de cada producto en orden lógico.
 *
 * Hace falta porque `Product.specs` era `jsonb`, que reordena las claves por
 * longitud: los productos ya guardados perdieron el orden de carga. Ya se pasó
 * la columna a `json` (respeta el orden), así que basta con volver a escribirlas.
 *
 * NO cambia claves ni valores: solo el orden. Si una clave del orden esperado no
 * existe en el producto se ignora, y cualquier clave no listada se agrega al
 * final, de modo que nunca se pierde información.
 *
 *   npx tsx scripts/reorder-specs.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/** slug -> claves en el orden en que deben mostrarse. */
const ORDEN: Record<string, string[]> = {
  "controlador-tactil-inteligente-wifi": [
    "Interfaz", "Temperatura", "Rango de trabajo", "Humedad", "Modos",
    "Salidas", "Registro", "Conectividad", "Protecciones", "Alimentación",
  ],
  "control-esp32-s3-kit-actualizacion": [
    "Interfaz", "Temperatura", "Rango de trabajo", "Humedad", "Modos",
    "Salidas", "Registro", "Conectividad", "Protecciones", "Alimentación",
  ],
  "deshidratador-comercial-ind-26mto": [
    "bandejas", "temperatura", "potencia", "construcción", "garantía",
  ],
  "deshidratador-comercial-ind-48mto-turbo-oscilante": [
    "Capacidad:", "Alimentacion:", "Potencia instalada:", "Consumo promed.: ",
  ],
  "deshidratador-modelo-fa-10t": [
    "Capacidad:", "Cant. bandejas", "Alimentacion:", "Potencia instalada:", "Consumo Promed.:",
  ],
  "deshidratador-modelo-fa-6t": [
    "Capacidad:", "Cant. Bandejas", "Alimentacion:", "Potencia instalada:", "Consumo promed.:",
  ],
  "deshidratador-modelo-fa-8t": [
    "Capacidad:", "Cant. bandejas:", "Alimentacion:", "Potencia instalada:", "Consumo promed.:",
  ],
};

async function main() {
  for (const [slug, orden] of Object.entries(ORDEN)) {
    const p = await prisma.product.findUnique({ where: { slug } });
    if (!p || !p.specs || typeof p.specs !== "object" || Array.isArray(p.specs)) {
      console.log(`SALTEADO (sin specs): ${slug}`);
      continue;
    }
    const actual = p.specs as Record<string, string>;

    const ordenado: Record<string, string> = {};
    for (const k of orden) {
      if (k in actual) ordenado[k] = actual[k];
    }
    // Red de seguridad: nada se pierde por un typo en la lista de arriba.
    const sobrantes = Object.keys(actual).filter((k) => !(k in ordenado));
    for (const k of sobrantes) ordenado[k] = actual[k];

    if (sobrantes.length > 0) {
      console.log(`  ! ${slug}: claves no listadas, van al final -> ${sobrantes.join(", ")}`);
    }
    if (Object.keys(ordenado).length !== Object.keys(actual).length) {
      throw new Error(`${slug}: cambio la cantidad de specs, abortando`);
    }

    await prisma.product.update({ where: { slug }, data: { specs: ordenado } });
    console.log(`OK ${slug}\n   ${Object.keys(ordenado).join(" | ")}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
