"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import toast, { Toaster } from "react-hot-toast";
import ImageUpload from "@/components/admin/ImageUpload";
import FileUpload from "@/components/admin/FileUpload";

const LINEAS = ["", "Familiar", "Comercial"];

type SpecEntry = { key: string; value: string };

function slugify(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export default function EditProductPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [dataSheet, setDataSheet] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoUploading, setVideoUploading] = useState(false);
  const [form, setForm] = useState<Record<string, unknown> | null>(null);
  const [specs, setSpecs] = useState<SpecEntry[]>([]);

  useEffect(() => {
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then((data: { name: string }[]) => setCategories(data.map((c) => c.name)));
  }, []);

  useEffect(() => {
    fetch(`/api/admin/products/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setForm({
          name: data.name ?? "", slug: data.slug ?? "", description: data.description ?? "",
          price: String(data.price ?? ""), salePrice: data.salePrice != null ? String(data.salePrice) : "", stock: String(data.stock ?? ""),
          category: data.category ?? "", linea: data.linea ?? "", featured: data.featured ?? false,
          rating: data.rating != null ? String(data.rating) : "",
          reviewCount: String(data.reviewCount ?? 0),
          weightGrams: data.weightGrams != null ? String(data.weightGrams) : "",
          heightCm: data.heightCm != null ? String(data.heightCm) : "",
          widthCm: data.widthCm != null ? String(data.widthCm) : "",
          lengthCm: data.lengthCm != null ? String(data.lengthCm) : "",
        });
        setImages(Array.isArray(data.images) ? data.images : []);
        setDataSheet(data.dataSheet ?? "");
        setVideoUrl(data.videoUrl ?? "");
        const sp = data.specs ?? {};
        const entries = Object.entries(sp).map(([k, v]) => ({ key: k, value: String(v) }));
        setSpecs(entries.length > 0 ? entries : [{ key: "", value: "" }]);
      });
  }, [id]);

  function hc(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value, type } = e.target;
    const val = type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
    setForm((p) => p ? { ...p, [name]: val } : p);
  }

  function updateSpec(idx: number, field: "key" | "value", val: string) {
    setSpecs((p) => p.map((s, i) => i === idx ? { ...s, [field]: val } : s));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    const specsObj = Object.fromEntries(specs.filter((s) => s.key).map((s) => [s.key, s.value]));
    setSaving(true);
    const res = await fetch(`/api/admin/products/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name, slug: form.slug, description: form.description,
        price: Number(form.price), stock: Number(form.stock),
        category: form.category, linea: form.linea || null, featured: form.featured,
        images,
        salePrice: form.salePrice ? Number(form.salePrice) : null,
        dataSheet: dataSheet || null,
        videoUrl: videoUrl || null,
        specs: Object.keys(specsObj).length > 0 ? specsObj : null,
        rating: form.rating ? Number(form.rating) : null,
        reviewCount: Number(form.reviewCount),
        weightGrams: form.weightGrams ? Number(form.weightGrams) : null,
        heightCm: form.heightCm ? Number(form.heightCm) : null,
        widthCm: form.widthCm ? Number(form.widthCm) : null,
        lengthCm: form.lengthCm ? Number(form.lengthCm) : null,
      }),
    });
    setSaving(false);
    if (res.ok) { toast.success("Producto actualizado"); router.push("/admin/productos"); }
    else toast.error("Error al guardar");
  }

  if (!form) return <div className="flex h-32 items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-bio-green border-t-transparent" /></div>;

  const isDeshidratador = String(form.category) === "Deshidratadores";

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Toaster position="top-right" />
      <div className="flex items-center gap-3">
        <Link href="/admin/productos" className="text-sm text-slate-400 hover:text-slate-600">← Productos</Link>
        <h1 className="text-xl font-bold text-slate-800">Editar Producto</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-xl bg-white p-6 shadow-sm">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Name</span>
          <input type="text" name="name" value={String(form.name ?? "")} onChange={hc}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-bio-green" />
        </label>

        <div>
          <span className="mb-1 block text-sm font-medium text-slate-700">Slug</span>
          <div className="flex gap-2">
            <input type="text" name="slug" value={String(form.slug ?? "")} onChange={hc}
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-bio-green" />
            <button
              type="button"
              onClick={() => setForm((p) => p ? { ...p, slug: slugify(String(p.name ?? "")) } : p)}
              className="shrink-0 rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
              title="Regenerar slug desde el nombre"
            >
              Regenerar
            </button>
          </div>
          <p className="mt-1 text-xs text-slate-400">Cambiarlo afecta la URL del producto.</p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Descripción</label>
          <textarea name="description" value={String(form.description ?? "")} onChange={hc} rows={4}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-bio-green" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Precio normal (ARS)</span>
            <input type="number" name="price" value={String(form.price ?? "")} onChange={hc}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-bio-green" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Precio oferta (ARS)</span>
            <input type="number" name="salePrice" value={String(form.salePrice ?? "")} onChange={hc}
              placeholder="Dejar vacío si no hay oferta"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-bio-green" />
          </label>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Stock</span>
            <input type="number" name="stock" value={String(form.stock ?? "")} onChange={hc}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-bio-green" />
          </label>
          <div />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Categoría</label>
            <select name="category" value={String(form.category ?? "")} onChange={hc}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-bio-green">
              {categories.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Línea</label>
            <select name="linea" value={String(form.linea ?? "")} onChange={hc}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-bio-green">
              {LINEAS.map((l) => <option key={l} value={l}>{l || "— ninguna —"}</option>)}
            </select>
          </div>
        </div>

        {/* Imágenes */}
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Imágenes</label>
          <ImageUpload value={images} onChange={setImages} />
        </div>

        {/* Ficha técnica — solo Deshidratadores */}
        {isDeshidratador && (
          <FileUpload value={dataSheet} onChange={setDataSheet} />
        )}

        {/* Video del producto */}
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Video del producto <span className="font-normal text-slate-400">(opcional)</span>
          </label>
          <input
            type="url"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="https://youtube.com/watch?v=... o URL directa de video"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-bio-green"
          />
          <div className="mt-2 flex items-center gap-3">
            <label className={`cursor-pointer rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 ${videoUploading ? "opacity-50 pointer-events-none" : ""}`}>
              {videoUploading ? "Subiendo..." : "Subir MP4 / WebM"}
              <input
                type="file"
                accept="video/mp4,video/webm,video/ogg"
                className="sr-only"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setVideoUploading(true);
                  const fd = new FormData();
                  fd.append("file", file);
                  fd.append("type", "video");
                  const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
                  const data = await res.json();
                  if (data.url) setVideoUrl(data.url);
                  else toast.error(data.error ?? "Error al subir");
                  setVideoUploading(false);
                  e.target.value = "";
                }}
              />
            </label>
            {videoUrl && (
              <button type="button" onClick={() => setVideoUrl("")} className="text-xs text-red-400 hover:text-red-600">
                Quitar video
              </button>
            )}
          </div>
          {videoUrl && (
            <p className="mt-1 text-xs text-bio-green truncate">✓ {videoUrl}</p>
          )}
        </div>

        {/* Especificaciones */}
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Especificaciones</label>
          {specs.map((s, i) => (
            <div key={i} className="mb-2 flex gap-2">
              <input value={s.key} onChange={(e) => updateSpec(i, "key", e.target.value)} placeholder="Clave"
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-bio-green" />
              <input value={s.value} onChange={(e) => updateSpec(i, "value", e.target.value)} placeholder="Valor"
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-bio-green" />
              <button type="button" onClick={() => setSpecs((p) => p.filter((_, j) => j !== i))} className="text-slate-400 hover:text-red-500 px-2">✕</button>
            </div>
          ))}
          <button type="button" onClick={() => setSpecs((p) => [...p, { key: "", value: "" }])} className="text-xs font-medium text-bio-green hover:underline">+ Agregar spec</button>
        </div>

        {/* Mercado Envíos — peso y dimensiones */}
        <div>
          <p className="mb-2 text-sm font-medium text-slate-700">
            Envío — peso y dimensiones del paquete
            <span className="ml-1 text-xs font-normal text-slate-400">(opcional, para Mercado Envíos)</span>
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(["weightGrams", "heightCm", "widthCm", "lengthCm"] as const).map((field) => (
              <label key={field} className="block">
                <span className="mb-1 block text-xs font-medium text-slate-600">
                  {field === "weightGrams" ? "Peso (g)" : field === "heightCm" ? "Alto (cm)" : field === "widthCm" ? "Ancho (cm)" : "Largo (cm)"}
                </span>
                <input type="number" name={field} value={String(form[field] ?? "")} onChange={hc} min="0"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-bio-green" />
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Rating</span>
            <input type="number" name="rating" value={String(form.rating ?? "")} onChange={hc} step="0.1" min="0" max="5"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-bio-green" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Cant. reseñas</span>
            <input type="number" name="reviewCount" value={String(form.reviewCount ?? 0)} onChange={hc}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-bio-green" />
          </label>
        </div>

        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <input type="checkbox" name="featured" checked={Boolean(form.featured)} onChange={hc} className="h-4 w-4 accent-bio-green" />
          Destacado en home
        </label>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving}
            className="rounded-lg bg-bio-green px-5 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">
            {saving ? "Guardando..." : "Guardar"}
          </button>
          <Link href="/admin/productos" className="rounded-lg border border-slate-300 px-5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancelar</Link>
        </div>
      </form>
    </div>
  );
}
