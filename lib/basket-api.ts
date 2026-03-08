import type { BasketItem } from "../types/api";
import { apiRequest, getAuthHeaders } from "./api-client";

export type BasketRecord = Record<string, BasketItem>;

export async function getBasket(token: string): Promise<BasketRecord> {
  const data = await apiRequest<{ items: BasketItem[]; total: number }>("/basket", {
    method: "GET",
    headers: getAuthHeaders(token),
  });
  const basket: BasketRecord = {};
  for (const item of data.items) {
    basket[item.product.id] = item;
  }
  return basket;
}

export async function putBasket(
  token: string,
  items: { productId: string; quantity: number }[]
): Promise<BasketRecord> {
  const data = await apiRequest<{ items: BasketItem[]; total: number }>("/basket", {
    method: "PUT",
    headers: getAuthHeaders(token),
    body: JSON.stringify({ items }),
  });
  const basket: BasketRecord = {};
  for (const item of data.items) {
    basket[item.product.id] = item;
  }
  return basket;
}
