import Link from "next/link";
import { Leaf, MapPin, Phone, Mail } from "lucide-react";

const LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/productos", label: "Tienda" },
  { href: "/recetas", label: "Recetas" },
  { href: "/nosotros", label: "Nosotros" },
];

const SOCIALS = [
  { href: "https://instagram.com/bioorigen", label: "Instagram" },
  { href: "https://facebook.com/bioorigen", label: "Facebook" },
  { href: "https://twitter.com/bioorigen", label: "Twitter" },
];

export default function Footer() {
  return (
    <footer className="mt-20 bg-bio-dark text-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-bio-green text-white">
              <Leaf size={18} />
            </span>
            <span className="text-base font-bold">Bio Origen</span>
          </div>
          <p className="mt-3 text-sm text-white/70">
            Alimentos deshidratados naturales, sin conservantes. Del campo a tu
            mesa.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide">
            Enlaces
          </h3>
          <ul className="mt-3 space-y-2 text-sm text-white/70">
            {LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="hover:text-bio-orange">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide">
            Contacto
          </h3>
          <ul className="mt-3 space-y-3 text-sm text-white/70">
            <li className="flex items-start gap-2">
              <MapPin size={16} className="mt-0.5 shrink-0 text-bio-orange" />
              <span>Jose Cebey s/n, Tigre, Buenos Aires</span>
            </li>
            <li className="flex items-center gap-2">
              <Phone size={16} className="shrink-0 text-bio-orange" />
              <a href="tel:+5491169819981" className="hover:text-bio-orange">
                +54 911 6981-9981
              </a>
            </li>
            <li className="flex items-center gap-2">
              <Mail size={16} className="shrink-0 text-bio-orange" />
              <a
                href="mailto:consultas@bioorigen.com.ar"
                className="hover:text-bio-orange"
              >
                consultas@bioorigen.com.ar
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide">
            Redes sociales
          </h3>
          <ul className="mt-3 space-y-2 text-sm text-white/70">
            {SOCIALS.map(({ href, label }) => (
              <li key={label}>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-bio-orange"
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 py-4 text-center text-xs text-white/60">
        © {new Date().getFullYear()} Bio Origen SRL. Todos los derechos
        reservados.
      </div>
    </footer>
  );
}
