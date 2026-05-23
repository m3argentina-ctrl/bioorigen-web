import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

type OrderItem = { productId: string; name: string; price: number; quantity: number };

const STATUS_LABELS: Record<string, string> = {
  pending:   "Pendiente",
  paid:      "Pagado",
  shipped:   "Enviado",
  completed: "Completado",
  cancelled: "Cancelado",
  failed:    "Fallido",
};

const PAYMENT_LABELS: Record<string, string> = {
  mercadopago:   "MercadoPago",
  bank_transfer: "Transferencia Bancaria",
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  approved:   "Aprobado",
  pending:    "Pendiente",
  rejected:   "Rechazado",
  in_process: "En proceso",
  refunded:   "Devuelto",
  cancelled:  "Cancelado",
};

const CARRIER_LABELS: Record<string, string> = {
  andreani:        "Andreani",
  correoargentino: "Correo Argentino",
  me2:             "Mercado Envíos",
};

const METHOD_LABELS: Record<string, string> = {
  domicilio: "A domicilio",
  sucursal:  "Retiro en sucursal",
};

function fmt(n: number) {
  return n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(d: Date) {
  return d.toLocaleString("es-AR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export async function GET() {
  const authError = await requireAdmin();
  if (authError) return authError;

  const orders = await prisma.order.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  /* ── Hoja 1: Órdenes ── */
  const ordersRows = orders.map((o) => {
    const items = (o.items as unknown as OrderItem[]) ?? [];
    const itemsSummary = items.map((i) => `${i.name} ×${i.quantity}`).join(" | ");

    return {
      "ID Corto":            `#${o.id.slice(-8).toUpperCase()}`,
      "ID Completo":         o.id,
      "Fecha":               fmtDate(new Date(o.createdAt)),
      "Última actualización": fmtDate(new Date(o.updatedAt)),
      "Estado":              STATUS_LABELS[o.status] ?? o.status,
      // Cliente
      "Cliente":             o.customerName,
      "Email":               o.customerEmail,
      "Teléfono":            o.customerPhone ?? "",
      "Dirección":           o.customerAddress ?? "",
      // Productos
      "Productos":           itemsSummary,
      "Cant. artículos":     items.reduce((s, i) => s + i.quantity, 0),
      // Importes
      "Subtotal ($)":        fmt(o.subtotal),
      "Descuento ($)":       o.discount > 0 ? fmt(o.discount) : "",
      "Envío ($)":           o.shippingIsFree ? "GRATIS" : fmt(o.shipping),
      "Total ($)":           fmt(o.total),
      // Pago
      "Medio de pago":       PAYMENT_LABELS[o.paymentMethod] ?? o.paymentMethod,
      "Estado de pago":      o.paymentStatus ? (PAYMENT_STATUS_LABELS[o.paymentStatus] ?? o.paymentStatus) : "",
      "MP ID":               o.mercadoPagoId ?? "",
      // Envío
      "Carrier":             o.shippingCarrier ? (CARRIER_LABELS[o.shippingCarrier] ?? o.shippingCarrier) : "",
      "Modalidad envío":     o.shippingMethod ? (METHOD_LABELS[o.shippingMethod] ?? o.shippingMethod) : "",
      "Envío gratis":        o.shippingIsFree ? "Sí" : "No",
      "Motivo envío gratis": o.shippingFreeReason ?? "",
    };
  });

  /* ── Hoja 2: Detalle de productos ── */
  const itemRows: Record<string, string | number>[] = [];
  for (const o of orders) {
    const items = (o.items as unknown as OrderItem[]) ?? [];
    for (const item of items) {
      itemRows.push({
        "ID Orden":   `#${o.id.slice(-8).toUpperCase()}`,
        "Fecha":      fmtDate(new Date(o.createdAt)),
        "Cliente":    o.customerName,
        "Estado":     STATUS_LABELS[o.status] ?? o.status,
        "Producto":   item.name,
        "Precio u.":  fmt(item.price),
        "Cantidad":   item.quantity,
        "Subtotal":   fmt(item.price * item.quantity),
      });
    }
  }

  /* ── Armar workbook ── */
  const wb = XLSX.utils.book_new();

  const ws1 = XLSX.utils.json_to_sheet(ordersRows);
  ws1["!cols"] = [
    { wch: 12 }, // ID Corto
    { wch: 30 }, // ID Completo
    { wch: 18 }, // Fecha
    { wch: 18 }, // Última actualización
    { wch: 14 }, // Estado
    { wch: 26 }, // Cliente
    { wch: 28 }, // Email
    { wch: 18 }, // Teléfono
    { wch: 38 }, // Dirección
    { wch: 50 }, // Productos
    { wch: 14 }, // Cant. artículos
    { wch: 14 }, // Subtotal
    { wch: 14 }, // Descuento
    { wch: 14 }, // Envío
    { wch: 14 }, // Total
    { wch: 22 }, // Medio de pago
    { wch: 16 }, // Estado de pago
    { wch: 20 }, // MP ID
    { wch: 18 }, // Carrier
    { wch: 20 }, // Modalidad envío
    { wch: 13 }, // Envío gratis
    { wch: 30 }, // Motivo envío gratis
  ];

  const ws2 = XLSX.utils.json_to_sheet(itemRows);
  ws2["!cols"] = [
    { wch: 12 }, // ID Orden
    { wch: 18 }, // Fecha
    { wch: 26 }, // Cliente
    { wch: 14 }, // Estado
    { wch: 36 }, // Producto
    { wch: 14 }, // Precio u.
    { wch: 10 }, // Cantidad
    { wch: 14 }, // Subtotal
  ];

  XLSX.utils.book_append_sheet(wb, ws1, "Órdenes");
  XLSX.utils.book_append_sheet(wb, ws2, "Detalle productos");

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  const today = new Date().toISOString().slice(0, 10);

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="ordenes-${today}.xlsx"`,
    },
  });
}
