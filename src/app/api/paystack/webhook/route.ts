import { NextResponse, type NextRequest } from "next/server";
import { getOrderByReference, markOrderPaid } from "@/lib/db";
import { validWebhookSignature, verifyPayment } from "@/lib/payments";

// Backup for shoppers who close the page before being redirected.
// Set this URL in the Paystack dashboard: https://<your-domain>/api/paystack/webhook
export async function POST(request: NextRequest) {
  const raw = await request.text();
  if (!validWebhookSignature(raw, request.headers.get("x-paystack-signature"))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const event = JSON.parse(raw);
  if (event.event === "charge.success") {
    const order = await getOrderByReference(event.data.reference);
    if (order) {
      const payment = await verifyPayment(event.data.reference);
      if (payment.paid && payment.amountKes >= order.totalKes) await markOrderPaid(order.id, payment.reference);
    }
  }
  return NextResponse.json({ ok: true });
}
