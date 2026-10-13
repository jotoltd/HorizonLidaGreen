"use client";

import { useState } from "react";

export default function AccountSettings({ user }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setDone(false);
    const fd = new FormData(e.target);
    const currentPassword = fd.get("currentPassword")?.toString() || "";
    const newPassword = fd.get("newPassword")?.toString() || "";
    const confirm = fd.get("confirm")?.toString() || "";
    if (newPassword !== confirm) {
      setError("New passwords do not match.");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/auth/password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) { setError(data.error || "Failed to update password."); return; }
    setDone(true);
    e.target.reset();
  }

  return (
    <div className="panel" style={{ maxWidth: 560 }}>
      <div className="section-heading">
        <h2>Change password</h2>
      </div>
      <div className="invitation-text" style={{ marginBottom: 16 }}>
        <p>
          <strong>Signed in as:</strong> {user.name || user.email}
          <br />
          <strong>Email:</strong> {user.email}
        </p>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="form-grid" style={{ gridTemplateColumns: "1fr" }}>
          <label className="field"><span>Current password</span><input name="currentPassword" type="password" required autoComplete="current-password" /></label>
          <label className="field"><span>New password</span><input name="newPassword" type="password" required minLength={6} autoComplete="new-password" /></label>
          <label className="field"><span>Confirm new password</span><input name="confirm" type="password" required minLength={6} autoComplete="new-password" /></label>
        </div>
        {error && <p className="login-error" style={{ marginTop: 16 }}>{error}</p>}
        {done && <p style={{ color: "#375737", marginTop: 16 }}>Password updated. Use your new password next time you sign in.</p>}
        <div className="form-footer">
          <p>Password must be at least 6 characters.</p>
          <button type="submit" disabled={loading} className="btn-pill btn-pill-primary">{loading ? "Saving…" : "Update password"}</button>
        </div>
      </form>
    </div>
  );
}
