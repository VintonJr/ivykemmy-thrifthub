export type Category = "women" | "men" | "kids" | "shoes" | "bags" | "accessories";

export type Condition = "new-with-tags" | "excellent" | "good" | "fair";

export type ProductStatus = "available" | "reserved" | "sold" | "hidden";

export interface Product {
  id: string;
  title: string;
  description: string;
  category: Category;
  brand?: string;
  size: string;
  condition: Condition;
  flaws?: string;
  priceKes: number;
  images: string[];
  status: ProductStatus;
  // Set while a shopper is paying, so the one-of-a-kind piece can't be sold twice.
  reservedUntil?: number;
  reservedByOrder?: string;
  createdAt: number;
}

export type OrderStatus = "pending-payment" | "paid" | "packed" | "dispatched" | "delivered" | "cancelled";

export interface OrderItem {
  productId: string;
  title: string;
  priceKes: number;
  image?: string;
}

export interface Order {
  id: string;
  reference: string;
  customer: { name: string; phone: string; email?: string };
  delivery: { zoneId: string; zoneName: string; feeKes: number; address: string };
  items: OrderItem[];
  subtotalKes: number;
  totalKes: number;
  status: OrderStatus;
  paymentRef?: string;
  createdAt: number;
  paidAt?: number;
}

export const CATEGORIES: { id: Category; label: string }[] = [
  { id: "women", label: "Women" },
  { id: "men", label: "Men" },
  { id: "kids", label: "Kids" },
  { id: "shoes", label: "Shoes" },
  { id: "bags", label: "Bags" },
  { id: "accessories", label: "Accessories" },
];

export const CONDITIONS: { id: Condition; label: string }[] = [
  { id: "new-with-tags", label: "New with tags" },
  { id: "excellent", label: "Excellent" },
  { id: "good", label: "Good" },
  { id: "fair", label: "Fair" },
];

export const ORDER_STATUSES: OrderStatus[] = ["pending-payment", "paid", "packed", "dispatched", "delivered", "cancelled"];
