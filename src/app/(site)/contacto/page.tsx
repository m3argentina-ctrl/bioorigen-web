import { MapPin, Phone, Mail, Clock, MessageSquare } from "lucide-react";
import type { Metadata } from "next";
import ContactForm from "./ContactForm";

export const metadata: Metadata = {
  title: "Contacto — Bio Origen",
  description: "Contactate con Bio Origen. Consultas sobre productos, envíos, mayoristas y más.",
};

const INFO = [
  { Icon: MapPin, label: "Dirección", value: "Jose Cebey s/n, Tigre, Buenos Aires" },
  { Icon: Phone, label: "Teléfono / WhatsApp", value: "+54 911 6981-9981", href: "https://wa.me/5491169819981" },
  { Icon: Mail, label: "Email", value: "consultas@bioorigen.com.ar", href: "mailto:consultas@bioorigen.com.ar" },
  { Icon: Clock, label: "Horario de atención", value: "Lunes a viernes, 9 a 17 hs." },
];

export default function ContactoPage() {
  return (
    <main className="bg-bio-beige/30 py-12">
      <div className="mx-auto max-w-6xl px-4">
        {/* Header */}
        <div className="mb-10 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-bio-green/10 px-4 py-1.5 text-sm font-semibold text-bio-green">
            <MessageSquare size={15} />
            Contacto
          </span>
          <h1 className="mt-3 text-3xl font-extrabold text-bio-dark sm:text-4xl">
            ¿En qué podemos ayudarte?
          </h1>
          <p className="mt-2 text-bio-dark/60">
            Completá el formulario y te respondemos a la brevedad.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_420px]">
          {/* Formulario */}
          <div className="rounded-2xl bg-white p-6 shadow-sm sm:p-8">
            <h2 className="mb-6 text-lg font-bold text-bio-dark">Envianos un mensaje</h2>
            <ContactForm />
          </div>

          {/* Info + Mapa */}
          <div className="space-y-5">
            {/* Tarjetas de info */}
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="mb-5 text-lg font-bold text-bio-dark">Información de contacto</h2>
              <ul className="space-y-4">
                {INFO.map(({ Icon, label, value, href }) => (
                  <li key={label} className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-bio-green/10 text-bio-green">
                      <Icon size={18} />
                    </span>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-bio-dark/50">{label}</p>
                      {href
                        ? <a href={href} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-bio-dark hover:text-bio-green transition-colors">{value}</a>
                        : <p className="text-sm text-bio-dark">{value}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* WhatsApp CTA */}
            <a
              href="https://wa.me/5491169819981"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-2xl bg-[#25D366] px-5 py-4 text-white shadow-sm transition-opacity hover:opacity-90"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7 shrink-0">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              <div>
                <p className="font-bold">Escribinos por WhatsApp</p>
                <p className="text-sm opacity-90">Respuesta rápida en horario de atención</p>
              </div>
            </a>

            {/* Mapa Google Maps embed */}
            <div className="overflow-hidden rounded-2xl shadow-sm">
              <iframe
                src="https://maps.google.com/maps?q=Jose+Cebey+s%2Fn+Tigre+Buenos+Aires&output=embed&z=15"
                width="100%"
                height="220"
                style={{ border: 0, display: "block" }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Ubicación Bio Origen"
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
