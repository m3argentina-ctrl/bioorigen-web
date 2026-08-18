import { DynamicIcon } from "@/lib/icons";

type Item = { id: string; icon: string; title: string; text: string; active: boolean; order: number };

const DEFAULTS: Item[] = [
  { id: "d1", icon: "Truck",       title: "Envíos a todo el país",  text: "Andreani y Correo Argentino", active: true, order: 0 },
  { id: "d2", icon: "Shield",      title: "Compra 100% segura",     text: "Pagos protegidos con SSL",    active: true, order: 1 },
  { id: "d3", icon: "Award",       title: "Garantía oficial",       text: "Todos nuestros equipos",      active: true, order: 2 },
  { id: "d4", icon: "Headphones",  title: "Atención personalizada", text: "Lun–Vie de 9 a 18hs",         active: true, order: 3 },
];

export default function TrustBar({ items }: { items?: Item[] }) {
  const display = (items && items.length > 0 ? items : DEFAULTS)
    .filter((i) => i.active)
    .sort((a, b) => a.order - b.order);

  return (
    <section className="border-b border-gray-100 bg-white py-6">
      <div className="mx-auto max-w-6xl px-4">
        <div className="grid grid-cols-2 gap-x-4 gap-y-5 md:grid-cols-4">
          {display.map((item) => (
            <div key={item.id} className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-bio-beige text-bio-green">
                <DynamicIcon name={item.icon} size={20} />
              </span>
              <div>
                <p className="text-sm font-bold leading-tight text-bio-dark">{item.title}</p>
                <p className="text-xs text-bio-dark/60">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
