"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  UtensilsCrossed,
  ClipboardList,
  Image as ImageIcon,
  Tags,
  Sparkles,
  Truck,
  CreditCard,
  Settings,
  ExternalLink,
  X,
  MessageSquare,
} from "lucide-react";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/productos", label: "Productos", icon: Package },
  { href: "/admin/categorias", label: "Categorías", icon: Tags },
  { href: "/admin/recetas", label: "Recetas", icon: UtensilsCrossed },
  { href: "/admin/ordenes", label: "Órdenes", icon: ClipboardList },
  { href: "/admin/contacto", label: "Contacto", icon: MessageSquare },
  { href: "/admin/banners", label: "Banners", icon: ImageIcon },
  { href: "/admin/beneficios", label: "Beneficios", icon: Sparkles },
  { href: "/admin/envio", label: "Envíos", icon: Truck },
  { href: "/admin/pagos", label: "Pagos", icon: CreditCard },
  { href: "/admin/config", label: "Configuración", icon: Settings },
];

type Props = {
  userName?: string | null;
  onClose?: () => void;
  unreadContactCount?: number;
};

export default function Sidebar({ userName, onClose, unreadContactCount = 0 }: Props) {
  const pathname = usePathname();

  function isActive(href: string, exact?: boolean) {
    return exact ? pathname === href : pathname.startsWith(href);
  }

  return (
    <div className="flex h-full w-64 flex-col bg-slate-900 text-white">
      {/* Logo */}
      <div className="flex items-center justify-between border-b border-slate-700 px-4 py-4">
        <Link href="/admin" className="flex items-center gap-2">
          <Image
            src="/logo.svg"
            alt="Bio Origen"
            width={110}
            height={36}
            unoptimized
            className="h-9 w-auto brightness-0 invert"
          />
        </Link>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:text-white lg:hidden"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-4">
        <ul className="space-y-1">
          {NAV.map(({ href, label, icon: Icon, exact }) => (
            <li key={href}>
              <Link
                href={href}
                onClick={onClose}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive(href, exact)
                    ? "bg-bio-green text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Icon size={18} />
                {label}
                {href === "/admin/contacto" && unreadContactCount > 0 && (
                  <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-500 px-1 text-xs font-bold text-white">
                    {unreadContactCount}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-700 px-4 py-3">
        <p className="truncate text-xs text-slate-400">{userName ?? "Admin"}</p>
        <Link
          href="/"
          target="_blank"
          className="mt-2 flex items-center gap-1.5 text-xs text-slate-400 hover:text-white"
        >
          <ExternalLink size={13} />
          Ver sitio
        </Link>
      </div>
    </div>
  );
}
