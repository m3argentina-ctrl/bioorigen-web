import Link from "next/link";
import { Leaf, MapPin, Mail } from "lucide-react";

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

const PAYMENT_METHODS = [
  "Visa",
  "Mastercard",
  "MercadoPago",
  "Débito",
  "Transferencia",
];

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
            Fabricamos deshidratadores de alimentos de alta calidad. Línea
            familiar e industrial con garantía oficial.
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
          <h3 className="text-sm font-semibold uppercase tracking-wide">
            Productos
          </h3>
          <ul className="mt-3 space-y-2 text-sm text-white/70">
            {PRODUCTS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="transition-colors hover:text-bio-orange"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Col 3: Información + medios de pago */}
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide">
            Información
          </h3>
          <ul className="mt-3 space-y-2 text-sm text-white/70">
            {INFO.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="transition-colors hover:text-bio-orange"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/40">
              Medios de pago
            </p>
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
          <h3 className="text-sm font-semibold uppercase tracking-wide">
            Contacto
          </h3>
          <ul className="mt-3 space-y-3 text-sm text-white/70">
            <li className="flex items-start gap-2">
              <MapPin size={16} className="mt-0.5 shrink-0 text-bio-orange" />
              <span>Gral Pacheco, Buenos Aires, Argentina </span>
            </li>
            <li className="flex items-center gap-2">
              {/* WhatsApp icon */}
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="shrink-0 text-[#25D366]" aria-hidden>
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.112 1.523 5.84L.057 23.428a.75.75 0 0 0 .916.916l5.623-1.464A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.907 0-3.686-.513-5.21-1.406l-.374-.217-3.884 1.011 1.013-3.868-.228-.38A9.956 9.956 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
              </svg>
              <a
                href="https://wa.me/5491169819981"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-bio-orange"
              >
                +54 911 6981-9981{" "}
                <span className="text-white/40">(solo mensajes)</span>
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
        © {new Date().getFullYear()} Bio Origen SRL. Todos los derechos
        reservados.
      </div>
    </footer>
  );
}
