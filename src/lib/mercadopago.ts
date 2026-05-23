import MercadoPagoConfig, { Payment, Preference } from "mercadopago";

let _client: MercadoPagoConfig | null = null;

export function getMercadoPagoClient(): MercadoPagoConfig | null {
  if (_client) return _client;
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) return null;
  _client = new MercadoPagoConfig({ accessToken: token });
  return _client;
}

export function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
}

type PreferenceItem = {
  id: string;
  title: string;
  quantity: number;
  unit_price: number;
  currency_id?: string;
};

export async function createPreference(params: {
  items: PreferenceItem[];
  payer?: { name?: string; email?: string };
  orderId: string;
}): Promise<{ id: string; init_point: string; sandbox_init_point: string }> {
  const client = getMercadoPagoClient();
  if (!client) throw new Error("MercadoPago no configurado: falta MERCADOPAGO_ACCESS_TOKEN");

  const baseUrl = getBaseUrl();

  const pref = await new Preference(client).create({
    body: {
      items: params.items,
      payer: params.payer,
      back_urls: {
        success: `${baseUrl}/checkout/success`,
        failure: `${baseUrl}/checkout/failure`,
        pending: `${baseUrl}/checkout/pending`,
      },
      auto_return: "approved",
      external_reference: params.orderId,
      notification_url: `${baseUrl}/api/webhooks/mercadopago`,
    },
  });

  return {
    id: pref.id!,
    init_point: pref.init_point!,
    sandbox_init_point: pref.sandbox_init_point ?? pref.init_point!,
  };
}

export async function getPayment(paymentId: string) {
  const client = getMercadoPagoClient();
  if (!client) throw new Error("MercadoPago no configurado");
  return new Payment(client).get({ id: paymentId });
}
