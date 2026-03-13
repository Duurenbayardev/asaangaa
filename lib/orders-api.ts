import type { Order } from "../types/api";
import { getApiBaseUrl, parseJsonResponse } from "./api-client";
import { getAuthHeaders } from "./auth-api";

export interface CreateOrderResponse {
  id: string;
  status: string;
  lines: { productName: string; quantity: number; unitPrice: number; total: number }[];
  subtotal: number;
  tax: number;
  delivery: number;
  grandTotal: number;
  createdAt: string;
}

export interface QPayInvoiceUrl {
  name: string;
  description?: string;
  link: string;
}

export interface CreateOrderWithQPayResponse {
  order: CreateOrderResponse;
  qPay: {
    invoiceId: string;
    qrImage: string;
    qrText: string;
    urls: QPayInvoiceUrl[];
  };
}

export async function createOrderWithQPay(
  token: string,
  body: { addressId: string; phone: string; itemIds?: string[] }
): Promise<CreateOrderWithQPayResponse> {
  const res = await fetch(`${getApiBaseUrl()}/orders/create-with-qpay`, {
    method: "POST",
    headers: { ...getAuthHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await parseJsonResponse(res);
  if (!res.ok) throw data;
  return data as CreateOrderWithQPayResponse;
}

export async function createOrder(
  token: string,
  body: { addressId: string; phone: string; itemIds?: string[] }
): Promise<CreateOrderResponse> {
  const res = await fetch(`${getApiBaseUrl()}/orders`, {
    method: "POST",
    headers: { ...getAuthHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await parseJsonResponse(res);
  if (!res.ok) throw data;
  return data as CreateOrderResponse;
}

export async function getOrders(token: string): Promise<Order[]> {
  const res = await fetch(`${getApiBaseUrl()}/orders`, {
    headers: getAuthHeaders(token),
  });
  const data = await parseJsonResponse(res);
  if (!res.ok) throw data;
  return Array.isArray(data) ? data : [];
}

export async function getOrder(token: string, orderId: string): Promise<Order | null> {
  const res = await fetch(`${getApiBaseUrl()}/orders/${orderId}`, {
    headers: getAuthHeaders(token),
  });
  const data = await parseJsonResponse(res);
  if (!res.ok) {
    if (res.status === 404) return null;
    throw data;
  }
  return data as Order;
}
