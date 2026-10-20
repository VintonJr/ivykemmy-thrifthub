import { Suspense } from "react";
import { requireAdmin } from "@/lib/admin-auth";
import { AdminNav } from "../../admin-nav";
import { NewProductForm } from "./form";

export default function NewProductPage() {
  return (
    <Suspense>
      <Guarded />
    </Suspense>
  );
}

async function Guarded() {
  await requireAdmin();
  return (
    <div>
      <AdminNav />
      <NewProductForm />
    </div>
  );
}
