"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/CartProvider";
import { formatPrice } from "@/lib/format";
import FreeShippingProgress from "@/components/checkout/FreeShippingProgress";
import { Building2, CreditCard, Smartphone } from "lucide-react";
import type { ShippingOption } from "@/lib/shipping/calculator";

type PaymentConfig = {
  bankTransferEnabled: boolean;
  bankTransferDiscount: number;
  openpayEnabled: boolean;
};

type FormData = {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
};

const ME2_ENABLED = process.env.NEXT_PUBLIC_MERCADO_ENVIOS_ENABLED === "true";

function validate(data: FormData): Partial<Record<keyof FormData, string>> {
  const errors: Partial<Record<keyof FormData, string>> = {};
  if (!data.name.trim()) errors.name = "Requerido";
  if (!data.email.trim() || !data.email.includes("@"))
    errors.email = "Email inválido";
  if (!data.phone.trim()) errors.phone = "Requerido";
  if (!data.address.trim()) errors.address = "Requerido";
  if (!data.city.trim()) errors.city = "Requerido";
  if (!data.postalCode.trim()) errors.postalCode = "Requerido";
  return errors;
}

const EMPTY_FORM: FormData = { name: "", email: "", phone: "", address: "", city: "", postalCode: "" };

export default function CheckoutForm() {
  const router = useRouter();
  const { items, subtotal, clear } = useCart();
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<ShippingOption | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"mercadopago" | "bank_transfer" | "openpay">("mercadopago");
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig>({
    bankTransferEnabled: false,
    bankTransferDiscount: 0,
    openpayEnabled: false,
  });

  // Carga opciones de envío cuando cambia el subtotal
  useEffect(() => {
    if (subtotal <= 0 || ME2_ENABLED) return;
    fetch("/api/shipping/calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subtotal }),
    })
      .then((r) => r.json())
      .then((data) => {
        const opts: ShippingOption[] = data.options ?? [];
        setShippingOptions(opts);
        if (opts.length > 0 && !selectedShipping) setSelectedShipping(opts[0]);
      })
      .catch(() => null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subtotal]);

  // Carga config de medios de pago
  useEffect(() => {
    fetch("/api/payment-config")
      .then((r) => r.json())
      .then((data: PaymentConfig) => setPaymentConfig(data))
      .catch(() => null);
  }, []);

  const shippingCost = ME2_ENABLED ? 0 : (selectedShipping?.cost ?? 0);
  const discount = paymentMethod === "bank_transfer" && paymentConfig.bankTransferDiscount > 0
    ? Math.round(subtotal * (paymentConfig.bankTransferDiscount / 100))
    : 0;
  const total = subtotal + shippingCost - discount;

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fieldErrors = validate(form);
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      const fieldOrder: (keyof FormData)[] = ["name", "email", "phone", "address", "city", "postalCode"];
      const firstError = fieldOrder.find((f) => fieldErrors[f]);
      if (firstError) {
        const el = document.querySelector<HTMLElement>(`[name="${firstError}"]`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          el.focus({ preventScroll: true });
        }
      }
      return;
    }

    setLoading(true);
    setServerError("");

    try {
      const checkoutItems = items.map((i) => ({
        productId: i.product.id,
        quantity: i.quantity,
      }));

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: checkoutItems,
          customer: {
            name: form.name.trim(),
            email: form.email.trim().toLowerCase(),
            phone: form.phone.trim(),
            address: form.address.trim(),
            city: form.city.trim(),
            postalCode: form.postalCode.trim(),
          },
          carrier: selectedShipping?.carrier ?? "andreani",
          shippingMethod: selectedShipping?.method ?? "domicilio",
          paymentMethod,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setServerError(data.error ?? "Error al procesar el pedido");
        return;
      }

      if (data.paymentMethod === "bank_transfer") {
        clear();
        router.push(`/checkout/transferencia?orderId=${data.orderId}`);
        return;
      }

      if (data.paymentMethod === "openpay") {
        // No llamar clear() aquí — la página de éxito ya lo hace al montar
        setRedirecting(true);
        window.location.href = data.checkoutUrl;
        return;
      }

      // MercadoPago
      clear();
      const initPoint =
        process.env.NODE_ENV === "production"
          ? data.initPoint
          : (data.sandboxInitPoint ?? data.initPoint);

      router.push(initPoint);
    } catch {
      setServerError("Error de conexión. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  if (redirecting) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#0066ff]/10">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#0066ff] border-t-transparent" />
        </div>
        <div>
          <p className="text-lg font-semibold text-bio-dark">Redirigiendo al sitio seguro de pago</p>
          <p className="mt-1 text-sm text-bio-dark/60">Estás siendo transferido a OpenPay Argentina. No cerrés esta ventana.</p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-bio-beige px-4 py-2 text-xs text-bio-dark/50">
          <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
          Conexión segura · SSL
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px] lg:items-start">
      {/* Formulario */}
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <h2 className="text-lg font-bold text-bio-dark">Datos de contacto</h2>

        <Field
          label="Nombre completo"
          name="name"
          value={form.name}
          onChange={handleChange}
          error={errors.name}
          placeholder="Juan García"
          autoComplete="name"
        />

        <Field
          label="Email"
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          error={errors.email}
          placeholder="juan@email.com"
          autoComplete="email"
        />

        <Field
          label="Teléfono"
          name="phone"
          type="tel"
          value={form.phone}
          onChange={handleChange}
          error={errors.phone}
          placeholder="+54 9 11 1234-5678"
          autoComplete="tel"
        />

        <h2 className="pt-2 text-lg font-bold text-bio-dark">Dirección de entrega</h2>

        <Field
          label="Dirección (calle y número)"
          name="address"
          value={form.address}
          onChange={handleChange}
          error={errors.address}
          placeholder="Av. Corrientes 1234, piso 2"
          autoComplete="street-address"
        />

        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Ciudad"
            name="city"
            value={form.city}
            onChange={handleChange}
            error={errors.city}
            placeholder="Buenos Aires"
            autoComplete="address-level2"
          />
          <Field
            label="Código postal"
            name="postalCode"
            value={form.postalCode}
            onChange={handleChange}
            error={errors.postalCode}
            placeholder="1043"
            autoComplete="postal-code"
          />
        </div>

        {/* Selector de método de envío (solo cuando ME2 está desactivado) */}
        {!ME2_ENABLED && shippingOptions.length > 0 && (
          <div>
            <h2 className="mb-3 text-lg font-bold text-bio-dark">Método de envío</h2>
            <div className="space-y-2">
              {shippingOptions.map((opt) => (
                <label key={`${opt.carrier}-${opt.method}`}
                  className={`flex cursor-pointer items-center justify-between rounded-xl border-2 px-4 py-3 transition-colors ${
                    selectedShipping?.carrier === opt.carrier && selectedShipping?.method === opt.method
                      ? "border-bio-green bg-bio-green/5"
                      : "border-slate-200 hover:border-slate-300"
                  }`}>
                  <div className="flex items-center gap-3">
                    <input type="radio" name="shipping" checked={
                      selectedShipping?.carrier === opt.carrier && selectedShipping?.method === opt.method
                    } onChange={() => setSelectedShipping(opt)} className="text-bio-green" />
                    <div>
                      <p className="text-sm font-medium text-bio-dark">{opt.label}</p>
                      <p className="text-xs text-bio-dark/50">{opt.days}{opt.hasInsurance ? " · con seguro" : ""}</p>
                    </div>
                  </div>
                  <span className={`text-sm font-bold ${opt.isFree ? "text-bio-green" : "text-bio-dark"}`}>
                    {opt.isFree ? "GRATIS" : formatPrice(opt.cost)}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        <FreeShippingProgress subtotal={subtotal} />

        {/* Selector de método de pago */}
        {(paymentConfig.bankTransferEnabled || paymentConfig.openpayEnabled) && (
          <div>
            <h2 className="mb-3 text-lg font-bold text-bio-dark">Método de pago</h2>
            <div className="space-y-2">
              {/* MercadoPago */}
              <label className={`flex cursor-pointer items-center justify-between rounded-xl border-2 px-4 py-3 transition-colors ${
                paymentMethod === "mercadopago" ? "border-[#009EE3] bg-[#009EE3]/5" : "border-slate-200 hover:border-slate-300"
              }`}>
                <div className="flex items-center gap-3">
                  <input type="radio" name="paymentMethod" checked={paymentMethod === "mercadopago"}
                    onChange={() => setPaymentMethod("mercadopago")} className="text-[#009EE3]" />
                  <div className="flex items-center gap-2">
                    <CreditCard size={16} className="text-[#009EE3]" />
                    <div>
                      <p className="text-sm font-medium text-bio-dark">MercadoPago</p>
                      <p className="text-xs text-bio-dark/50">Tarjetas de crédito, débito y más</p>
                    </div>
                  </div>
                </div>
              </label>

              {/* OpenPay Argentina */}
              {paymentConfig.openpayEnabled && (
                <label className={`flex cursor-pointer items-center justify-between rounded-xl border-2 px-4 py-3 transition-colors ${
                  paymentMethod === "openpay" ? "border-[#0066ff] bg-[#0066ff]/5" : "border-slate-200 hover:border-slate-300"
                }`}>
                  <div className="flex items-center gap-3">
                    <input type="radio" name="paymentMethod" checked={paymentMethod === "openpay"}
                      onChange={() => setPaymentMethod("openpay")} className="text-[#0066ff]" />
                    <div className="flex items-center gap-2">
                      <Smartphone size={16} className="text-[#0066ff]" />
                      <div>
                        <p className="text-sm font-medium text-bio-dark">Tarjeta de crédito / débito</p>
                        <p className="text-xs text-bio-dark/50">Visa, Mastercard · Pago seguro con OpenPay</p>
                      </div>
                    </div>
                  </div>
                </label>
              )}

              {/* Transferencia bancaria */}
              {paymentConfig.bankTransferEnabled && (
                <label className={`flex cursor-pointer items-center justify-between rounded-xl border-2 px-4 py-3 transition-colors ${
                  paymentMethod === "bank_transfer" ? "border-bio-green bg-bio-green/5" : "border-slate-200 hover:border-slate-300"
                }`}>
                  <div className="flex items-center gap-3">
                    <input type="radio" name="paymentMethod" checked={paymentMethod === "bank_transfer"}
                      onChange={() => setPaymentMethod("bank_transfer")} className="text-bio-green" />
                    <div className="flex items-center gap-2">
                      <Building2 size={16} className="text-bio-green" />
                      <div>
                        <p className="text-sm font-medium text-bio-dark">Transferencia bancaria</p>
                        <p className="text-xs text-bio-dark/50">CBU / Alias · Coordinamos el envío</p>
                      </div>
                    </div>
                  </div>
                  {paymentConfig.bankTransferDiscount > 0 && (
                    <span className="shrink-0 rounded-full bg-bio-green px-2.5 py-0.5 text-xs font-bold text-white">
                      {paymentConfig.bankTransferDiscount}% OFF
                    </span>
                  )}
                </label>
              )}
            </div>
          </div>
        )}

        {serverError && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
            {serverError}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || items.length === 0}
          className={`flex w-full items-center justify-center gap-3 rounded-xl px-6 py-4 text-base font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 ${
            paymentMethod === "bank_transfer" ? "bg-bio-green"
            : paymentMethod === "openpay" ? "bg-[#0066ff]"
            : "bg-[#009EE3]"
          }`}
        >
          {loading ? (
            <>
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Procesando...
            </>
          ) : paymentMethod === "bank_transfer" ? (
            <>
              <Building2 size={18} />
              Confirmar y ver datos bancarios
            </>
          ) : paymentMethod === "openpay" ? (
            <>
              <Smartphone size={18} />
              Pagar con tarjeta
            </>
          ) : (
            <>
              <MercadoPagoLogo />
              Pagar con MercadoPago
            </>
          )}
        </button>
      </form>

      {/* Resumen del carrito */}
      <aside className="sticky top-32">
        <div className="rounded-2xl bg-bio-beige p-5">
          <h2 className="mb-4 text-base font-bold text-bio-dark">Resumen del pedido</h2>

          <ul className="space-y-3">
            {items.map((item) => (
              <li key={item.product.id} className="flex items-start justify-between gap-2">
                <span className="text-sm text-bio-dark">
                  {item.product.name}
                  <span className="ml-1 text-bio-dark/50">×{item.quantity}</span>
                </span>
                <span className="shrink-0 text-sm font-semibold text-bio-dark">
                  {formatPrice(item.product.price * item.quantity)}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-4 space-y-2 border-t border-bio-dark/10 pt-4 text-sm">
            <div className="flex justify-between text-bio-dark/70">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-bio-dark/70">
              <span>Envío</span>
              <span>
                {shippingCost === 0 ? (
                  <span className="font-semibold text-bio-green">Gratis</span>
                ) : (
                  formatPrice(shippingCost)
                )}
              </span>
            </div>
            {selectedShipping?.isFree && selectedShipping.freeReason && (
              <p className="text-xs text-bio-green">{selectedShipping.freeReason}</p>
            )}
            {discount > 0 && (
              <div className="flex justify-between font-semibold text-bio-green">
                <span>Descuento transferencia ({paymentConfig.bankTransferDiscount}%)</span>
                <span>− {formatPrice(discount)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-bio-dark/10 pt-2 text-base font-bold text-bio-dark">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

// ---- Componentes auxiliares ----

type FieldProps = {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  placeholder?: string;
  type?: string;
  autoComplete?: string;
};

function Field({ label, name, value, onChange, error, placeholder, type = "text", autoComplete }: FieldProps) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-bio-dark">
        {label} <span className="text-bio-orange">*</span>
      </span>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={`w-full rounded-xl border px-4 py-2.5 text-sm text-bio-dark outline-none transition-colors focus:border-bio-green ${
          error
            ? "border-red-400 bg-red-50"
            : "border-bio-dark/20 bg-white hover:border-bio-green/50"
        }`}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </label>
  );
}

function MercadoPagoLogo() {
  return (
    <svg viewBox="0 0 48 20" fill="none" className="h-5 w-auto" aria-hidden>
      <path
        d="M24 0C10.75 0 0 4.48 0 10s10.75 10 24 10 24-4.48 24-10S37.25 0 24 0z"
        fill="#fff"
        opacity=".2"
      />
      <text x="4" y="14" fontSize="11" fontWeight="bold" fill="#fff" fontFamily="sans-serif">
        MP
      </text>
    </svg>
  );
}
