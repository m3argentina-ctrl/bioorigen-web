import Link from "next/link";

export default function PromoBanner() {
  return (
    <section
      className="relative overflow-hidden py-20 text-white"
      style={{ background: "linear-gradient(135deg, #2D5016 0%, #4A7C59 100%)" }}
    >
      {/* Círculos decorativos */}
      <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/5" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-white/5" />
      <div className="pointer-events-none absolute right-1/3 top-1/2 h-40 w-40 -translate-y-1/2 rounded-full bg-white/5" />

      <div className="relative mx-auto max-w-6xl px-4 text-center">
        <span className="inline-block rounded-full bg-white/20 px-4 py-1 text-xs font-semibold uppercase tracking-widest">
          Línea Industrial
        </span>
        <h2 className="mx-auto mt-4 max-w-2xl text-balance text-3xl font-extrabold md:text-4xl">
          Deshidratá tus alimentos como un profesional
        </h2>
        <p className="mt-3 text-white/80">
          Conocé nuestra línea industrial FA-10T · Alta capacidad · Uso continuo 24hs
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/productos?categoria=Deshidratadores"
            className="rounded-full bg-bio-orange px-8 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
          >
            Ver modelos
          </Link>
          <Link
            href="/contacto"
            className="rounded-full border border-white/60 px-8 py-3 text-sm font-bold transition-colors hover:bg-white/10"
          >
            Consultar precio
          </Link>
        </div>
      </div>
    </section>
  );
}
