import "server-only";
import { randomUUID } from "crypto";
import postgres from "postgres";
import type { Order, OrderStatus, Product } from "../types";
import { HOLD_MINUTES, newOrderReference, UnavailableError, type NewOrder, type NewProduct, type ProductFilter } from "./common";

// Products and orders in PostgreSQL (Supabase on the live shop).
// Tables live in their own "shop" schema with row level security on, so Supabase's public API can't read them.
// They are created on first use, so there's no SQL to run by hand.

type Sql = postgres.Sql | postgres.TransactionSql;

export function databaseUrl(): string | undefined {
  return process.env.POSTGRES_URL || process.env.DATABASE_URL || undefined;
}

function connect(): postgres.Sql {
  const url = new URL(databaseUrl()!);
  const local = ["localhost", "127.0.0.1"].includes(url.hostname) || url.searchParams.get("sslmode") === "disable";
  // Supabase's connection string carries extra query options (e.g. supa=...) that Postgres itself rejects.
  url.search = "";
  return postgres(url.toString(), {
    ssl: local ? false : "require",
    // Supabase's pooler (port 6543) doesn't support prepared statements.
    prepare: false,
    max: 3,
    idle_timeout: 20,
  });
}

// One connection pool per server process, kept across dev reloads.
const globals = globalThis as unknown as { ivkSql?: postgres.Sql; ivkReady?: Promise<void> };

const SCHEMA = `
create schema if not exists shop;

create table if not exists shop.products (
  id text primary key,
  title text not null,
  description text not null default '',
  category text not null,
  brand text,
  size text not null,
  condition text not null,
  flaws text,
  price_kes integer not null,
  images text[] not null default '{}',
  status text not null default 'available',
  reserved_until timestamptz,
  reserved_by_order text,
  created_at timestamptz not null default now()
);

create table if not exists shop.orders (
  id text primary key,
  reference text not null unique,
  customer jsonb not null,
  delivery jsonb not null,
  items jsonb not null,
  subtotal_kes integer not null,
  total_kes integer not null,
  status text not null,
  payment_ref text,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create index if not exists products_status_idx on shop.products (status, created_at desc);
create index if not exists orders_created_idx on shop.orders (created_at desc);

alter table shop.products enable row level security;
alter table shop.orders enable row level security;
`;

async function db(): Promise<postgres.Sql> {
  const sql = (globals.ivkSql ??= connect());
  globals.ivkReady ??= sql
    .begin(async (tx) => {
      // Several servers may start at once; only one creates the tables.
      await tx`select pg_advisory_xact_lock(4815162342)`;
      await tx.unsafe(SCHEMA);
    })
    .then(() => undefined)
    .catch((err) => {
      globals.ivkReady = undefined;
      throw err;
    });
  await globals.ivkReady;
  return sql;
}

interface ProductRow {
  id: string;
  title: string;
  description: string;
  category: Product["category"];
  brand: string | null;
  size: string;
  condition: Product["condition"];
  flaws: string | null;
  price_kes: number;
  images: string[];
  status: Product["status"];
  reserved_until: Date | null;
  reserved_by_order: string | null;
  created_at: Date;
}

interface OrderRow {
  id: string;
  reference: string;
  customer: Order["customer"];
  delivery: Order["delivery"];
  items: Order["items"];
  subtotal_kes: number;
  total_kes: number;
  status: OrderStatus;
  payment_ref: string | null;
  created_at: Date;
  paid_at: Date | null;
}

function toProduct(r: ProductRow): Product {
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    category: r.category,
    brand: r.brand ?? undefined,
    size: r.size,
    condition: r.condition,
    flaws: r.flaws ?? undefined,
    priceKes: r.price_kes,
    images: r.images,
    status: r.status,
    reservedUntil: r.reserved_until?.getTime(),
    reservedByOrder: r.reserved_by_order ?? undefined,
    createdAt: r.created_at.getTime(),
  };
}

function toOrder(r: OrderRow): Order {
  return {
    id: r.id,
    reference: r.reference,
    customer: r.customer,
    delivery: r.delivery,
    items: r.items,
    subtotalKes: r.subtotal_kes,
    totalKes: r.total_kes,
    status: r.status,
    paymentRef: r.payment_ref ?? undefined,
    createdAt: r.created_at.getTime(),
    paidAt: r.paid_at?.getTime(),
  };
}

// Frees pieces whose 15-minute hold ran out and cancels the unpaid orders behind them.
async function releaseExpiredHolds(sql: Sql) {
  await sql`
    with expired as (
      select id, reserved_by_order from shop.products
      where status = 'reserved' and reserved_until < now()
      for update skip locked
    ),
    cancelled as (
      update shop.orders set status = 'cancelled'
      where status = 'pending-payment' and id in (select reserved_by_order from expired)
    )
    update shop.products set status = 'available', reserved_until = null, reserved_by_order = null
    where id in (select id from expired)`;
}

async function readDb(): Promise<postgres.Sql> {
  const sql = await db();
  await releaseExpiredHolds(sql);
  return sql;
}

export async function listProducts(filter: ProductFilter = {}): Promise<Product[]> {
  const sql = await readDb();
  const q = filter.q?.trim();
  const rows = await sql<ProductRow[]>`
    select * from shop.products
    where true
      ${filter.includeUnavailable ? sql`` : sql`and status = 'available'`}
      ${filter.category ? sql`and category = ${filter.category}` : sql``}
      ${filter.size ? sql`and lower(size) = lower(${filter.size})` : sql``}
      ${filter.maxPrice ? sql`and price_kes <= ${filter.maxPrice}` : sql``}
      ${q ? sql`and strpos(lower(title || ' ' || coalesce(brand, '') || ' ' || description), lower(${q})) > 0` : sql``}
    order by created_at desc`;
  return rows.map(toProduct);
}

