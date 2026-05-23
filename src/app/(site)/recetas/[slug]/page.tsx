import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Clock, Thermometer, ChevronLeft } from "lucide-react";
import { getRecipeBySlug } from "@/lib/queries";

export const dynamic = "force-dynamic";

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props) {
  const recipe = await getRecipeBySlug(params.slug);
  if (!recipe) return {};
  return {
    title: `${recipe.name} — Bio Origen`,
    description: recipe.description,
  };
}

const CATEGORY_COLOR: Record<string, string> = {
  Básico: "bg-green-100 text-green-700",
  Intermedio: "bg-yellow-100 text-yellow-700",
  Avanzado: "bg-red-100 text-red-700",
};

export default async function RecetaDetailPage({ params }: Props) {
  const recipe = await getRecipeBySlug(params.slug);
  if (!recipe) notFound();

  const color = CATEGORY_COLOR[recipe.category] ?? "bg-bio-beige text-bio-dark";

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <Link
        href="/recetas"
        className="mb-6 inline-flex items-center gap-1 text-sm text-bio-dark/60 hover:text-bio-green"
      >
        <ChevronLeft size={16} /> Volver a recetas
      </Link>

      {recipe.image ? (
        <div className="relative mb-8 h-72 w-full overflow-hidden rounded-2xl">
          <Image
            src={recipe.image}
            alt={recipe.name}
            fill
            className="object-cover"
          />
        </div>
      ) : (
        <div className="mb-8 flex h-40 items-center justify-center rounded-2xl bg-bio-beige text-8xl">
          {recipe.emoji}
        </div>
      )}

      <div className="mb-8">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${color}`}>
            {recipe.category}
          </span>
          <span className="rounded-full bg-bio-beige px-3 py-1 text-xs font-medium text-bio-dark">
            {recipe.difficulty}
          </span>
          {recipe.season && (
            <span className="rounded-full bg-bio-green/10 px-3 py-1 text-xs font-medium text-bio-green">
              {recipe.season}
            </span>
          )}
        </div>
        <h1 className="text-3xl font-extrabold text-bio-dark">
          {recipe.emoji} {recipe.name}
        </h1>
        <p className="mt-2 text-base text-bio-dark/70">{recipe.description}</p>
        <div className="mt-4 flex gap-6 text-sm text-bio-dark/60">
          <span className="flex items-center gap-1.5">
            <Clock size={15} className="text-bio-green" />
            {recipe.time}
          </span>
          <span className="flex items-center gap-1.5">
            <Thermometer size={15} className="text-bio-green" />
            {recipe.temperature}
          </span>
        </div>
      </div>

      <div className="space-y-6">
        <section className="rounded-2xl bg-white p-6 shadow-card">
          <h2 className="mb-4 text-lg font-bold text-bio-dark">Ingredientes</h2>
          <ul className="space-y-2">
            {recipe.ingredients.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-bio-dark/80">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-bio-green/15 text-xs font-bold text-bio-green">
                  {i + 1}
                </span>
                {item}
              </li>
            ))}
          </ul>
        </section>

        {recipe.equipment.length > 0 && (
          <section className="rounded-2xl bg-white p-6 shadow-card">
            <h2 className="mb-4 text-lg font-bold text-bio-dark">
              Equipamiento necesario
            </h2>
            <ul className="space-y-1.5">
              {recipe.equipment.map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-bio-dark/80">
                  <span className="h-1.5 w-1.5 rounded-full bg-bio-green" />
                  {item}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="rounded-2xl bg-white p-6 shadow-card">
          <h2 className="mb-4 text-lg font-bold text-bio-dark">Preparación</h2>
          <ol className="space-y-4">
            {recipe.steps.map((step, i) => (
              <li key={i} className="flex gap-4">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-bio-green text-xs font-bold text-white">
                  {i + 1}
                </span>
                <p className="pt-0.5 text-sm text-bio-dark/80">{step}</p>
              </li>
            ))}
          </ol>
        </section>

        {recipe.variations.length > 0 && (
          <section className="rounded-2xl bg-white p-6 shadow-card">
            <h2 className="mb-4 text-lg font-bold text-bio-dark">Variaciones</h2>
            <ul className="space-y-2">
              {recipe.variations.map((v, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-bio-dark/80">
                  <span className="mt-0.5 text-bio-orange">✦</span>
                  {v}
                </li>
              ))}
            </ul>
          </section>
        )}

        {recipe.uses.length > 0 && (
          <section className="rounded-2xl bg-white p-6 shadow-card">
            <h2 className="mb-4 text-lg font-bold text-bio-dark">
              ¿Para qué usarlos?
            </h2>
            <ul className="flex flex-wrap gap-2">
              {recipe.uses.map((u, i) => (
                <li
                  key={i}
                  className="rounded-full bg-bio-beige px-3 py-1 text-sm text-bio-dark/80"
                >
                  {u}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
