"use client";

import { useState } from "react";
import { Mail } from "lucide-react";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setStatus(res.ok ? "ok" : "error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <section className="bg-bio-orange py-14 text-white">
      <div className="mx-auto max-w-2xl px-4 text-center">
        <Mail className="mx-auto mb-3 opacity-80" size={32} />
        <h2 className="text-2xl font-extrabold">Recibí recetas y ofertas exclusivas</h2>
        <p className="mt-2 text-white/80">
          Suscribite y sé el primero en conocer nuestras novedades y promociones.
        </p>

        {status === "ok" ? (
          <p className="mt-6 rounded-xl bg-white/20 px-6 py-4 text-sm font-semibold">
            ¡Gracias! Te avisaremos con las mejores ofertas y recetas.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className="w-full max-w-xs rounded-full border-0 px-5 py-3 text-sm text-bio-dark outline-none ring-2 ring-white/40 focus:ring-white sm:w-72"
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="rounded-full bg-white px-6 py-3 text-sm font-bold text-bio-orange transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {status === "loading" ? "Enviando..." : "Suscribirme"}
            </button>
          </form>
        )}

        {status === "error" && (
          <p className="mt-3 text-sm text-white/80">Ocurrió un error. Por favor intentá de nuevo.</p>
        )}
      </div>
    </section>
  );
}
