/**
 * Descarga y prepara las fotos de las recetas en public/recetas/.
 *
 * Las fotos NO viajan en el repo por peso: se generan con este script y se
 * commitean una vez elegidas. Cada receta usa /recetas/<slug>.jpg, que es el
 * valor del campo `image` en src/lib/sample-data.ts.
 *
 * Uso:
 *   node scripts/recetas-imagenes.mjs buscar [slug...]   descarga candidatas y elige la 1
 *   node scripts/recetas-imagenes.mjs elegir <slug> <n>  promueve la candidata n
 *   node scripts/recetas-imagenes.mjs importar <slug> <archivo>   usa una foto propia
 *   node scripts/recetas-imagenes.mjs estado             qué recetas ya tienen foto
 *   node scripts/recetas-imagenes.mjs limpiar            borra las candidatas descartadas
 *
 * Proveedores (en orden de preferencia):
 *   PEXELS_API_KEY   → Pexels. Mejores fotos de comida. Key gratis e inmediata
 *                      en https://www.pexels.com/api/. Licencia Pexels: uso
 *                      libre, comercial incluido, sin atribución obligatoria.
 *   sin key          → Openverse (api.openverse.org), filtrado a CC0 y dominio
 *                      público. No necesita key pero tiene menos fotos de
 *                      producto y un límite de peticiones más bajo.
 */

import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "public", "recetas");
const CAND_DIR = path.join(OUT_DIR, "_candidatos");
const CREDITS = path.join(OUT_DIR, "CREDITOS.md");
/** Vive fuera de _candidatos/ para que `limpiar` no se lleve las licencias. */
const META = path.join(OUT_DIR, "fuentes.json");

/** Ancho/alto final. Las tarjetas usan 4:3 y el detalle recorta al centro. */
const WIDTH = 1200;
const HEIGHT = 900;
const QUALITY = 82;
/** Cuántas candidatas bajar por receta para poder elegir a ojo. */
const CANDIDATES = 5;

/**
 * Búsqueda por receta. En inglés porque los bancos de fotos indexan en inglés;
 * las consultas apuntan al producto terminado, no al proceso.
 */
const QUERIES = {
  "chips-de-manzana": "dried apple slices snack",
  "platanos-deshidratados": "dried banana slices",
  "fresas-deshidratadas": "dried strawberry slices",
  "chips-de-zanahoria": "dried carrot chips snack",
  "hierbas-aromaticas": "dried herbs oregano thyme rosemary",
  "rodajas-de-naranja-deshidratadas": "dried orange slices",
  "anana-deshidratado": "dried pineapple rings",
  "chips-de-kale": "kale chips bowl",
  "tomates-secos": "sun dried tomatoes jar",
  "chips-vegetales-mixtos": "vegetable chips beetroot zucchini",
  "leather-de-frutas": "fruit leather rolls homemade",
  "condimento-casero-en-polvo": "homemade vegetable seasoning powder jar",
  "sopa-instantanea-para-camping": "dried soup mix jar vegetables",
  "jengibre-y-curcuma-deshidratados": "dried ginger turmeric slices powder",
  "melts-de-yogur-y-fruta": "yogurt melts drops snack",
  "beef-jerky": "beef jerky strips",
  "hongos-gourmet-deshidratados": "dried shiitake porcini mushrooms",
  "barritas-energeticas": "homemade granola energy bars oats",
  "frutos-secos-activados": "raw almonds walnuts cashews bowl",
  "masa-madre-deshidratada": "dried sourdough starter flakes",
  "charqui-de-pollo": "chicken jerky strips",
};

// ─────────────────────────────────────────────────────────────────────────────

const log = (...a) => console.log(...a);
const fail = (msg) => {
  console.error(`\n✖ ${msg}\n`);
  process.exit(1);
};

/** Sin timeout, una red caída deja el script colgado sin decir nada. */
const TIMEOUT_MS = 30_000;

