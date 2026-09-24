"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const EyeIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" />
    <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" />
    <path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" />
    <path d="m2 2 20 20" />
  </svg>
);

const ArrowRight = (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </svg>
);

export default function LoginForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

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
    <form onSubmit={handleSubmit}>
      <label className="field">
        <span>Email address</span>
        <input id="email" name="email" type="email" required autoComplete="email" placeholder="you@company.com" />
      </label>

      <label className="field">
        <span>Password</span>
        <div className="password-field">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            placeholder="Enter your password"
          />
          <button type="button" aria-label="Show password" onClick={() => setShowPassword((s) => !s)}>
            {showPassword ? EyeOffIcon : EyeIcon}
          </button>
        </div>
      </label>

      <button className="text-button forgot" type="button">
        Forgot password?
      </button>

      <label className="field">
        <span>Explore the design as</span>
        <select defaultValue="Client">
          <option>Client</option>
          <option>Administrator</option>
        </select>
      </label>

      {error && <p className="login-error">{error}</p>}

      <button type="submit" disabled={loading} className="btn-pill btn-pill-primary login-submit">
        {loading ? "Signing in…" : "Sign in"} {ArrowRight}
      </button>
    </form>
  );
}
