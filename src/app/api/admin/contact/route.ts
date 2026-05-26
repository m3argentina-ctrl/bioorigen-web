import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const authError = await requireAdmin();
  if (authError) return authError;

  const messages = await prisma.contactMessage.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true, name: true, email: true, subject: true,
      status: true, createdAt: true,
    },
  });

  const unreadCount = await prisma.contactMessage.count({ where: { status: "unread" } });

  return NextResponse.json({ messages, unreadCount });
}
