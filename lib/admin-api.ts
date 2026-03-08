import type { Product } from "../types/api";
import { getApiBaseUrl } from "./api-client";
import { getAuthHeaders } from "./auth-api";

export async function getAdminProducts(token: string): Promise<Product[]> {
  const data = await fetch(`${getApiBaseUrl()}/admin/products`, {
    headers: getAuthHeaders(token),
  }).then((r) => r.json());
  if (!data.items) throw new Error(data.message || "Failed to fetch");
  return data.items;
}

export async function createProduct(
  token: string,
  body: { name: string; categoryId: string; price: number; unit: string; description?: string; images?: string[]; tags?: string[] }
): Promise<Product> {
  const res = await fetch(`${getApiBaseUrl()}/admin/products`, {
    method: "POST",
    headers: { ...getAuthHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
}

export async function updateProduct(
  token: string,
  id: string,
  body: Partial<{ name: string; categoryId: string; price: number; unit: string; description: string; images: string[]; tags: string[] }>
): Promise<Product> {
  const res = await fetch(`${getApiBaseUrl()}/admin/products/${id}`, {
    method: "PATCH",
    headers: { ...getAuthHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
}

export async function deleteProduct(token: string, id: string): Promise<void> {
  const res = await fetch(`${getApiBaseUrl()}/admin/products/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(token),
  });
  if (!res.ok) throw await res.json();
}

export async function getAdminOrders(token: string): Promise<AdminOrder[]> {
  const data = await fetch(`${getApiBaseUrl()}/admin/orders`, {
    headers: getAuthHeaders(token),
  }).then((r) => r.json());
  if (!Array.isArray(data)) throw new Error(data.message || "Failed to fetch");
  return data;
}

export async function uploadImage(token: string, image: { uri: string; type?: string; name?: string }): Promise<string> {
  const formData = new FormData();
  formData.append("image", {
    uri: image.uri,
    type: image.type ?? "image/jpeg",
    name: image.name ?? "image.jpg",
  } as unknown as Blob);
  const res = await fetch(`${getApiBaseUrl()}/upload`, {
    method: "POST",
    headers: getAuthHeaders(token),
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw data;
  const url = data.url as string;
  return url.startsWith("http") ? url : `${getApiBaseUrl()}${url}`;
}

export async function ocrImage(token: string, image: { uri: string; type?: string; name?: string }): Promise<string> {
  const formData = new FormData();
  formData.append("image", {
    uri: image.uri,
    type: image.type ?? "image/jpeg",
    name: image.name ?? "image.jpg",
  } as unknown as Blob);
  const res = await fetch(`${getApiBaseUrl()}/ocr`, {
    method: "POST",
    headers: getAuthHeaders(token),
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw data;
  return (data.text as string) ?? "";
}

export interface AdminOrder {
  id: string;
  userId: string;
  userEmail: string;
  userName: string | null;
  status: string;
  lines: { productId: string; productName: string; quantity: number; unitPrice: number; total: number }[];
  address: Record<string, unknown>;
  subtotal: number;
  tax: number;
  delivery: number;
  grandTotal: number;
  createdAt: string;
}
