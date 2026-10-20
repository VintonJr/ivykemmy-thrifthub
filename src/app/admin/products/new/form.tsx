"use client";

import { useActionState } from "react";
import { CATEGORIES, CONDITIONS } from "@/lib/types";
import { addProduct } from "../../actions";

export function NewProductForm() {
  const [state, action, pending] = useActionState(addProduct, {});
  return (
    <form action={action} className="mx-auto max-w-lg space-y-3">
      <h1 className="text-xl font-bold">New listing</h1>
      <label className="block text-sm font-medium">
        Photos (first one is the cover)
        <input name="images" type="file" accept="image/jpeg,image/png,image/webp" multiple required capture="environment" className="input mt-1" />
      </label>
      <input name="title" required placeholder="Title, e.g. Vintage denim jacket" className="input" />
      <div className="grid grid-cols-2 gap-3">
        <select name="category" required defaultValue="" className="input">
          <option value="" disabled>
            Category
          </option>
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
        <select name="condition" required defaultValue="" className="input">
          <option value="" disabled>
            Condition
          </option>
          {CONDITIONS.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
        <input name="size" required placeholder="Size, e.g. M or UK 8" className="input" />
        <input name="priceKes" type="number" min={1} required placeholder="Price (KES)" className="input" />
      </div>
      <input name="brand" placeholder="Brand (optional)" className="input" />
      <input name="flaws" placeholder="Flaws, if any (builds trust)" className="input" />
      <textarea name="description" rows={3} placeholder="Description, measurements, fabric" className="input" />
      {state.error && <p className="text-sm text-red-700">{state.error}</p>}
      <button disabled={pending} className="btn w-full">
        {pending ? "Saving..." : "Publish listing"}
      </button>
    </form>
  );
}
