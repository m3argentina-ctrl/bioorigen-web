"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, Menu, X, ChevronDown } from "lucide-react";
import { useCart } from "@/components/CartProvider";

type Category = { id: string; name: string; slug: string };

const NAV = [
  { href: "/", label: "Inicio" },
  { href: "/productos", label: "Tienda" },
  { href: "/recetas", label: "Recetas" },
  { href: "/contacto", label: "Contacto" },
];

export default function Header({ categories = [] }: { categories?: Category[] }) {
  const { count, openCart } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [mobileCategOpen, setMobileCategOpen] = useState(false);

  const closeAll = () => {
    setMenuOpen(false);
    setCatOpen(false);
    setMobileCategOpen(false);
  };

  return (
    <header className="border-b-2 border-bio-green bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2">
        <Link href="/" className="flex items-center" onClick={closeAll}>
          <Image
            src="/logo.svg"
            alt="Bio Origen - Deshidratadores de Alimentos"
            width={150}
            height={99}
            priority
            unoptimized
            className="h-20 w-auto object-contain"
          />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-7 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-bio-dark transition-colors hover:text-bio-green"
            >
              {item.label}
            </Link>
          ))}

          {categories.length > 0 && (
            <div
              className="relative"
              onMouseEnter={() => setCatOpen(true)}
              onMouseLeave={() => setCatOpen(false)}
            >
              <button
                type="button"
                className="flex items-center gap-1 text-sm font-medium text-bio-dark transition-colors hover:text-bio-green"
              >
                Categorías
                <ChevronDown
                  size={14}
                  className={`transition-transform duration-200 ${catOpen ? "rotate-180" : ""}`}
                />
              </button>

              {catOpen && (
                <div className="absolute left-0 top-full z-10 mt-1 min-w-[200px] rounded-xl border border-gray-100 bg-white p-2 shadow-card-hover">
                  {categories.map((cat) => (
                    <Link
                      key={cat.id}
                      href={`/productos?categoria=${encodeURIComponent(cat.name)}`}
                      className="block rounded-lg px-3 py-2 text-sm text-bio-dark transition-colors hover:bg-bio-beige hover:text-bio-green"
                      onClick={closeAll}
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {/* Cart: siempre verde con badge naranja */}
          <button
            type="button"
            onClick={openCart}
            aria-label={`Carrito${count > 0 ? ` — ${count} productos` : ""}`}
            className="relative flex h-10 w-10 items-center justify-center rounded-full bg-bio-green text-white transition-colors hover:bg-bio-green-dark"
          >
            <ShoppingCart size={20} />
            {count > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-bio-orange px-1 text-xs font-bold text-white ring-2 ring-white">
                {count}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={menuOpen}
            className="flex h-10 w-10 items-center justify-center rounded-full text-bio-dark transition-colors hover:bg-bio-beige md:hidden"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <nav className="border-t border-bio-green/20 bg-white md:hidden">
          <ul className="mx-auto max-w-6xl divide-y divide-gray-100 px-4 py-1">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={closeAll}
                  className="block py-2.5 text-sm font-medium text-bio-dark transition-colors hover:text-bio-green"
                >
                  {item.label}
                </Link>
              </li>
            ))}

            {categories.length > 0 && (
              <li>
                <button
                  type="button"
                  onClick={() => setMobileCategOpen((v) => !v)}
                  className="flex w-full items-center justify-between py-2.5 text-sm font-medium text-bio-dark"
                >
                  Categorías
                  <ChevronDown
                    size={14}
                    className={`transition-transform duration-200 ${mobileCategOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {mobileCategOpen && (
                  <ul className="mb-2 space-y-1 pl-3">
                    {categories.map((cat) => (
                      <li key={cat.id}>
                        <Link
                          href={`/productos?categoria=${encodeURIComponent(cat.name)}`}
                          onClick={closeAll}
                          className="block py-1.5 text-sm text-bio-dark/70 transition-colors hover:text-bio-green"
                        >
                          {cat.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            )}
          </ul>
        </nav>
      )}
    </header>
  );
}
