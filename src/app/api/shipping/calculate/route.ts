import { NextResponse } from "next/server";
import { calculateShipping } from "@/lib/shipping/calculator";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { subtotal, zipCode, productIds, categories, couponCode } = await request.json();

    if (typeof subtotal !== "number" || subtotal < 0) {
      return NextResponse.json({ error: "subtotal requerido" }, { status: 400 });
    }

    const result = await calculateShipping({ subtotal, zipCode, productIds, categories, couponCode });
    return NextResponse.json(result);
  } catch (e) {
    console.error("[shipping/calculate]", e);
    return NextResponse.json({ error: "Error al calcular envío" }, { status: 500 });
  }
}
