"use client";

import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import RecipeCard from "@/components/recipes/RecipeCard";
import type { Recipe } from "@/lib/types";

const CATEGORIES = ["Todos", "Básico", "Intermedio", "Avanzado"];

export default function RecetasContent({ recipes }: { recipes: Recipe[] }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Todos");

  const filtered = useMemo(() => {
    return recipes.filter((r) => {
      const matchCat = category === "Todos" || r.category === category;
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        r.name.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [recipes, search, category]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-extrabold text-bio-dark">Recetas</h1>
      <p className="mt-2 text-bio-dark/70">
        Ideas para aprovechar nuestros alimentos deshidratados.
      </p>

      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                category === c
                  ? "bg-bio-green text-white"
                  : "bg-white text-bio-dark/70 shadow-sm hover:text-bio-dark"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-bio-dark/40"
          />
          <input
            type="text"
            placeholder="Buscar receta..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-full border border-bio-beige bg-white py-2 pl-9 pr-4 text-sm text-bio-dark placeholder-bio-dark/40 outline-none focus:border-bio-green sm:w-64"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="mt-12 text-center text-sm text-bio-dark/60">
          No hay recetas que coincidan.
        </p>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}
    </div>
  );
}
