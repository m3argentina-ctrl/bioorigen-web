"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import toast, { Toaster } from "react-hot-toast";
import SingleImageUpload from "@/components/admin/SingleImageUpload";

type FormData = {
  title: string;
  subtitle: string;
  description: string;
  image: string;
  buttonText: string;
  buttonLink: string;
  bgColor: string;
  order: number;
  active: boolean;
};

export default function EditBannerPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [form, setForm] = useState<FormData | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/banners/${id}`)
      .then((r) => r.json())
      .then((data) => setForm({
        title: data.title ?? "",
        subtitle: data.subtitle ?? "",
        description: data.description ?? "",
        image: data.image ?? "",
        buttonText: data.buttonText ?? "",
        buttonLink: data.buttonLink ?? "",
        bgColor: data.bgColor ?? "#4A7C59",
        order: data.order ?? 0,
        active: data.active ?? true,
      }));
  }, [id]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value, type } = e.target;
    setForm((prev) => prev ? ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : type === "number" ? Number(value) : value,
    }) : prev);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    const res = await fetch(`/api/admin/banners/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) {
      toast.success("Banner actualizado");
      router.push("/admin/banners");
    } else {
      toast.error("Error al guardar");
    }
  }

  if (!form) {
    return <div className="flex h-32 items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-bio-green border-t-transparent" /></div>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Toaster position="top-right" />
      <div className="flex items-center gap-3">
        <Link href="/admin/banners" className="text-sm text-slate-400 hover:text-slate-600">← Banners</Link>
        <h1 className="text-xl font-bold text-slate-800">Editar Banner</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl bg-white p-6 shadow-sm">
          {(["title", "subtitle"] as const).map((f) => (
            <label key={f} className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700 capitalize">{f}</span>
              <input type="text" name={f} value={form[f]} onChange={handleChange} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-bio-green" />
            </label>
          ))}
          <SingleImageUpload
            label="Imagen *"
            value={form.image}
            onChange={(url) => setForm((p) => p ? { ...p, image: url } : p)}
          />
          {(["buttonText", "buttonLink"] as const).map((f) => (
            <label key={f} className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">{f === "buttonText" ? "Texto del botón" : "Link del botón"}</span>
              <input type="text" name={f} value={form[f]} onChange={handleChange} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-bio-green" />
            </label>
          ))}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Descripción</label>
            <textarea name="description" value={form.description} onChange={handleChange} rows={3} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-bio-green" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Color</label>
              <div className="flex items-center gap-2">
                <input type="color" name="bgColor" value={form.bgColor} onChange={handleChange} className="h-9 w-14 rounded border cursor-pointer" />
                <input type="text" name="bgColor" value={form.bgColor} onChange={handleChange} className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-bio-green" />
              </div>
            </div>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Orden</span>
              <input type="number" name="order" value={form.order} onChange={handleChange} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-bio-green" />
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input type="checkbox" name="active" checked={form.active} onChange={handleChange} className="h-4 w-4 accent-bio-green" />
            Activo
          </label>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="rounded-lg bg-bio-green px-5 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">
              {saving ? "Guardando..." : "Guardar"}
            </button>
            <Link href="/admin/banners" className="rounded-lg border border-slate-300 px-5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancelar</Link>
          </div>
        </form>

        {/* Preview */}
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Vista previa</p>
          <div className="flex min-h-40 flex-col items-start justify-center rounded-xl p-6" style={{ backgroundColor: form.bgColor }}>
            <p className="text-lg font-bold text-white">{form.title}</p>
            {form.subtitle && <p className="mt-1 text-sm text-white/80">{form.subtitle}</p>}
            {form.buttonText && <span className="mt-3 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white">{form.buttonText}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
