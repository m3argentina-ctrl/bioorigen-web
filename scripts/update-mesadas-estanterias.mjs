/**
 * Actualiza los productos de mesadas/estantes/estanterías:
 * 1. Corrige el campo `category` (nombre viejo → nuevo)
 * 2. Agrega variantes de medida a mesadas y estante
 * 3. Crea las dos bachas (simple y doble)
 * 4. Desactiva las estanterías domésticas (RACKH3 y RACKH5)
 */
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const CAT_MESADAS = "Mesadas y Estantes Profesionales de Acero Inoxidable";
const CAT_PROCESADORAS = "Procesadoras y Cutters";
const CAT_ESTANTERIAS = "Estanterías";

async function main() {

  // ── 1. Corregir category string en productos ───────────────────────────────
  console.log("1. Actualizando categorías en productos...");

  // "Equipamiento Profesional" → "Procesadoras y Cutters"
  const r1 = await prisma.product.updateMany({
    where: { category: "Equipamiento Profesional" },
    data: { category: CAT_PROCESADORAS },
  });
  console.log(`   Procesadoras/Cutters: ${r1.count} producto(s) actualizados`);

  // "Mobiliario de Acero" → nombre nuevo de mesadas
  const r2 = await prisma.product.updateMany({
    where: { category: "Mobiliario de Acero" },
    data: { category: CAT_MESADAS },
  });
  console.log(`   Mesadas/Estantes: ${r2.count} producto(s) actualizados`);

  // ── 2. Agregar variantes a Mesada de Acero (sin zócalo) ───────────────────
  console.log("\n2. Variantes de medida en productos...");

  await prisma.product.update({
    where: { slug: "mesada-de-acero-inoxidable" },
    data: {
      price: 439999, // precio mínimo (80 cm) — actualizar los demás en admin
      variants: [
        { id: "80cm",  label: "80 cm",  price: 439999, stock: 10 },
        { id: "120cm", label: "120 cm", price: 439999, stock: 10 },
        { id: "150cm", label: "150 cm", price: 439999, stock: 10 },
        { id: "180cm", label: "180 cm", price: 439999, stock: 10 },
      ],
    },
  });
  console.log("   ✓ Mesada de Acero Inoxidable — 4 medidas");

  await prisma.product.update({
    where: { slug: "mesada-de-acero-con-zocalo" },
    data: {
      price: 499999,
      variants: [
        { id: "80cm",  label: "80 cm",  price: 499999, stock: 10 },
        { id: "120cm", label: "120 cm", price: 499999, stock: 10 },
        { id: "150cm", label: "150 cm", price: 499999, stock: 10 },
        { id: "180cm", label: "180 cm", price: 499999, stock: 10 },
      ],
    },
  });
  console.log("   ✓ Mesada con Zócalo — 4 medidas");

  await prisma.product.update({
    where: { slug: "estante-de-acero-inoxidable" },
    data: {
      price: 215999,
      variants: [
        { id: "80cm",  label: "80 cm",  price: 215999, stock: 15 },
        { id: "120cm", label: "120 cm", price: 215999, stock: 15 },
        { id: "150cm", label: "150 cm", price: 215999, stock: 15 },
      ],
    },
  });
  console.log("   ✓ Estante de Acero — 3 medidas");

  // ── 3. Crear bachas ────────────────────────────────────────────────────────
  console.log("\n3. Creando bachas...");

  await prisma.product.upsert({
    where: { slug: "bacha-simple-tb-bach800s" },
    update: {
      name: "Bacha Simple TB-BACH800S",
      price: 699999,
      category: CAT_MESADAS,
      description: "Bacha de acero inoxidable SS201 con pileta simple. Fácil armado e instalación. Pileta: 500×500×300 mm. Medidas totales: 700×700×800 mm. Peso: 11 kg.",
      images: [
        "https://static.wixstatic.com/media/5c4b07_d5a927b89a624e1db2cf463520de2f8a~mv2.png",
        "https://static.wixstatic.com/media/5c4b07_ba94f9270c704b6596c6870831d699db~mv2.png",
      ],
      specs: {
        "Material": "Acero inoxidable SS201",
        "Tipo": "Pileta simple",
        "Tamaño de pileta": "500×500×300 mm",
        "Medidas totales": "700×700×800 mm",
        "Peso": "11 kg",
      },
      stock: 10,
      active: true,
    },
    create: {
      slug: "bacha-simple-tb-bach800s",
      name: "Bacha Simple TB-BACH800S",
      price: 699999,
      category: CAT_MESADAS,
      description: "Bacha de acero inoxidable SS201 con pileta simple. Fácil armado e instalación. Pileta: 500×500×300 mm. Medidas totales: 700×700×800 mm. Peso: 11 kg.",
      images: [
        "https://static.wixstatic.com/media/5c4b07_d5a927b89a624e1db2cf463520de2f8a~mv2.png",
        "https://static.wixstatic.com/media/5c4b07_ba94f9270c704b6596c6870831d699db~mv2.png",
      ],
      specs: {
        "Material": "Acero inoxidable SS201",
        "Tipo": "Pileta simple",
        "Tamaño de pileta": "500×500×300 mm",
        "Medidas totales": "700×700×800 mm",
        "Peso": "11 kg",
      },
      stock: 10,
      active: true,
      featured: false,
    },
  });
  console.log("   ✓ Bacha Simple TB-BACH800S ($699.999)");

  await prisma.product.upsert({
    where: { slug: "bacha-doble-tb-bach800c" },
    update: {
      name: "Bacha Doble TB-BACH800C",
      price: 919999,
      category: CAT_MESADAS,
      description: "Bacha de acero inoxidable SS201 con pileta doble. Fácil armado e instalación. Tamaño de cada pileta: 500×500×300 mm. Medidas totales: 700×700×800 mm. Peso: 12,5 kg.",
      images: [
        "https://static.wixstatic.com/media/5c4b07_fa9601f94487420f911bfb40297b44c5~mv2.png",
        "https://static.wixstatic.com/media/5c4b07_a4631abc6a934d27b98bd52ee6b214ac~mv2.png",
      ],
      specs: {
        "Material": "Acero inoxidable SS201",
        "Tipo": "Pileta doble",
        "Tamaño de pileta": "500×500×300 mm (c/u)",
        "Medidas totales": "700×700×800 mm",
        "Peso": "12,5 kg",
      },
      stock: 10,
      active: true,
    },
    create: {
      slug: "bacha-doble-tb-bach800c",
      name: "Bacha Doble TB-BACH800C",
      price: 919999,
      category: CAT_MESADAS,
      description: "Bacha de acero inoxidable SS201 con pileta doble. Fácil armado e instalación. Tamaño de cada pileta: 500×500×300 mm. Medidas totales: 700×700×800 mm. Peso: 12,5 kg.",
      images: [
        "https://static.wixstatic.com/media/5c4b07_fa9601f94487420f911bfb40297b44c5~mv2.png",
        "https://static.wixstatic.com/media/5c4b07_a4631abc6a934d27b98bd52ee6b214ac~mv2.png",
      ],
      specs: {
        "Material": "Acero inoxidable SS201",
        "Tipo": "Pileta doble",
        "Tamaño de pileta": "500×500×300 mm (c/u)",
        "Medidas totales": "700×700×800 mm",
        "Peso": "12,5 kg",
      },
      stock: 10,
      active: true,
      featured: false,
    },
  });
  console.log("   ✓ Bacha Doble TB-BACH800C ($919.999)");

  // ── 4. Desactivar estanterías domésticas ──────────────────────────────────
  console.log("\n4. Desactivando estanterías domésticas...");

  const r3 = await prisma.product.updateMany({
    where: { slug: { in: ["estanteria-tb-rackh3", "estanteria-tb-rackh5"] } },
    data: { active: false },
  });
  console.log(`   ✓ ${r3.count} estantería(s) doméstica(s) desactivadas (RACKH3, RACKH5)`);

  console.log("\n✅ Listo.");
}

main()
  .catch((e) => { console.error("❌", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
