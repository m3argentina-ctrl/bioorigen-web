import Link from "next/link";
import Image from "next/image";

type Category = {
  id: string;
  name: string;
  slug: string;
  image?: string | null;
};

type Props = { categories: Category[] };

const EMOJI: Record<string, string> = {
  Deshidratadores: "🌀",
  Industriales: "🏭",
  Accesorios: "🔧",
  Repuestos: "⚙️",
  Charqui: "🥩",
  Snacks: "🥨",
  Frutas: "🍎",
  Verduras: "🥕",
  Alimentos: "🥗",
  Recetas: "📖",
};

const FALLBACK: Array<{ id: string; name: string; href: string; image: null; emoji: string }> = [
  { id: "f1", name: "Deshidratadores Hogareños", href: "/productos?categoria=Deshidratadores", image: null, emoji: "🌀" },
  { id: "f2", name: "Línea Industrial", href: "/productos?categoria=Industriales", image: null, emoji: "🏭" },
  { id: "f3", name: "Accesorios", href: "/productos?categoria=Accesorios", image: null, emoji: "🔧" },
  { id: "f4", name: "Repuestos", href: "/productos?categoria=Repuestos", image: null, emoji: "⚙️" },
  { id: "f5", name: "Alimentos Deshidratados", href: "/productos?categoria=Alimentos", image: null, emoji: "🥗" },
  { id: "f6", name: "Recetas", href: "/recetas", image: null, emoji: "📖" },
];

export default function CategoryGrid({ categories }: Props) {
  const items =
    categories.length > 0
      ? [
          ...categories.map((c) => ({
            id: c.id,
            name: c.name,
            href: `/productos?categoria=${encodeURIComponent(c.name)}`,
            image: c.image ?? null,
            emoji: EMOJI[c.name] ?? "🌿",
          })),
          ...(!categories.some((c) => c.slug === "recetas" || c.name.toLowerCase().includes("receta"))
            ? [{ id: "recetas-link", name: "Recetas", href: "/recetas", image: null, emoji: "📖" }]
            : []),
        ]
      : FALLBACK;

  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <h2 className="text-center text-2xl font-extrabold text-bio-dark">
        Explorá nuestras categorías
      </h2>
      <p className="mt-1 text-center text-sm text-bio-dark/60">
        Encontrá el equipo o producto ideal para vos
      </p>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {items.map((cat) => (
          <Link
            key={cat.id}
            href={cat.href}
            className="group relative aspect-square overflow-hidden rounded-xl"
          >
            {/* Imagen o gradiente de fondo */}
            {cat.image ? (
              <Image
                src={cat.image}
                alt={cat.name}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                className="object-cover transition-transform duration-500 group-hover:scale-110"
              />
            ) : (
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #2D5016 0%, #4A7C59 100%)" }}
              >
                <span className="text-5xl transition-transform duration-300 group-hover:scale-110">
                  {cat.emoji}
                </span>
              </div>
            )}

            {/* Gradiente base para legibilidad del texto */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

            {/* Overlay verde al hover */}
            <div
              className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              style={{ backgroundColor: "rgba(45, 80, 22, 0.6)" }}
            />

            {/* Nombre */}
            <div className="absolute bottom-0 left-0 right-0 p-2.5">
              <p className="text-xs font-bold leading-snug text-white drop-shadow">
                {cat.name}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
