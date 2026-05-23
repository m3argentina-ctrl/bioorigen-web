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

export function getProducts(): Promise<Product[]> {
  return safe(async () => {
    const rows = await prisma.product.findMany({ orderBy: { name: "asc" } });
    // El campo `specs` (Json) llega sin tipar desde la DB; lo afirmamos acá.
    return rows as unknown as Product[];
  });
}

export function getFeaturedProducts(): Promise<Product[]> {
  return safe(async () => {
    const rows = await prisma.product.findMany({
      where: { featured: true },
      orderBy: { name: "asc" },
    });
    return rows as unknown as Product[];
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
