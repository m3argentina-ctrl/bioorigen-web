import { MapPin, Phone, Mail, Clock } from "lucide-react";

export const metadata = {
  title: "Contacto — Bio Origen",
};

const ITEMS = [
  {
    Icon: MapPin,
    label: "Dirección",
    value: "Jose Cebey s/n, Tigre, Buenos Aires",
  },
  { Icon: Phone, label: "Teléfono", value: "+54 911 6981-9981" },
  { Icon: Mail, label: "Email", value: "consultas@bioorigen.com.ar" },
  { Icon: Clock, label: "Horario", value: "Lunes a viernes, 9 a 17 h" },
];

export default function ContactoPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-extrabold text-bio-dark">Contacto</h1>
      <p className="mt-2 text-bio-dark/70">
        Escribinos para consultas mayoristas, pedidos o sugerencias.
      </p>
      <div className="mt-6 space-y-4 rounded-2xl bg-white p-6 shadow-card">
        {ITEMS.map(({ Icon, label, value }) => (
          <div key={label} className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-bio-beige text-bio-green">
              <Icon size={20} />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-bio-dark/60">
                {label}
              </p>
              <p className="text-sm text-bio-dark">{value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
