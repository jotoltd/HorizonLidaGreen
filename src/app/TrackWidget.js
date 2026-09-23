"use client";

import { useState } from "react";
import { ShipmentResult } from "@/lib/ShipmentResult";

export default function TrackWidget({ title = "Track a delivery", admin = false }) {
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
      setError(data.error || "Unable to find delivery.");
      return;
    }
    setResult(data);
  }

  return (
    <div className="card p-5 sm:p-6">
      <h3 className="mb-1 font-semibold text-navy-800">{title}</h3>
      <p className="mb-4 text-sm text-navy-500">Enter a delivery reference to review the latest status.</p>
      <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row">
        <input
          value={tracking}
          onChange={(e) => setTracking(e.target.value)}
          placeholder="e.g. HLG26092101"
          className="input font-mono uppercase"
          autoCapitalize="characters"
        />
        <button type="submit" disabled={loading} className="btn-primary whitespace-nowrap">
          {loading ? "Searching…" : "Track delivery"}
        </button>
      </form>
      {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
      {result && <div className="mt-6"><ShipmentResult result={result} admin={admin} /></div>}
    </div>
  );
}
