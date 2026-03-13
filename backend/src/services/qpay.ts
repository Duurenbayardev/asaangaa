/**
 * QPay Mongolia merchant API client.
 * Docs: token (Basic auth), create invoice (simple), payment check.
 */

import { config } from "../config";

const BASE = config.qpay.baseUrl;

function getBasicAuth(): string {
  const { clientId, clientSecret } = config.qpay;
  if (!clientId || !clientSecret) {
    throw new Error("QPay credentials not configured (QPAY_CLIENT_ID, QPAY_CLIENT_SECRET)");
  }
  return Buffer.from(`${clientId}:${clientSecret}`, "utf8").toString("base64");
}

export interface QPayTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
}

let cachedToken: { token: string; expiresAt: number } | null = null;

export async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.token;
  }
  const res = await fetch(`${BASE}/v2/auth/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${getBasicAuth()}`,
      "Content-Type": "application/json",
    },
    body: "{}",
  });
  const data = (await res.json()) as QPayTokenResponse & { error?: string };
  if (!res.ok || data.error) {
    throw new Error(data.error ?? `QPay auth failed: ${res.status}`);
  }
  const expiresIn = (data.expires_in ?? 3600) * 1000;
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + expiresIn,
  };
  return cachedToken.token;
}

export interface CreateInvoiceParams {
  senderInvoiceNo: string;
  invoiceReceiverCode: string;
  invoiceDescription: string;
  amount: number;
  callbackUrl: string;
}

export interface QPayInvoiceUrl {
  name: string;
  description?: string;
  link: string;
}

export interface CreateInvoiceResponse {
  invoice_id: string;
  qr_text: string;
  qr_image: string;
  urls: QPayInvoiceUrl[];
}

export async function createInvoice(params: CreateInvoiceParams): Promise<CreateInvoiceResponse> {
  const { invoiceCode } = config.qpay;
  if (!invoiceCode) {
    throw new Error("QPay invoice code not configured (QPAY_INVOICE_CODE)");
  }
  const token = await getAccessToken();
  const body = {
    invoice_code: invoiceCode,
    sender_invoice_no: params.senderInvoiceNo,
    invoice_receiver_code: params.invoiceReceiverCode,
    invoice_description: params.invoiceDescription,
    amount: Math.round(params.amount),
    callback_url: params.callbackUrl,
  };
  const res = await fetch(`${BASE}/v2/invoice`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as CreateInvoiceResponse & { error?: string; message?: string };
  if (!res.ok || data.error) {
    throw new Error(data.message ?? data.error ?? `QPay create invoice failed: ${res.status}`);
  }
  if (!data.invoice_id) {
    throw new Error("QPay did not return invoice_id");
  }
  return {
    invoice_id: data.invoice_id,
    qr_text: data.qr_text ?? "",
    qr_image: data.qr_image ?? "",
    urls: Array.isArray(data.urls) ? data.urls : [],
  };
}

export interface PaymentCheckRow {
  payment_id: string;
  payment_status: string;
  payment_date: string;
  payment_amount: string;
  payment_currency: string;
}

export interface PaymentCheckResponse {
  count: number;
  paid_amount: number;
  rows: PaymentCheckRow[];
}

export async function checkPayment(invoiceId: string): Promise<PaymentCheckResponse> {
  const token = await getAccessToken();
  const res = await fetch(`${BASE}/v2/payment/check`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      object_type: "INVOICE",
      object_id: invoiceId,
      offset: { page_number: 1, page_limit: 100 },
    }),
  });
  const data = (await res.json()) as PaymentCheckResponse & { error?: string };
  if (!res.ok) {
    throw new Error(data.error ?? `QPay payment check failed: ${res.status}`);
  }
  return {
    count: data.count ?? 0,
    paid_amount: data.paid_amount ?? 0,
    rows: Array.isArray(data.rows) ? data.rows : [],
  };
}

export function isQPayConfigured(): boolean {
  const { clientId, clientSecret, invoiceCode, callbackBaseUrl } = config.qpay;
  return !!(clientId && clientSecret && invoiceCode && callbackBaseUrl);
}
