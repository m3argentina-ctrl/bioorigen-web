"use client";

import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import ProductCard from "@/components/products/ProductCard";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/types";

// Sub-líneas de la categoría Deshidratadores.
const LINEAS = ["todas", "Familiar", "Comercial"];

type DbCategory = { id: string; name: string; slug: string };

export default function ProductsBrowser({
  products,
  initialCategory = "todos",
  dbCategories,
}: {
  products: Product[];
  initialCategory?: string;
  dbCategories?: DbCategory[];
}) {
  const categories = useMemo(() => {
    if (dbCategories && dbCategories.length > 0) {
      return dbCategories.map((c) => c.name);
    }
    // Fallback: derivar de productos con Deshidratadores primero.
    const set = new Set(products.map((p) => p.category));
    set.add("Deshidratadores");
    const rest = Array.from(set).filter((c) => c !== "Deshidratadores").sort();
    return ["Deshidratadores", ...rest];
  }, [products, dbCategories]);

  const [minLimit, maxLimit] = useMemo(() => {
    if (products.length === 0) return [0, 0];
    const prices = products.map((p) => p.price);
    return [Math.min(...prices), Math.max(...prices)];
  }, [products]);

  const [search, setSearch] = useState("");
  // Categoría inicial desde el query param (?categoria=), validada contra las
  // categorías reales; si no existe, cae en "todos".
  const [category, setCategory] = useState(() =>
    categories.includes(initialCategory) ? initialCategory : "todos",
  );
  const [linea, setLinea] = useState("todas");
  const [priceMin, setPriceMin] = useState(minLimit);
  const [priceMax, setPriceMax] = useState(maxLimit);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Al cambiar de categoría, la sub-línea solo aplica a Deshidratadores.
  function selectCategory(cat: string) {
    setCategory(cat);
    if (cat !== "Deshidratadores") setLinea("todas");
  }

  const filtered = useMemo(
    () =>
      products.filter((p) => {
        if (category !== "todos" && p.category !== category) return false;
        if (
          category === "Deshidratadores" &&
          linea !== "todas" &&
          p.linea !== linea
        )
          return false;
        const q = search.trim().toLowerCase();
        if (q && !p.name.toLowerCase().includes(q)) return false;
        if (p.price < priceMin || p.price > priceMax) return false;
        return true;
      }),
    [products, category, linea, search, priceMin, priceMax],
  );

  const filtersActive =
    search.trim() !== "" ||
    category !== "todos" ||
    linea !== "todas" ||
    priceMin !== minLimit ||
    priceMax !== maxLimit;

  function clearFilters() {
    setSearch("");
    setCategory("todos");
    setLinea("todas");
    setPriceMin(minLimit);
    setPriceMax(maxLimit);
  }

  function renderFilterPanel() {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-bold text-bio-dark">Categoría</h3>
          <div className="mt-2 flex flex-col">
            {["todos", ...categories].map((cat) => (
              <div key={cat}>
                <button
                  type="button"
                  onClick={() => selectCategory(cat)}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm font-medium capitalize transition-colors ${
                    category === cat
                      ? "bg-bio-green text-white"
                      : "text-bio-dark hover:bg-white"
                  }`}
                >
                  {cat}
                </button>

                {cat === "Deshidratadores" &&
                  category === "Deshidratadores" && (
                    <div className="ml-3 mt-1 flex flex-col border-l-2 border-bio-green/20 pl-2">
                      {LINEAS.map((l) => (
                        <button
                          key={l}
                          type="button"
                          onClick={() => setLinea(l)}
                          className={`rounded-lg px-3 py-1.5 text-left text-xs font-medium transition-colors ${
                            linea === l
                              ? "bg-bio-green/15 text-bio-green"
                              : "text-bio-dark/80 hover:bg-white"
                          }`}
                        >
                          {l === "todas" ? "Todas las líneas" : `Línea ${l}`}
                        </button>
                      ))}
                    </div>
                  )}
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold text-bio-dark">Precio</h3>
          <p className="mt-1 text-xs font-medium text-bio-dark/70">
            {formatPrice(priceMin)} — {formatPrice(priceMax)}
          </p>
          <div className="mt-2 space-y-3">
            <label className="block">
              <span className="text-xs text-bio-dark/60">Mínimo</span>
              <input
                type="range"
                min={minLimit}
                max={maxLimit}
                step={100}
                value={priceMin}
                onChange={(e) =>
                  setPriceMin(Math.min(Number(e.target.value), priceMax))
                }
                className="w-full accent-bio-green"
                aria-label="Precio mínimo"
              />
            </label>
            <label className="block">
              <span className="text-xs text-bio-dark/60">Máximo</span>
              <input
                type="range"
                min={minLimit}
                max={maxLimit}
                step={100}
                value={priceMax}
                onChange={(e) =>
                  setPriceMax(Math.max(Number(e.target.value), priceMin))
                }
                className="w-full accent-bio-green"
                aria-label="Precio máximo"
              />
            </label>
          </div>
        </div>

        {filtersActive && (
          <button
            type="button"
            onClick={clearFilters}
            className="flex items-center gap-1 text-xs font-semibold text-bio-orange hover:underline"
          >
            <X size={14} /> Limpiar filtros
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="mt-8 flex gap-8">
      <aside className="hidden w-60 shrink-0 lg:block">
        <div className="rounded-2xl bg-bio-beige p-5">
          {renderFilterPanel()}
        </div>
      </aside>

      <div className="flex-1">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-bio-dark/40"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar productos..."
              aria-label="Buscar productos por nombre"
              className="w-full rounded-full border border-bio-green/20 bg-white py-2.5 pl-10 pr-4 text-sm text-bio-dark outline-none focus:border-bio-green"
            />
          </div>
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="flex items-center gap-2 rounded-full bg-bio-green px-4 py-2.5 text-sm font-semibold text-white lg:hidden"
          >
            <SlidersHorizontal size={16} /> Filtros
          </button>
        </div>

        <p className="mt-4 text-sm text-bio-dark/60">
          Mostrando {filtered.length} de {products.length} productos
        </p>

        {filtered.length === 0 ? (
          <p className="mt-6 rounded-2xl bg-white p-8 text-center text-sm text-bio-dark/60 shadow-card">
            No hay productos que coincidan con los filtros.
          </p>
        ) : (
          <div className="mt-4 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>

      <div
        onClick={() => setDrawerOpen(false)}
        aria-hidden
        className={`fixed inset-0 z-40 bg-bio-dark/50 transition-opacity lg:hidden ${
          drawerOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        role="dialog"
        aria-label="Filtros de productos"
        className={`fixed left-0 top-0 z-50 flex h-full w-72 flex-col bg-bio-beige p-5 shadow-2xl transition-transform duration-300 lg:hidden ${
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-bio-dark">Filtros</h2>
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            aria-label="Cerrar filtros"
            className="text-bio-dark hover:text-bio-green"
          >
            <X size={20} />
          </button>
        </div>
        <div className="mt-5 overflow-y-auto">{renderFilterPanel()}</div>
      </aside>
    </div>
  );
}
