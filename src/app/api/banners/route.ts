import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const banners = await prisma.banner.findMany({
    where: { active: true },
    orderBy: { order: "asc" },
    select: {
      id: true,
      title: true,
      subtitle: true,
      description: true,
      image: true,
      buttonText: true,
      buttonLink: true,
      bgColor: true,
      order: true,
    },
  });
  return NextResponse.json(banners, {
    headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate" },
  });
}
