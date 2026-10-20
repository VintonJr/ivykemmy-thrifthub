import "server-only";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import type { Order, OrderStatus, Product } from "./types";

// A simple JSON-file store so the shop runs locally with no setup.
// Swap this module for Supabase/PostgreSQL before deploying (see supabase/schema.sql):
// hosts like Vercel have a read-only filesystem.

interface Store {
  products: Product[];
  orders: Order[];
}

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_FILE = path.join(DATA_DIR, "store.json");
const SEED_FILE = path.join(DATA_DIR, "seed.json");

export const HOLD_MINUTES = 15;

async function load(): Promise<Store> {
  try {
    return JSON.parse(await fs.readFile(STORE_FILE, "utf8"));
  } catch {
    const seed: Store = JSON.parse(await fs.readFile(SEED_FILE, "utf8"));
    await fs.writeFile(STORE_FILE, JSON.stringify(seed, null, 2));
    return seed;
  }
}

// Writes run one at a time so two checkouts can't both grab the same piece.
let queue: Promise<unknown> = Promise.resolve();

function mutate<T>(fn: (store: Store) => T | Promise<T>): Promise<T> {
  const run = queue.then(async () => {
    const store = await load();
    releaseExpiredHolds(store);
    const result = await fn(store);
    await fs.writeFile(STORE_FILE, JSON.stringify(store, null, 2));
    return result;
  });
  queue = run.catch(() => undefined);
  return run;
}

function releaseExpiredHolds(store: Store) {
  const now = Date.now();
  for (const p of store.products) {
    if (p.status === "reserved" && (p.reservedUntil ?? 0) < now) {
      p.status = "available";
      p.reservedUntil = undefined;
      const order = store.orders.find((o) => o.id === p.reservedByOrder);
      if (order && order.status === "pending-payment") order.status = "cancelled";
      p.reservedByOrder = undefined;
    }
  }
}

async function read(): Promise<Store> {
  const store = await load();
  releaseExpiredHolds(store);
  return store;
}

export interface ProductFilter {
  category?: string;
  size?: string;
  maxPrice?: number;
  q?: string;
  includeUnavailable?: boolean;
}

export async function listProducts(filter: ProductFilter = {}): Promise<Product[]> {
  const { products } = await read();
  const q = filter.q?.toLowerCase().trim();
  return products
    .filter((p) => (filter.includeUnavailable ? true : p.status === "available"))
    .filter((p) => !filter.category || p.category === filter.category)
    .filter((p) => !filter.size || p.size.toLowerCase() === filter.size.toLowerCase())
    .filter((p) => !filter.maxPrice || p.priceKes <= filter.maxPrice)
    .filter((p) => !q || `${p.title} ${p.brand ?? ""} ${p.description}`.toLowerCase().includes(q))
    .sort((a, b) => b.createdAt - a.createdAt);
}

export async function getProduct(id: string): Promise<Product | undefined> {
  const { products } = await read();
  return products.find((p) => p.id === id);
}

export async function listSizes(): Promise<string[]> {
  const { products } = await read();
  return [...new Set(products.filter((p) => p.status === "available").map((p) => p.size))].sort();
}

export async function createProduct(input: Omit<Product, "id" | "createdAt" | "status">): Promise<Product> {
  return mutate((store) => {
    const product: Product = { ...input, id: randomUUID().slice(0, 8), status: "available", createdAt: Date.now() };
    store.products.push(product);
    return product;
  });
}

export async function updateProduct(id: string, patch: Partial<Product>): Promise<void> {
  await mutate((store) => {
    const p = store.products.find((x) => x.id === id);
    if (p) Object.assign(p, patch);
  });
}

export async function deleteProduct(id: string): Promise<void> {
  await mutate((store) => {
    store.products = store.products.filter((p) => p.id !== id);
  });
}

export class UnavailableError extends Error {
  constructor(public titles: string[]) {
    super(`No longer available: ${titles.join(", ")}`);
  }
}

// Reserves every product in the cart for HOLD_MINUTES and creates a pending order.
export async function createOrder(
  input: Omit<Order, "id" | "reference" | "items" | "subtotalKes" | "totalKes" | "status" | "createdAt">,
  productIds: string[],
): Promise<Order> {
  return mutate((store) => {
    const products = productIds.map((id) => store.products.find((p) => p.id === id));
    const unavailable = products
      .map((p, i) => (!p || p.status !== "available" ? (p?.title ?? productIds[i]) : null))
      .filter((t): t is string => t !== null);
    if (unavailable.length) throw new UnavailableError(unavailable);

    const id = randomUUID();
    const items = (products as Product[]).map((p) => ({
      productId: p.id,
      title: p.title,
      priceKes: p.priceKes,
      image: p.images[0],
    }));
    const subtotalKes = items.reduce((sum, i) => sum + i.priceKes, 0);
    const order: Order = {
      ...input,
      id,
      reference: `IVK-${Date.now().toString(36).toUpperCase()}`,
      items,
      subtotalKes,
      totalKes: subtotalKes + input.delivery.feeKes,
      status: "pending-payment",
      createdAt: Date.now(),
    };
    for (const p of products as Product[]) {
      p.status = "reserved";
      p.reservedUntil = Date.now() + HOLD_MINUTES * 60_000;
      p.reservedByOrder = id;
    }
    store.orders.push(order);
    return order;
  });
}

export async function getOrder(id: string): Promise<Order | undefined> {
  const { orders } = await read();
  return orders.find((o) => o.id === id);
}

export async function getOrderByReference(reference: string): Promise<Order | undefined> {
  const { orders } = await read();
  return orders.find((o) => o.reference === reference);
}

export async function listOrders(): Promise<Order[]> {
  const { orders } = await read();
  return [...orders].sort((a, b) => b.createdAt - a.createdAt);
}

// Marks the order paid and its pieces sold. Safe to call more than once.
export async function markOrderPaid(orderId: string, paymentRef: string): Promise<Order | undefined> {
  return mutate((store) => {
    const order = store.orders.find((o) => o.id === orderId);
    if (!order) return undefined;
    if (order.status === "pending-payment" || order.status === "cancelled") {
      order.status = "paid";
      order.paidAt = Date.now();
      order.paymentRef = paymentRef;
      for (const item of order.items) {
        const p = store.products.find((x) => x.id === item.productId);
        if (p) {
          p.status = "sold";
          p.reservedUntil = undefined;
          p.reservedByOrder = undefined;
        }
      }
    }
    return order;
  });
}

export async function setOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
  await mutate((store) => {
    const order = store.orders.find((o) => o.id === orderId);
    if (order) order.status = status;
  });
}