async function fetchJson(url, headers = {}) {
  const res = await fetch(url, { headers, signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} — ${url}`);
  return res.json();
}

/** Devuelve [{ url, creator, source, license, pageUrl }] */
async function buscarPexels(query, key) {
  const url =
    "https://api.pexels.com/v1/search?per_page=" +
    CANDIDATES +
    "&orientation=landscape&query=" +
    encodeURIComponent(query);
  const data = await fetchJson(url, { Authorization: key });
  return (data.photos ?? []).map((p) => ({
    url: p.src.large2x || p.src.large || p.src.original,
    creator: p.photographer,
    source: "Pexels",
    license: "Licencia Pexels (uso libre, comercial, sin atribución obligatoria)",
    pageUrl: p.url,
  }));
}

async function buscarOpenverse(query) {
  const url =
    "https://api.openverse.org/v1/images/?license=cc0,pdm&category=photograph&page_size=" +
    CANDIDATES +
    "&q=" +
    encodeURIComponent(query);
  const data = await fetchJson(url, { "User-Agent": "bioorigen-web/1.0" });
  return (data.results ?? []).map((r) => ({
    url: r.url,
    creator: r.creator || "desconocido",
    source: r.source || "Openverse",
    license: `${(r.license || "cc0").toUpperCase()} ${r.license_version ?? ""}`.trim(),
    pageUrl: r.foreign_landing_url || r.url,
  }));
}

const PEXELS_KEY = process.env.PEXELS_API_KEY?.trim();
const proveedor = PEXELS_KEY ? "Pexels" : "Openverse";
const buscar = (q) => (PEXELS_KEY ? buscarPexels(q, PEXELS_KEY) : buscarOpenverse(q));

/** Normaliza a JPG 1200x900. `origen` puede ser una URL o una ruta local. */
async function guardarFoto(origen, destino) {
  let entrada = origen;
  if (/^https?:\/\//i.test(origen)) {
    const res = await fetch(origen, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!res.ok) throw new Error(`descarga falló: ${res.status} ${origen}`);
    entrada = Buffer.from(await res.arrayBuffer());
  }
  await fs.mkdir(path.dirname(destino), { recursive: true });
  await sharp(entrada)
    .resize(WIDTH, HEIGHT, { fit: "cover", position: "attention" })
    .jpeg({ quality: QUALITY, progressive: true, mozjpeg: true })
    .toFile(destino);
}

async function leerMeta() {
  if (!existsSync(META)) return {};
  return JSON.parse(await fs.readFile(META, "utf8"));
}

async function escribirMeta(meta) {
  await fs.mkdir(OUT_DIR, { recursive: true });
  await fs.writeFile(META, JSON.stringify(meta, null, 2));
}

async function escribirCreditos(meta) {
  const filas = Object.entries(meta)
    .filter(([, m]) => m.elegida)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([slug, m]) => {
      const e = m.candidatas[m.elegida - 1];
      if (!e) return null;
      return `| \`${slug}.jpg\` | ${e.source} | ${e.creator} | ${e.license} | ${e.pageUrl} |`;
    })
    .filter(Boolean);

  // Sin filas no hay nada que acreditar: no pisamos un CREDITOS.md que ya exista.
  if (!filas.length) return;

  const md = `# Créditos de las fotos de recetas

Generado por \`scripts/recetas-imagenes.mjs\`. Todas las fotos son de uso libre
(comercial incluido). Verificá la licencia antes de reemplazar cualquiera a mano.

| Archivo | Banco | Autor | Licencia | Origen |
|---|---|---|---|---|
${filas.join("\n")}

Fotos propias de Bio Origen importadas con \`importar\` no figuran en esta tabla.
`;
  await fs.writeFile(CREDITS, md);
}

// ─── comandos ────────────────────────────────────────────────────────────────

async function cmdBuscar(slugs) {
  const objetivo = slugs.length ? slugs : Object.keys(QUERIES);
  const desconocidos = objetivo.filter((s) => !QUERIES[s]);
  if (desconocidos.length) fail(`slug sin consulta definida: ${desconocidos.join(", ")}`);

  log(`Proveedor: ${proveedor}`);
  if (!PEXELS_KEY) {
    log("Sugerencia: exportá PEXELS_API_KEY para fotos de comida bastante mejores.\n");
  }

  const meta = await leerMeta();
  let ok = 0;
  let err = 0;

  for (const slug of objetivo) {
    process.stdout.write(`· ${slug} … `);
    try {
      const candidatas = await buscar(QUERIES[slug]);
      if (!candidatas.length) {
        log("sin resultados");
        err++;
        continue;
      }
      for (let i = 0; i < candidatas.length; i++) {
        await guardarFoto(candidatas[i].url, path.join(CAND_DIR, slug, `${i + 1}.jpg`));
      }
      await guardarFoto(candidatas[0].url, path.join(OUT_DIR, `${slug}.jpg`));
      meta[slug] = { candidatas, elegida: 1 };
      await escribirMeta(meta);
      log(`${candidatas.length} candidatas, elegida la 1`);
      ok++;
    } catch (e) {
      log(`ERROR: ${e.message}`);
      err++;
    }
  }

  await escribirCreditos(meta);
  log(`\nListo: ${ok} recetas con foto, ${err} con problemas.`);
  log(`Revisá ${path.relative(ROOT, CAND_DIR)}/<slug>/ y cambiá con:`);
  log(`  node scripts/recetas-imagenes.mjs elegir <slug> <n>`);
}

