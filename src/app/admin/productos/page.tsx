"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, Star } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { formatPrice } from "@/lib/format";

type Product = {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  linea: string | null;
  featured: boolean;
  images: string[];
};

export default function ProductosAdminPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then((data: { name: string }[]) => setCategories(data.map((c) => c.name)));
  }, []);

  async function load() {
    const params = new URLSearchParams();
    if (category !== "all") params.set("category", category);
    if (search) params.set("search", search);
    const res = await fetch(`/api/admin/products?${params}`);
    setProducts(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, [category, search]); // eslint-disable-line

  async function deleteProduct(id: string) {
    if (!confirm("¿Eliminar este producto?")) return;
    await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    setProducts((prev) => prev.filter((p) => p.id !== id));
    toast.success("Producto eliminado");
  }

  return (
    <div className="space-y-5">
      <Toaster position="top-right" />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-800">Productos</h1>
        <Link
          href="/admin/productos/new"
          className="flex items-center gap-1.5 rounded-lg bg-bio-green px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          <Plus size={16} /> Nuevo Producto
        </Link>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre..."
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-bio-green"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-bio-green"
        >
          <option value="all">Todas las categorías</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-bio-green border-t-transparent" />
        </div>
      ) : (
        <div className="rounded-xl bg-white shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b bg-slate-50 text-xs text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left">Producto</th>
                <th className="px-4 py-3 text-right">Precio</th>
                <th className="px-4 py-3 text-right">Stock</th>
                <th className="px-4 py-3 text-left">Categoría</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 shrink-0 rounded-lg bg-slate-100 flex items-center justify-center text-xs text-slate-400 overflow-hidden">
                        {p.images[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.images[0]} alt="" className="h-full w-full object-cover" />
                        ) : "📦"}
                      </div>
                      <div>
                        <p className="font-medium text-slate-700">{p.name}</p>
                        {p.featured && (
                          <span className="flex items-center gap-0.5 text-xs text-yellow-500">
                            <Star size={10} fill="currentColor" /> Destacado
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-slate-700">
                    {formatPrice(p.price)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`rounded px-2 py-0.5 text-xs font-semibold ${
                      p.stock === 0 ? "bg-red-100 text-red-600" :
                      p.stock < 10 ? "bg-orange-100 text-orange-600" :
                      "bg-green-100 text-green-700"
                    }`}>
                      {p.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {p.category}{p.linea ? ` — ${p.linea}` : ""}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/productos/${p.id}/edit`}
                        className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      >
                        <Pencil size={15} />
                      </Link>
                      <button
                        type="button"
                        onClick={() => deleteProduct(p.id)}
                        className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {products.length === 0 && (
            <p className="py-10 text-center text-sm text-slate-400">Sin productos.</p>
          )}
        </div>
      )}
    </div>
  );
}
