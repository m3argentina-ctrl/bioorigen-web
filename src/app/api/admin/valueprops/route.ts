import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const props = await prisma.valueProp.findMany({ orderBy: { order: "asc" } });
  return NextResponse.json(props);
}

const Schema = z.object({
  icon: z.string().min(1),
  title: z.string().min(1),
  text: z.string().min(1),
  order: z.number().int().default(0),
  active: z.boolean().default(true),
});

export async function POST(request: Request) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const body = Schema.parse(await request.json());
    const prop = await prisma.valueProp.create({ data: body });
    return NextResponse.json(prop, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.issues }, { status: 400 });
    return NextResponse.json({ error: "Error al crear" }, { status: 500 });
  }
}
