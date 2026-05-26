import Link from "next/link";
import Image from "next/image";
import type { Recipe } from "@/lib/types";

const DIFF_STYLE: Record<string, string> = {
  Fácil: "bg-green-100 text-green-700",
  Media: "bg-orange-100 text-orange-700",
  Difícil: "bg-red-100 text-red-700",
};

function RecipeCard({ recipe }: { recipe: Recipe }) {
  const img = recipe.image || recipe.images?.[0] || "";
  const diffClass = DIFF_STYLE[recipe.difficulty] ?? "bg-gray-100 text-gray-600";

  return (
    <Link
      href={`/recetas/${recipe.slug}`}
      className="group overflow-hidden rounded-2xl bg-white shadow-card transition-all duration-200 hover:-translate-y-1 hover:shadow-card-hover"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-bio-beige">
        {img ? (
          <Image
            src={img}
            alt={recipe.name}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-6xl">
            {recipe.emoji}
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${diffClass}`}>
            {recipe.difficulty}
          </span>
          {recipe.time && (
            <span className="text-xs text-bio-dark/60">⏱ {recipe.time}</span>
          )}
        </div>
        <h3 className="mt-2 font-bold leading-snug text-bio-dark transition-colors group-hover:text-bio-green">
          {recipe.name}
        </h3>
        <p className="mt-1 line-clamp-2 text-sm text-bio-dark/60">{recipe.description}</p>
      </div>
    </Link>
  );
}

export default function RecipesSection({ recipes }: { recipes: Recipe[] }) {
  if (recipes.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-bio-orange">
            Inspiración
          </p>
          <h2 className="text-2xl font-extrabold text-bio-dark">
            Recetas para tu deshidratador
          </h2>
        </div>
        <Link
          href="/recetas"
          className="rounded-full border border-bio-orange px-4 py-2 text-sm font-semibold text-bio-orange transition-colors hover:bg-bio-orange hover:text-white"
        >
          Ver todas →
        </Link>
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {recipes.slice(0, 3).map((recipe) => (
          <RecipeCard key={recipe.id} recipe={recipe} />
        ))}
      </div>

      <div className="mt-8 text-center">
        <Link
          href="/recetas"
          className="inline-block rounded-full bg-bio-orange px-10 py-3 text-sm font-bold text-white shadow-card transition-colors hover:bg-bio-orange-dark"
        >
          Ver todas las recetas
        </Link>
      </div>
    </section>
  );
}
