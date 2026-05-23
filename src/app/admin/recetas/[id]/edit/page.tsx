"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Upload, X } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

function ArrayField({
  label,
  items,
  onChange,
  placeholder,
  multiline,
}: {
  label: string;
  items: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">{label}</label>
      {items.map((v, i) =>
        multiline ? (
          <div key={i} className="mb-2 flex gap-2">
            <textarea
              value={v}
              onChange={(e) => onChange(items.map((x, j) => (j === i ? e.target.value : x)))}
              placeholder={placeholder ? `${placeholder} ${i + 1}` : ""}
              rows={2}
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-bio-green"
            />
            <button
              type="button"
              onClick={() => onChange(items.filter((_, j) => j !== i))}
              className="px-2 text-slate-400 hover:text-red-500"
            >
              ✕
            </button>
          </div>
        ) : (
          <div key={i} className="mb-2 flex gap-2">
            <input
              value={v}
              onChange={(e) => onChange(items.map((x, j) => (j === i ? e.target.value : x)))}
              placeholder={placeholder ? `${placeholder} ${i + 1}` : ""}
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-bio-green"
            />
            <button
              type="button"
              onClick={() => onChange(items.filter((_, j) => j !== i))}
              className="px-2 text-slate-400 hover:text-red-500"
            >
              ✕
            </button>
          </div>
        )
      )}
      <button
        type="button"
        onClick={() => onChange([...items, ""])}
        className="text-xs font-medium text-bio-green hover:underline"
      >
        + Agregar {label.toLowerCase()}
      </button>
    </div>
  );
}

type FormState = {
  name: string;
  slug: string;
  emoji: string;
  description: string;
  category: string;
  difficulty: string;
  time: string;
  temperature: string;
  season: string;
  image: string;
  featured: boolean;
};

export default function EditRecetaPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState<FormState | null>(null);
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [equipment, setEquipment] = useState<string[]>([]);
  const [steps, setSteps] = useState<string[]>([]);
  const [variations, setVariations] = useState<string[]>([]);
  const [uses, setUses] = useState<string[]>([]);

  useEffect(() => {
    fetch(`/api/admin/recipes/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setForm({
          name: data.name ?? "",
          slug: data.slug ?? "",
          emoji: data.emoji ?? "🌿",
          description: data.description ?? "",
          category: data.category ?? "Básico",
          difficulty: data.difficulty ?? "Fácil",
          time: data.time ?? "",
          temperature: data.temperature ?? "",
          season: data.season ?? "",
          image: data.image ?? "",
          featured: data.featured ?? false,
        });
        setIngredients(data.ingredients?.length ? data.ingredients : [""]);
        setEquipment(data.equipment?.length ? data.equipment : [""]);
        setSteps(data.steps?.length ? data.steps : [""]);
        setVariations(data.variations?.length ? data.variations : [""]);
        setUses(data.uses?.length ? data.uses : [""]);
      });
  }, [id]);

  function hc(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setForm((p) => (p ? { ...p, [name]: type === "checkbox" ? checked : value } : p));
  }

  async function uploadImage(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error();
      const { url } = await res.json();
      setForm((p) => (p ? { ...p, image: url } : p));
      toast.success("Imagen subida");
    } catch {
      toast.error("Error al subir imagen");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    const res = await fetch(`/api/admin/recipes/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        season: form.season || null,
        ingredients: ingredients.filter(Boolean),
        equipment: equipment.filter(Boolean),
        steps: steps.filter(Boolean),
        variations: variations.filter(Boolean),
        uses: uses.filter(Boolean),
      }),
    });
    setSaving(false);
    if (res.ok) {
      toast.success("Receta actualizada");
      router.push("/admin/recetas");
    } else {
      toast.error("Error al guardar");
    }
  }

  if (!form) {
    return (
      <div className="flex h-32 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-bio-green border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Toaster position="top-right" />
      <div className="flex items-center gap-3">
        <Link href="/admin/recetas" className="text-sm text-slate-400 hover:text-slate-600">
          ← Recetas
        </Link>
        <h1 className="text-xl font-bold text-slate-800">Editar Receta</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-xl bg-white p-6 shadow-sm">
        <div className="grid grid-cols-[1fr_auto] gap-3">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Nombre</span>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={hc}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-bio-green"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Emoji</span>
            <input
              type="text"
              name="emoji"
              value={form.emoji}
              onChange={hc}
              className="w-16 rounded-lg border border-slate-300 px-3 py-2 text-center text-lg outline-none focus:border-bio-green"
            />
          </label>
        </div>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Slug</span>
          <input
            type="text"
            name="slug"
            value={form.slug}
            onChange={hc}
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-bio-green"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Descripción</span>
          <textarea
            name="description"
            value={form.description}
            onChange={hc}
            rows={3}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-bio-green"
          />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Categoría</span>
            <select
              name="category"
              value={form.category}
              onChange={hc}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-bio-green"
            >
              <option>Básico</option>
              <option>Intermedio</option>
              <option>Avanzado</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Dificultad</span>
            <select
              name="difficulty"
              value={form.difficulty}
              onChange={hc}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-bio-green"
            >
              <option>Fácil</option>
              <option>Media</option>
              <option>Difícil</option>
            </select>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Tiempo</span>
            <input
              type="text"
              name="time"
              value={form.time}
              onChange={hc}
              placeholder="ej: 6-8 horas"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-bio-green"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Temperatura</span>
            <input
              type="text"
              name="temperature"
              value={form.temperature}
              onChange={hc}
              placeholder="ej: 60°C"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-bio-green"
            />
          </label>
        </div>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">
            Temporada (opcional)
          </span>
          <input
            type="text"
            name="season"
            value={form.season}
            onChange={hc}
            placeholder="Verano, Invierno..."
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-bio-green"
          />
        </label>

        {/* Imagen */}
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Imagen principal</label>
          {form.image ? (
            <div className="relative mb-2 h-40 w-full overflow-hidden rounded-lg">
              <Image src={form.image} alt="preview" fill className="object-cover" />
              <button
                type="button"
                onClick={() => setForm((p) => (p ? { ...p, image: "" } : p))}
                className="absolute right-2 top-2 rounded-full bg-black/50 p-1 text-white hover:bg-black/70"
              >
                <X size={14} />
              </button>
            </div>
          ) : null}
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-slate-300 px-4 py-3 text-sm text-slate-500 hover:border-bio-green hover:text-bio-green">
            <Upload size={16} />
            {uploading ? "Subiendo..." : "Subir imagen"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) uploadImage(f);
              }}
            />
          </label>
        </div>

        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            name="featured"
            checked={form.featured}
            onChange={hc}
            className="h-4 w-4 rounded border-slate-300 accent-bio-green"
          />
          Destacada
        </label>

        <ArrayField
          label="Ingredientes"
          items={ingredients}
          onChange={setIngredients}
          placeholder="Ingrediente"
        />
        <ArrayField
          label="Equipamiento"
          items={equipment}
          onChange={setEquipment}
          placeholder="Equipo"
        />
        <ArrayField
          label="Pasos"
          items={steps}
          onChange={setSteps}
          placeholder="Paso"
          multiline
        />
        <ArrayField
          label="Variaciones"
          items={variations}
          onChange={setVariations}
          placeholder="Variación"
        />
        <ArrayField label="Usos" items={uses} onChange={setUses} placeholder="Uso" />

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-bio-green px-5 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar"}
          </button>
          <Link
            href="/admin/recetas"
            className="rounded-lg border border-slate-300 px-5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
