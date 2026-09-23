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

const CLIENT_NAV = [
  { href: "/portal", label: "Deliveries" },
  { href: "/portal/bookings", label: "Bookings" },
  { href: "/portal/track", label: "Track delivery" },
  { href: "/portal/contact", label: "Contact" },
];

const ADMIN_NAV = [
  { href: "/admin", label: "Deliveries" },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/clients", label: "Clients" },
  { href: "/admin/track", label: "Track delivery" },
  { href: "/admin/contact", label: "Contact" },
];

export function Shell({ user, title, children, actions, currentHref }) {
  const nav = user.role === "ADMIN" ? ADMIN_NAV : CLIENT_NAV;
  const workspaceLabel = user.role === "ADMIN" ? "Administrator workspace" : "Client workspace";
  return (
    <div className="min-h-screen bg-sage-100">
      <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
        {/* Top bar */}
        <header className="mb-6 flex items-center justify-between gap-4 rounded-2xl bg-white px-5 py-4 shadow-sm">
          <Link href={user.role === "ADMIN" ? "/admin" : "/portal"}>
            <Logo />
          </Link>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-stone-500 sm:inline">{workspaceLabel}</span>
            <SignOutButton />
          </div>
        </header>

        <div className="flex gap-6 lg:gap-10">
          {/* Sidebar nav on a white panel */}
          <aside className="hidden w-52 shrink-0 flex-col rounded-2xl bg-white p-5 shadow-sm md:flex">
            <nav className="flex flex-col gap-1">
              {nav.map((item) => {
                const active = currentHref === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                      active
                        ? "bg-sage-100 text-charcoal"
                        : "text-stone-600 hover:bg-sage-100/70 hover:text-charcoal"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-auto pt-8">
              <div className="text-[10px] font-bold tracking-widest text-stone-400">
                HORIZON<br />LIDA GREEN
              </div>
            </div>
          </aside>

          {/* Main column */}
          <div className="min-w-0 flex-1">
            {/* Mobile nav */}
            <nav className="mb-4 flex flex-wrap gap-1 md:hidden">
              {nav.map((item) => {
                const active = currentHref === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                      active
                        ? "bg-sage-200 text-charcoal"
                        : "bg-white text-stone-600 hover:bg-sage-200/60"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <h1 className="text-2xl font-bold text-charcoal sm:text-3xl">{title}</h1>
              {actions}
            </div>

            <main>{children}</main>

            <footer className="mt-8 text-center text-xs text-stone-400">
              © {new Date().getFullYear()} Horizon Lida Green — Delivery Portal
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
}
