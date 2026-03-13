/**
 * QPay Mongolia merchant API client.
 * Docs: token (Basic auth), create invoice (simple), payment check.
 */

import { config } from "../config";

const BASE = config.qpay.baseUrl;

async function readJsonOrText(res: Response): Promise<{ json: unknown | null; text: string }> {
  const text = await res.text();
  if (!text.trim()) return { json: null, text: "" };
  try {
    return { json: JSON.parse(text), text };
  } catch {
    return { json: null, text };
  }
}

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
  const parsed = await readJsonOrText(res);
  const data = (parsed.json ?? {}) as Partial<QPayTokenResponse> & { error?: string; code?: string; message?: string };
  if (!res.ok || data.error) {
    const code = data.code ?? data.error;
    const msg = data.message ?? data.error ?? parsed.text?.slice(0, 300);
    throw new Error(`QPay auth failed: ${res.status}${code ? ` code=${code}` : ""}${msg ? ` ${msg}` : ""}`);
  }
  if (!data.access_token) {
    const code = (data as { code?: string }).code;
    const msg = (data as { message?: string }).message ?? parsed.text?.slice(0, 300);
    throw new Error(`QPay auth no token: ${res.status}${code ? ` code=${code}` : ""}${msg ? ` ${msg}` : ""}`);
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
  const parsed = await readJsonOrText(res);
  const data = (parsed.json ?? {}) as Partial<CreateInvoiceResponse> & { error?: string; code?: string; message?: string };
  if (!res.ok || data.error) {
    const code = data.code ?? data.error;
    const msg = data.message ?? data.error ?? parsed.text?.slice(0, 300);
    throw new Error(`QPay create invoice failed: ${res.status}${code ? ` code=${code}` : ""}${msg ? ` ${msg}` : ""}`);
  }
  if (!data.invoice_id) {
    const code = (data as { code?: string }).code;
    const msg = (data as { message?: string }).message ?? parsed.text?.slice(0, 300);
    throw new Error(`QPay no invoice_id: ${res.status}${code ? ` code=${code}` : ""}${msg ? ` ${msg}` : ""}`);
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
  const parsed = await readJsonOrText(res);
  const data = (parsed.json ?? {}) as Partial<PaymentCheckResponse> & { error?: string; code?: string; message?: string };
  if (!res.ok) {
    const code = data.code ?? data.error;
    const msg = data.message ?? data.error ?? parsed.text?.slice(0, 300);
    throw new Error(`QPay payment check failed: ${res.status}${code ? ` code=${code}` : ""}${msg ? ` ${msg}` : ""}`);
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
