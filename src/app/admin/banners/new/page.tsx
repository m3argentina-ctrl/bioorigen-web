"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

const DEFAULTS: FormData = {
  title: "",
  subtitle: "",
  description: "",
  image: "",
  buttonText: "",
  buttonLink: "",
  bgColor: "#4A7C59",
  order: 0,
  active: true,
};

export default function NewBannerPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormData>(DEFAULTS);
  const [saving, setSaving] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : type === "number" ? Number(value) : value,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.image) {
      toast.error("Título e imagen son requeridos");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/admin/banners", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) {
      toast.success("Banner creado");
      router.push("/admin/banners");
    } else {
      const d = await res.json();
      toast.error(d.error ?? "Error al guardar");
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Toaster position="top-right" />
      <div className="flex items-center gap-3">
        <Link href="/admin/banners" className="text-sm text-slate-400 hover:text-slate-600">← Banners</Link>
        <h1 className="text-xl font-bold text-slate-800">Nuevo Banner</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl bg-white p-6 shadow-sm">
          <Field label="Título *" name="title" value={form.title} onChange={handleChange} />
          <Field label="Subtítulo" name="subtitle" value={form.subtitle} onChange={handleChange} />
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Descripción</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-bio-green"
            />
          </div>
          <SingleImageUpload
            label="Imagen *"
            value={form.image}
            onChange={(url) => setForm((p) => ({ ...p, image: url }))}
          />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Texto del botón" name="buttonText" value={form.buttonText} onChange={handleChange} />
            <Field label="Link del botón" name="buttonLink" value={form.buttonLink} onChange={handleChange} placeholder="/productos" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Color de fondo</label>
              <div className="flex items-center gap-2">
                <input type="color" name="bgColor" value={form.bgColor} onChange={handleChange} className="h-9 w-14 rounded border border-slate-300 cursor-pointer" />
                <input type="text" name="bgColor" value={form.bgColor} onChange={handleChange} className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-bio-green" />
              </div>
            </div>
            <Field label="Orden" name="order" value={String(form.order)} onChange={handleChange} type="number" />
          </div>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input type="checkbox" name="active" checked={form.active} onChange={handleChange} className="h-4 w-4 accent-bio-green" />
            Activo
          </label>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="rounded-lg bg-bio-green px-5 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">
              {saving ? "Guardando..." : "Guardar"}
            </button>
            <Link href="/admin/banners" className="rounded-lg border border-slate-300 px-5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
              Cancelar
            </Link>
          </div>
        </form>

        {/* Preview */}
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Vista previa</p>
          <div
            className="flex min-h-40 flex-col items-start justify-center rounded-xl p-6"
            style={{ backgroundColor: form.bgColor }}
          >
            {form.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.image} alt="" className="mb-3 h-16 w-full object-cover rounded opacity-50" onError={() => {}} />
            )}
            <p className="text-lg font-bold text-white">{form.title || "Título del banner"}</p>
            {form.subtitle && <p className="mt-1 text-sm text-white/80">{form.subtitle}</p>}
            {form.buttonText && (
              <span className="mt-3 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white">
                {form.buttonText}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, name, value, onChange, placeholder, type = "text" }: {
  label: string; name: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string; type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-bio-green"
      />
    </label>
  );
}
