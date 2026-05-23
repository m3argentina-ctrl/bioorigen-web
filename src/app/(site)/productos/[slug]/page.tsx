import { notFound } from "next/navigation";
import Link from "next/link";
import { Star, ChevronRight, FileDown } from "lucide-react";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/types";
import AddToCart from "./AddToCart";
import ProductGallery from "./ProductGallery";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const product = await prisma.product.findUnique({ where: { slug: params.slug } });
  if (!product) return {};
  return {
    title: `${product.name} — Bio Origen`,
    description: product.description.slice(0, 155),
  };
}

const CATEGORY_EMOJI: Record<string, string> = {
  Charqui: "🥩", Snacks: "🥨", Frutas: "🍎", Verduras: "🥕", Deshidratadores: "🌀",
};

export default async function ProductoPage({ params }: { params: { slug: string } }) {
  const raw = await prisma.product.findUnique({ where: { slug: params.slug } });
  if (!raw) notFound();

  const product = raw as unknown as Product;
  const specs = product.specs ? Object.entries(product.specs) : [];
  const rounded = product.rating != null ? Math.round(product.rating) : 0;
  const onSale = product.salePrice != null && product.salePrice < product.price;
  const discount = onSale ? Math.round((1 - product.salePrice! / product.price) * 100) : 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-1.5 text-sm text-bio-dark/50">
        <Link href="/" className="hover:text-bio-green">Inicio</Link>
        <ChevronRight size={14} />
        <Link href="/productos" className="hover:text-bio-green">Productos</Link>
        <ChevronRight size={14} />
        <span className="text-bio-dark">{product.name}</span>
      </nav>

      <div className="grid gap-10 md:grid-cols-2">
        {/* Galería */}
        <ProductGallery
          images={product.images}
          name={product.name}
          videoUrl={product.videoUrl}
          fallbackEmoji={CATEGORY_EMOJI[product.category] ?? "🌿"}
          badge={
            onSale ? (
              <span className="absolute left-4 top-4 rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white">
                -{discount}% OFF
              </span>
            ) : product.featured ? (
              <span className="absolute left-4 top-4 rounded-full bg-bio-orange px-3 py-1 text-xs font-bold text-white">
                Destacado
              </span>
            ) : undefined
          }
        />

        {/* Info */}
        <div className="flex flex-col gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-bio-green">
              {product.category}
            </span>
            <h1 className="mt-1 text-3xl font-extrabold text-bio-dark">{product.name}</h1>
          </div>

          {product.rating != null && (
            <div className="flex items-center gap-2">
              <div className="flex">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star key={i} size={18}
                    className={i < rounded ? "text-bio-orange" : "text-bio-dark/20"}
                    fill={i < rounded ? "currentColor" : "none"}
                  />
                ))}
              </div>
              <span className="text-sm text-bio-dark/60">
                {product.rating.toFixed(1)} ({product.reviewCount} reseñas)
              </span>
            </div>
          )}

          <div className="flex items-baseline gap-3">
            {onSale ? (
              <>
                <span className="text-3xl font-extrabold text-red-500">{formatPrice(product.salePrice!)}</span>
                <span className="text-lg text-bio-dark/40 line-through">{formatPrice(product.price)}</span>
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-sm font-bold text-red-600">-{discount}% OFF</span>
              </>
            ) : (
              <span className="text-3xl font-extrabold text-bio-green">{formatPrice(product.price)}</span>
            )}
          </div>

          <p className="text-bio-dark/80 leading-relaxed">{product.description}</p>

          {specs.length > 0 && (
            <div className="rounded-xl border border-bio-beige bg-bio-beige/50 p-4">
              <h2 className="mb-2 text-sm font-bold text-bio-dark">Especificaciones</h2>
              <dl className="space-y-1.5">
                {specs.map(([k, v]) => (
                  <div key={k} className="flex gap-2 text-sm">
                    <dt className="w-32 shrink-0 font-medium text-bio-dark/70">{k}</dt>
                    <dd className="text-bio-dark">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm">
            <span className={`h-2.5 w-2.5 rounded-full ${product.stock > 0 ? "bg-green-500" : "bg-amber-400"}`} />
            <span className={`font-semibold uppercase tracking-wide ${product.stock > 0 ? "text-green-700" : "text-amber-600"}`}>
              {product.stock > 0 ? `${product.stock} en stock` : "Se fabrica a pedido"}
            </span>
          </div>

          <AddToCart product={product} />

          {product.dataSheet && (
            <a
              href={product.dataSheet}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-full border-2 border-bio-green px-6 py-3 text-sm font-semibold text-bio-green transition-colors hover:bg-bio-green hover:text-white"
            >
              <FileDown size={18} />
              Ver / Descargar ficha técnica (PDF)
            </a>
          )}

          <Link
            href="/productos"
            className="text-center text-sm text-bio-dark/50 hover:text-bio-green"
          >
            ← Volver a productos
          </Link>
        </div>
      </div>
    </div>
  );
}
