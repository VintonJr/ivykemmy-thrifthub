import Link from "next/link";
import { logout } from "./actions";

export function AdminNav() {
  return (
    <div className="mb-6 flex flex-wrap items-center gap-4 border-b border-blush pb-3 text-sm font-medium">
      <span className="font-bold text-brand">Admin</span>
      <Link href="/admin" className="hover:text-brand">
        Orders
      </Link>
      <Link href="/admin/products" className="hover:text-brand">
        Products
      </Link>
      <Link href="/admin/products/new" className="hover:text-brand">
        + New listing
      </Link>
      <form action={logout} className="ml-auto">
        <button className="text-muted hover:text-accent">Sign out</button>
      </form>
    </div>
  );
}
