import Link from "next/link";
import Image from "next/image";
import { Clock, Thermometer } from "lucide-react";
import type { Recipe } from "@/lib/types";

const CATEGORY_COLOR: Record<string, string> = {
  Básico:      "bg-green-100 text-green-700",
  Intermedio:  "bg-yellow-100 text-yellow-700",
  Avanzado:    "bg-red-100 text-red-700",
};

export default function RecipeCard({ recipe }: { recipe: Recipe }) {
  const color = CATEGORY_COLOR[recipe.category] ?? "bg-bio-beige text-bio-dark";

  return (
    <Link
      href={`/recetas/${recipe.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-card transition-transform hover:-translate-y-1 hover:shadow-lg"
    >
      {/* Imagen o placeholder */}
      <div className="relative h-48 w-full shrink-0 overflow-hidden bg-bio-beige">
        {recipe.image ? (
          <Image
            src={recipe.image}
            alt={recipe.name}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-6xl">
            {recipe.emoji}
          </div>
        )}
        <span className={`absolute left-3 top-3 rounded-full px-2.5 py-0.5 text-xs font-semibold ${color}`}>
          {recipe.category}
        </span>
      </div>

      {/* Contenido */}
      <div className="flex flex-1 flex-col gap-2 p-5">
        <h2 className="text-base font-bold text-bio-dark leading-tight">
          {recipe.emoji} {recipe.name}
        </h2>
        <p className="line-clamp-2 text-sm text-bio-dark/65">{recipe.description}</p>

        <div className="mt-auto flex items-center gap-4 pt-3 text-xs text-bio-dark/55 border-t border-bio-beige">
          <span className="flex items-center gap-1">
            <Clock size={13} className="text-bio-green" />
            {recipe.time}
          </span>
          <span className="flex items-center gap-1">
            <Thermometer size={13} className="text-bio-green" />
            {recipe.temperature}
          </span>
          <span className="ml-auto rounded-full bg-bio-beige px-2 py-0.5 font-medium text-bio-dark">
            {recipe.difficulty}
          </span>
        </div>
      </div>
    </Link>
  );
}
