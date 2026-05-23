"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Upload, X, Loader2 } from "lucide-react";

type Props = {
  value: string[];
  onChange: (urls: string[]) => void;
};

export default function ImageUpload({ value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError("");
    setUploading(true);

    const newUrls: string[] = [];
    for (const file of Array.from(files)) {
      const form = new FormData();
      form.append("file", file);
      form.append("type", "image");
      const res = await fetch("/api/admin/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Error al subir"); break; }
      newUrls.push(data.url);
    }

    onChange([...value, ...newUrls]);
    setUploading(false);
  }

  function remove(idx: number) {
    onChange(value.filter((_, i) => i !== idx));
  }

  return (
    <div className="space-y-3">
      {/* Miniaturas */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((url, i) => (
            <div key={i} className="group relative h-20 w-20 overflow-hidden rounded-lg border border-slate-200">
              <Image src={url} alt={`Imagen ${i + 1}`} fill className="object-cover" unoptimized />
              <button
                type="button"
                onClick={() => remove(i)}
                className="absolute right-0.5 top-0.5 hidden rounded-full bg-red-500 p-0.5 text-white group-hover:flex"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Drop zone */}
      <button
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
        className="flex w-full cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-slate-300 py-6 text-sm text-slate-500 transition-colors hover:border-bio-green hover:text-bio-green disabled:opacity-50"
      >
        {uploading ? (
          <><Loader2 size={22} className="animate-spin" /> Subiendo...</>
        ) : (
          <><Upload size={22} /> Arrastrá imágenes o hacé clic para seleccionar<span className="text-xs text-slate-400">JPG, PNG, WebP · máx 5 MB c/u</span></>
        )}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
