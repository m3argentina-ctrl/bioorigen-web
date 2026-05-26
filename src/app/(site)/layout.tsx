import { CartProvider } from "@/components/CartProvider";
import HeaderWrapper from "@/components/layout/HeaderWrapper";
import Footer from "@/components/layout/Footer";
import CartSidebar from "@/components/CartSidebar";
import TopBar from "@/components/home/TopBar";
import { prisma } from "@/lib/db";

async function getTopBarData() {
  try {
    const [configs, paymentCfg] = await Promise.all([
      prisma.siteConfig.findMany({
        where: { key: { in: ["free_shipping_from", "contact_phone"] } },
      }),
      prisma.paymentConfig.findFirst(),
    ]);
    const cfg = Object.fromEntries(configs.map((c) => [c.key, c.value]));
    return {
      freeShippingFrom: parseInt(cfg.free_shipping_from ?? "80000", 10) || 80000,
      phone: cfg.contact_phone ?? "+54 911 6981-9981",
      transferDiscount: paymentCfg?.bankTransferDiscount ?? 0,
    };
  } catch {
    return { freeShippingFrom: 80000, phone: "+54 911 6981-9981", transferDiscount: 0 };
  }
}

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const topBarData = await getTopBarData();
  return (
    <CartProvider>
      <div className="sticky top-0 z-50">
        <TopBar {...topBarData} />
        <HeaderWrapper />
      </div>
      <main className="min-h-[70vh]">{children}</main>
      <Footer />
      <CartSidebar />
    </CartProvider>
  );
}
