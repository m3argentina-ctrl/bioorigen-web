// Migration script: Supabase REST API → Neon
// Run with: node scripts/migrate-supabase-to-neon.mjs

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const SUPABASE_URL = "https://rqtccnimnqesxtgkceub.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJxdGNjbmltbnFlc3h0Z2tjZXViIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTIwNDA3NywiZXhwIjoyMDk0NzgwMDc3fQ.OcK9gsRRnKd3rNP8x-H-WFZmmsAf1tfQi-M5YBypq3k";

const NEON_URL =
  "postgresql://neondb_owner:npg_bDRnBG0Oe4ms@ep-broad-frost-acphts1x.sa-east-1.aws.neon.tech/neondb?sslmode=require";

const neon = new PrismaClient({ datasources: { db: { url: NEON_URL } } });

async function fetchTable(table) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function tryFetch(table) {
  try {
    const data = await fetchTable(table);
    console.log(`  ✔ ${table}: ${data.length} registros`);
    return data;
  } catch (e) {
    console.log(`  ⚠ ${table}: no encontrada (${e.message})`);
    return [];
  }
}

// Normaliza un producto de Supabase al schema de Neon
function normalizeProduct(p) {
  return {
    id:          p.id,
    name:        p.name,
    slug:        p.slug,
    description: p.description ?? "",
    price:       p.price,
    salePrice:   p.salePrice ?? null,
    stock:       p.stock ?? 0,
    category:    p.category ?? "",
    linea:       p.linea ?? null,
    featured:    p.featured ?? false,
    images:      p.images ?? [],
    specs:       p.specs ?? null,
    dataSheet:   p.dataSheet ?? null,
    videoUrl:    p.videoUrl ?? null,
    weightGrams: p.weightGrams ?? null,
    heightCm:    p.heightCm ?? null,
    widthCm:     p.widthCm ?? null,
    lengthCm:    p.lengthCm ?? null,
    rating:      p.rating ?? null,
    reviewCount: p.reviewCount ?? 0,
    createdAt:   p.createdAt ? new Date(p.createdAt) : new Date(),
    updatedAt:   p.updatedAt ? new Date(p.updatedAt) : new Date(),
  };
}

// Normaliza una receta de Supabase al schema de Neon
function normalizeRecipe(r) {
  return {
    id:          r.id,
    name:        r.name,
    slug:        r.slug,
    emoji:       r.emoji ?? "🌿",
    description: r.description ?? "",
    category:    r.category ?? "",
    difficulty:  r.difficulty ?? "Básico",
    time:        r.time ?? "",
    temperature: r.temperature ?? "",
    ingredients: r.ingredients ?? [],
    equipment:   r.equipment ?? [],
    steps:       r.steps ?? [],
    variations:  r.variations ?? [],
    uses:        r.uses ?? [],
    image:       r.image ?? "",
    images:      r.images ?? [],
    featured:    r.featured ?? false,
    season:      r.season ?? null,
    createdAt:   r.createdAt ? new Date(r.createdAt) : new Date(),
    updatedAt:   r.updatedAt ? new Date(r.updatedAt) : new Date(),
  };
}

// Normaliza una orden de Supabase al schema de Neon
function normalizeOrder(o) {
  return {
    id:                 o.id,
    customerEmail:      o.customerEmail ?? "",
    customerName:       o.customerName ?? "",
    customerPhone:      o.customerPhone ?? "",
    customerAddress:    o.customerAddress ?? "",
    items:              o.items ?? [],
    subtotal:           o.subtotal ?? 0,
    shipping:           o.shipping ?? 0,
    discount:           o.discount ?? 0,
    total:              o.total ?? 0,
    status:             o.status ?? "pending",
    paymentMethod:      o.paymentMethod ?? "mercadopago",
    mercadoPagoId:      o.mercadoPagoId ?? null,
    paymentStatus:      o.paymentStatus ?? null,
    shippingCarrier:    o.shippingCarrier ?? null,
    shippingMethod:     o.shippingMethod ?? null,
    shippingIsFree:     o.shippingIsFree ?? false,
    shippingFreeReason: o.shippingFreeReason ?? null,
    openpayId:          o.openpayId ?? null,
    createdAt:          o.createdAt ? new Date(o.createdAt) : new Date(),
    updatedAt:          o.updatedAt ? new Date(o.updatedAt) : new Date(),
  };
}

