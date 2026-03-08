import type { Product } from "../types/api";
import { apiRequest } from "./api-client";

export async function fetchProducts(params?: { category?: string; search?: string; limit?: number; offset?: number }): Promise<Product[]> {
  const data = await apiRequest<{ items: Product[] }>("/products", {
    method: "GET",
    params: params as Record<string, string | number | undefined>,
  });
  return data.items ?? [];
}