async function cmdElegir(slug, n) {
  const meta = await leerMeta();
  const entrada = meta[slug];
  if (!entrada) fail(`no hay candidatas para "${slug}". Corré primero: buscar ${slug}`);
  const i = Number(n);
  if (!Number.isInteger(i) || i < 1 || i > entrada.candidatas.length) {
    fail(`elegí un número entre 1 y ${entrada.candidatas.length}`);
  }
  const origen = path.join(CAND_DIR, slug, `${i}.jpg`);
  if (!existsSync(origen)) fail(`falta el archivo ${origen}`);
  await fs.copyFile(origen, path.join(OUT_DIR, `${slug}.jpg`));
  entrada.elegida = i;
  await escribirMeta(meta);
  await escribirCreditos(meta);
  log(`${slug}.jpg ← candidata ${i}`);
}

async function cmdImportar(slug, archivo) {
  if (!QUERIES[slug]) fail(`slug desconocido: ${slug}`);
  if (!existsSync(archivo)) fail(`no encuentro el archivo ${archivo}`);
  await guardarFoto(archivo, path.join(OUT_DIR, `${slug}.jpg`));
  const meta = await leerMeta();
  delete meta[slug]; // foto propia: sale de la tabla de créditos
  await escribirMeta(meta);
  await escribirCreditos(meta);
  log(`${slug}.jpg ← ${archivo} (foto propia)`);
}

async function cmdEstado() {
  const faltan = [];
  for (const slug of Object.keys(QUERIES)) {
    const f = path.join(OUT_DIR, `${slug}.jpg`);
    if (existsSync(f)) {
      const { size } = await fs.stat(f);
      log(`✓ ${slug.padEnd(36)} ${(size / 1024).toFixed(0)} KB`);
    } else {
      faltan.push(slug);
    }
  }
  for (const slug of faltan) log(`✗ ${slug}`);
  log(`\n${Object.keys(QUERIES).length - faltan.length}/${Object.keys(QUERIES).length} recetas con foto.`);
}

async function cmdLimpiar() {
  if (!existsSync(CAND_DIR)) return log("No hay candidatas para borrar.");
  await fs.rm(CAND_DIR, { recursive: true, force: true });
  log("Candidatas borradas. Las fotos elegidas siguen en public/recetas/.");
}

// ─── main ────────────────────────────────────────────────────────────────────

const [cmd, ...args] = process.argv.slice(2);

switch (cmd) {
  case "buscar":
    await cmdBuscar(args);
    break;
  case "elegir":
    if (args.length !== 2) fail("uso: elegir <slug> <n>");
    await cmdElegir(args[0], args[1]);
    break;
  case "importar":
    if (args.length !== 2) fail("uso: importar <slug> <archivo>");
    await cmdImportar(args[0], args[1]);
    break;
  case "estado":
    await cmdEstado();
    break;
  case "limpiar":
    await cmdLimpiar();
    break;
  default:
    log(
      [
        "Fotos de recetas para public/recetas/",
        "",
        "  node scripts/recetas-imagenes.mjs buscar [slug...]",
        "  node scripts/recetas-imagenes.mjs elegir <slug> <n>",
        "  node scripts/recetas-imagenes.mjs importar <slug> <archivo>",
        "  node scripts/recetas-imagenes.mjs estado",
        "  node scripts/recetas-imagenes.mjs limpiar",
        "",
        `Proveedor actual: ${proveedor}`,
      ].join("\n"),
    );
}
