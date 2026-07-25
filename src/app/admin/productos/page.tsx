"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, Star, EyeOff, Eye } from "lucide-react";
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
  active: boolean;
  images: string[];
};

export default function ProductosAdminPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [showPaused, setShowPaused] = useState(true);

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

  async function toggleActive(id: string, current: boolean) {
    const res = await fetch(`/api/admin/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !current }),
    });
    if (res.ok) {
      setProducts((prev) => prev.map((p) => p.id === id ? { ...p, active: !current } : p));
      toast.success(current ? "Producto pausado" : "Producto activado");
    } else {
      toast.error("Error al cambiar estado");
    }
  }

  async function deleteProduct(id: string) {
    if (!confirm("¿Eliminar este producto? Esta acción no se puede deshacer.")) return;
    await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    setProducts((prev) => prev.filter((p) => p.id !== id));
    toast.success("Producto eliminado");
  }

  const visible = showPaused ? products : products.filter((p) => p.active);

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
        <button
          type="button"
          onClick={() => setShowPaused((v) => !v)}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
            showPaused
              ? "border-slate-300 text-slate-500 hover:bg-slate-50"
              : "border-bio-green bg-bio-green/10 text-bio-green"
          }`}
        >
          {showPaused ? <EyeOff size={14} /> : <Eye size={14} />}
          {showPaused ? "Ocultar pausados" : "Mostrar pausados"}
        </button>
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
                <th className="px-4 py-3 text-center">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {visible.map((p) => (
                <tr key={p.id} className={`hover:bg-slate-50 ${!p.active ? "opacity-60" : ""}`}>
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
                  <td className="px-4 py-3 text-center">
                    {p.active ? (
                      <span className="inline-block rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                        Activo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">
                        <EyeOff size={10} /> Pausado
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => toggleActive(p.id, p.active)}
                        title={p.active ? "Pausar producto" : "Activar producto"}
                        className={`rounded p-1.5 transition-colors ${
                          p.active
                            ? "text-slate-400 hover:bg-orange-50 hover:text-orange-500"
                            : "text-bio-green hover:bg-green-50"
                        }`}
                      >
                        {p.active ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
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
          {visible.length === 0 && (
            <p className="py-10 text-center text-sm text-slate-400">Sin productos.</p>
          )}
        </div>
      )}
    </div>
  );
}
