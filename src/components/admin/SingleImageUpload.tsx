"use client";

import { useRef, useState } from "react";
import { Upload, X, Loader2 } from "lucide-react";

type Props = {
  value: string;
  onChange: (url: string) => void;
  label?: string;
};

export default function SingleImageUpload({ value, onChange, label = "Imagen" }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(file: File) {
    setError("");
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    form.append("type", "image");
    const res = await fetch("/api/admin/upload", { method: "POST", body: form });
    const data = await res.json();
    setUploading(false);
    if (!res.ok) { setError(data.error ?? "Error al subir"); return; }
    onChange(data.url);
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700">{label}</label>

      {/* Preview */}
      {value && (
        <div className="relative h-32 w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Preview" className="h-full w-full object-cover" />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute right-2 top-2 rounded-full bg-black/50 p-1 text-white hover:bg-black/70"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* URL input */}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="https://... (o subí una imagen abajo)"
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-bio-green"
      />

      {/* Upload button */}
      <button
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 py-3 text-sm text-slate-500 transition-colors hover:border-bio-green hover:text-bio-green disabled:opacity-50"
      >
        {uploading
          ? <><Loader2 size={18} className="animate-spin" /> Subiendo...</>
          : <><Upload size={18} /> Subir desde la PC (JPG, PNG, WebP · máx 5 MB)</>
        }
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
      />

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
