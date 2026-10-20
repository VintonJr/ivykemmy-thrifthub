import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ClearCartOnMount } from "@/components/cart";
import { getOrder } from "@/lib/db";
import { formatKes } from "@/lib/format";
import type { OrderStatus } from "@/lib/types";

const STEPS: { status: OrderStatus; label: string }[] = [
  { status: "paid", label: "Paid" },
  { status: "packed", label: "Packed" },
  { status: "dispatched", label: "On the way" },
  { status: "delivered", label: "Delivered" },
];

export default function OrderPage({ params }: PageProps<"/order/[id]">) {
  return (
    <Suspense fallback={<div className="mx-auto h-64 max-w-xl animate-pulse rounded-xl bg-stone-200" />}>
      <OrderDetail params={params} />
    </Suspense>
  );
}

async function OrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) notFound();
  const stepIndex = STEPS.findIndex((s) => s.status === order.status);
  const paid = stepIndex >= 0;

  return (
    <div className="mx-auto max-w-xl space-y-6">
      {paid && <ClearCartOnMount />}
      <div className="text-center">
        <h1 className="text-2xl font-bold">
          {paid ? "Asante! Your order is confirmed" : order.status === "cancelled" ? "This order was cancelled" : "Waiting for payment"}
        </h1>
        <p className="mt-1 text-muted">Order {order.reference}</p>
      </div>

      {paid && (
        <ol className="grid grid-cols-4 gap-2 text-center text-xs">
          {STEPS.map((s, i) => (
            <li key={s.status} className={`rounded-lg py-2 ${i <= stepIndex ? "bg-ivy text-white" : "bg-stone-200 text-muted"}`}>
              {s.label}
            </li>
          ))}
        </ol>
      )}
      {order.status === "pending-payment" && (
        <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
          We haven&apos;t received your payment yet. If you paid, refresh this page in a minute.
        </p>
      )}
      {order.status === "cancelled" && (
        <p className="rounded-lg bg-stone-100 p-3 text-sm">
          Payment wasn&apos;t completed within 15 minutes, so the pieces went back on sale.{" "}
          <Link href="/cart" className="font-medium text-ivy underline">
            Try again
          </Link>
        </p>
      )}

      <div className="space-y-2 rounded-xl border border-stone-200 bg-card p-5 text-sm">
        {order.items.map((i) => (
          <div key={i.productId} className="flex justify-between">
            <span>{i.title}</span>
            <span>{formatKes(i.priceKes)}</span>
          </div>
        ))}
        <div className="flex justify-between text-muted">
          <span>Delivery: {order.delivery.zoneName}</span>
          <span>{formatKes(order.delivery.feeKes)}</span>
        </div>
        <div className="flex justify-between border-t border-stone-200 pt-2 text-base font-semibold">
          <span>Total</span>
          <span>{formatKes(order.totalKes)}</span>
        </div>
        <p className="pt-2 text-muted">Delivering to: {order.delivery.address}</p>
      </div>
      <Link href="/shop" className="btn w-full">
        Keep shopping
      </Link>
    </div>
  );
}
