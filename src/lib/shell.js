import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import SignOutButton from "@/lib/SignOutButton";
import { Logo } from "@/lib/logo";

export { Logo };

export async function getCurrentUser() {
  const token = cookies().get("token")?.value;
  const user = token ? verifyToken(token) : null;
  return user;
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/login");
  return user;
}

export async function requireClient() {
  const user = await getCurrentUser();
  if (!user || user.role !== "CLIENT") redirect("/login");
  return user;
}

export function Shell({ user, title, children, actions }) {
  return (
    <div className="min-h-screen bg-navy-50">
      <header className="sticky top-0 z-20 border-b border-navy-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-4 sm:gap-8">
            <Link href={user.role === "ADMIN" ? "/admin" : "/portal"}>
              <Logo />
            </Link>
            <h1 className="hidden text-base font-semibold text-navy-700 sm:block">{title}</h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden text-right sm:block">
              <div className="text-sm font-semibold text-navy-800">{user.name}</div>
              <div className="text-xs text-navy-400">{user.email}</div>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-navy-800 text-sm font-semibold text-white">
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-navy-800 sm:text-xl">{title}</h2>
          {actions}
        </div>
        {children}
      </main>
      <footer className="mx-auto max-w-7xl px-4 pb-8 text-center text-xs text-navy-300 sm:px-6">
        © {new Date().getFullYear()} Horizon Lida Green — Freight Forwarding
      </footer>
    </div>
  );
}
