import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { getOrder, markOrderPaid } from "@/lib/db";
import { formatKes } from "@/lib/format";
import { paymentsEnabled } from "@/lib/payments";

// Stands in for the Paystack payment page until PAYSTACK_SECRET_KEY is set.
export default function DemoPayPage({ params }: PageProps<"/checkout/demo-pay/[orderId]">) {
  return (
    <Suspense>
      <DemoPay params={params} />
    </Suspense>
  );
}

async function DemoPay({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  if (paymentsEnabled()) notFound();
  const order = await getOrder(orderId);
  if (!order) notFound();

  async function pay() {
    "use server";
    if (paymentsEnabled()) return;
    await markOrderPaid(orderId, `DEMO-${orderId.slice(0, 8)}`);
    redirect(`/order/${orderId}`);
  }

  return (
    <div className="mx-auto max-w-md space-y-5 rounded-2xl border border-stone-200 bg-card p-6 text-center">
      <p className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">Demo mode: no real money moves</p>
      <h1 className="text-xl font-bold">Confirm M-Pesa payment</h1>
      <p className="text-muted">
        With Paystack connected, {order.customer.phone} would get an M-Pesa prompt for <strong>{formatKes(order.totalKes)}</strong>.
      </p>
      <form action={pay}>
        <button className="btn w-full">Simulate successful payment</button>
      </form>
      <p className="text-xs text-muted">Order {order.reference}</p>
    </div>
  );
}
