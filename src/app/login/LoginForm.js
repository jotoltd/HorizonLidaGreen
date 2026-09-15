"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.target);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      body: fd,
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Unable to sign in. Please try again.");
      return;
    }
    router.push(data.role === "ADMIN" ? "/admin" : "/portal");
    router.refresh();
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label className="label" htmlFor="email">Email address</label>
          <input id="email" name="email" type="email" required autoComplete="email" className="input" placeholder="you@company.com" />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input id="password" name="password" type="password" required autoComplete="current-password" className="input" placeholder="••••••" />
        </div>
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <p className="mt-6 text-center text-xs text-navy-300">
        Contact us if you have any issues
      </p>
    </>
  );
}
