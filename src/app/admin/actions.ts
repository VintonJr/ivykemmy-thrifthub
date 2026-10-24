"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { checkPassword, clearAdminSession, requireAdmin, setAdminSession } from "@/lib/admin-auth";
import { saveImages } from "@/lib/uploads";
import { createProduct, deleteProduct, setOrderStatus, updateProduct } from "@/lib/db";
import { CATEGORIES, CONDITIONS, ORDER_STATUSES, type Category, type Condition, type OrderStatus } from "@/lib/types";

export async function login(_prev: { error?: string }, formData: FormData): Promise<{ error?: string }> {
  if (!process.env.ADMIN_PASSWORD) return { error: "Set ADMIN_PASSWORD first (in .env.local, or in Vercel's environment variables)." };
  if (!checkPassword(String(formData.get("password") ?? ""))) return { error: "Wrong password." };
  await setAdminSession();
  redirect("/admin");
}

export async function logout() {
  await clearAdminSession();
  redirect("/admin/login");
}

export async function addProduct(_prev: { error?: string }, formData: FormData): Promise<{ error?: string }> {
  await requireAdmin();
  const title = String(formData.get("title") ?? "").trim();
  const category = String(formData.get("category")) as Category;
  const condition = String(formData.get("condition")) as Condition;
  const size = String(formData.get("size") ?? "").trim();
  const priceKes = Math.round(Number(formData.get("priceKes")));
  const files = formData.getAll("images").filter((f): f is File => f instanceof File && f.size > 0);

  if (!title) return { error: "Add a title." };
  if (!CATEGORIES.some((c) => c.id === category)) return { error: "Pick a category." };
  if (!CONDITIONS.some((c) => c.id === condition)) return { error: "Pick a condition." };
  if (!size) return { error: "Add a size." };
  if (!(priceKes > 0)) return { error: "Add a price in KES." };
  if (!files.length) return { error: "Add at least one photo." };

  const images = await saveImages(files);
  if (!images.length) return { error: "Photos must be JPG, PNG or WebP and under 5 MB each." };

  await createProduct({
    title,
    category,
    condition,
    size,
    priceKes,
    images,
    brand: String(formData.get("brand") ?? "").trim() || undefined,
    flaws: String(formData.get("flaws") ?? "").trim() || undefined,
    description: String(formData.get("description") ?? "").trim(),
  });
  revalidatePath("/", "layout");
  redirect("/admin/products");
}

export async function setProductVisibility(id: string, visible: boolean) {
  await requireAdmin();
  await updateProduct(id, { status: visible ? "available" : "hidden" });
  revalidatePath("/", "layout");
}

export async function removeProduct(id: string) {
  await requireAdmin();
  await deleteProduct(id);
  revalidatePath("/", "layout");
}

export async function changeOrderStatus(id: string, formData: FormData) {
  await requireAdmin();
  const status = String(formData.get("status")) as OrderStatus;
  if (ORDER_STATUSES.includes(status)) await setOrderStatus(id, status);
  revalidatePath("/admin");
}
