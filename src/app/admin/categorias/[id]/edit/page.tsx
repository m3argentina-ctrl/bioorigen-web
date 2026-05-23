"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import toast, { Toaster } from "react-hot-toast";

export default function EditCategoriaPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    fetch(`/api/admin/categories/${id}`)
      .then((r) => r.json())
      .then((data) => setForm({
        name: data.name ?? "",
        slug: data.slug ?? "",
        description: data.description ?? "",
        image: data.image ?? "",
        active: data.active ?? true,
      }));
  }, [id]);

  function hc(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value, type } = e.target;
    const val = type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
    setForm((p) => p ? { ...p, [name]: val } : p);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    const res = await fetch(`/api/admin/categories/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        slug: form.slug,
        description: String(form.description || "") || null,
        image: String(form.image || "") || null,
        active: form.active,
      }),
    });
    setSaving(false);
    if (res.ok) { toast.success("Categoría actualizada"); router.push("/admin/categorias"); }
    else toast.error("Error al guardar");
  }

  if (!form) return (
    <div className="flex h-32 items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-bio-green border-t-transparent" />
    </div>
  );

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <Toaster position="top-right" />
      <div className="flex items-center gap-3">
        <Link href="/admin/categorias" className="text-sm text-slate-400 hover:text-slate-600">← Categorías</Link>
        <h1 className="text-xl font-bold text-slate-800">Editar Categoría</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl bg-white p-6 shadow-sm">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Nombre *</span>
          <input type="text" name="name" value={String(form.name ?? "")} onChange={hc} required
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-bio-green" />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Slug *</span>
          <input type="text" name="slug" value={String(form.slug ?? "")} onChange={hc} required
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono outline-none focus:border-bio-green" />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Descripción</span>
          <textarea name="description" value={String(form.description ?? "")} onChange={hc} rows={3}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-bio-green" />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">URL de imagen</span>
          <input type="url" name="image" value={String(form.image ?? "")} onChange={hc} placeholder="https://..."
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-bio-green" />
        </label>

        <label className="flex items-center gap-3 rounded-lg border border-slate-200 p-3">
          <input type="checkbox" name="active" checked={Boolean(form.active)}
            onChange={hc} className="h-4 w-4 accent-bio-green" />
          <span className="text-sm font-medium text-slate-700">Activa (visible en el sitio)</span>
        </label>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving}
            className="rounded-lg bg-bio-green px-5 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">
            {saving ? "Guardando..." : "Guardar"}
          </button>
          <Link href="/admin/categorias"
            className="rounded-lg border border-slate-300 px-5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
