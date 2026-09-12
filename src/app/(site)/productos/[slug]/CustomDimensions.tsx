"use client";

import { useState } from "react";

const WA_NUMBER = "5491169819981";

export default function CustomDimensions({ productName }: { productName: string }) {
  const [ancho, setAncho] = useState("");
  const [largo, setLargo] = useState("");

  const ready = ancho.trim() !== "" && largo.trim() !== "";
  const waMsg = `Hola! Quiero consultar el precio de: ${productName} — Medida personalizada: ${ancho} x ${largo} cm`;
  const waHref = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(waMsg)}`;

  return (
    <div className="rounded-xl border border-bio-green/20 bg-bio-beige/50 px-5 py-4 space-y-3">
      <div>
        <p className="text-sm font-semibold text-bio-dark">¿Necesitás otra medida?</p>
        <p className="text-xs text-bio-dark/60 mt-0.5">Ingresá las dimensiones y te cotizamos.</p>
      </div>
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="block text-xs font-medium text-bio-dark/60 mb-1">Ancho (cm)</label>
          <input
            type="number"
            min="1"
            value={ancho}
            onChange={(e) => setAncho(e.target.value)}
            placeholder="ej: 120"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-bio-dark focus:border-bio-green focus:outline-none"
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs font-medium text-bio-dark/60 mb-1">Largo (cm)</label>
          <input
            type="number"
            min="1"
            value={largo}
            onChange={(e) => setLargo(e.target.value)}
            placeholder="ej: 60"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-bio-dark focus:border-bio-green focus:outline-none"
          />
        </div>
      </div>
      <a
        href={ready ? waHref : undefined}
        target={ready ? "_blank" : undefined}
        rel="noopener noreferrer"
        aria-disabled={!ready}
        onClick={!ready ? (e) => e.preventDefault() : undefined}
        className={`flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white transition-colors ${
          ready ? "bg-[#25D366] hover:bg-[#1ebe5c]" : "cursor-not-allowed bg-slate-300"
        }`}
      >
        Consultar medida por WhatsApp
      </a>
    </div>
  );
}
