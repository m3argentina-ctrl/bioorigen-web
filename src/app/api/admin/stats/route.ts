import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const EMPTY_STATS = {
  monthRevenue: 0,
  monthCount: 0,
  avgTicket: 0,
  ordersByStatus: [],
  salesByDay: [] as { date: string; total: number }[],
  topProducts: [],
  lowStockProducts: [],
  recentOrders: [],
};

export async function GET() {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [monthOrders, allOrders, lowStockProducts, recentOrders] =
      await Promise.all([
        prisma.order.findMany({
          where: {
            createdAt: { gte: startOfMonth },
            status: { in: ["paid", "shipped", "completed"] },
          },
          select: { total: true, createdAt: true },
        }),
        prisma.order.groupBy({ by: ["status"], _count: true }),
        prisma.product.findMany({
          where: { stock: { lt: 10 } },
          select: { id: true, name: true, stock: true, category: true },
          orderBy: { stock: "asc" },
        }),
        prisma.order.findMany({
          take: 10,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            customerName: true,
            customerEmail: true,
            total: true,
            status: true,
            createdAt: true,
          },
        }),
      ]);

    const monthRevenue = monthOrders.reduce((sum, o) => sum + o.total, 0);
    const monthCount = monthOrders.length;
    const avgTicket = monthCount > 0 ? monthRevenue / monthCount : 0;

    // Ventas por día (últimos 30 días)
    const paidOrders = await prisma.order.findMany({
      where: {
        createdAt: { gte: thirtyDaysAgo },
        status: { in: ["paid", "shipped", "completed"] },
      },
      select: { total: true, createdAt: true },
    });

    const salesByDay: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      salesByDay[d.toISOString().slice(0, 10)] = 0;
    }
    for (const order of paidOrders) {
      const key = order.createdAt.toISOString().slice(0, 10);
      if (salesByDay[key] !== undefined) salesByDay[key] += order.total;
    }

    // Top 5 productos más vendidos
    const paidOrdersFull = await prisma.order.findMany({
      where: { status: { in: ["paid", "shipped", "completed"] } },
      select: { items: true },
    });

    const productSales: Record<
      string,
      { name: string; qty: number; revenue: number }
    > = {};
    for (const order of paidOrdersFull) {
      const items = order.items as {
        productId: string;
        name: string;
        price: number;
        quantity: number;
      }[];
      for (const item of items) {
        if (!productSales[item.productId]) {
          productSales[item.productId] = { name: item.name, qty: 0, revenue: 0 };
        }
        productSales[item.productId].qty += item.quantity;
        productSales[item.productId].revenue += item.price * item.quantity;
      }
    }
    const topProducts = Object.entries(productSales)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    return NextResponse.json({
      monthRevenue,
      monthCount,
      avgTicket,
      ordersByStatus: allOrders,
      salesByDay: Object.entries(salesByDay).map(([date, total]) => ({
        date,
        total,
      })),
      topProducts,
      lowStockProducts,
      recentOrders,
    });
  } catch (err) {
    console.error("[stats] error:", err);
    return NextResponse.json(EMPTY_STATS);
  }
}
