import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import LoginForm from "./login/LoginForm";

const ArrowRight = (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </svg>
);

const TruckIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
    <path d="M15 18H9" />
    <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" />
    <circle cx="17" cy="18" r="2" />
    <circle cx="7" cy="18" r="2" />
  </svg>
);

const PackageIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z" />
    <path d="M12 22V12" />
    <polyline points="3.29 7 12 12 20.71 7" />
    <path d="m7.5 4.27 9 5.15" />
  </svg>
);

const ShieldCheckIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

export default async function Home() {
  const token = cookies().get("token")?.value;
  const user = token ? verifyToken(token) : null;
  if (user?.role === "ADMIN") redirect("/admin");
  if (user?.role === "CLIENT") redirect("/portal");

  return (
    <main className="login-screen">
      <div className="login-background" />

      <header className="login-header">
        <div className="brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/company-logo.jpg" alt="Horizon Lida Green Ltd" />
        </div>
        <a href="mailto:junyi.liang@horizonlidagreen.com" className="btn-pill btn-pill-ghost">
          Contact us {ArrowRight}
        </a>
      </header>

      <div className="login-layout">
        <section className="login-intro">
          <p className="eyebrow">HORIZON LIDA GREEN · DELIVERY PORTAL</p>
          <h1>
            Your next
            <br />
            <b>delivery.</b>
            <br />
            All in one place.
          </h1>
          <p className="intro-copy">
            From collection to arrival,
            <br />
            keep every vehicle journey in view.
          </p>
          <div className="login-pills">
            <span>{TruckIcon}Vehicle transport</span>
            <span>{PackageIcon}Shipment management</span>
          </div>
        </section>

        <section className="login-card">
          <div className="round-icon">{ShieldCheckIcon}</div>
          <p className="eyebrow">WELCOME BACK</p>
          <h2>Let’s get you moving.</h2>
          <p className="muted">Your deliveries, documents and bookings.</p>

          <LoginForm />

          <p className="preview-note">
            Sign in with the email and password provided by Horizon Lida Green.
          </p>

          <div className="login-bottom">
            <span>Just checking a journey?</span>
            <Link href="/track">Track delivery {ArrowRight}</Link>
          </div>
        </section>
      </div>

      <footer className="login-footer">
        © Horizon Lida Green Ltd<span>Vehicle logistics, made simple.</span>
      </footer>
    </main>
  );
}
