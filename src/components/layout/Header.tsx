"use client";

import { useState, useEffect, useRef } from "react";
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

const CAT_EMOJI: Record<string, string> = {
  Deshidratadores: "🌀",
  Industriales: "🏭",
  Accesorios: "🔧",
  Repuestos: "⚙️",
  Charqui: "🥩",
  Snacks: "🥨",
  Frutas: "🍎",
  Verduras: "🥕",
  Alimentos: "🥗",
  Recetas: "📖",
};

export default function Header({ categories = [] }: { categories?: Category[] }) {
  const { count, openCart } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [mobileCategOpen, setMobileCategOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdown al clickear fuera
  useEffect(() => {
    if (!catOpen) return;
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setCatOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [catOpen]);

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
              ref={dropdownRef}
              className="relative"
              onMouseEnter={() => setCatOpen(true)}
              onMouseLeave={() => setCatOpen(false)}
            >
              <button
                type="button"
                onClick={() => setCatOpen((v) => !v)}
                className="flex items-center gap-1 text-sm font-medium text-bio-dark transition-colors hover:text-bio-green"
              >
                Categorías
                <ChevronDown
                  size={14}
                  className={`transition-transform duration-200 ${catOpen ? "rotate-180" : ""}`}
                />
              </button>

              {/* Mega menu — siempre en DOM, animado con opacity+translate */}
              <div
                className={`absolute left-0 top-full z-20 mt-1 w-80 rounded-xl border border-gray-100 bg-white p-3 shadow-card-hover transition-all duration-200 ${
                  catOpen
                    ? "visible translate-y-0 opacity-100"
                    : "invisible -translate-y-2 opacity-0 pointer-events-none"
                }`}
              >
                <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-widest text-bio-dark/40">
                  Categorías
                </p>
                <div className="grid grid-cols-2 gap-0.5">
                  {categories.map((cat) => (
                    <Link
                      key={cat.id}
                      href={`/productos?categoria=${encodeURIComponent(cat.name)}`}
                      className="group flex items-center gap-2 rounded-lg px-3 py-2 transition-colors hover:bg-bio-beige"
                      onClick={closeAll}
                    >
                      <span className="text-base leading-none">
                        {CAT_EMOJI[cat.name] ?? "🌿"}
                      </span>
                      <span className="text-sm font-medium text-bio-dark transition-colors group-hover:text-[#F97316]">
                        {cat.name}
                      </span>
                    </Link>
                  ))}
                </div>
                <div className="mt-2 border-t border-gray-100 pt-2">
                  <Link
                    href="/productos"
                    className="block rounded-lg px-3 py-1.5 text-sm font-semibold text-bio-green hover:bg-bio-beige"
                    onClick={closeAll}
                  >
                    Ver todos los productos →
                  </Link>
                </div>
              </div>
            </div>
          )}
        </nav>

        <div className="flex items-center gap-2">
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
                  <ul className="mb-2 grid grid-cols-2 gap-0.5 pl-1">
                    {categories.map((cat) => (
                      <li key={cat.id}>
                        <Link
                          href={`/productos?categoria=${encodeURIComponent(cat.name)}`}
                          onClick={closeAll}
                          className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-bio-dark/70 transition-colors hover:text-[#F97316]"
                        >
                          <span>{CAT_EMOJI[cat.name] ?? "🌿"}</span>
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
