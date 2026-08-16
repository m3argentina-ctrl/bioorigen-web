/**
 * Sincroniza las recetas de src/lib/sample-data.ts contra la base (Neon).
 *
 * La web lee las recetas de la base, no del código: editar sample-data.ts sola
 * no cambia nada en producción. Este script es el puente.
 *
 * Uso:
 *   npx tsx scripts/sync-recetas.ts            aplica los cambios
 *   npx tsx scripts/sync-recetas.ts --dry-run  muestra qué haría, sin escribir
 *   npx tsx scripts/sync-recetas.ts --force    pisa también las fotos subidas
 *                                              desde el admin
 *
 * Sobre las fotos: por defecto, si una receta ya tiene en la base una imagen
 * cargada a mano (una URL de Supabase, por ejemplo), se respeta. Solo se
 * escribe la ruta local /recetas/<slug>.jpg cuando el campo está vacío o ya
 * era una ruta local. Con --force se pisa siempre.
 *
 * Necesita DATABASE_URL en .env — o sea, se corre desde la PC, no desde CI.
 */

import { PrismaClient } from "@prisma/client";
import { SAMPLE_RECIPES } from "../src/lib/sample-data";

const prisma = new PrismaClient();

const dryRun = process.argv.includes("--dry-run");
const force = process.argv.includes("--force");

const esRutaLocal = (v: string) => v.startsWith("/recetas/");

async function main() {
  const existentes = await prisma.recipe.findMany({
    select: { slug: true, image: true },
  });
  const porSlug = new Map(existentes.map((r) => [r.slug, r]));

  let creadas = 0;
  let actualizadas = 0;
  const fotosRespetadas: string[] = [];

  for (const receta of SAMPLE_RECIPES) {
    const actual = porSlug.get(receta.slug);

    // Foto: no pisamos lo que se haya subido desde el admin.
    let image = receta.image;
    if (actual && actual.image && !esRutaLocal(actual.image) && !force) {
      image = actual.image;
      fotosRespetadas.push(receta.slug);
    }

    const datos = { ...receta, image };

    if (!actual) {
      creadas++;
      console.log(`+ ${receta.slug}`);
      if (!dryRun) await prisma.recipe.create({ data: datos });
    } else {
      actualizadas++;
      console.log(`~ ${receta.slug}`);
      if (!dryRun) await prisma.recipe.update({ where: { slug: receta.slug }, data: datos });
    }
  }

  // Recetas cargadas desde el admin que no están en el código: se dejan como están.
  const slugsCodigo = new Set(SAMPLE_RECIPES.map((r) => r.slug));
  const soloEnBase = existentes.filter((r) => !slugsCodigo.has(r.slug)).map((r) => r.slug);

  console.log("");
  console.log(`Creadas:      ${creadas}`);
  console.log(`Actualizadas: ${actualizadas}`);
  if (fotosRespetadas.length) {
    console.log(
      `Fotos del admin respetadas (${fotosRespetadas.length}): ${fotosRespetadas.join(", ")}`,
    );
    console.log("  → usá --force si querés pisarlas con las de /public/recetas/.");
  }
  if (soloEnBase.length) {
    console.log(`Solo en la base, sin tocar (${soloEnBase.length}): ${soloEnBase.join(", ")}`);
  }
  if (dryRun) console.log("\n(--dry-run: no se escribió nada)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
