"use server";

import { redirect } from "next/navigation";
import { createOrder, UnavailableError } from "@/lib/db";
import { findZone } from "@/lib/delivery";
import { normalizeKenyanPhone } from "@/lib/format";
import { startPayment } from "@/lib/payments";

export interface CheckoutState {
  error?: string;
  unavailableTitles?: string[];
}

export async function placeOrder(_prev: CheckoutState, formData: FormData): Promise<CheckoutState> {
  const name = String(formData.get("name") ?? "").trim();
  const phone = normalizeKenyanPhone(String(formData.get("phone") ?? ""));
  const email = String(formData.get("email") ?? "").trim() || undefined;
  const address = String(formData.get("address") ?? "").trim();
  const zone = findZone(String(formData.get("zone") ?? ""));
  let productIds: string[] = [];
  try {
    productIds = JSON.parse(String(formData.get("productIds") ?? "[]"));
  } catch {}

  if (!name) return { error: "Please enter your name." };
  if (!phone) return { error: "Please enter a valid Safaricom or Airtel number, e.g. 0712 345 678." };
  if (!zone) return { error: "Please choose a delivery option." };
  if (!address) return { error: "Please tell us where to deliver, or which pickup point you prefer." };
  if (!productIds.length) return { error: "Your bag is empty." };

  let paymentUrl: string;
  try {
    const order = await createOrder(
      {
        customer: { name, phone, email },
        delivery: { zoneId: zone.id, zoneName: zone.name, feeKes: zone.feeKes, address },
      },
      productIds,
    );
    paymentUrl = await startPayment(order);
  } catch (err) {
    if (err instanceof UnavailableError) {
      return { error: "Sorry, some pieces were just bought by someone else.", unavailableTitles: err.titles };
    }
    console.error("checkout failed", err);
    return { error: "We couldn't start the payment. Please try again." };
  }
  redirect(paymentUrl);
}
