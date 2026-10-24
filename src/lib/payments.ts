import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
import type { Order } from "./types";

// Paystack handles M-Pesa and cards in one integration.
// Without PAYSTACK_SECRET_KEY the shop runs in demo mode with a simulated payment page.

const API = "https://api.paystack.co";

export function paymentsEnabled(): boolean {
  return Boolean(process.env.PAYSTACK_SECRET_KEY);
}

// On Vercel the shop's main address is known, so NEXT_PUBLIC_SITE_URL is only needed for a custom domain.
function siteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return "http://localhost:3000";
}

async function paystack<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });
  const body = await res.json();
  if (!res.ok || !body.status) throw new Error(body.message ?? `Paystack error ${res.status}`);
  return body.data as T;
}

// Returns the URL to send the shopper to for payment.
export async function startPayment(order: Order): Promise<string> {
  if (!paymentsEnabled()) return `/checkout/demo-pay/${order.id}`;

  const data = await paystack<{ authorization_url: string }>("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      // Paystack requires an email; phone-only shoppers get a placeholder.
      email: order.customer.email || `${order.customer.phone}@customers.ivykemmy.shop`,
      amount: order.totalKes * 100,
      currency: "KES",
      reference: order.reference,
      channels: ["mobile_money", "card"],
      callback_url: `${siteUrl()}/api/paystack/callback`,
      metadata: { orderId: order.id, phone: order.customer.phone },
    }),
  });
  return data.authorization_url;
}

export interface VerifiedPayment {
  paid: boolean;
  amountKes: number;
  reference: string;
}

export async function verifyPayment(reference: string): Promise<VerifiedPayment> {
  const data = await paystack<{ status: string; amount: number; reference: string }>(
    `/transaction/verify/${encodeURIComponent(reference)}`,
  );
  return { paid: data.status === "success", amountKes: data.amount / 100, reference: data.reference };
}

export function validWebhookSignature(rawBody: string, signature: string | null): boolean {
  if (!signature || !process.env.PAYSTACK_SECRET_KEY) return false;
  const expected = createHmac("sha512", process.env.PAYSTACK_SECRET_KEY).update(rawBody).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}
