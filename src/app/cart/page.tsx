"use client";

import Link from "next/link";
import { useCart } from "@/components/cart";
import { formatKes } from "@/lib/format";

export default function CartPage() {
  const { items, remove, ready } = useCart();
  const subtotal = items.reduce((sum, i) => sum + i.priceKes, 0);

  if (!ready) return null;

  if (!items.length) {
    return (
      <div className="py-16 text-center">
        <h1 className="text-2xl font-bold">Your bag is empty</h1>
        <p className="mt-2 text-muted">Every piece is one of a kind, so grab what you love before someone else does.</p>
        <Link href="/shop" className="btn mt-6">
          Start shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Your bag</h1>
      <ul className="divide-y divide-blush rounded-xl border border-blush bg-card">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-4 p-4">
            {/* eslint-disable-next-line @next/next/no-img-element -- admin uploads have unknown sizes */}
            <img src={item.image} alt="" className="h-20 w-16 rounded-lg bg-blush/60 object-cover" />
            <div className="flex-1">
              <Link href={`/product/${item.id}`} className="font-medium hover:text-brand">
                {item.title}
              </Link>
              <p className="text-sm text-muted">Size {item.size}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold">{formatKes(item.priceKes)}</p>
              <button onClick={() => remove(item.id)} className="text-sm text-muted hover:text-accent">
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between text-lg">
        <span>Subtotal</span>
        <span className="font-semibold">{formatKes(subtotal)}</span>
      </div>
      <Link href="/checkout" className="btn w-full">
        Checkout
      </Link>
    </div>
  );
}
