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
  imageUrl: z.string().default(""),
  imageUrlMobile: z.string().optional().nullable(),
  alt: z.string().default(""),
  eyebrow: z.string().optional().nullable(),
  title: z.string().optional().nullable(),
  subtitle: z.string().optional().nullable(),
  ctaLabel: z.string().optional().nullable(),
  ctaHref: z.string().optional().nullable(),
  ctaNewTab: z.boolean().default(false),
  href: z.string().optional().nullable(),
  align: z.enum(["left", "center", "right"]).default("left"),
  theme: z.enum(["light", "dark"]).default("dark"),
  overlay: z.number().min(0).max(1).default(0.35),
  height: z.enum(["small", "medium", "large", "full"]).default("medium"),
  textColor: z.string().optional().nullable(),
  ctaColor: z.string().optional().nullable(),
  ctaTextColor: z.string().optional().nullable(),
  order: z.number().int().default(0),
  active: z.boolean().default(true),
  startsAt: z.string().optional().nullable(),
  endsAt: z.string().optional().nullable(),
});

export async function POST(request: Request) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const body = BannerSchema.parse(await request.json());
    const data = {
      ...body,
      startsAt: body.startsAt ? new Date(body.startsAt) : null,
      endsAt: body.endsAt ? new Date(body.endsAt) : null,
    };
    const banner = await prisma.banner.create({ data });
    return NextResponse.json(banner, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ errors: e.issues.map(i => i.message) }, { status: 422 });
    }
    return NextResponse.json({ error: "Error al crear banner" }, { status: 500 });
  }
}
