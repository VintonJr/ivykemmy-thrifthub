import "server-only";
import { createHmac } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";

const COOKIE = "ivk_admin";

function token(): string {
  const password = process.env.ADMIN_PASSWORD ?? "";
  return createHmac("sha256", password).update("ivykemmy-admin").digest("hex");
}

export function checkPassword(input: string): boolean {
  const password = process.env.ADMIN_PASSWORD;
  return Boolean(password) && input === password;
}

export async function setAdminSession() {
  (await cookies()).set(COOKIE, token(), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 7 });
}

export async function clearAdminSession() {
  (await cookies()).delete(COOKIE);
}

export async function isAdmin(): Promise<boolean> {
  // Always check at request time, never at build time.
  await connection();
  if (!process.env.ADMIN_PASSWORD) return false;
  return (await cookies()).get(COOKIE)?.value === token();
}

export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}
