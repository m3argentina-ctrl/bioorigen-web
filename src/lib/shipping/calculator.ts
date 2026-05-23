import { prisma } from "@/lib/db";
import type { FreeShippingConfig, ShippingConfig } from "@prisma/client"; // disponible tras prisma generate

export type Carrier = "andreani" | "correoargentino";
export type ShippingMethod = "domicilio" | "sucursal";

export interface ShippingOption {
  carrier: Carrier;
  method: ShippingMethod;
  label: string;
  cost: number;
  isFree: boolean;
  freeReason?: string;
  days: string;
  hasInsurance: boolean;
}

export interface FreeShippingProgress {
  hasRule: boolean;
  minimumAmount: number;
  amountRemaining: number;
  percentage: number;
  qualifies: boolean;
}

export interface ShippingCalculationResult {
  options: ShippingOption[];
  progress: FreeShippingProgress | null;
}

export async function calculateShipping(params: {
  subtotal: number;
  zipCode?: string;
  productIds?: string[];
  categories?: string[];
  couponCode?: string;
}): Promise<ShippingCalculationResult> {
  const [config, freeRules] = await Promise.all([
    prisma.shippingConfig.findFirst(),
    prisma.freeShippingConfig.findMany({
      where: { enabled: true },
      orderBy: { priority: "desc" },
    }),
  ]);

  // Si no hay config de carriers, usar valores por defecto
  const cfg: ShippingConfig = config ?? {
    id: "default",
    andreaniEnabled: true,
    andreaniDomicilio: 13000,
    andreaniSucursal: 11000,
    andreaniDays: "2-4 días",
    andreaniInsurance: true,
    correoEnabled: true,
    correoDomicilio: 19000,
    correoSucursal: 16000,
    correoDays: "6-10 días",
    correoInsurance: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  function checkFree(carrier: Carrier): { isFree: boolean; reason?: string } {
    for (const rule of freeRules) {
      if (carrier === "andreani" && !rule.applyAndreani) continue;
      if (carrier === "correoargentino" && !rule.applyCorreo) continue;
      if (qualifiesForFreeShipping(rule, params)) {
        return { isFree: true, reason: freeReason(rule) };
      }
    }
    return { isFree: false };
  }

  const options: ShippingOption[] = [];

  if (cfg.andreaniEnabled) {
    const { isFree, reason } = checkFree("andreani");
    options.push({
      carrier: "andreani", method: "domicilio",
      label: "Andreani — A domicilio",
      cost: isFree ? 0 : cfg.andreaniDomicilio,
      isFree, freeReason: reason,
      days: cfg.andreaniDays, hasInsurance: cfg.andreaniInsurance,
    });
    options.push({
      carrier: "andreani", method: "sucursal",
      label: "Andreani — Retiro en sucursal",
      cost: isFree ? 0 : cfg.andreaniSucursal,
      isFree, freeReason: reason,
      days: cfg.andreaniDays, hasInsurance: cfg.andreaniInsurance,
    });
  }

  if (cfg.correoEnabled) {
    const { isFree, reason } = checkFree("correoargentino");
    options.push({
      carrier: "correoargentino", method: "domicilio",
      label: "Correo Argentino — A domicilio",
      cost: isFree ? 0 : cfg.correoDomicilio,
      isFree, freeReason: reason,
      days: cfg.correoDays, hasInsurance: cfg.correoInsurance,
    });
    options.push({
      carrier: "correoargentino", method: "sucursal",
      label: "Correo Argentino — Retiro en sucursal",
      cost: isFree ? 0 : cfg.correoSucursal,
      isFree, freeReason: reason,
      days: cfg.correoDays, hasInsurance: cfg.correoInsurance,
    });
  }

  // Progreso hacia envío gratis por monto mínimo
  const minRule = freeRules.find((r) => r.type === "minimum_amount" && r.minimumAmount != null);
  const progress: FreeShippingProgress | null = minRule?.minimumAmount
    ? {
        hasRule: true,
        minimumAmount: minRule.minimumAmount,
        amountRemaining: Math.max(0, minRule.minimumAmount - params.subtotal),
        percentage: Math.min(100, (params.subtotal / minRule.minimumAmount) * 100),
        qualifies: params.subtotal >= minRule.minimumAmount,
      }
    : null;

  return { options, progress };
}

function qualifiesForFreeShipping(
  rule: FreeShippingConfig,
  params: { subtotal: number; zipCode?: string; productIds?: string[]; categories?: string[]; couponCode?: string },
): boolean {
  switch (rule.type) {
    case "always":
      return true;
    case "never":
      return false;
    case "minimum_amount":
      return params.subtotal >= (rule.minimumAmount ?? 0);
    case "by_date": {
      if (!rule.startDate || !rule.endDate) return false;
      const now = new Date();
      return now >= rule.startDate && now <= rule.endDate;
    }
    case "by_location":
      if (!params.zipCode || rule.freeZipCodes.length === 0) return false;
      return rule.freeZipCodes.some((z: string) =>
        params.zipCode!.toUpperCase().startsWith(z.toUpperCase()),
      );
    case "by_product":
      if (!params.productIds?.length || !rule.productIds.length) return false;
      return params.productIds.some((id) => rule.productIds.includes(id));
    case "by_category":
      if (!params.categories?.length || !rule.categories.length) return false;
      return params.categories.some((c) => rule.categories.includes(c));
    case "by_coupon":
      if (!params.couponCode || !rule.couponCode) return false;
      return params.couponCode.toUpperCase() === rule.couponCode.toUpperCase();
    default:
      return false;
  }
}

function freeReason(rule: FreeShippingConfig): string {
  switch (rule.type) {
    case "always": return "Todos los envíos son gratis";
    case "minimum_amount": return `Compra superior a $${rule.minimumAmount?.toLocaleString("es-AR")}`;
    case "by_date": return rule.campaignName ?? "Campaña especial";
    case "by_location": return "Envío gratis a tu zona";
    case "by_product": return "Producto con envío gratis incluido";
    case "by_category": return "Categoría con envío gratis";
    case "by_coupon": return `Cupón aplicado: ${rule.couponCode}`;
    default: return "Envío gratis aplicado";
  }
}
