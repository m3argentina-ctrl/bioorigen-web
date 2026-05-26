function isSandbox(): boolean {
  return process.env.OPENPAY_AR_SANDBOX !== "false";
}

function getClientId(): string {
  return process.env.OPENPAY_AR_CLIENT_ID ?? "";
}

function getClientSecret(): string {
  return process.env.OPENPAY_AR_CLIENT_SECRET ?? "";
}

function getAuthUrl(): string {
  return isSandbox()
    ? "https://auth.stg.geopagos.io/oauth/token"
    : "https://auth.prd.geopagos.io/oauth/token";
}

function getApiBase(): string {
  return isSandbox()
    ? "https://api-mpos-openpay-ar.stg.geopagos.io"
    : "https://api.openpayargentina.com.ar";
}

export function isConfigured(): boolean {
  return Boolean(getClientId() && getClientSecret());
}

async function getAccessToken(): Promise<string> {
  const clientId = getClientId();
  const clientSecret = getClientSecret();
  console.log(`[openpayar] auth → sandbox=${isSandbox()} configured=${Boolean(clientId && clientSecret)}`);
  const params = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
  });
  const res = await fetch(getAuthUrl(), {
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

  const res = await fetch(`${getApiBase()}/api/v2/orders`, {
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
