"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast, { Toaster } from "react-hot-toast";

function slugify(t: string) {
  return t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export default function NewCategoriaPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "", description: "", image: "", active: true });

  function hc(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value, type } = e.target;
    const val = type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
    setForm((p) => {
      const u = { ...p, [name]: val };
      if (name === "name") u.slug = slugify(value);
      return u;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        slug: form.slug,
        description: form.description || null,
        image: form.image || null,
        active: form.active,
      }),
    });
    setSaving(false);
    if (res.ok) { toast.success("Categoría creada"); router.push("/admin/categorias"); }
    else toast.error("Error al crear (¿nombre duplicado?)");
  }

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <Toaster position="top-right" />
      <div className="flex items-center gap-3">
        <Link href="/admin/categorias" className="text-sm text-slate-400 hover:text-slate-600">← Categorías</Link>
        <h1 className="text-xl font-bold text-slate-800">Nueva Categoría</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl bg-white p-6 shadow-sm">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Nombre *</span>
          <input type="text" name="name" value={form.name} onChange={hc} required
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-bio-green" />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Slug *</span>
          <input type="text" name="slug" value={form.slug} onChange={hc} required
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono outline-none focus:border-bio-green" />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Descripción</span>
          <textarea name="description" value={form.description} onChange={hc} rows={3}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-bio-green" />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">URL de imagen</span>
          <input type="url" name="image" value={form.image} onChange={hc} placeholder="https://..."
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-bio-green" />
        </label>

        <label className="flex items-center gap-3 rounded-lg border border-slate-200 p-3">
          <input type="checkbox" name="active" checked={form.active}
            onChange={hc} className="h-4 w-4 accent-bio-green" />
          <span className="text-sm font-medium text-slate-700">Activa (visible en el sitio)</span>
        </label>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving}
            className="rounded-lg bg-bio-green px-5 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">
            {saving ? "Guardando..." : "Crear categoría"}
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
