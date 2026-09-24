"use client";

import { useState } from "react";
import { ShipmentResult } from "@/lib/ShipmentResult";

const PinIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const ArrowRight = (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </svg>
);

export default function TrackWidget({ admin = false }) {
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
    <div>
      <div className="panel">
        <form onSubmit={handleSearch} className="track-search">
          <label className="field">
            <span>Delivery reference</span>
            <input
              value={tracking}
              onChange={(e) => setTracking(e.target.value)}
              placeholder="e.g. HLG26092101"
              autoCapitalize="characters"
            />
          </label>
          <button type="submit" disabled={loading} className="btn-pill btn-pill-primary">
            {loading ? "Searching…" : <>Track delivery {ArrowRight}</>}
          </button>
        </form>
        {error && <p className="login-error" style={{ marginBottom: 0 }}>{error}</p>}
      </div>

      {result ? (
        <ShipmentResult result={result} admin={admin} />
      ) : (
        !error && (
          <div className="empty">
            {PinIcon}
            <h2>Your journey starts with a reference.</h2>
            <p>Enter a delivery reference above.</p>
          </div>
        )
      )}
    </div>
  );
}
