"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

function initials(nameOrEmail) {
  const s = (nameOrEmail || "").trim();
  if (!s) return "·";
  const parts = s.split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return s.slice(0, 2).toUpperCase();
}

export default function AccountMenu({ user }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const router = useRouter();
  const settingsHref = user.role === "ADMIN" ? "/admin/settings" : "/portal/settings";
  const workspaceLabel = user.role === "ADMIN" ? "Administrator workspace" : "Client workspace";

  useEffect(() => {
    if (!open) return;
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function handleSignOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <div className="account-menu" ref={ref}>
      <button
        type="button"
        className="avatar avatar-button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Account menu"
        aria-expanded={open}
      >
        {initials(user.name || user.email)}
      </button>
      {open && (
        <div className="account-dropdown">
          <div className="account-dropdown-head">
            <strong>{user.name || user.email}</strong>
            <small>{user.email}</small>
            <small>{workspaceLabel}</small>
          </div>
          <Link href={settingsHref} className="account-dropdown-item" onClick={() => setOpen(false)}>
            Account settings
          </Link>
          <button type="button" className="account-dropdown-item" onClick={handleSignOut}>
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
