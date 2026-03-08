import type { Product } from "../types/api";
import { getApiBaseUrl, parseJsonResponse } from "./api-client";
import { getAuthHeaders } from "./auth-api";

export async function getAdminProducts(token: string): Promise<Product[]> {
  const res = await fetch(`${getApiBaseUrl()}/admin/products`, {
    headers: getAuthHeaders(token),
  });
  const data = (await parseJsonResponse(res)) as { items?: Product[]; message?: string };
  if (!res.ok || !data.items) throw new Error((data as { message?: string }).message || "Failed to fetch");
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
  const data = await parseJsonResponse(res);
  if (!res.ok) throw data;
  return data as Product;
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
  const data = await parseJsonResponse(res);
  if (!res.ok) throw data;
  return data as Product;
}

export async function deleteProduct(token: string, id: string): Promise<void> {
  const res = await fetch(`${getApiBaseUrl()}/admin/products/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(token),
  });
  if (!res.ok) throw await parseJsonResponse(res);
}

export async function getAdminOrders(token: string): Promise<AdminOrder[]> {
  const res = await fetch(`${getApiBaseUrl()}/admin/orders`, {
    headers: getAuthHeaders(token),
  });
  const data = await parseJsonResponse(res);
  if (!res.ok) throw (data as { message?: string });
  if (!Array.isArray(data)) throw new Error((data as { message?: string }).message || "Failed to fetch");
  return data as AdminOrder[];
}

export async function getAdminOrder(token: string, orderId: string): Promise<AdminOrder | null> {
  const res = await fetch(`${getApiBaseUrl()}/admin/orders/${orderId}`, {
    headers: getAuthHeaders(token),
  });
  const data = await parseJsonResponse(res);
  if (!res.ok) {
    if (res.status === 404) return null;
    throw data;
  }
  return data as AdminOrder;
}

export type OrderStatus = "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";

export async function updateOrderStatus(
  token: string,
  orderId: string,
  status: OrderStatus
): Promise<AdminOrder> {
  const res = await fetch(`${getApiBaseUrl()}/admin/orders/${orderId}`, {
    method: "PATCH",
    headers: { ...getAuthHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  const data = await parseJsonResponse(res);
  if (!res.ok) throw data;
  return data as AdminOrder;
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
  const data = (await parseJsonResponse(res)) as { url?: string };
  if (!res.ok) throw data;
  const url = data.url ?? "";
  return url.startsWith("http") ? url : `${getApiBaseUrl()}${url}`;
}

/** Upload image as base64 data URL (more reliable when multipart fails). */
export async function uploadImageBase64(token: string, dataUrl: string): Promise<string> {
  const res = await fetch(`${getApiBaseUrl()}/upload/base64`, {
    method: "POST",
    headers: { ...getAuthHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify({ image: dataUrl }),
  });
  const data = (await parseJsonResponse(res)) as { url?: string };
  if (!res.ok) throw data;
  const url = data.url ?? "";
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
  const data = (await parseJsonResponse(res)) as { text?: string };
  if (!res.ok) throw data;
  return data.text ?? "";
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
