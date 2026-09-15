"use client";

import { useState } from "react";
import { Logo } from "@/lib/logo";
import { ShipmentResult } from "@/lib/ShipmentResult";
import Link from "next/link";

export default function TrackPage() {
  const [tracking, setTracking] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  async function handleSearch(e) {
    e.preventDefault();
    if (!tracking.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    const res = await fetch(`/api/track?tracking=${encodeURIComponent(tracking.trim())}`);
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Unable to find shipment.");
      return;
    }
    setResult(data);
  }

  return (
    <div className="min-h-screen bg-navy-50">
      {/* Header */}
      <header className="border-b border-navy-100 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/track"><Logo /></Link>
          <Link href="/login" className="text-sm font-medium text-teal-600 hover:text-teal-700">Sign in →</Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-navy-800">Track Your Shipment</h1>
          <p className="mt-2 text-navy-400">Enter your tracking number to see live status. No login required.</p>
        </div>

        <form onSubmit={handleSearch} className="mx-auto mt-8 flex max-w-lg flex-col gap-3 sm:flex-row">
          <input
            value={tracking}
            onChange={(e) => setTracking(e.target.value)}
            placeholder="e.g. HLG123456789"
            className="input font-mono uppercase"
            autoCapitalize="characters"
          />
          <button type="submit" disabled={loading} className="btn-primary whitespace-nowrap">
            {loading ? "Searching…" : "Track"}
          </button>
        </form>

        {error && (
          <div className="mx-auto mt-6 max-w-lg rounded-lg bg-red-50 px-4 py-3 text-center text-sm text-red-600">
            {error}
          </div>
        )}

        {result && <ShipmentResult result={result} />}
      </main>
    </div>
  );
}
