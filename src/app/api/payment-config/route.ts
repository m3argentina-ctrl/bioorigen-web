import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const cfg = await prisma.paymentConfig.findFirst();

  const base = {
    bankTransferEnabled: cfg?.bankTransferEnabled ?? false,
    bankTransferDiscount: cfg?.bankTransferDiscount ?? 0,
    bankName: cfg?.bankName ?? "",
    bankHolder: cfg?.bankHolder ?? "",
    bankCbu: cfg?.bankCbu ?? "",
    bankAlias: cfg?.bankAlias ?? "",
    bankNote: cfg?.bankNote ?? "",
    openpayEnabled: cfg?.openpayEnabled ?? false,
  };

  return NextResponse.json(base);
}
