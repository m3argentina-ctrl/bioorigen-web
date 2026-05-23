"use client";

import { useRef, useState } from "react";
import { FileText, Upload, X, Loader2 } from "lucide-react";

type Props = {
  value: string;          // URL actual del PDF (puede ser "")
  onChange: (url: string) => void;
  label?: string;
};

export default function FileUpload({ value, onChange, label = "Ficha técnica (PDF)" }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(file: File) {
    setError("");
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    form.append("type", "datasheet");
    const res = await fetch("/api/admin/upload", { method: "POST", body: form });
    const data = await res.json();
    setUploading(false);
    if (!res.ok) { setError(data.error ?? "Error al subir"); return; }
    onChange(data.url);
  }

  const fileName = value ? value.split("/").pop() ?? "archivo.pdf" : null;

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700">{label}</label>

      {fileName && (
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
          <FileText size={16} className="shrink-0 text-bio-green" />
          <a href={value} target="_blank" rel="noopener noreferrer"
            className="flex-1 truncate text-xs text-bio-green hover:underline">
            {fileName}
          </a>
          <button type="button" onClick={() => onChange("")} className="text-slate-400 hover:text-red-500">
            <X size={15} />
          </button>
        </div>
      )}

      <button
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 py-4 text-sm text-slate-500 transition-colors hover:border-bio-green hover:text-bio-green disabled:opacity-50"
      >
        {uploading ? (
          <><Loader2 size={18} className="animate-spin" /> Subiendo PDF...</>
        ) : (
          <><Upload size={18} /> {fileName ? "Reemplazar PDF" : "Subir ficha técnica (PDF · máx 20 MB)"}</>
        )}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
      />

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