export async function getProduct(id: string): Promise<Product | undefined> {
  const sql = await readDb();
  const [row] = await sql<ProductRow[]>`select * from shop.products where id = ${id}`;
  return row ? toProduct(row) : undefined;
}

export async function listSizes(): Promise<string[]> {
  const sql = await readDb();
  const rows = await sql<{ size: string }[]>`select distinct size from shop.products where status = 'available' order by size`;
  return rows.map((r) => r.size);
}

export async function createProduct(input: NewProduct): Promise<Product> {
  const sql = await db();
  const [row] = await sql<ProductRow[]>`
    insert into shop.products (id, title, description, category, brand, size, condition, flaws, price_kes, images)
    values (${randomUUID().slice(0, 8)}, ${input.title}, ${input.description}, ${input.category}, ${input.brand ?? null},
            ${input.size}, ${input.condition}, ${input.flaws ?? null}, ${input.priceKes}, ${input.images})
    returning *`;
  return toProduct(row);
}

// Only status changes are needed today (hide/show); other fields are kept for parity with the file store.
export async function updateProduct(id: string, patch: Partial<Product>): Promise<void> {
  const sql = await db();
  const columns: Record<string, unknown> = {};
  if (patch.title !== undefined) columns.title = patch.title;
  if (patch.description !== undefined) columns.description = patch.description;
  if (patch.size !== undefined) columns.size = patch.size;
  if (patch.priceKes !== undefined) columns.price_kes = patch.priceKes;
  if (patch.status !== undefined) columns.status = patch.status;
  if (!Object.keys(columns).length) return;
  await sql`update shop.products set ${sql(columns)} where id = ${id}`;
}

export async function deleteProduct(id: string): Promise<void> {
  const sql = await db();
  await sql`delete from shop.products where id = ${id}`;
}

// Reserves every product in the cart for HOLD_MINUTES and creates a pending order.
// Row locks stop two shoppers from grabbing the same piece at once.
export async function createOrder(input: NewOrder, productIds: string[]): Promise<Order> {
  const sql = await db();
  return sql.begin(async (tx) => {
    await releaseExpiredHolds(tx);
    const rows = await tx<ProductRow[]>`select * from shop.products where id = any(${productIds}) order by id for update`;
    const byId = new Map(rows.map((r) => [r.id, r]));
    const unavailable = productIds
      .map((id) => {
        const p = byId.get(id);
        return !p || p.status !== "available" ? (p?.title ?? id) : null;
      })
      .filter((t): t is string => t !== null);
    if (unavailable.length) throw new UnavailableError(unavailable);

    const products = productIds.map((id) => byId.get(id)!);
    const id = randomUUID();
    const items = products.map((p) => ({ productId: p.id, title: p.title, priceKes: p.price_kes, image: p.images[0] }));
    const subtotalKes = items.reduce((sum, i) => sum + i.priceKes, 0);
    const [order] = await tx<OrderRow[]>`
      insert into shop.orders (id, reference, customer, delivery, items, subtotal_kes, total_kes, status)
      values (${id}, ${newOrderReference()}, ${tx.json(input.customer)}, ${tx.json(input.delivery)}, ${tx.json(items)},
              ${subtotalKes}, ${subtotalKes + input.delivery.feeKes}, 'pending-payment')
      returning *`;
    await tx`
      update shop.products
      set status = 'reserved', reserved_until = now() + make_interval(mins => ${HOLD_MINUTES}), reserved_by_order = ${id}
      where id = any(${productIds})`;
    return toOrder(order);
  });
}

export async function getOrder(id: string): Promise<Order | undefined> {
  const sql = await readDb();
  const [row] = await sql<OrderRow[]>`select * from shop.orders where id = ${id}`;
  return row ? toOrder(row) : undefined;
}

export async function getOrderByReference(reference: string): Promise<Order | undefined> {
  const sql = await readDb();
  const [row] = await sql<OrderRow[]>`select * from shop.orders where reference = ${reference}`;
  return row ? toOrder(row) : undefined;
}

export async function listOrders(): Promise<Order[]> {
  const sql = await readDb();
  const rows = await sql<OrderRow[]>`select * from shop.orders order by created_at desc`;
  return rows.map(toOrder);
}

// Marks the order paid and its pieces sold. Safe to call more than once.
export async function markOrderPaid(orderId: string, paymentRef: string): Promise<Order | undefined> {
  const sql = await db();
  return sql.begin(async (tx) => {
    const [row] = await tx<OrderRow[]>`select * from shop.orders where id = ${orderId} for update`;
    if (!row) return undefined;
    if (row.status !== "pending-payment" && row.status !== "cancelled") return toOrder(row);
    const [paid] = await tx<OrderRow[]>`
      update shop.orders set status = 'paid', paid_at = now(), payment_ref = ${paymentRef}
      where id = ${orderId} returning *`;
    const productIds = row.items.map((i) => i.productId);
    await tx`
      update shop.products set status = 'sold', reserved_until = null, reserved_by_order = null
      where id = any(${productIds})`;
    return toOrder(paid);
  });
}

export async function setOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
  const sql = await db();
  await sql`update shop.orders set status = ${status} where id = ${orderId}`;
}
