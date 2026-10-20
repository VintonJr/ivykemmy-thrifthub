import { Suspense } from "react";
import { requireAdmin } from "@/lib/admin-auth";
import { listOrders } from "@/lib/db";
import { formatKes } from "@/lib/format";
import { ORDER_STATUSES } from "@/lib/types";
import { changeOrderStatus } from "./actions";
import { AdminNav } from "./admin-nav";

export default function AdminOrdersPage() {
  return (
    <Suspense>
      <Orders />
    </Suspense>
  );
}

async function Orders() {
  await requireAdmin();
  const orders = await listOrders();
  const paid = orders.filter((o) => o.paidAt);
  const revenue = paid.reduce((sum, o) => sum + o.subtotalKes, 0);
  const toPack = orders.filter((o) => o.status === "paid").length;

  return (
    <div>
      <AdminNav />
      <div className="mb-6 grid grid-cols-3 gap-3">
        {[
          ["Paid orders", paid.length.toString()],
          ["Sales (excl. delivery)", formatKes(revenue)],
          ["Waiting to pack", toPack.toString()],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-blush bg-card p-4">
            <p className="text-xs text-muted">{label}</p>
            <p className="text-xl font-semibold">{value}</p>
          </div>
        ))}
      </div>
      <h1 className="mb-3 text-xl font-bold">Orders</h1>
      {!orders.length && <p className="text-muted">No orders yet.</p>}
      <div className="space-y-3">
        {orders.map((o) => (
          <div key={o.id} className="rounded-xl border border-blush bg-card p-4 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-semibold">
                  {o.reference} · {formatKes(o.totalKes)}
                </p>
                <p className="text-muted">
                  {o.customer.name} · {o.customer.phone} · {new Date(o.createdAt).toLocaleString("en-KE", { timeZone: "Africa/Nairobi" })}
                </p>
              </div>
              <form action={changeOrderStatus.bind(null, o.id)} className="flex gap-2">
                <select name="status" defaultValue={o.status} className="input py-1">
                  {ORDER_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <button className="rounded-full bg-brand px-4 text-white">Save</button>
              </form>
            </div>
            <p className="mt-2">{o.items.map((i) => i.title).join(", ")}</p>
            <p className="text-muted">
              {o.delivery.zoneName}: {o.delivery.address}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