function normalizeBanner(b) {
  return {
    id:          b.id,
    title:       b.title ?? "",
    subtitle:    b.subtitle ?? null,
    description: b.description ?? null,
    image:       b.image ?? "",
    buttonText:  b.buttonText ?? null,
    buttonLink:  b.buttonLink ?? null,
    bgColor:     b.bgColor ?? "#4A7C59",
    order:       b.order ?? 0,
    active:      b.active ?? true,
    createdAt:   b.createdAt ? new Date(b.createdAt) : new Date(),
    updatedAt:   b.updatedAt ? new Date(b.updatedAt) : new Date(),
  };
}

function normalizeCategory(c) {
  return {
    id:          c.id,
    name:        c.name,
    slug:        c.slug,
    description: c.description ?? null,
    image:       c.image ?? null,
    order:       c.order ?? 0,
    active:      c.active ?? true,
    createdAt:   c.createdAt ? new Date(c.createdAt) : new Date(),
    updatedAt:   c.updatedAt ? new Date(c.updatedAt) : new Date(),
  };
}

async function main() {
  console.log("\n🔍 Leyendo datos de Supabase...");

  const [products, recipes, orders, banners, categories] = await Promise.all([
    tryFetch("Product"),
    tryFetch("Recipe"),
    tryFetch("Order"),
    tryFetch("Banner"),
    tryFetch("Category"),
  ]);

  const total = products.length + recipes.length + orders.length + banners.length + categories.length;

  if (total === 0) {
    console.log("\n⚠ No se encontraron datos en Supabase. Nada que migrar.\n");
    return;
  }

  console.log(`\n📦 Total a migrar: ${total} registros`);
  console.log("\n🗑  Limpiando tablas en Neon...");

  await neon.order.deleteMany();
  await neon.product.deleteMany();
  await neon.recipe.deleteMany();
  await neon.banner.deleteMany();
  await neon.category.deleteMany();
  await neon.admin.deleteMany();
  console.log("  ✔ Listo\n");

  console.log("⬆  Insertando en Neon...");

  if (categories.length) {
    await neon.category.createMany({ data: categories.map(normalizeCategory) });
    console.log(`  ✔ Category: ${categories.length}`);
  }
  if (products.length) {
    await neon.product.createMany({ data: products.map(normalizeProduct) });
    console.log(`  ✔ Product: ${products.length}`);
  }
  if (recipes.length) {
    await neon.recipe.createMany({ data: recipes.map(normalizeRecipe) });
    console.log(`  ✔ Recipe: ${recipes.length}`);
  }
  if (orders.length) {
    await neon.order.createMany({ data: orders.map(normalizeOrder) });
    console.log(`  ✔ Order: ${orders.length}`);
  }
  if (banners.length) {
    await neon.banner.createMany({ data: banners.map(normalizeBanner) });
    console.log(`  ✔ Banner: ${banners.length}`);
  }

  // Recrear admin con contraseña conocida
  const hash = await bcrypt.hash("Admin123!", 12);
  await neon.admin.create({
    data: {
      email: "admin@bioorigen.com.ar",
      password: hash,
      name: "Administrador",
      role: "admin",
    },
  });
  console.log("  ✔ Admin: recreado con Admin123!");

  console.log("\n✅ Migración completada.\n");
}

main()
  .catch((e) => { console.error("\n❌ Error:", e.message); process.exit(1); })
  .finally(() => neon.$disconnect());
