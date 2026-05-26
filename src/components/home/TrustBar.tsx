import { Truck, Shield, Award, Headphones } from "lucide-react";

const ITEMS = [
  { Icon: Truck, title: "Envíos a todo el país", text: "Andreani y Correo Argentino" },
  { Icon: Shield, title: "Compra 100% segura", text: "Pagos protegidos con SSL" },
  { Icon: Award, title: "Garantía oficial", text: "Todos nuestros equipos" },
  { Icon: Headphones, title: "Atención personalizada", text: "Lun–Vie de 9 a 18hs" },
];

export default function TrustBar() {
  return (
    <section className="border-b border-gray-100 bg-white py-6">
      <div className="mx-auto max-w-6xl px-4">
        <div className="grid grid-cols-2 gap-x-4 gap-y-5 md:grid-cols-4">
          {ITEMS.map(({ Icon, title, text }) => (
            <div key={title} className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-bio-beige text-bio-green">
                <Icon size={20} />
              </span>
              <div>
                <p className="text-sm font-bold leading-tight text-bio-dark">{title}</p>
                <p className="text-xs text-bio-dark/60">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
