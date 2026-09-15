"use client";

import { useRouter } from "next/navigation";

export default function SignOutButton() {
  const router = useRouter();
  async function handleSignOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }
  return (
    <button type="button" onClick={handleSignOut} className="btn-secondary !px-3 !py-2 text-xs">
      Sign out
    </button>
  );
}
