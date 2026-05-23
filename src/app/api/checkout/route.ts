import { NextResponse } from "next/server";
import { Preference } from "mercadopago";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getMercadoPagoClient, getBaseUrl } from "@/lib/mercadopago";
import { calculateShipping } from "@/lib/shipping/calculator";
import { createOrder as createOpenpayOrder, isConfigured as openpayConfigured } from "@/lib/openpayar";

async function getPaymentConfig() {
  const cfg = await prisma.paymentConfig.findFirst();
  return cfg ?? { bankTransferEnabled: false, bankTransferDiscount: 0, bankName: "", bankHolder: "", bankCbu: "", bankAlias: "", bankNote: "" };
}

export const dynamic = "force-dynamic";

const ME2_ENABLED = process.env.MERCADO_ENVIOS_ENABLED === "true";
const ME2_ORIGIN_ZIP = process.env.MERCADO_ENVIOS_ORIGIN_ZIP ?? "1648";

// Dimensiones por defecto cuando el producto no tiene datos cargados
const DEFAULT_WEIGHT_G = 500;
const DEFAULT_HEIGHT_CM = 10;
const DEFAULT_WIDTH_CM = 15;
const DEFAULT_LENGTH_CM = 20;

type CheckoutBody = {
  items?: { productId?: unknown; quantity?: unknown }[];
  customer?: {
    name?: unknown;
    email?: unknown;
    phone?: unknown;
    address?: unknown;
    city?: unknown;
    postalCode?: unknown;
  };
  carrier?: string;
  shippingMethod?: string;
  paymentMethod?: string;
};

