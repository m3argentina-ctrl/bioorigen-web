import Link from "next/link";
import ProductCard from "@/components/products/ProductCard";
import BannerCarousel from "@/components/BannerCarousel";
import TrustBar from "@/components/home/TrustBar";
import CategoryGrid from "@/components/home/CategoryGrid";
import PromoBanner from "@/components/home/PromoBanner";
import RecipesSection from "@/components/home/RecipesSection";
import GuaranteeBanner from "@/components/home/GuaranteeBanner";
import Newsletter from "@/components/home/Newsletter";
import FadeIn from "@/components/home/FadeIn";
import { getFeaturedProducts } from "@/lib/queries";
import { prisma } from "@/lib/db";
import type { Recipe } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [featured, banners, categories, recipeRows] = await Promise.all([
    getFeaturedProducts(),
    prisma.banner.findMany({ where: { active: true }, orderBy: { order: "asc" } }),
    prisma.category.findMany({ where: { active: true }, orderBy: { order: "asc" } }).catch(() => []),
    prisma.recipe
      .findMany({ take: 3, orderBy: [{ featured: "desc" }, { name: "asc" }] })
      .catch(() => []),
  ]);

  const recipes = recipeRows as unknown as Recipe[];

  return (
    <div>
      {/* Hero slider */}
      <BannerCarousel banners={banners} />

      {/* Barra de confianza */}
      <TrustBar />

      {/* Grid de categorías con imagen */}
      <FadeIn>
        <CategoryGrid categories={categories} />
      </FadeIn>

      {/* Productos destacados */}
      <FadeIn delay={80}>
        <section className="mx-auto max-w-6xl px-4 pb-8 pt-4">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-bio-green">
                Más vendidos
              </p>
              <h2 className="text-2xl font-extrabold text-bio-dark">Productos destacados</h2>
            </div>
            <Link
              href="/productos"
              className="rounded-full border border-bio-green px-4 py-2 text-sm font-semibold text-bio-green transition-colors hover:bg-bio-green hover:text-white"
            >
              Ver todos →
            </Link>
          </div>

          {featured.length === 0 ? (
            <p className="mt-6 rounded-2xl bg-white p-8 text-center text-sm text-bio-dark/60 shadow-card">
              No hay productos destacados. Marcá algunos desde el panel de administración.
            </p>
          ) : (
            <>
              {/*
                Mobile: scroll horizontal con swipe
                Desktop: grid 2 → 4 columnas
              */}
              <div className="mt-6 flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 -mx-4 px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mx-0 md:grid md:grid-cols-2 md:gap-6 md:overflow-visible md:snap-none md:pb-0 md:px-0 lg:grid-cols-4">
                {featured.slice(0, 8).map((product) => (
                  <div
                    key={product.id}
                    className="w-[272px] flex-none snap-start md:w-auto"
                  >
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>

              <div className="mt-10 text-center">
                <Link
                  href="/productos"
                  className="inline-block rounded-full bg-bio-green px-10 py-3 text-sm font-bold text-white shadow-card transition-colors hover:bg-bio-green-dark"
                >
                  Ver todos los productos
                </Link>
              </div>
            </>
          )}
        </section>
      </FadeIn>

      {/* Recetas */}
      <FadeIn delay={60}>
        <div className="bg-bio-beige/50">
          <RecipesSection recipes={recipes} />
        </div>
      </FadeIn>

      {/* Banner promocional línea industrial */}
      <FadeIn delay={40}>
        <PromoBanner />
      </FadeIn>

      {/* Garantía */}
      <FadeIn delay={40}>
        <GuaranteeBanner />
      </FadeIn>

      {/* Newsletter */}
      <Newsletter />
    </div>
  );
}
