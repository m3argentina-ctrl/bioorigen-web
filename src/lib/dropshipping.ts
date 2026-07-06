import { prisma } from "@/lib/db";
import { sendSupplierOrderEmail } from "@/lib/email";
import type { OrderItem } from "@/lib/types";
import type { Prisma } from "@prisma/client";

type TxClient = Omit<
  typeof prisma,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

/**
 * Dentro de una transacción: crea SupplierOrders para todos los ítems del
 * pedido que tengan proveedor asignado. Devuelve el orderId si se crearon
 * órdenes (para que el llamador pueda enviar los emails después de commitear).
 * No envía emails aquí porque no podemos hacer fetch dentro de una tx.
 */
export async function createSupplierOrdersInTx(
  tx: TxClient,
  order: {
    id: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    customerAddress: string;
    items: Prisma.JsonValue;
  },
): Promise<boolean> {
  const orderItems = order.items as unknown as OrderItem[];
  const productIds = orderItems.map((i) => i.productId);

  const products = await tx.product.findMany({
    where: { id: { in: productIds }, supplierId: { not: null } },
    select: { id: true, supplierId: true, supplierCost: true },
  });

  if (products.length === 0) return false;

  // Agrupa por proveedor.
  const bySupplier = new Map<
    string,
    { productId: string; name: string; quantity: number; supplierCost: number }[]
  >();

  for (const item of orderItems) {
    const prod = products.find((p) => p.id === item.productId);
    if (!prod?.supplierId) continue;
    const list = bySupplier.get(prod.supplierId) ?? [];
    list.push({
      productId: item.productId,
      name: item.name,
      quantity: item.quantity,
      supplierCost: prod.supplierCost ?? 0,
    });
    bySupplier.set(prod.supplierId, list);
  }

  if (bySupplier.size === 0) return false;

  for (const [supplierId, items] of Array.from(bySupplier.entries())) {
    const totalCost = items.reduce((acc: number, i) => acc + i.supplierCost * i.quantity, 0);

    // Evita crear duplicados si ya existe una SupplierOrder para este pedido+proveedor.
    const exists = await tx.supplierOrder.findFirst({
      where: { orderId: order.id, supplierId },
    });
    if (exists) continue;

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

  return true;
}

/**
 * Fuera de la transacción: envía los emails pendientes a los proveedores y
 * actualiza el estado de las SupplierOrders a "notified".
 */
export async function notifySuppliers(orderId: string): Promise<void> {
  const baseUrl = process.env.NEXTAUTH_URL ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");

  const supplierOrders = await prisma.supplierOrder.findMany({
    where: { orderId, status: "pending" },
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
