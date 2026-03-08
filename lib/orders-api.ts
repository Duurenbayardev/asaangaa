import type { Order } from "../types/api";
import { getApiBaseUrl } from "./api-client";
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

export async function createOrder(
  token: string,
  body: { addressId: string; itemIds?: string[] }
): Promise<CreateOrderResponse> {
  const res = await fetch(`${getApiBaseUrl()}/orders`, {
    method: "POST",
    headers: { ...getAuthHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
}

export async function getOrders(token: string): Promise<Order[]> {
  const res = await fetch(`${getApiBaseUrl()}/orders`, {
    headers: getAuthHeaders(token),
  });
  const data = await res.json();
  if (!res.ok) throw data;
  return Array.isArray(data) ? data : [];
}
