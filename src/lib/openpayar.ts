const SANDBOX = process.env.OPENPAY_AR_SANDBOX !== "false";
const CLIENT_ID = process.env.OPENPAY_AR_CLIENT_ID ?? "";
const CLIENT_SECRET = process.env.OPENPAY_AR_CLIENT_SECRET ?? "";

const AUTH_URL = SANDBOX
  ? "https://auth.stg.geopagos.io/oauth/token"
  : "https://auth.prd.geopagos.io/oauth/token";

const API_BASE = SANDBOX
  ? "https://api-mpos-openpay-ar.stg.geopagos.io"
  : "https://api.openpayargentina.com.ar";

export function isConfigured(): boolean {
  return Boolean(CLIENT_ID && CLIENT_SECRET);
}

async function getAccessToken(): Promise<string> {
  const params = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
  });
  const res = await fetch(AUTH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenPay AR auth failed ${res.status}: ${text}`);
  }
  const data = await res.json();
  return data.access_token as string;
}

type OrderItem = {
  id: string;
  name: string;
  unitPrice: number; // ARS (pesos)
  quantity: number;
};

type CreateOrderParams = {
  orderId: string;
  items: OrderItem[];
  successUrl: string;
  failureUrl: string;
  webhookUrl?: string;
};

export async function createOrder(params: CreateOrderParams): Promise<string> {
  const token = await getAccessToken();

  const body = {
    data: {
      attributes: {
        currency: "032", // ISO 4217 numérico para ARS
        items: params.items.map((item) => ({
          id: item.id,
          name: item.name,
          unitPrice: {
            currency: "032",
            amount: Math.round(item.unitPrice * 100), // pesos → centavos
          },
          quantity: item.quantity,
        })),
        redirect_urls: {
          success: params.successUrl,
          failed: params.failureUrl,
        },
        ...(params.webhookUrl && { webhookUrl: params.webhookUrl }),
        externalReference: params.orderId,
      },
    },
  };

  const res = await fetch(`${API_BASE}/api/v2/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/vnd.api+json",
      Accept: "application/vnd.api+json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenPay AR order failed ${res.status}: ${text}`);
  }

  const data = await res.json();
  const checkoutUrl = data?.data?.attributes?.links?.checkout as string | undefined;
  if (!checkoutUrl) {
    throw new Error("OpenPay AR: respuesta sin URL de checkout");
  }
  return checkoutUrl;
}
