import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";

const BASE = "https://bioorigen.com.ar";

// Se genera al pedirlo, no durante el build: si la base no responde (p. ej.
// Neon suspendida) el deploy no falla, y el sitemap sale con las páginas fijas.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, recipes] = await Promise.all([
    prisma.product.findMany({ where: { active: true }, select: { slug: true, updatedAt: true } }),
    prisma.recipe.findMany({ select: { slug: true, updatedAt: true } }),
  ]).catch((e) => {
    console.error("[sitemap] base no disponible:", (e as Error).message);
    return [[], []] as const;
  });

  const statics: MetadataRoute.Sitemap = [
    { url: BASE,               lastModified: new Date(), changeFrequency: "daily",   priority: 1.0 },
    { url: `${BASE}/productos`, lastModified: new Date(), changeFrequency: "daily",   priority: 0.9 },
    { url: `${BASE}/recetas`,   lastModified: new Date(), changeFrequency: "weekly",  priority: 0.7 },
    { url: `${BASE}/nosotros`,  lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/contacto`,  lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
  ];

  const productUrls: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${BASE}/productos/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const recipeUrls: MetadataRoute.Sitemap = recipes.map((r) => ({
    url: `${BASE}/recetas/${r.slug}`,
    lastModified: r.updatedAt,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...statics, ...productUrls, ...recipeUrls];
}
