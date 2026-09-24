"use client";

import Link from "next/link";
import TrackWidget from "@/app/TrackWidget";

export default function TrackPage() {
  return (
    <main className="login-screen">
      <div className="login-background" />
      <header className="login-header">
        <Link href="/" className="brand" aria-label="Horizon Lida Green">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/company-logo.jpg" alt="Horizon Lida Green Ltd" />
        </Link>
        <Link href="/" className="btn-pill btn-pill-ghost">
          Sign in
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </Link>
      </header>

      <div className="login-layout" style={{ gridTemplateColumns: "1fr", maxWidth: 860 }}>
        <section className="login-card" style={{ justifySelf: "center", maxWidth: 860 }}>
          <p className="eyebrow">TRACK A DELIVERY</p>
          <h2>Where is my vehicle?</h2>
          <p className="muted">Enter your delivery reference to see the live status.</p>
          <div style={{ marginTop: 24 }}>
            <TrackWidget />
          </div>
        </section>
      </div>

      <footer className="login-footer">
        © Horizon Lida Green Ltd<span>Vehicle logistics, made simple.</span>
      </footer>
    </main>
  );
}
