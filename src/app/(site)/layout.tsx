import { CartProvider } from "@/components/CartProvider";
import HeaderWrapper from "@/components/layout/HeaderWrapper";
import Footer from "@/components/layout/Footer";
import CartSidebar from "@/components/CartSidebar";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <div className="sticky top-0 z-50">
        <HeaderWrapper />
      </div>
      <main className="min-h-[70vh]">{children}</main>
      <Footer />
      <CartSidebar />
    </CartProvider>
  );
}
