import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCartButton } from "@/components/cart";
import { getProduct } from "@/lib/db";
import { categoryLabel, conditionLabel, formatKes } from "@/lib/format";

export default function ProductPage({ params }: PageProps<"/product/[id]">) {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-stone-200" />}>
      <ProductDetail params={params} />
    </Suspense>
  );
}

async function ProductDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product || product.status === "hidden") notFound();
  const available = product.status === "available";

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div className="space-y-3">
        {product.images.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element -- admin uploads have unknown sizes
          <img key={i} src={src} alt={`${product.title} photo ${i + 1}`} className="w-full rounded-xl bg-stone-200 object-cover" />
        ))}
      </div>
      <div className="space-y-5">
        <Link href={`/shop?category=${product.category}`} className="text-sm text-muted hover:text-ivy">
          {categoryLabel(product.category)}
        </Link>
        <h1 className="text-2xl font-bold">{product.title}</h1>
        <p className="text-2xl font-semibold text-ivy">{formatKes(product.priceKes)}</p>
        {!available && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {product.status === "sold" ? "This piece has found a new home." : "Someone is checking out with this piece right now. Check back in 15 minutes."}
          </p>
        )}
        <dl className="grid grid-cols-2 gap-3 rounded-xl border border-stone-200 bg-card p-4 text-sm">
          {product.brand && (
            <div>
              <dt className="text-muted">Brand</dt>
              <dd className="font-medium">{product.brand}</dd>
            </div>
          )}
          <div>
            <dt className="text-muted">Size</dt>
            <dd className="font-medium">{product.size}</dd>
          </div>
          <div>
            <dt className="text-muted">Condition</dt>
            <dd className="font-medium">{conditionLabel(product.condition)}</dd>
          </div>
          {product.flaws && (
            <div className="col-span-2">
              <dt className="text-muted">Flaws</dt>
              <dd className="font-medium">{product.flaws}</dd>
            </div>
          )}
        </dl>
        <p className="leading-relaxed">{product.description}</p>
        <AddToCartButton
          disabled={!available}
          item={{ id: product.id, title: product.title, priceKes: product.priceKes, image: product.images[0], size: product.size }}
        />
        <p className="text-xs text-muted">One of a kind: only one piece available. Pay with M-Pesa or card at checkout.</p>
      </div>
    </div>
  );
}
