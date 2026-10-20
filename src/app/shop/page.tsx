import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ProductCard, ProductGridSkeleton } from "@/components/product-card";
import { listProducts, listSizes } from "@/lib/db";
import { CATEGORIES } from "@/lib/types";

export const metadata: Metadata = { title: "Shop" };

type Search = Promise<Record<string, string | string[] | undefined>>;

export default function ShopPage({ searchParams }: PageProps<"/shop">) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Shop</h1>
      <Suspense fallback={<ProductGridSkeleton />}>
        <Results searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

function one(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v || undefined;
}

async function Results({ searchParams }: { searchParams: Search }) {
  const sp = await searchParams;
  const filter = {
    category: one(sp.category),
    size: one(sp.size),
    maxPrice: Number(one(sp.maxPrice)) || undefined,
    q: one(sp.q),
  };
  const [products, sizes] = await Promise.all([listProducts(filter), listSizes()]);
  const hasFilter = Object.values(filter).some(Boolean);

  return (
    <>
      <form className="grid grid-cols-2 gap-3 rounded-xl border border-blush bg-card p-4 sm:grid-cols-5">
        <input name="q" defaultValue={filter.q} placeholder="Search brand or item" className="input col-span-2 sm:col-span-1" />
        <select name="category" defaultValue={filter.category ?? ""} className="input">
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
        <select name="size" defaultValue={filter.size ?? ""} className="input">
          <option value="">Any size</option>
          {sizes.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select name="maxPrice" defaultValue={filter.maxPrice?.toString() ?? ""} className="input">
          <option value="">Any price</option>
          {[500, 1000, 2000, 3000, 5000].map((p) => (
            <option key={p} value={p}>
              Up to KES {p.toLocaleString("en-KE")}
            </option>
          ))}
        </select>
        <div className="col-span-2 flex gap-2 sm:col-span-1">
          <button className="btn flex-1 py-2">Filter</button>
          {hasFilter && (
            <Link href="/shop" className="rounded-full px-3 py-2 text-sm text-muted hover:text-brand">
              Clear
            </Link>
          )}
        </div>
      </form>

      {products.length ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <p className="py-10 text-center text-muted">Nothing matches yet. New pieces drop every week.</p>
      )}
    </>
  );
}
