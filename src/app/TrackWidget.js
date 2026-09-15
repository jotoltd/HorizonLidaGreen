"use client";

import { useState } from "react";
import { ShipmentResult } from "@/lib/ShipmentResult";

export default function TrackWidget() {
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
    <div>
      <form onSubmit={handleSearch} className="flex flex-col gap-2 sm:flex-row sm:gap-3">
        <input
          value={tracking}
          onChange={(e) => setTracking(e.target.value)}
          placeholder="Enter tracking number e.g. HLG123456789"
          className="input font-mono uppercase"
          autoCapitalize="characters"
        />
        <button type="submit" disabled={loading} className="btn-primary whitespace-nowrap">
          {loading ? "Searching…" : "Track"}
        </button>
      </form>

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-center text-sm text-red-600">
          {error}
        </div>
      )}

      {result && <ShipmentResult result={result} />}
    </div>
  );
}
