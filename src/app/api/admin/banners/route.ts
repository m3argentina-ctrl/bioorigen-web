import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const banners = await prisma.banner.findMany({ orderBy: { order: "asc" } });
  return NextResponse.json(banners);
}

const BannerSchema = z.object({
  title: z.string().min(1),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  image: z.string().min(1),
  buttonText: z.string().optional(),
  buttonLink: z.string().optional(),
  bgColor: z.string().default("#4A7C59"),
  order: z.number().int().default(0),
  active: z.boolean().default(true),
});

export async function POST(request: Request) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const body = BannerSchema.parse(await request.json());
    const banner = await prisma.banner.create({ data: body });
    return NextResponse.json(banner, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Error al crear banner" }, { status: 500 });
  }
}
