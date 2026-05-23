import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: true });
  }

  const attrs = (body?.data as Record<string, unknown>)?.attributes as Record<string, unknown> | undefined;
  const externalReference = attrs?.externalReference as string | undefined;
  const status = attrs?.status as string | undefined;
  const openpayOrderId = (body?.data as Record<string, unknown>)?.id as string | undefined;

  if (!externalReference) {
    return NextResponse.json({ ok: true });
  }

  let orderStatus: "paid" | "failed" | "pending";
  if (status === "approved" || status === "paid" || status === "completed") {
    orderStatus = "paid";
  } else if (status === "rejected" || status === "failed" || status === "cancelled" || status === "expired") {
    orderStatus = "failed";
  } else {
    orderStatus = "pending";
  }

  console.log(`[webhook/openpayar] externalRef=${externalReference} status=${status} → ${orderStatus}`);

  await prisma.order
    .update({
      where: { id: externalReference },
      data: {
        status: orderStatus,
        ...(openpayOrderId && { openpayId: openpayOrderId }),
      },
    })
    .catch((e) => console.error("[webhook/openpayar] update failed:", e));

  return NextResponse.json({ ok: true });
}
