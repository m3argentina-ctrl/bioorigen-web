"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast, { Toaster } from "react-hot-toast";
import ImageUpload from "@/components/admin/ImageUpload";
import FileUpload from "@/components/admin/FileUpload";

const LINEAS = ["", "Familiar", "Comercial"];

type SpecEntry = { key: string; value: string };

function slugify(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export default function NewProductPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [dataSheet, setDataSheet] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoUploading, setVideoUploading] = useState(false);
  const [form, setForm] = useState({
    name: "", slug: "", description: "", price: "", salePrice: "", stock: "",
    category: "", linea: "", featured: false, rating: "", reviewCount: "0",
    weightGrams: "", heightCm: "", widthCm: "", lengthCm: "",
  });
  const [specs, setSpecs] = useState<SpecEntry[]>([{ key: "", value: "" }]);

  useEffect(() => {
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then((data: { name: string }[]) => {
        const names = data.map((c) => c.name);
        setCategories(names);
        setForm((p) => ({ ...p, category: p.category || names[0] || "" }));
      });
  }, []);

  function hc(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value, type } = e.target;
    const val = type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
    setForm((p) => {
      const u = { ...p, [name]: val };
      if (name === "name") u.slug = slugify(value);
      return u;
    });
  }

  function updateSpec(idx: number, field: "key" | "value", val: string) {
    setSpecs((p) => p.map((s, i) => i === idx ? { ...s, [field]: val } : s));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const specsObj = Object.fromEntries(specs.filter((s) => s.key).map((s) => [s.key, s.value]));
    setSaving(true);
    const res = await fetch("/api/admin/products", {
      method: "POST",
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
    if (res.ok) { toast.success("Producto creado"); router.push("/admin/productos"); }
    else {
      const d = await res.json();
      toast.error(Array.isArray(d.error) ? d.error[0]?.message : (d.error ?? "Error"));
    }
  }

  const isDeshidratador = form.category === "Deshidratadores";

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Toaster position="top-right" />
      <div className="flex items-center gap-3">
        <Link href="/admin/productos" className="text-sm text-slate-400 hover:text-slate-600">← Productos</Link>
        <h1 className="text-xl font-bold text-slate-800">Nuevo Producto</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-xl bg-white p-6 shadow-sm">
        <F label="Nombre *" name="name" value={form.name} onChange={hc} />
        <F label="Slug *" name="slug" value={form.slug} onChange={hc} />

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Descripción *</label>
          <textarea name="description" value={form.description} onChange={hc} rows={4}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-bio-green" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <F label="Precio normal (ARS) *" name="price" value={form.price} onChange={hc} type="number" />
          <F label="Precio oferta (ARS)" name="salePrice" value={form.salePrice} onChange={hc} type="number" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <F label="Stock *" name="stock" value={form.stock} onChange={hc} type="number" />
          <div />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Categoría</label>
            <select name="category" value={form.category} onChange={hc}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-bio-green">
              {categories.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Línea</label>
            <select name="linea" value={form.linea} onChange={hc}
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
              <input value={s.key} onChange={(e) => updateSpec(i, "key", e.target.value)} placeholder="Clave (ej: potencia)"
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-bio-green" />
              <input value={s.value} onChange={(e) => updateSpec(i, "value", e.target.value)} placeholder="Valor (ej: 500W)"
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-bio-green" />
              <button type="button" onClick={() => setSpecs((p) => p.filter((_, j) => j !== i))} className="text-slate-400 hover:text-red-500 px-2">✕</button>
            </div>
          ))}
          <button type="button" onClick={() => setSpecs((p) => [...p, { key: "", value: "" }])} className="text-xs font-medium text-bio-green hover:underline">+ Agregar spec</button>
        </div>

        {/* Mercado Envíos — peso y dimensiones del paquete */}
        <div>
          <p className="mb-2 text-sm font-medium text-slate-700">
            Envío — peso y dimensiones del paquete
            <span className="ml-1 text-xs font-normal text-slate-400">(opcional, para Mercado Envíos)</span>
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <F label="Peso (g)" name="weightGrams" value={form.weightGrams} onChange={hc} type="number" />
            <F label="Alto (cm)" name="heightCm" value={form.heightCm} onChange={hc} type="number" />
            <F label="Ancho (cm)" name="widthCm" value={form.widthCm} onChange={hc} type="number" />
            <F label="Largo (cm)" name="lengthCm" value={form.lengthCm} onChange={hc} type="number" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <F label="Rating (0-5)" name="rating" value={form.rating} onChange={hc} type="number" />
          <F label="Cant. reseñas" name="reviewCount" value={form.reviewCount} onChange={hc} type="number" />
        </div>

        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <input type="checkbox" name="featured" checked={form.featured} onChange={hc} className="h-4 w-4 accent-bio-green" />
          Destacado en home
        </label>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving}
            className="rounded-lg bg-bio-green px-5 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">
            {saving ? "Guardando..." : "Crear producto"}
          </button>
          <Link href="/admin/productos" className="rounded-lg border border-slate-300 px-5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancelar</Link>
        </div>
      </form>
    </div>
  );
}

function F({ label, name, value, onChange, type = "text" }: {
  label: string; name: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      <input type={type} name={name} value={value} onChange={onChange}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-bio-green" />
    </label>
  );
}
