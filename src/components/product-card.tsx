import Link from "next/link";
import type { Product } from "@/lib/types";
import { conditionLabel, formatKes } from "@/lib/format";

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link href={`/product/${product.id}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-stone-200">
        {/* eslint-disable-next-line @next/next/no-img-element -- admin uploads have unknown sizes */}
        <img src={product.images[0]} alt={product.title} className="h-full w-full object-cover transition group-hover:scale-105" />
        {product.status !== "available" && (
          <span className="absolute left-2 top-2 rounded-full bg-black/70 px-3 py-1 text-xs font-semibold text-white">
            {product.status === "sold" ? "Sold" : "On hold"}
          </span>
        )}
      </div>
      <div className="mt-2 space-y-0.5">
        <p className="truncate text-sm font-medium">{product.title}</p>
        <p className="text-xs text-muted">
          {[product.brand, `Size ${product.size}`, conditionLabel(product.condition)].filter(Boolean).join(" · ")}
        </p>
        <p className="font-semibold">{formatKes(product.priceKes)}</p>
      </div>
    </Link>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-[4/5] rounded-xl bg-stone-200" />
          <div className="mt-2 h-4 w-3/4 rounded bg-stone-200" />
          <div className="mt-1 h-4 w-1/3 rounded bg-stone-200" />
        </div>
      ))}
    </div>
  );
}
