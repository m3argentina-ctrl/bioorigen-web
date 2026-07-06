import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendTrackingNotification } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { token: string } }) {
  const so = await prisma.supplierOrder.findUnique({
    where: { confirmToken: params.token },
    include: { supplier: { select: { name: true } } },
  });
  if (!so) return NextResponse.json({ error: "Token inválido" }, { status: 404 });
  return NextResponse.json({
    id: so.id,
    status: so.status,
    customerName: so.customerName,
    shippingAddress: so.shippingAddress,
    items: so.items,
    trackingNumber: so.trackingNumber,
    carrier: so.carrier,
    supplierName: so.supplier.name,
  });
}

export async function POST(request: Request, { params }: { params: { token: string } }) {
  const so = await prisma.supplierOrder.findUnique({
    where: { confirmToken: params.token },
    include: { supplier: { select: { name: true } } },
  });

  if (!so) return NextResponse.json({ error: "Token inválido" }, { status: 404 });
  if (so.status === "cancelled") {
    return NextResponse.json({ error: "Esta orden fue cancelada" }, { status: 409 });
  }

  const body = await request.json();
  const trackingNumber = (body.trackingNumber ?? "").trim();
  const carrier = (body.carrier ?? "").trim();

  if (!trackingNumber || !carrier) {
    return NextResponse.json({ error: "Tracking y transportista son obligatorios" }, { status: 400 });
  }

  await prisma.supplierOrder.update({
    where: { id: so.id },
    data: { status: "shipped", trackingNumber, carrier, shippedAt: new Date() },
  });

  const items = so.items as Array<{ name: string; quantity: number }>;
  await sendTrackingNotification({
    customerName: so.customerName,
    customerEmail: so.customerEmail,
    orderId: so.orderId,
    carrier,
    trackingNumber,
    items,
  });

  return NextResponse.json({ ok: true });
}
