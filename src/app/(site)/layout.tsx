import { CartProvider } from "@/components/CartProvider";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import CartSidebar from "@/components/CartSidebar";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <Header />
      <main className="min-h-[70vh]">{children}</main>
      <Footer />
      <CartSidebar />
    </CartProvider>
  );
}
