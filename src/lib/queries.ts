import { prisma } from "@/lib/db";
import type { Product, Recipe } from "@/lib/types";

// La base puede no estar configurada todavía. Hasta entonces las queries
// devuelven arrays vacíos para que las páginas muestren su estado vacío.
async function safe<T>(run: () => Promise<T[]>): Promise<T[]> {
  try {
    return await run();
  } catch (err) {
    console.error("[queries] base de datos no disponible:", err);
    return [];
  }
}

async function getPausedCategoryNames(): Promise<Set<string>> {
  const cfg = await prisma.siteConfig.findUnique({ where: { key: "paused_categories" } });
  const names: string[] = cfg ? JSON.parse(cfg.value) : [];
  return new Set(names);
}

export function getProducts(): Promise<Product[]> {
  return safe(async () => {
    const [rows, pausedCats] = await Promise.all([
      prisma.product.findMany({ orderBy: { name: "asc" } }),
      getPausedCategoryNames(),
    ]);
    // Un producto está disponible si está activo individualmente Y su categoría está activa.
    return rows.map((r) => ({
      ...r,
      active: r.active && !pausedCats.has(r.category),
    })) as unknown as Product[];
  });
}

export function getFeaturedProducts(): Promise<Product[]> {
  return safe(async () => {
    const [rows, pausedCats] = await Promise.all([
      prisma.product.findMany({ where: { active: true, featured: true }, orderBy: { name: "asc" } }),
      getPausedCategoryNames(),
    ]);
    return rows
      .filter((r) => !pausedCats.has(r.category))
      .map((r) => r) as unknown as Product[];
  });
}

export function getRecipes(): Promise<Recipe[]> {
  return safe(async () => {
    const rows = await prisma.recipe.findMany({ orderBy: { name: "asc" } });
    return rows as unknown as Recipe[];
  });
}

export async function getRecipeBySlug(slug: string): Promise<Recipe | null> {
  try {
    const row = await prisma.recipe.findUnique({ where: { slug } });
    return row as Recipe | null;
  } catch {
    return null;
  }
}
