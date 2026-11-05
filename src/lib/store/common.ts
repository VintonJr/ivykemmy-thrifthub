import type { Order, Product } from "../types";

export const HOLD_MINUTES = 15;

export interface ProductFilter {
  category?: string;
  size?: string;
  maxPrice?: number;
  q?: string;
  includeUnavailable?: boolean;
}

export type NewProduct = Omit<Product, "id" | "createdAt" | "status">;
export type NewOrder = Omit<Order, "id" | "reference" | "items" | "subtotalKes" | "totalKes" | "status" | "createdAt">;

export class UnavailableError extends Error {
  constructor(public titles: string[]) {
    super(`No longer available: ${titles.join(", ")}`);
  }
}

export function newOrderReference(): string {
  return `IVK-${Date.now().toString(36).toUpperCase()}`;
}
