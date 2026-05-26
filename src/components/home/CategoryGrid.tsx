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
          // Agregar Recetas si no está ya
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

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {items.map((cat) => (
          <Link
            key={cat.id}
            href={cat.href}
            className="group flex flex-col items-center overflow-hidden rounded-xl border border-gray-100 bg-white p-4 text-center shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-bio-green hover:shadow-card"
          >
            <span className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-bio-beige transition-colors group-hover:bg-bio-green/10">
              {cat.image ? (
                <Image
                  src={cat.image}
                  alt={cat.name}
                  width={64}
                  height={64}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-3xl">{cat.emoji}</span>
              )}
            </span>
            <p className="mt-3 text-xs font-semibold leading-snug text-bio-dark group-hover:text-bio-green">
              {cat.name}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
