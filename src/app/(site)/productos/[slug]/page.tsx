import { notFound } from "next/navigation";
import Link from "next/link";
import { Star, ChevronRight, FileDown } from "lucide-react";
import { prisma } from "@/lib/db";
import { isQuotePrice } from "@/lib/format";
import { parseVariants } from "@/lib/variants";
import type { Product, ShippingMode } from "@/lib/types";
import AddToCart from "./AddToCart";
import ProductGallery from "./ProductGallery";
import { ProductPrice, VariantProvider } from "@/components/products/VariantContext";

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
  const raw = await prisma.product.findUnique({
    where: { slug: params.slug },
    include: { supplier: { select: { shippingMode: true } } },
  });
  if (!raw) notFound();
  const shippingMode = (raw.supplier?.shippingMode ?? "COORDINAR") as ShippingMode;

  // Si la categoría está pausada (SiteConfig), el producto también se considera inactivo.
  const categoryPaused = raw.active
    ? await prisma.siteConfig
        .findUnique({ where: { key: "paused_categories" } })
        .then((cfg) => {
          const names: string[] = cfg ? JSON.parse(cfg.value) : [];
          return names.includes(raw.category);
        })
    : false;

  const product = { ...raw, active: raw.active && !categoryPaused } as unknown as Product;
  const specs = product.specs ? Object.entries(product.specs) : [];
  const rounded = product.rating != null ? Math.round(product.rating) : 0;
  const quote = isQuotePrice(product);
  const variants = parseVariants(product);
  // El cartel de oferta de la galería es fijo, así que con variantes muestra el
  // mayor descuento disponible entre las medidas.
  const discounts = quote
    ? []
    : variants.length > 0
      ? variants
          .filter((v) => v.salePrice != null)
          .map((v) => Math.round((1 - v.salePrice! / v.price) * 100))
      : product.salePrice != null && product.salePrice < product.price
        ? [Math.round((1 - product.salePrice / product.price) * 100)]
        : [];
  const onSale = discounts.length > 0;
  const discount = onSale ? Math.max(...discounts) : 0;

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

        {/* Info — dentro del provider para que el precio siga a la medida elegida */}
        <VariantProvider product={product}>
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

          {/* El precio lo pinta un componente cliente porque cambia con la medida. */}
          <div className="flex items-baseline gap-3">
            <ProductPrice product={product} />
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
            <span className={`h-2.5 w-2.5 rounded-full ${!product.active ? "bg-red-400" : product.stock > 0 ? "bg-green-500" : "bg-amber-400"}`} />
            <span className={`font-semibold uppercase tracking-wide ${!product.active ? "text-red-500" : product.stock > 0 ? "text-green-700" : "text-amber-600"}`}>
              {!product.active ? "Sin stock" : product.stock > 0 ? `${product.stock} en stock` : product.supplierId ? "Disponible bajo pedido" : "Se fabrica a pedido"}
            </span>
          </div>

          {quote ? (
            <div className="space-y-3">
              <div className="rounded-xl border border-bio-green/20 bg-bio-beige/60 px-5 py-4">
                <p className="text-sm font-semibold text-bio-dark">Precio a convenir</p>
                <p className="mt-1 text-xs text-bio-dark/60">
                  El costo depende de cada equipo. Escribinos y te pasamos el presupuesto.
                </p>
              </div>
              <a
                href={`https://wa.me/5491169819981?text=${encodeURIComponent(
                  `Hola! Quiero consultar por: ${product.name}`,
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-full bg-bio-orange px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-bio-orange-dark"
              >
                Consultar por WhatsApp
              </a>
              <a
                href="/contacto"
                className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-bio-green px-6 py-3 text-sm font-semibold text-bio-green transition-colors hover:bg-bio-green hover:text-white"
              >
                Enviar consulta por mail
              </a>
            </div>
          ) : product.active ? (
            <AddToCart product={product} shippingMode={shippingMode} />
          ) : (
            <div className="space-y-3">
              <div className="rounded-xl border border-red-100 bg-red-50 px-5 py-4 text-center">
                <p className="text-sm font-semibold text-red-600">Producto sin stock en este momento</p>
                <p className="mt-1 text-xs text-red-400">Podés consultarnos y te avisamos cuando esté disponible</p>
              </div>
              <a
                href="/contacto"
                className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-bio-green px-6 py-3 text-sm font-semibold text-bio-green transition-colors hover:bg-bio-green hover:text-white"
              >
                Consultar disponibilidad
              </a>
            </div>
          )}

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
        </VariantProvider>
      </div>
    </div>
  );
}
