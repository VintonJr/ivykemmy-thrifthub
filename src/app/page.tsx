import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { ProductCard, ProductGridSkeleton } from "@/components/product-card";
import { listProducts } from "@/lib/db";
import { CATEGORIES } from "@/lib/types";

export default function Home() {
  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand to-brand-dark px-6 py-12 text-white sm:px-10">
        <div aria-hidden className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-blush/25" />
        <div aria-hidden className="absolute -bottom-20 right-24 h-40 w-40 rounded-full border-[6px] border-gold/70" />
        <p className="relative text-sm uppercase tracking-widest text-blush">Pre-loved. Hand-picked. One of a kind.</p>
        <h1 className="relative mt-2 max-w-xl text-3xl font-bold sm:text-4xl">Quality thrift fashion, delivered across Kenya</h1>
        <p className="relative mt-3 max-w-lg text-white/85">Clothes, shoes and bags at thrift prices. Pay with M-Pesa, get it delivered or pick up near you.</p>
        <Link href="/shop" className="relative mt-6 inline-block rounded-full bg-white px-6 py-3 font-semibold text-brand-dark hover:bg-blush">
          Shop new drops
        </Link>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Shop by category</h2>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {CATEGORIES.map((c) => (
            <Link
              key={c.id}
              href={`/shop?category=${c.id}`}
              className="rounded-xl border border-blush bg-card px-3 py-4 text-center text-sm font-medium hover:border-brand hover:bg-blush/40 hover:text-brand-dark"
            >
              {c.label}
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">New drops</h2>
          <Link href="/shop" className="text-sm font-medium text-brand hover:underline">
            See all
          </Link>
        </div>
        <Suspense fallback={<ProductGridSkeleton />}>
          <NewDrops />
        </Suspense>
      </section>
    </div>
  );
}

async function NewDrops() {
  await connection();
  const products = (await listProducts()).slice(0, 8);
  if (!products.length) return <p className="text-muted">New pieces are coming soon.</p>;
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
