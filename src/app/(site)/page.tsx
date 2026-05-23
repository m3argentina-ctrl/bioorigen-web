import Link from "next/link";
import ProductCard from "@/components/products/ProductCard";
import BannerCarousel from "@/components/BannerCarousel";
import { DynamicIcon } from "@/lib/icons";
import { getFeaturedProducts } from "@/lib/queries";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [featured, banners, valueProps] = await Promise.all([
    getFeaturedProducts(),
    prisma.banner.findMany({ where: { active: true }, orderBy: { order: "asc" } }),
    prisma.valueProp.findMany({ where: { active: true }, orderBy: { order: "asc" } }),
  ]);

  return (
    <div>
      <BannerCarousel banners={banners} />

      {valueProps.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-12">
          <div className="grid gap-6 sm:grid-cols-3">
            {valueProps.map(({ id, icon, title, text }) => (
              <div
                key={id}
                className="rounded-2xl bg-white p-6 text-center shadow-card"
              >
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-bio-beige text-bio-green">
                  <DynamicIcon name={icon} size={24} />
                </span>
                <h3 className="mt-3 font-bold text-bio-dark">{title}</h3>
                <p className="mt-1 text-sm text-bio-dark/70">{text}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-extrabold text-bio-dark">
            Productos destacados
          </h2>
          <Link
            href="/productos"
            className="text-sm font-semibold text-bio-green hover:text-bio-green-dark"
          >
            Ver todos →
          </Link>
        </div>

        {featured.length === 0 ? (
          <p className="mt-6 rounded-2xl bg-white p-8 text-center text-sm text-bio-dark/60 shadow-card">
            No hay productos para mostrar. Configurá la base de datos y ejecutá
            el seed.
          </p>
        ) : (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
