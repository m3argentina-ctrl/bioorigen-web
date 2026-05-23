"use client";

import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import { useCart } from "@/components/CartProvider";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/types";

const CATEGORY_EMOJI: Record<string, string> = {
  Charqui: "🥩",
  Snacks: "🥨",
  Frutas: "🍎",
  Verduras: "🥕",
  Deshidratadores: "🌀",
};

function StarRating({
  rating,
  reviewCount,
}: {
  rating: number;
  reviewCount: number;
}) {
  const rounded = Math.round(rating);
  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            size={15}
            className={i < rounded ? "text-bio-orange" : "text-bio-dark/20"}
            fill={i < rounded ? "currentColor" : "none"}
          />
        ))}
      </div>
      <span className="text-xs text-bio-dark/60">
        {rating.toFixed(1)} ({reviewCount})
      </span>
    </div>
  );
}

export default function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const outOfStock = product.stock <= 0;
  const image = product.images[0];
  const onSale = product.salePrice != null && product.salePrice < product.price;
  const discount = onSale ? Math.round((1 - product.salePrice! / product.price) * 100) : 0;

  const href = `/productos/${product.slug}`;

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-card transition-all duration-200 hover:-translate-y-1 hover:shadow-card-hover">
      <Link href={href} className="relative block aspect-square bg-bio-beige">
        {image ? (
          <Image
            src={image}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, 320px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-6xl">
            {CATEGORY_EMOJI[product.category] ?? "🌿"}
          </div>
        )}
        {onSale && (
          <span className="absolute left-3 top-3 rounded-full bg-red-500 px-2 py-1 text-xs font-bold text-white">
            -{discount}%
          </span>
        )}
        {!onSale && product.featured && (
          <span className="absolute left-3 top-3 rounded-full bg-bio-orange px-2 py-1 text-xs font-bold text-white">
            Destacado
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <span className="text-xs font-medium uppercase tracking-wide text-bio-green">
          {product.category}
        </span>
        <Link href={href}>
          <h3 className="mt-1 text-base font-bold text-bio-dark group-hover:text-bio-green">
            {product.name}
          </h3>
        </Link>

        {product.rating != null && (
          <div className="mt-1">
            <StarRating
              rating={product.rating}
              reviewCount={product.reviewCount}
            />
          </div>
        )}

        <p className="mt-2 line-clamp-2 text-sm text-bio-dark/70">
          {product.description}
        </p>

        <div className="mt-4 flex items-center justify-between">
          <div>
            {onSale ? (
              <>
                <span className="text-lg font-bold text-red-500">
                  {formatPrice(product.salePrice!)}
                </span>
                <span className="ml-2 text-sm text-bio-dark/40 line-through">
                  {formatPrice(product.price)}
                </span>
              </>
            ) : (
              <span className="text-lg font-bold text-bio-green">
                {formatPrice(product.price)}
              </span>
            )}
          </div>
          {!outOfStock && (
            <button
              type="button"
              onClick={() => addItem(product)}
              className="rounded-full bg-bio-orange px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-bio-orange-dark"
            >
              Agregar al carrito
            </button>
          )}
        </div>
        {outOfStock && (
          <Link
            href={href}
            className="mt-3 block w-full rounded-full border border-bio-orange py-2 text-center text-sm font-semibold text-bio-orange transition-colors hover:bg-bio-orange hover:text-white"
          >
            A PEDIDO
          </Link>
        )}
      </div>
    </article>
  );
}
