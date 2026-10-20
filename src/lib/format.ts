import { CATEGORIES, CONDITIONS, type Category, type Condition } from "./types";

export function formatKes(amount: number): string {
  return `KES ${amount.toLocaleString("en-KE")}`;
}

export function categoryLabel(id: Category): string {
  return CATEGORIES.find((c) => c.id === id)?.label ?? id;
}

export function conditionLabel(id: Condition): string {
  return CONDITIONS.find((c) => c.id === id)?.label ?? id;
}

// Accepts 07XXXXXXXX, 01XXXXXXXX, 7XXXXXXXX, +2547XXXXXXXX and returns 2547XXXXXXXX, or null.
export function normalizeKenyanPhone(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  let local = digits;
  if (local.startsWith("254")) local = local.slice(3);
  else if (local.startsWith("0")) local = local.slice(1);
  if (!/^[17]\d{8}$/.test(local)) return null;
  return `254${local}`;
}
