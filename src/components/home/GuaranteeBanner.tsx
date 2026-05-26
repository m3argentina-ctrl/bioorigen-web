import Link from "next/link";

const ITEMS = [
  { emoji: "🔧", title: "Servicio técnico disponible", text: "Asistencia en todo el país" },
  { emoji: "📦", title: "Repuestos originales", text: "Stock permanente de piezas" },
  { emoji: "⭐", title: "1 año de garantía", text: "Con certificado oficial escrito" },
];

export default function GuaranteeBanner() {
  return (
    <section className="py-16 text-white" style={{ background: "#1a3009" }}>
      <div className="mx-auto max-w-6xl px-4 text-center">
        <span className="inline-block rounded-full bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-widest">
          Tranquilidad garantizada
        </span>
        <h2 className="mx-auto mt-4 max-w-xl text-balance text-3xl font-extrabold md:text-4xl">
          Garantía oficial Bio Origen
        </h2>
        <p className="mt-2 text-white/70">
          Cada equipo sale de fábrica con controles de calidad y garantía escrita
        </p>

        <div className="mt-10 grid gap-8 sm:grid-cols-3">
          {ITEMS.map(({ emoji, title, text }) => (
            <div key={title} className="flex flex-col items-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-3xl">
                {emoji}
              </span>
              <p className="mt-3 text-lg font-bold">{title}</p>
              <p className="mt-1 text-sm text-white/70">{text}</p>
            </div>
          ))}
        </div>

        <div className="mt-10">
          <Link
            href="/nosotros"
            className="inline-block rounded-full border border-white/40 px-8 py-3 text-sm font-bold transition-colors hover:bg-white/10"
          >
            Conocé más
          </Link>
        </div>
      </div>
    </section>
  );
}
