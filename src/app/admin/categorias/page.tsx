"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, RefreshCw } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  order: number;
  active: boolean;
};

export default function CategoriasAdminPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then((d) => { setCategories(d); setLoading(false); });
  }, []);

  async function toggleActive(cat: Category) {
    const res = await fetch(`/api/admin/categories/${cat.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !cat.active }),
    });
    if (res.ok) {
      setCategories((prev) => prev.map((c) => c.id === cat.id ? { ...c, active: !c.active } : c));
    }
  }

  async function deleteCategory(id: string) {
    if (!confirm("¿Eliminar esta categoría?")) return;
    await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    setCategories((prev) => prev.filter((c) => c.id !== id));
    toast.success("Categoría eliminada");
  }

  async function syncFromProducts() {
    setSyncing(true);
    const res = await fetch("/api/admin/categories/sync", { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      toast.success(`${data.synced} categorías sincronizadas`);
      // Recargar la lista
      fetch("/api/admin/categories")
        .then((r) => r.json())
        .then(setCategories);
    } else {
      toast.error("Error al sincronizar");
    }
    setSyncing(false);
  }

  async function moveOrder(cat: Category, dir: "up" | "down") {
    const sorted = [...categories].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex((c) => c.id === cat.id);
    const swapIdx = dir === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;

    const other = sorted[swapIdx];
    await Promise.all([
      fetch(`/api/admin/categories/${cat.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ order: other.order }) }),
      fetch(`/api/admin/categories/${other.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ order: cat.order }) }),
    ]);
    setCategories((prev) =>
      prev.map((c) => c.id === cat.id ? { ...c, order: other.order } : c.id === other.id ? { ...c, order: cat.order } : c)
    );
  }

  const sorted = [...categories].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-5">
      <Toaster position="top-right" />
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">Categorías</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={syncFromProducts}
            disabled={syncing}
            title="Importar categorías que ya usan los productos"
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={15} className={syncing ? "animate-spin" : ""} />
            Sincronizar desde productos
          </button>
          <Link
            href="/admin/categorias/new"
            className="flex items-center gap-1.5 rounded-lg bg-bio-green px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            <Plus size={16} /> Nueva Categoría
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-bio-green border-t-transparent" />
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b bg-slate-50 text-xs text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left">Orden</th>
                <th className="px-4 py-3 text-left">Nombre</th>
                <th className="px-4 py-3 text-left">Slug</th>
                <th className="px-4 py-3 text-left">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {sorted.map((cat, idx) => (
                <tr key={cat.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <span className="w-6 text-center text-slate-400">{cat.order}</span>
                      <div className="flex flex-col">
                        <button type="button" onClick={() => moveOrder(cat, "up")} disabled={idx === 0}
                          className="rounded p-0.5 text-slate-300 hover:text-slate-600 disabled:opacity-20">
                          <ChevronUp size={14} />
                        </button>
                        <button type="button" onClick={() => moveOrder(cat, "down")} disabled={idx === sorted.length - 1}
                          className="rounded p-0.5 text-slate-300 hover:text-slate-600 disabled:opacity-20">
                          <ChevronDown size={14} />
                        </button>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-700">{cat.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-400">{cat.slug}</td>
                  <td className="px-4 py-3">
                    <button type="button" onClick={() => toggleActive(cat)}
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors ${
                        cat.active ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                      }`}>
                      {cat.active ? "Activa" : "Inactiva"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/admin/categorias/${cat.id}/edit`}
                        className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                        <Pencil size={15} />
                      </Link>
                      <button type="button" onClick={() => deleteCategory(cat.id)}
                        className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {categories.length === 0 && (
            <p className="py-10 text-center text-sm text-slate-400">Sin categorías aún.</p>
          )}
        </div>
      )}
    </div>
  );
}
