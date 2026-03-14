/**
 * Shared API types / schemas for backend alignment.
 * Use these on the backend (e.g. Prisma models, REST DTOs) and in the app.
 */

import type { CategoryId } from "../constants/categories";

// ----- Auth / User (phone-only, no email) -----

export interface User {
  id: string;
  name: string | null;
  phone?: string;
  role?: string;
  verified: boolean;
  createdAt: string; // ISO
  updatedAt?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  user: User;
}

// ----- Product -----

export interface Product {
  id: string;
  name: string;
  category: CategoryId;
  price: number;
  unit: string;
  description?: string;
  images: string[];
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
}

// ----- Address -----

export interface SavedAddress {
  id: string;
  userId?: string;
  fullName?: string;
  line1: string;
  line2?: string;
  city: string;
  postalCode?: string;
  phone?: string;
  instructions?: string;
  createdAt?: string;
}

export type CreateAddressBody = Omit<SavedAddress, "id" | "userId" | "createdAt">;

// ----- Basket / Cart (session or user-scoped) -----

export interface BasketItemPayload {
  productId: string;
  quantity: number;
}

export interface BasketItem {
  product: Product;
  quantity: number;
}

export interface Basket {
  items: BasketItem[];
  total: number;
}

// ----- Wishlist -----

export interface Wishlist {
  productIds: string[];
}

// ----- Order -----

export type OrderStatus =
  | "pending"
  | "pending_payment"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface OrderLine {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface OrderAddressSnapshot {
  fullName?: string;
  line1: string;
  line2?: string;
  city: string;
  postalCode?: string;
  phone?: string;
  instructions?: string;
}

export interface Order {
  id: string;
  userId: string;
  status: OrderStatus;
  lines: OrderLine[];
  address: OrderAddressSnapshot;
  subtotal: number;
  tax: number;
  delivery: number;
  grandTotal: number;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateOrderBody {
  addressId: string;
  phone: string;
  itemIds?: string[]; // optional: subset of basket; if omitted, use full basket
}
