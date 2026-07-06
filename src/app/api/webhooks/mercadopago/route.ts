import crypto from "crypto";
import { NextResponse } from "next/server";
import { Payment } from "mercadopago";
import { prisma } from "@/lib/db";
import { getMercadoPagoClient } from "@/lib/mercadopago";
import { sendSupplierOrderEmail } from "@/lib/email";
import type { OrderItem } from "@/lib/types";

export const dynamic = "force-dynamic";

// Verifica el header x-signature según la spec de MercadoPago. Devuelve true
// cuando no hay secret configurado (validación deshabilitada) para test local.
function isValidSignature(request: Request, dataId: string): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secret) {
    console.warn(
      "[webhook] MERCADOPAGO_WEBHOOK_SECRET no configurado — firma no verificada",
    );
    return true;
  }

  const signature = request.headers.get("x-signature");
  const requestId = request.headers.get("x-request-id");
  if (!signature || !requestId) return false;

  const parts = Object.fromEntries(
    signature.split(",").map((p) => p.split("=").map((s) => s.trim())),
  );
  const ts = parts.ts;
  const v1 = parts.v1;
  if (!ts || !v1) return false;

  const manifest = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${ts};`;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(manifest)
    .digest("hex");

  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(v1));
  } catch {
    return false;
  }
}

// Mapea el estado de pago de MercadoPago al status (String) de la orden.
function mapStatus(mpStatus: string | undefined): string {
  switch (mpStatus) {
    case "approved":
      return "paid";
    case "rejected":
    case "cancelled":
    case "refunded":
    case "charged_back":
      return "cancelled";
    default:
      return "pending";
  }
}

export async function POST(request: Request) {
  let payload: { type?: string; data?: { id?: string } } = {};
  try {
    payload = await request.json();
  } catch {
    // MercadoPago a veces manda el id solo como query param.
  }

  const url = new URL(request.url);
  const type = payload.type ?? url.searchParams.get("type") ?? "";
  const dataId =
    payload.data?.id ??
    url.searchParams.get("data.id") ??
    url.searchParams.get("id") ??
    "";

  if (type !== "payment" || !dataId) {
    // Confirma otros tipos de notificación para que MercadoPago no reintente.
    return NextResponse.json({ received: true });
  }

  if (!isValidSignature(request, dataId)) {
    return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
  }

  const mpClient = getMercadoPagoClient();
  if (!mpClient) {
    return NextResponse.json(
      { error: "MercadoPago no configurado" },
      { status: 503 },
    );
  }

  try {
    const payment = await new Payment(mpClient).get({ id: dataId });
    const orderId = payment.external_reference;
    if (!orderId) return NextResponse.json({ received: true });

    const newStatus = mapStatus(payment.status);

    let shouldNotifySuppliers = false;
    let notifyOrderId = "";

    await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: orderId } });
      if (!order || order.status === newStatus) return;

      await tx.order.update({
        where: { id: orderId },
        data: {
          status: newStatus,
          mercadoPagoId: String(payment.id),
          paymentStatus: payment.status ?? null,
        },
      });

      // Descuenta stock y crea órdenes de proveedor una sola vez, cuando pasa a "paid".
      if (newStatus === "paid" && order.status !== "paid") {
        const orderItems = order.items as unknown as OrderItem[];
        for (const item of orderItems) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          });
        }

        // Agrupa ítems por proveedor para crear una SupplierOrder por proveedor.
        const productIds = orderItems.map((i) => i.productId);
        const products = await tx.product.findMany({
          where: { id: { in: productIds }, supplierId: { not: null } },
          select: { id: true, supplierId: true, supplierCost: true },
        });

        // Map: supplierId → lista de items
        const bySupplier = new Map<string, { productId: string; name: string; quantity: number; supplierCost: number }[]>();
        for (const item of orderItems) {
          const prod = products.find((p) => p.id === item.productId);
          if (!prod?.supplierId) continue;
          const list = bySupplier.get(prod.supplierId) ?? [];
          list.push({ productId: item.productId, name: item.name, quantity: item.quantity, supplierCost: prod.supplierCost ?? 0 });
          bySupplier.set(prod.supplierId, list);
        }

        for (const [supplierId, items] of Array.from(bySupplier.entries())) {
          const totalCost = items.reduce((acc: number, i) => acc + i.supplierCost * i.quantity, 0);
          await tx.supplierOrder.create({
            data: {
              orderId: order.id,
              supplierId,
              status: "pending",
              items,
              customerName: order.customerName,
              customerEmail: order.customerEmail,
              customerPhone: order.customerPhone,
              shippingAddress: order.customerAddress,
              supplierCost: totalCost,
            },
          });
        }

        if (bySupplier.size > 0) {
          shouldNotifySuppliers = true;
          notifyOrderId = order.id;
        }
      }
    });

    // Envía emails a proveedores fuera de la transacción.
    if (shouldNotifySuppliers && notifyOrderId) {
      const baseUrl = process.env.NEXTAUTH_URL ?? process.env.VERCEL_URL ?? "";
      const supplierOrders = await prisma.supplierOrder.findMany({
        where: { orderId: notifyOrderId, status: "pending" },
        include: { supplier: true },
      });

      for (const so of supplierOrders) {
        const items = so.items as Array<{ name: string; quantity: number }>;
        const confirmUrl = `${baseUrl}/proveedor/confirmar/${so.confirmToken}`;
        const { ok } = await sendSupplierOrderEmail({
          supplierName: so.supplier.name,
          supplierEmail: so.supplier.email,
          supplierOrderId: so.id,
          customerName: so.customerName,
          customerPhone: so.customerPhone,
          customerEmail: so.customerEmail,
          shippingAddress: so.shippingAddress,
          items,
          confirmUrl,
        });
        if (ok) {
          await prisma.supplierOrder.update({
            where: { id: so.id },
            data: { status: "notified", notifiedAt: new Date() },
          });
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[webhook/mercadopago]", error);
    // Devuelve 500 para que MercadoPago reintente la notificación.
    return NextResponse.json(
      { error: "Error procesando la notificación" },
      { status: 500 },
    );
  }
}
