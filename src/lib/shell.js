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

const ICONS = {
  deliveries: (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
      <path d="M15 18H9" />
      <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" />
      <circle cx="17" cy="18" r="2" />
      <circle cx="7" cy="18" r="2" />
    </svg>
  ),
  bookings: (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M9 12h6" />
      <path d="M9 16h6" />
    </svg>
  ),
  clients: (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  track: (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  contact: (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  ),
};

const ChevronRight = (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m9 18 6-6-6-6" />
  </svg>
);

const BellIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M10.268 21a2 2 0 0 0 3.464 0" />
    <path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326" />
  </svg>
);

const CLIENT_NAV = [
  { href: "/portal", label: "Deliveries", icon: "deliveries" },
  { href: "/portal/bookings", label: "Bookings", icon: "bookings" },
  { href: "/portal/track", label: "Track Delivery", icon: "track" },
  { href: "/portal/contact", label: "Contact", icon: "contact" },
];

const ADMIN_NAV = [
  { href: "/admin", label: "Deliveries", icon: "deliveries" },
  { href: "/admin/bookings", label: "Bookings", icon: "bookings" },
  { href: "/admin/clients", label: "Clients", icon: "clients" },
  { href: "/admin/track", label: "Track Delivery", icon: "track" },
  { href: "/admin/contact", label: "Contact", icon: "contact" },
];

function initials(nameOrEmail) {
  const s = (nameOrEmail || "").trim();
  if (!s) return "·";
  const parts = s.split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return s.slice(0, 2).toUpperCase();
}

export function Shell({ user, title, eyebrow, subtitle, children, actions, currentHref }) {
  const nav = user.role === "ADMIN" ? ADMIN_NAV : CLIENT_NAV;
  const workspaceLabel = user.role === "ADMIN" ? "Administrator workspace" : "Client workspace";
  return (
    <div className="portal">
      <header className="app-header">
        <Link href={user.role === "ADMIN" ? "/admin" : "/portal"} className="brand" aria-label="Horizon Lida Green">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/company-logo.jpg" alt="Horizon Lida Green Ltd" />
        </Link>
        <div className="account">
          <span className="saved-dot" />
          {workspaceLabel}
          <span className="notification-button" aria-hidden="true">
            {BellIcon}
            <i />
          </span>
          <span className="avatar">{initials(user.name || user.email)}</span>
          <SignOutButton />
        </div>
      </header>

      <aside className="sidebar">
        <p className="eyebrow">WORKSPACE</p>
        <nav>
          {nav.map((item) => {
            const active = currentHref === item.href;
            return (
              <Link key={item.href} href={item.href} className={active ? "active" : ""}>
                {ICONS[item.icon]}
                {item.label}
                {active && ChevronRight}
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-bottom">
          <p className="review-label">SIGNED IN</p>
          <label>{user.name || user.email}</label>
          <p>
            {user.email}
            <br />
            {workspaceLabel}
          </p>
        </div>
      </aside>

      <main className="app-main">
        <div className="breadcrumb">
          Workspace {ChevronRight} {title}
        </div>
        <div className="page-heading">
          <div>
            <p className="eyebrow">{eyebrow || "OPERATIONS OVERVIEW"}</p>
            <h1>{title}</h1>
            {subtitle && <p className="muted">{subtitle}</p>}
          </div>
          {actions}
        </div>
        {children}
        <footer className="app-footer">
          © Horizon Lida Green Ltd<span>Vehicle logistics, made simple.</span>
        </footer>
      </main>
    </div>
  );
}
