import { NextResponse, type NextRequest } from "next/server";
import { getOrderByReference, markOrderPaid } from "@/lib/db";
import { verifyPayment } from "@/lib/payments";

// Paystack sends the shopper back here after they pay.
export async function GET(request: NextRequest) {
  const reference = request.nextUrl.searchParams.get("reference");
  const order = reference ? await getOrderByReference(reference) : undefined;
  if (!reference || !order) return NextResponse.redirect(new URL("/", request.url));

  try {
    const payment = await verifyPayment(reference);
    if (payment.paid && payment.amountKes >= order.totalKes) await markOrderPaid(order.id, payment.reference);
  } catch (err) {
    console.error("paystack verify failed", err);
  }
  return NextResponse.redirect(new URL(`/order/${order.id}`, request.url));
}
