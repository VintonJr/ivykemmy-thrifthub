"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { useCart } from "@/components/cart";
import { DELIVERY_ZONES } from "@/lib/delivery";
import { formatKes } from "@/lib/format";
import { placeOrder, type CheckoutState } from "./actions";

export default function CheckoutPage() {
  const { items, ready } = useCart();
  const [state, action, pending] = useActionState<CheckoutState, FormData>(placeOrder, {});
  const [zoneId, setZoneId] = useState(DELIVERY_ZONES[0].id);
  const zone = DELIVERY_ZONES.find((z) => z.id === zoneId)!;
  const subtotal = items.reduce((sum, i) => sum + i.priceKes, 0);

  if (!ready) return null;
  if (!items.length) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted">Your bag is empty.</p>
        <Link href="/shop" className="btn mt-4">
          Shop
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="mx-auto grid max-w-4xl gap-8 md:grid-cols-[1fr_320px]">
      <input type="hidden" name="productIds" value={JSON.stringify(items.map((i) => i.id))} />
      <div className="space-y-5">
        <h1 className="text-2xl font-bold">Checkout</h1>
        <fieldset className="space-y-3">
          <legend className="mb-2 font-semibold">Your details</legend>
          <input name="name" required placeholder="Full name" className="input" autoComplete="name" />
          <input name="phone" required placeholder="M-Pesa phone number, e.g. 0712 345 678" className="input" inputMode="tel" autoComplete="tel" />
          <input name="email" type="email" placeholder="Email (optional, for receipts)" className="input" autoComplete="email" />
        </fieldset>
        <fieldset className="space-y-2">
          <legend className="mb-2 font-semibold">Delivery</legend>
          {DELIVERY_ZONES.map((z) => (
            <label key={z.id} className="flex cursor-pointer items-center gap-3 rounded-lg border border-blush bg-card p-3 has-[:checked]:border-brand">
              <input type="radio" name="zone" value={z.id} checked={zoneId === z.id} onChange={() => setZoneId(z.id)} className="accent-brand" />
              <span className="flex-1">
                <span className="block text-sm font-medium">{z.name}</span>
                <span className="block text-xs text-muted">{z.eta}</span>
              </span>
              <span className="text-sm font-semibold">{formatKes(z.feeKes)}</span>
            </label>
          ))}
          <textarea name="address" required rows={2} placeholder="Delivery address or preferred pickup point" className="input" />
        </fieldset>
      </div>

      <aside className="h-fit space-y-4 rounded-xl border border-blush bg-card p-5">
        <h2 className="font-semibold">Order summary</h2>
        <ul className="space-y-1 text-sm">
          {items.map((i) => (
            <li key={i.id} className="flex justify-between gap-2">
              <span className="truncate">{i.title}</span>
              <span>{formatKes(i.priceKes)}</span>
            </li>
          ))}
        </ul>
        <div className="space-y-1 border-t border-blush pt-3 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatKes(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Delivery</span>
            <span>{formatKes(zone.feeKes)}</span>
          </div>
          <div className="flex justify-between text-base font-semibold">
            <span>Total</span>
            <span>{formatKes(subtotal + zone.feeKes)}</span>
          </div>
        </div>
        {state.error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            <p>{state.error}</p>
            {state.unavailableTitles && <p className="mt-1">Please remove: {state.unavailableTitles.join(", ")}.</p>}
          </div>
        )}
        <button type="submit" disabled={pending} className="btn w-full">
          {pending ? "Starting payment..." : "Pay with M-Pesa or card"}
        </button>
        <p className="text-xs text-muted">Your pieces are held for 15 minutes while you pay.</p>
      </aside>
    </form>
  );
}
