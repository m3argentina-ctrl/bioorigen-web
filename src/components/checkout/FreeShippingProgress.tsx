"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Truck, CheckCircle2, ShoppingBag } from "lucide-react";
import { formatPrice } from "@/lib/format";
import type { FreeShippingProgress as ProgressData } from "@/lib/shipping/calculator";

export default function FreeShippingProgress({ subtotal }: { subtotal: number }) {
  const [progress, setProgress] = useState<ProgressData | null>(null);

  useEffect(() => {
    if (subtotal < 0) return;
    fetch("/api/shipping/calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subtotal }),
    })
      .then((r) => r.json())
      .then((data) => setProgress(data.progress ?? null))
      .catch(() => null);
  }, [subtotal]);

  if (!progress) return null;

  if (progress.qualifies) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-bio-green/10 px-4 py-3 text-sm text-bio-green">
        <CheckCircle2 size={18} className="shrink-0" />
        <span className="font-semibold">¡Envío gratis desbloqueado!</span>
      </div>
    );
  }

  return (
    <div className="space-y-2 rounded-xl bg-slate-50 px-4 py-3 text-sm">
      <div className="flex items-center justify-between text-slate-600">
        <div className="flex items-center gap-1.5">
          <Truck size={15} />
          <span>
            Te faltan <strong className="text-bio-green">{formatPrice(progress.amountRemaining)}</strong> para envío gratis
          </span>
        </div>
        <span className="text-xs text-slate-400">{Math.round(progress.percentage)}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-bio-green transition-all duration-500"
          style={{ width: `${progress.percentage}%` }}
        />
      </div>
      <Link
        href="/productos"
        className="flex items-center justify-center gap-1.5 rounded-lg border border-bio-green/40 py-2 text-xs font-semibold text-bio-green transition-colors hover:bg-bio-green hover:text-white"
      >
        <ShoppingBag size={13} />
        Agregar más productos
      </Link>
    </div>
  );
}