function str(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export async function POST(request: Request) {
  let body: CheckoutBody;
  try {
    body = (await request.json()) as CheckoutBody;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const items = Array.isArray(body.items) ? body.items : [];
  if (items.length === 0) {
    return NextResponse.json({ error: "El carrito está vacío" }, { status: 400 });
  }

  const requested = new Map<string, number>();
  for (const item of items) {
    if (typeof item.productId !== "string" || typeof item.quantity !== "number") {
      return NextResponse.json({ error: "Items inválidos" }, { status: 400 });
    }
    const qty = Math.round(item.quantity);
    if (qty <= 0) continue;
    requested.set(item.productId, (requested.get(item.productId) ?? 0) + qty);
  }
  if (requested.size === 0) {
    return NextResponse.json({ error: "El carrito está vacío" }, { status: 400 });
  }

  try {
    const products = await prisma.product.findMany({
      where: { id: { in: Array.from(requested.keys()) } },
    });

    if (products.length !== requested.size) {
      return NextResponse.json({ error: "Algunos productos ya no existen" }, { status: 400 });
    }

    const lineItems = products.map((product) => {
      const quantity = requested.get(product.id)!;
      return {
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity,
        // dimensiones para ME2
        weightGrams: product.weightGrams ?? DEFAULT_WEIGHT_G,
        heightCm: product.heightCm ?? DEFAULT_HEIGHT_CM,
        widthCm: product.widthCm ?? DEFAULT_WIDTH_CM,
        lengthCm: product.lengthCm ?? DEFAULT_LENGTH_CM,
      };
    });

    const subtotal = lineItems.reduce((sum, li) => sum + li.price * li.quantity, 0);
    const address    = str(body.customer?.address);
    const city       = str(body.customer?.city);
    const postalCode = str(body.customer?.postalCode);
    const customerAddress = [address, city, postalCode].filter(Boolean).join(", ");
    const selectedCarrier = (body.carrier ?? "andreani") as "andreani" | "correoargentino";
    const selectedMethod  = (body.shippingMethod ?? "domicilio") as "domicilio" | "sucursal";
    const rawPayment      = body.paymentMethod ?? "mercadopago";
    const paymentMethod   = ["bank_transfer", "openpay"].includes(rawPayment) ? rawPayment : "mercadopago";

    // Calcular envío usando el sistema configurable (o 0 si ME2 activo)
    let shipping = 0;
    let shippingIsFree = false;
    let shippingFreeReason: string | undefined;

    if (!ME2_ENABLED) {
      const shippingCalc = await calculateShipping({
        subtotal,
        zipCode: postalCode,
        productIds: lineItems.map((li) => li.productId),
        categories: products.map((p) => p.category),
      });
      const option = shippingCalc.options.find(
        (o) => o.carrier === selectedCarrier && o.method === selectedMethod,
      ) ?? shippingCalc.options[0];

      if (option) {
        shipping = option.cost;
        shippingIsFree = option.isFree;
        shippingFreeReason = option.freeReason;
      }
    }

    // Descuento por transferencia bancaria
    let discount = 0;
    if (paymentMethod === "bank_transfer") {
      const payCfg = await getPaymentConfig();
      if (payCfg.bankTransferEnabled && payCfg.bankTransferDiscount > 0) {
        discount = Math.round(subtotal * (payCfg.bankTransferDiscount / 100));
      }
    }

    const total = subtotal + shipping - discount;

    const order = await prisma.order.create({
      data: {
        customerName: str(body.customer?.name) || "Cliente",
        customerEmail: str(body.customer?.email),
        customerPhone: str(body.customer?.phone),
        customerAddress,
        items: lineItems.map(({ productId, name, price, quantity }) => ({
          productId, name, price, quantity,
        })) as unknown as Prisma.InputJsonValue,
        subtotal,
        shipping,
        discount,
        total,
        status: "pending",
        paymentMethod,
        shippingCarrier: ME2_ENABLED ? "me2" : selectedCarrier,
        shippingMethod: ME2_ENABLED ? undefined : selectedMethod,
        shippingIsFree,
        shippingFreeReason: shippingFreeReason ?? null,
      },
    });

    // Transferencia bancaria: no pasa por MercadoPago
    if (paymentMethod === "bank_transfer") {
      const payCfg = await getPaymentConfig();
      console.log(`[checkout] Orden ${order.id} — transferencia bancaria — total $${total} (descuento $${discount})`);
      return NextResponse.json({
        orderId: order.id,
        paymentMethod: "bank_transfer",
        bankDetails: {
          bankName: payCfg.bankName,
          bankHolder: payCfg.bankHolder,
          bankCbu: payCfg.bankCbu,
          bankAlias: payCfg.bankAlias,
          bankNote: payCfg.bankNote,
          discount,
          total,
        },
      });
    }

    // OpenPay Argentina: crear orden y redirigir al checkout hosted
    if (paymentMethod === "openpay") {
      if (!openpayConfigured()) {
        return NextResponse.json({ error: "OpenPay no está configurado. Definí OPENPAY_AR_CLIENT_ID y OPENPAY_AR_CLIENT_SECRET." }, { status: 503 });
      }

      const baseUrl = getBaseUrl();
      const isPublicUrl = baseUrl.startsWith("https://");

      const opItems = lineItems.map((li) => ({
        id: li.productId,
        name: li.name,
        unitPrice: li.price,
        quantity: li.quantity,
      }));

      if (!ME2_ENABLED && shipping > 0) {
        opItems.push({ id: "shipping", name: "Envío", unitPrice: shipping, quantity: 1 });
      }

      const checkoutUrl = await createOpenpayOrder({
        orderId: order.id,
        items: opItems,
        successUrl: `${baseUrl}/checkout/success?orderId=${order.id}`,
        failureUrl: `${baseUrl}/checkout/failure?orderId=${order.id}`,
        ...(isPublicUrl && { webhookUrl: `${baseUrl}/api/webhooks/openpayar` }),
      });

      console.log(`[checkout/openpay] Orden ${order.id} — total $${total} — redirigiendo a OpenPay AR`);
      return NextResponse.json({ orderId: order.id, paymentMethod: "openpay", checkoutUrl });
    }

    const mpClient = getMercadoPagoClient();
    if (!mpClient) {
      return NextResponse.json(
        { error: "MercadoPago no está configurado. Definí MERCADOPAGO_ACCESS_TOKEN.", orderId: order.id },
        { status: 503 },
      );
    }

    const baseUrl = getBaseUrl();
    const isPublicUrl = baseUrl.startsWith("https://");

    const mpItems = lineItems.map((li) => ({
      id: li.productId,
      title: li.name,
      quantity: li.quantity,
      unit_price: li.price,
      currency_id: "ARS",
    }));

    // Envío fijo como ítem separado (solo cuando ME2 está desactivado)
    if (!ME2_ENABLED && shipping > 0) {
      mpItems.push({
        id: "shipping",
        title: "Envío",
        quantity: 1,
        unit_price: shipping,
        currency_id: "ARS",
      });
    }

    // Calcula el paquete combinado para ME2: max de dimensiones, suma de pesos
    const me2Dimensions = ME2_ENABLED ? buildDimensions(lineItems) : null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const shipments: any = ME2_ENABLED
      ? {
          mode: "me2",
          dimensions: me2Dimensions,
          local_pick_up: false,
          receiver_address: {
            zip_code: postalCode || undefined,
            street_name: address || undefined,
            city_name: city || undefined,
          },
        }
      : undefined;

    const preference = await new Preference(mpClient).create({
      body: {
        items: mpItems,
        payer: {
          name: str(body.customer?.name) || undefined,
          email: str(body.customer?.email) || undefined,
        },
        external_reference: order.id,
        back_urls: {
          success: `${baseUrl}/checkout/success`,
          failure: `${baseUrl}/checkout/failure`,
          pending: `${baseUrl}/checkout/pending`,
        },
        ...(isPublicUrl && {
          auto_return: "approved" as const,
          notification_url: `${baseUrl}/api/webhooks/mercadopago`,
        }),
        ...(shipments && { shipments }),
      },
    });

    console.log(
      `[checkout] Orden ${order.id} — subtotal $${subtotal} envío $${shipping} total $${total}${ME2_ENABLED ? " [ME2]" : ""} — pref ${preference.id}`,
    );

    return NextResponse.json({
      orderId: order.id,
      preferenceId: preference.id,
      initPoint: preference.init_point,
      sandboxInitPoint: preference.sandbox_init_point ?? preference.init_point,
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : JSON.stringify(error, null, 2);
    console.error("[POST /api/checkout]", detail);
    return NextResponse.json({ error: "Error al procesar el checkout", detail }, { status: 500 });
  }
}

type LineItem = {
  quantity: number;
  weightGrams: number;
  heightCm: number;
  widthCm: number;
  lengthCm: number;
};

function buildDimensions(items: LineItem[]): string {
  let totalWeight = 0;
  let maxH = 0;
  let maxW = 0;
  let maxL = 0;
  for (const item of items) {
    totalWeight += item.weightGrams * item.quantity;
    if (item.heightCm > maxH) maxH = item.heightCm;
    if (item.widthCm > maxW) maxW = item.widthCm;
    if (item.lengthCm > maxL) maxL = item.lengthCm;
  }
  // ME2 formato: {alto}x{ancho}x{largo},{peso_gramos}
  return `${Math.ceil(maxH)}x${Math.ceil(maxW)}x${Math.ceil(maxL)},${Math.ceil(totalWeight)}`;
}

// Silencia el warning de variable no usada (usada para log/contexto)
void ME2_ORIGIN_ZIP;
