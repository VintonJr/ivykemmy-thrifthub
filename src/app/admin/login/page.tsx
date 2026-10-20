"use client";

import { useActionState } from "react";
import { login } from "../actions";

export default function AdminLogin() {
  const [state, action, pending] = useActionState(login, {});
  return (
    <form action={action} className="mx-auto max-w-sm space-y-4 py-10">
      <h1 className="text-2xl font-bold">Shop admin</h1>
      <input name="password" type="password" required placeholder="Admin password" className="input" autoFocus />
      {state.error && <p className="text-sm text-red-700">{state.error}</p>}
      <button disabled={pending} className="btn w-full">
        Sign in
      </button>
    </form>
  );
}
