import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const supplier = await prisma.supplier.findUnique({
    where: { id: params.id },
    include: { products: { select: { id: true, name: true, slug: true } } },
  });
  if (!supplier) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json(supplier);
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const body = await request.json();
    const { name, email, phone, address, notes, paymentTerms, active } = body;

    if (!name?.trim() || !email?.trim()) {
      return NextResponse.json({ error: "Nombre y email son obligatorios" }, { status: 400 });
    }

    const supplier = await prisma.supplier.update({
      where: { id: params.id },
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || null,
        address: address?.trim() || null,
        notes: notes?.trim() || null,
        paymentTerms: paymentTerms?.trim() || null,
        active: active !== false,
      },
    });
    return NextResponse.json(supplier);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Error" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const count = await prisma.product.count({ where: { supplierId: params.id } });
  if (count > 0) {
    return NextResponse.json(
      { error: `No se puede eliminar: ${count} producto(s) vinculado(s). Desvincularlos primero.` },
      { status: 409 },
    );
  }

  await prisma.supplier.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
