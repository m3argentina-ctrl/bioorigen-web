"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2 } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

type Recipe = { id: string; name: string; emoji: string; category: string; difficulty: string; time: string; featured: boolean };

export default function RecetasAdminPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/recipes").then((r) => r.json()).then((d) => { setRecipes(d); setLoading(false); });
  }, []);

  async function deleteRecipe(id: string) {
    if (!confirm("¿Eliminar esta receta?")) return;
    await fetch(`/api/admin/recipes/${id}`, { method: "DELETE" });
    setRecipes((prev) => prev.filter((r) => r.id !== id));
    toast.success("Receta eliminada");
  }

  return (
    <div className="space-y-5">
      <Toaster position="top-right" />
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">Recetas</h1>
        <Link href="/admin/recetas/new" className="flex items-center gap-1.5 rounded-lg bg-bio-green px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
          <Plus size={16} /> Nueva Receta
        </Link>
      </div>

      {loading ? (
        <div className="flex h-32 items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-bio-green border-t-transparent" /></div>
      ) : (
        <div className="rounded-xl bg-white shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b bg-slate-50 text-xs text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left">Nombre</th>
                <th className="px-4 py-3 text-left">Categoría</th>
                <th className="px-4 py-3 text-left">Dificultad</th>
                <th className="px-4 py-3 text-left">Tiempo</th>
                <th className="px-4 py-3 text-left">Destacada</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {recipes.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-700">{r.emoji} {r.name}</td>
                  <td className="px-4 py-3 text-slate-500">{r.category}</td>
                  <td className="px-4 py-3 text-slate-500">{r.difficulty}</td>
                  <td className="px-4 py-3 text-slate-500">{r.time}</td>
                  <td className="px-4 py-3">{r.featured && <span className="rounded-full bg-bio-green/10 px-2 py-0.5 text-xs font-medium text-bio-green">Sí</span>}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/admin/recetas/${r.id}/edit`} className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><Pencil size={15} /></Link>
                      <button type="button" onClick={() => deleteRecipe(r.id)} className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {recipes.length === 0 && <p className="py-10 text-center text-sm text-slate-400">Sin recetas.</p>}
        </div>
      )}
    </div>
  );
}
