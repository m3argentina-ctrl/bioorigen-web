"use client";

import { useState, useEffect } from "react";
import { Truck, CreditCard, Banknote, Phone } from "lucide-react";

type Props = {
  freeShippingFrom: number;
  phone: string;
  transferDiscount: number;
};

function fmt(n: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

export default function TopBar({ freeShippingFrom, phone, transferDiscount }: Props) {
  const discountLabel =
    transferDiscount > 0 ? `Transferencia ${transferDiscount}% OFF` : "Descuento por transferencia";

  const items = [
    { Icon: CreditCard, text: "3 cuotas sin interés" },
    { Icon: Truck, text: `Envío gratis desde ${fmt(freeShippingFrom)}` },
    { Icon: Banknote, text: discountLabel },
    { Icon: Phone, text: phone },
  ];

  const [active, setActive] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setActive((c) => (c + 1) % items.length), 3000);
    return () => clearInterval(t);
  }, [items.length]);

  return (
    <div className="bg-bio-green-deep py-1.5 text-xs font-medium text-white">
      {/* Desktop: todos los ítems en fila */}
      <div className="mx-auto hidden max-w-6xl items-center justify-center gap-8 px-4 md:flex">
        {items.map(({ Icon, text }) => (
          <span key={text} className="flex items-center gap-1.5 opacity-90 hover:opacity-100">
            <Icon size={13} />
            {text}
          </span>
        ))}
      </div>

      {/* Mobile: carrusel */}
      <div className="relative mx-auto h-5 overflow-hidden px-4 md:hidden">
        {items.map(({ Icon, text }, i) => (
          <span
            key={text}
            className="absolute inset-0 flex items-center justify-center gap-1.5 transition-all duration-500"
            style={{
              opacity: i === active ? 1 : 0,
              transform:
                i === active ? "translateY(0)" : i < active ? "translateY(-120%)" : "translateY(120%)",
            }}
          >
            <Icon size={13} />
            {text}
          </span>
        ))}
      </div>
    </div>
  );
}
