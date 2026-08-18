"use client";

import { useState, useEffect } from "react";
import { Truck, CreditCard, Banknote, Phone } from "lucide-react";
import { DynamicIcon } from "@/lib/icons";

type CustomItem = { id: string; icon: string; text: string; active: boolean; order: number };

type Props = {
  freeShippingFrom: number;
  phone: string;
  transferDiscount: number;
  customItems: CustomItem[];
};

function fmt(n: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

export default function TopBar({ freeShippingFrom, phone, transferDiscount, customItems }: Props) {
  const discountLabel =
    transferDiscount > 0 ? `Transferencia ${transferDiscount}% OFF` : "Descuento por transferencia";

  const dynamicItems = [
    { id: "_shipping", Icon: Truck,       text: `Envío gratis desde ${fmt(freeShippingFrom)}` },
    { id: "_discount", Icon: Banknote,    text: discountLabel },
    { id: "_phone",    Icon: Phone,       text: phone },
  ];

  // Custom items (from admin) sorted by order, active only
  const activeCustom = [...customItems]
    .filter((i) => i.active)
    .sort((a, b) => a.order - b.order);

  const allItems = [
    ...activeCustom.map((i) => ({ id: i.id, text: i.text, iconName: i.icon })),
    ...dynamicItems.map((i) => ({ id: i.id, text: i.text, Icon: i.Icon })),
  ];

  const [active, setActive] = useState(0);

  useEffect(() => {
    if (allItems.length <= 1) return;
    const t = setInterval(() => setActive((c) => (c + 1) % allItems.length), 3000);
    return () => clearInterval(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allItems.length]);

  return (
    <div className="bg-bio-green-deep py-1.5 text-xs font-medium text-white">
      {/* Desktop: todos en fila */}
      <div className="mx-auto hidden max-w-6xl items-center justify-center gap-8 px-4 md:flex">
        {allItems.map((item) => (
          <span key={item.id} className="flex items-center gap-1.5 opacity-90 hover:opacity-100">
            {"Icon" in item ? (
              <item.Icon size={13} />
            ) : (
              <DynamicIcon name={(item as { iconName: string }).iconName} size={13} />
            )}
            {item.text}
          </span>
        ))}
      </div>

      {/* Mobile: carrusel */}
      <div className="relative mx-auto h-5 overflow-hidden px-4 md:hidden">
        {allItems.map((item, i) => (
          <span
            key={item.id}
            className="absolute inset-0 flex items-center justify-center gap-1.5 transition-all duration-500"
            style={{
              opacity: i === active ? 1 : 0,
              transform:
                i === active ? "translateY(0)" : i < active ? "translateY(-120%)" : "translateY(120%)",
            }}
          >
            {"Icon" in item ? (
              <item.Icon size={13} />
            ) : (
              <DynamicIcon name={(item as { iconName: string }).iconName} size={13} />
            )}
            {item.text}
          </span>
        ))}
      </div>
    </div>
  );
}
