/**
 * Seed script: carga productos Turboblender en la DB de bioorigen-web
 * Correr con: node --env-file=.env.local scripts/seed-turboblender.mjs
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ─── Categorías ──────────────────────────────────────────────────────────────
const CATEGORIES = [
  {
    name: "Equipamiento Profesional",
    slug: "equipamiento-profesional",
    description: "Procesadoras, cutters y equipos de cocina profesional Turboblender.",
    order: 20,
    active: true,
  },
  {
    name: "Mobiliario de Acero",
    slug: "mobiliario-de-acero",
    description: "Mesadas y estantes de acero inoxidable para cocinas profesionales.",
    order: 21,
    active: true,
  },
  {
    name: "Estanterías",
    slug: "estanterias",
    description: "Estanterías ajustables para uso doméstico y profesional.",
    order: 22,
    active: true,
  },
];

// ─── Productos ────────────────────────────────────────────────────────────────
const PRODUCTS = [
  // ── Equipamiento Profesional ─────────────────────────────────────────────
  {
    name: "Cutter Profesional TB-CUT800",
    slug: "cutter-profesional-tb-cut800",
    category: "Equipamiento Profesional",
    price: 1199999,
    stock: 10,
    featured: false,
    active: true,
    description:
      "Cutter profesional de 800W con capacidad de 5 litros. Cuchillas de acero inoxidable de alta calidad, sistema de raspador de superficie, tapa transparente con abertura superior para líquidos, traba de seguridad con imanes y base de acero. Velocidad única estable para resultados consistentes.",
    images: [
      "https://static.wixstatic.com/media/5c4b07_5160b05d442f4b79b96da543dac8f675~mv2.png",
      "https://static.wixstatic.com/media/5c4b07_530dbeb5a1114ce38540901ad3bb57c0~mv2.png",
      "https://static.wixstatic.com/media/5c4b07_5532d09d65944a848fd0b68689cbbc7f~mv2.png",
    ],
    specs: {
      "Potencia": "800 W",
      "Capacidad": "5 litros",
      "Velocidad": "Única estable",
      "Cuchillas": "Acero inoxidable",
      "Sistema de seguridad": "Traba magnética",
      "Medidas": "560 × 275 × 340 mm (Alto × Ancho × Prof.)",
    },
  },
  {
    name: "Procesadora TB-PRO735PLUS",
    slug: "procesadora-tb-pro735plus",
    category: "Equipamiento Profesional",
    price: 1649999,
    stock: 10,
    featured: false,
    active: true,
    description:
      "Procesadora industrial de 735W con doble tolva y empujador. Incluye 6 discos de corte (Juliana 8mm, Rallador 2mm, Rallador 5mm, Rebanador 6mm, Rebanador 10mm, Cubo 10mm). Sistema de activación y corte por imanes, bajo nivel de ruido, patas antideslizantes. Accesorios opcionales: Cutter 5L, Disco rebanador 3mm y Juliana 4mm.",
    images: [
      "https://static.wixstatic.com/media/5c4b07_635790b1a2094793b6f6395648d44451~mv2.png",
      "https://static.wixstatic.com/media/5c4b07_81c402710f704a81a8ae54d18db9dba3~mv2.png",
    ],
    specs: {
      "Potencia": "735 W",
      "Tolva": "Doble con empujador",
      "Discos incluidos": "6 (Juliana 8mm / Rallador 2mm / Rallador 5mm / Rebanador 6mm / Rebanador 10mm / Cubo 10mm)",
      "Accesorios opcionales": "Cutter, Rebanador 3mm, Juliana 4mm",
      "Seguridad": "Sistema por imanes",
      "Medidas": "39 × 76 × 47,5 cm (Ancho × Alto × Prof.)",
      "Peso neto": "17,5 kg",
    },
  },
  {
    name: "Procesadora Industrial TB-PRO1500",
    slug: "procesadora-industrial-tb-pro1500",
    category: "Equipamiento Profesional",
    price: 2999999,
    stock: 5,
    featured: false,
    active: true,
    description:
      "Procesadora industrial de alta potencia 1500W con cubierta superior de acero inoxidable. Doble tolva con empujador, 6 discos de corte incluidos y bajo nivel de ruido. Sistema de seguridad por imanes, patas antideslizantes y fácil desarme para limpieza. Accesorio cutter opcional (bowl 5L de acero inox).",
    images: [
      "https://static.wixstatic.com/media/ee1073_1e3a3d1109844cd9b409edf025e6a8b0~mv2.jpg",
      "https://static.wixstatic.com/media/ee1073_002a82c93cdf4e63a1c5039094f51b55~mv2.jpg",
      "https://static.wixstatic.com/media/ee1073_eca9ec0b62f94b8484e6afc0edf194a8~mv2.jpg",
    ],
    specs: {
      "Potencia": "1500 W",
      "Cubierta": "Acero inoxidable",
      "Tolva": "Doble con empujador",
      "Discos incluidos": "6 (Juliana 8mm / Rallador 2mm / Rallador 5mm / Rebanador 6mm / Rebanador 10mm / Cubo 10mm)",
      "Accesorio opcional": "Cutter (bowl 5L acero inox)",
      "Seguridad": "Sistema por imanes",
      "Medidas": "44,4 × 66,9 × 30,3 cm (Ancho × Alto × Prof.)",
    },
  },
  {
    name: "Procesadora Profesional Compacta TB-PRO600",
    slug: "procesadora-profesional-compacta-tb-pro600",
    category: "Equipamiento Profesional",
    price: 879999,
    stock: 10,
    featured: false,
    active: true,
    description:
      "Procesadora compacta de uso comercial, 600W y 1500 RPM. Doble tolva con empujador, cubierta de plástico de alta resistencia, bajo nivel de ruido y switch de seguridad. Incluye 4 discos de corte (Juliana 4×4mm, Rallador 2mm, Rallador 4,5mm, Rebanador 4mm). Accesorios opcionales: Cutter 3L y Rebanador 2mm.",
    images: [
      "https://static.wixstatic.com/media/5c4b07_8b8f3eaced8a46be8ddae5bfa5fefdf5~mv2.png",
      "https://static.wixstatic.com/media/5c4b07_4cc7129703044eeb97f6bc97a01512ae~mv2.png",
    ],
    specs: {
      "Potencia": "600 W",
      "Velocidad": "1500 RPM",
      "Tolva": "Doble con empujador",
      "Discos incluidos": "4 (Juliana 4×4mm / Rallador 2mm / Rallador 4,5mm / Rebanador 4mm)",
      "Accesorios opcionales": "Cutter 3L, Rebanador 2mm",
      "Medidas": "26,6 × 42,5 × 25,3 cm (Ancho × Alto × Prof.)",
    },
  },

  // ── Mobiliario de Acero ──────────────────────────────────────────────────
  {
    name: "Mesada de Acero Inoxidable",
    slug: "mesada-de-acero-inoxidable",
    category: "Mobiliario de Acero",
    price: 439999,
    stock: 20,
    featured: false,
    active: true,
    description:
      "Mesada profesional de acero inoxidable SS201 con estante inferior de guardado. Fácil armado e instalación. Soporta hasta 100 kg por nivel. Disponible en 4 medidas: 80, 120, 150 y 180 cm de ancho. Altura uniforme 85 cm y profundidad 70 cm.",
    images: [
      "https://static.wixstatic.com/media/5c4b07_3cec987a4f454cadbcd9c53fc35ae9a0~mv2.png",
      "https://static.wixstatic.com/media/5c4b07_e24c969fb80a48bab43c7b80af14f296~mv2.png",
    ],
    specs: {
      "Material": "Acero inoxidable SS201",
      "Capacidad por nivel": "100 kg",
      "Alto": "85 cm",
      "Profundidad": "70 cm",
      "Medidas disponibles": "80 / 120 / 150 / 180 cm de ancho",
      "Peso": "22 kg (80cm) / 30 kg (120cm) / 39 kg (150cm) / 42 kg (180cm)",
    },
  },
  {
    name: "Mesada de Acero con Zócalo",
    slug: "mesada-de-acero-con-zocalo",
    category: "Mobiliario de Acero",
    price: 499999,
    stock: 20,
    featured: false,
    active: true,
    description:
      "Mesada profesional de acero inoxidable SS201 con zócalo antisalpicaduras de 100 mm y estante inferior de guardado. Fácil armado e instalación. Soporta hasta 100 kg por nivel. Disponible en 4 medidas: 80, 120, 150 y 180 cm de ancho.",
    images: [
      "https://static.wixstatic.com/media/5c4b07_9179c61df99b4a2b9cbee78812bc4852~mv2.png",
      "https://static.wixstatic.com/media/5c4b07_bec9602cd9a04e58805b49228052c8a5~mv2.png",
    ],
    specs: {
      "Material": "Acero inoxidable SS201",
      "Zócalo antisalpicaduras": "100 mm",
      "Capacidad por nivel": "100 kg",
      "Alto": "85 cm",
      "Profundidad": "70 cm",
      "Medidas disponibles": "80 / 120 / 150 / 180 cm de ancho",
      "Peso": "22 kg (80cm) / 32 kg (120cm) / 40 kg (150cm) / 43 kg (180cm)",
    },
  },
  {
    name: "Estante de Acero Inoxidable",
    slug: "estante-de-acero-inoxidable",
    category: "Mobiliario de Acero",
    price: 215999,
    stock: 30,
    featured: false,
    active: true,
    description:
      "Estante de acero inoxidable SS201 para cocinas profesionales. Con barral circular inferior. Fácil armado e instalación. Disponible en 3 medidas de ancho: 80, 120 y 150 cm. Profundidad 30 cm.",
    images: [
      "https://static.wixstatic.com/media/5c4b07_982fef79dce14105937dfeddde7adf25~mv2.png",
      "https://static.wixstatic.com/media/5c4b07_753e2c647ba54ef0a835b81236293863~mv2.jpg",
    ],
    specs: {
      "Material": "Acero inoxidable SS201",
      "Profundidad": "30 cm",
      "Medidas disponibles": "80 / 120 / 150 cm de ancho",
      "Peso": "5 kg (80cm) / 7 kg (120cm) / 8 kg (150cm)",
    },
  },

  // ── Estanterías ──────────────────────────────────────────────────────────
  {
    name: "Estantería TB-RACKH3",
    slug: "estanteria-tb-rackh3",
    category: "Estanterías",
    price: 106999,
    stock: 30,
    featured: false,
    active: true,
    description:
      "Estantería doméstica de 3 estantes ajustables en altura. Hasta 40 kg por estante. Estantes de alambre cromado en acero al carbono. Patas nivelables para suelo irregular.",
    images: [
      "https://static.wixstatic.com/media/5c4b07_dbc1388e56024cdfb10f08e4fbf10aa4~mv2.png",
      "https://static.wixstatic.com/media/5c4b07_296bf1c46e5b42ee90c751227535ce29~mv2.png",
    ],
    specs: {
      "Uso": "Doméstico",
      "Estantes": "3 ajustables en altura",
      "Capacidad por estante": "40 kg",
      "Material": "Acero al carbono cromado",
      "Medidas": "60 × 35 × 76 cm (largo × ancho × alto)",
    },
  },
  {
    name: "Estantería TB-RACKH5",
    slug: "estanteria-tb-rackh5",
    category: "Estanterías",
    price: 179999,
    stock: 30,
    featured: false,
    active: true,
    description:
      "Estantería doméstica de 5 estantes ajustables en altura. Hasta 40 kg por estante. Estantes de alambre cromado en acero al carbono. Patas nivelables para suelo irregular.",
    images: [
      "https://static.wixstatic.com/media/5c4b07_dbc1388e56024cdfb10f08e4fbf10aa4~mv2.png",
      "https://static.wixstatic.com/media/5c4b07_296bf1c46e5b42ee90c751227535ce29~mv2.png",
    ],
    specs: {
      "Uso": "Doméstico",
      "Estantes": "5 ajustables en altura",
      "Capacidad por estante": "40 kg",
      "Material": "Acero al carbono cromado",
      "Medidas": "60 × 35 × 150 cm (largo × ancho × alto)",
    },
  },
  {
    name: "Estantería Profesional TB-RACKC4",
    slug: "estanteria-profesional-tb-rackc4",
    category: "Estanterías",
    price: 284999,
    stock: 20,
    featured: false,
    active: true,
    description:
      "Estantería profesional de 4 estantes ajustables en altura con altísima capacidad de carga: hasta 250 kg por estante. Estantes de alambre cromado en acero al carbono. Patas nivelables para suelo irregular. Ideal para depósitos y cocinas industriales.",
    images: [
      "https://static.wixstatic.com/media/5c4b07_dbc1388e56024cdfb10f08e4fbf10aa4~mv2.png",
      "https://static.wixstatic.com/media/5c4b07_296bf1c46e5b42ee90c751227535ce29~mv2.png",
    ],
    specs: {
      "Uso": "Profesional",
      "Estantes": "4 ajustables en altura",
      "Capacidad por estante": "250 kg",
      "Material": "Acero al carbono cromado",
      "Medidas": "90 × 45 × 180 cm (largo × ancho × alto)",
    },
  },
  {
    name: "Estantería Profesional TB-RACKC4 Plus",
    slug: "estanteria-profesional-tb-rackc4-plus",
    category: "Estanterías",
    price: 419999,
    stock: 20,
    featured: false,
    active: true,
    description:
      "Estantería profesional grande de 4 estantes ajustables en altura, con capacidad de hasta 250 kg por estante. Mayor tamaño que la TB-RACKC4. Estantes de alambre cromado en acero al carbono. Patas nivelables para suelo irregular.",
    images: [
      "https://static.wixstatic.com/media/5c4b07_dbc1388e56024cdfb10f08e4fbf10aa4~mv2.png",
      "https://static.wixstatic.com/media/5c4b07_296bf1c46e5b42ee90c751227535ce29~mv2.png",
    ],
    specs: {
      "Uso": "Profesional",
      "Estantes": "4 ajustables en altura",
      "Capacidad por estante": "250 kg",
      "Material": "Acero al carbono cromado",
      "Medidas": "120 × 60 × 180 cm (largo × ancho × alto)",
    },
  },
  {
    name: "Estantería Profesional TB-RACKC5",
    slug: "estanteria-profesional-tb-rackc5",
    category: "Estanterías",
    price: 509999,
    stock: 20,
    featured: false,
    active: true,
    description:
      "Estantería profesional de 5 estantes ajustables en altura, con capacidad de hasta 250 kg por estante. Máxima capacidad de almacenamiento para depósitos y cocinas industriales. Estantes de alambre cromado en acero al carbono. Patas nivelables para suelo irregular.",
    images: [
      "https://static.wixstatic.com/media/5c4b07_dbc1388e56024cdfb10f08e4fbf10aa4~mv2.png",
      "https://static.wixstatic.com/media/5c4b07_296bf1c46e5b42ee90c751227535ce29~mv2.png",
    ],
    specs: {
      "Uso": "Profesional",
      "Estantes": "5 ajustables en altura",
      "Capacidad por estante": "250 kg",
      "Material": "Acero al carbono cromado",
      "Medidas": "120 × 60 × 180 cm (largo × ancho × alto)",
    },
  },
];

async function main() {
  console.log("⏳ Creando categorías...");
  for (const cat of CATEGORIES) {
    const result = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, description: cat.description, order: cat.order, active: cat.active },
      create: cat,
    });
    console.log(`  ✓ Categoría: ${result.name}`);
  }

  console.log("\n⏳ Creando productos...");
  for (const prod of PRODUCTS) {
    const result = await prisma.product.upsert({
      where: { slug: prod.slug },
      update: {
        name: prod.name,
        description: prod.description,
        price: prod.price,
        stock: prod.stock,
        category: prod.category,
        images: prod.images,
        specs: prod.specs,
        active: prod.active,
        featured: prod.featured,
      },
      create: prod,
    });
    console.log(`  ✓ Producto: ${result.name} ($${result.price.toLocaleString("es-AR")})`);
  }

  console.log("\n✅ Listo. Categorías y productos cargados.");
}

main()
  .catch((e) => { console.error("❌ Error:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
