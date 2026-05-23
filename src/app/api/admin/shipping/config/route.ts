import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const config = await prisma.shippingConfig.findFirst();
  return NextResponse.json(config ?? null);
}

const Schema = z.object({
  andreaniEnabled:   z.boolean().optional(),
  andreaniDomicilio: z.number().positive().optional(),
  andreaniSucursal:  z.number().positive().optional(),
  andreaniDays:      z.string().min(1).optional(),
  andreaniInsurance: z.boolean().optional(),
  correoEnabled:     z.boolean().optional(),
  correoDomicilio:   z.number().positive().optional(),
  correoSucursal:    z.number().positive().optional(),
  correoDays:        z.string().min(1).optional(),
  correoInsurance:   z.boolean().optional(),
});

export async function PUT(request: Request) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const body = Schema.parse(await request.json());
    const existing = await prisma.shippingConfig.findFirst();

    const config = existing
      ? await prisma.shippingConfig.update({ where: { id: existing.id }, data: body })
      : await prisma.shippingConfig.create({ data: body });

    return NextResponse.json(config);
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.issues }, { status: 400 });
    return NextResponse.json({ error: "Error al guardar" }, { status: 500 });
  }
}
