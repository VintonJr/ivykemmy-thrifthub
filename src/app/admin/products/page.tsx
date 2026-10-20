import { Suspense } from "react";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { listProducts } from "@/lib/db";
import { formatKes } from "@/lib/format";
import { removeProduct, setProductVisibility } from "../actions";
import { AdminNav } from "../admin-nav";

export default function AdminProductsPage() {
  return (
    <Suspense>
      <Products />
    </Suspense>
  );
}

async function Products() {
  await requireAdmin();
  const products = await listProducts({ includeUnavailable: true });

  return (
    <div>
      <AdminNav />
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-xl font-bold">Products ({products.length})</h1>
        <Link href="/admin/products/new" className="btn py-2 text-sm">
          + New listing
        </Link>
      </div>
      <ul className="divide-y divide-blush rounded-xl border border-blush bg-card">
        {products.map((p) => (
          <li key={p.id} className="flex items-center gap-3 p-3 text-sm">
            {/* eslint-disable-next-line @next/next/no-img-element -- admin uploads have unknown sizes */}
            <img src={p.images[0]} alt="" className="h-14 w-11 rounded bg-blush/60 object-cover" />
            <div className="flex-1">
              <Link href={`/product/${p.id}`} className="font-medium hover:text-brand">
                {p.title}
              </Link>
              <p className="text-muted">
                {formatKes(p.priceKes)} · Size {p.size} · <span className="capitalize">{p.status}</span>
              </p>
            </div>
            {(p.status === "available" || p.status === "hidden") && (
              <form action={setProductVisibility.bind(null, p.id, p.status === "hidden")}>
                <button className="text-brand hover:underline">{p.status === "hidden" ? "Show" : "Hide"}</button>
              </form>
            )}
            <form action={removeProduct.bind(null, p.id)}>
              <button className="text-muted hover:text-accent">Delete</button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
