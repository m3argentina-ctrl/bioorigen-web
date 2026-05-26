import Link from "next/link";
import { Leaf, MapPin, Phone, Mail } from "lucide-react";

const PRODUCTS = [
  { href: "/productos?categoria=Deshidratadores", label: "Deshidratadores" },
  { href: "/productos?categoria=Industriales", label: "Línea Industrial" },
  { href: "/productos?categoria=Accesorios", label: "Accesorios" },
  { href: "/productos?categoria=Repuestos", label: "Repuestos" },
  { href: "/productos", label: "Ver todos" },
];

const INFO = [
  { href: "/nosotros", label: "Quiénes somos" },
  { href: "/recetas", label: "Recetas" },
  { href: "/contacto", label: "Contacto" },
  { href: "/checkout", label: "Mi carrito" },
];

const PAYMENT_METHODS = ["Visa", "Mastercard", "MercadoPago", "Débito", "Transferencia"];

export default function Footer() {
  return (
    <footer className="mt-20 bg-bio-dark text-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">

        {/* Col 1: Logo + descripción + social */}
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-bio-green text-white">
              <Leaf size={18} />
            </span>
            <span className="text-base font-bold">Bio Origen</span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-white/70">
            Fabricamos deshidratadores de alimentos de alta calidad. Línea familiar e industrial
            con garantía oficial. Del campo a tu mesa.
          </p>
          <div className="mt-5 flex gap-2">
            <a
              href="https://instagram.com/bioorigen"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram Bio Origen"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-sm transition-colors hover:bg-bio-orange"
            >
              IG
            </a>
            <a
              href="https://facebook.com/bioorigen"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook Bio Origen"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-sm transition-colors hover:bg-bio-orange"
            >
              FB
            </a>
            <a
              href="https://wa.me/5491169819981"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp Bio Origen"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-sm transition-colors hover:bg-bio-orange"
            >
              WA
            </a>
          </div>
        </div>

        {/* Col 2: Productos */}
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide">Productos</h3>
          <ul className="mt-3 space-y-2 text-sm text-white/70">
            {PRODUCTS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="transition-colors hover:text-bio-orange">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Col 3: Información + medios de pago */}
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide">Información</h3>
          <ul className="mt-3 space-y-2 text-sm text-white/70">
            {INFO.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="transition-colors hover:text-bio-orange">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/40">Medios de pago</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {PAYMENT_METHODS.map((m) => (
                <span
                  key={m}
                  className="rounded-md bg-white/10 px-2 py-0.5 text-xs text-white/60"
                >
                  {m}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Col 4: Contacto + sello */}
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide">Contacto</h3>
          <ul className="mt-3 space-y-3 text-sm text-white/70">
            <li className="flex items-start gap-2">
              <MapPin size={16} className="mt-0.5 shrink-0 text-bio-orange" />
              <span>Jose Cebey s/n, Tigre, Buenos Aires</span>
            </li>
            <li className="flex items-center gap-2">
              <Phone size={16} className="shrink-0 text-bio-orange" />
              <a href="tel:+5491169819981" className="transition-colors hover:text-bio-orange">
                +54 911 6981-9981
              </a>
            </li>
            <li className="flex items-start gap-2">
              <Mail size={16} className="mt-0.5 shrink-0 text-bio-orange" />
              <a
                href="mailto:consultas@bioorigen.com.ar"
                className="break-all transition-colors hover:text-bio-orange"
              >
                consultas@bioorigen.com.ar
              </a>
            </li>
          </ul>
          <div className="mt-5 space-y-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-bio-green/30 px-3 py-1 text-xs font-semibold text-bio-green">
              <span className="h-1.5 w-1.5 rounded-full bg-bio-green" />
              Garantía oficial Bio Origen
            </span>
            <br />
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/60">
              🔒 Pago 100% seguro
            </span>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 py-4 text-center text-xs text-white/60">
        © {new Date().getFullYear()} Bio Origen SRL. Todos los derechos reservados.
      </div>
    </footer>
  );
}
