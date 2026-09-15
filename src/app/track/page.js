"use client";

import { useState } from "react";
import { Logo } from "@/lib/shell";
import Link from "next/link";

const statusStyles = {
  BOOKED: "bg-navy-100 text-navy-700",
  IN_TRANSIT: "bg-blue-100 text-blue-700",
  OUT_FOR_DELIVERY: "bg-amber-100 text-amber-700",
  DELIVERED: "bg-green-100 text-green-700",
  ON_HOLD: "bg-orange-100 text-orange-700",
  CANCELLED: "bg-red-100 text-red-700",
};

const STEP_ORDER = ["BOOKED", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED"];
const STEP_LABELS = { BOOKED: "Booked", IN_TRANSIT: "In Transit", OUT_FOR_DELIVERY: "Out for Delivery", DELIVERED: "Delivered" };

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—");
const fmtDateTime = (d) => (d ? new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—");

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

        <form onSubmit={handleSearch} className="mx-auto mt-8 flex max-w-lg gap-3">
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

function ShipmentResult({ result }) {
  const { shipment, events } = result;
  const currentStep = STEP_ORDER.indexOf(shipment.status);
  const cancelled = shipment.status === "ON_HOLD" || shipment.status === "CANCELLED";

  return (
    <div className="mt-8 space-y-6">
      {/* Summary card */}
      <div className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-xs font-medium text-navy-400">Tracking Number</div>
            <div className="font-mono text-2xl font-bold text-navy-800">{shipment.trackingNumber}</div>
          </div>
          <span className={`badge px-3 py-1 text-sm ${statusStyles[shipment.status]}`}>
            {shipment.status.replace(/_/g, " ")}
          </span>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Detail label="Origin" value={shipment.origin} />
          <Detail label="Destination" value={shipment.destination} />
          <Detail label="Carrier" value={shipment.carrier || "—"} />
          <Detail label="Service" value={shipment.service || "—"} />
          <Detail label="Pieces" value={shipment.pieces || "—"} />
          <Detail label="Weight" value={shipment.weight || "—"} />
          <Detail label="ETA" value={fmtDate(shipment.eta)} />
          <Detail label="Created" value={fmtDate(shipment.createdAt)} />
        </div>
      </div>

      {/* Progress timeline */}
      {!cancelled ? (
        <div className="card p-6">
          <h3 className="mb-6 font-semibold text-navy-800">Shipment Progress</h3>
          <div className="flex items-center">
            {STEP_ORDER.map((step, i) => {
              const done = i <= currentStep;
              const active = i === currentStep;
              return (
                <div key={step} className="flex flex-1 items-center last:flex-none">
                  <div className="flex flex-col items-center">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition ${
                      done ? "border-teal-500 bg-teal-500 text-white" : "border-navy-200 bg-white text-navy-300"}`}>
                      {done ? "✓" : i + 1}
                    </div>
                    <div className={`mt-2 text-xs font-medium ${active ? "text-teal-600" : done ? "text-navy-700" : "text-navy-300"}`}>
                      {STEP_LABELS[step]}
                    </div>
                  </div>
                  {i < STEP_ORDER.length - 1 && (
                    <div className={`mx-2 h-0.5 flex-1 ${i < currentStep ? "bg-teal-500" : "bg-navy-100"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="card p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-orange-600">!</div>
            <div>
              <div className="font-semibold text-navy-800">This shipment is {shipment.status.replace(/_/g, " ").toLowerCase()}</div>
              <div className="text-sm text-navy-400">Contact Horizon Lida Green for more information.</div>
            </div>
          </div>
        </div>
      )}

      {/* Tracking history */}
      <div className="card p-6">
        <h3 className="mb-4 font-semibold text-navy-800">Tracking History</h3>
        <div className="space-y-0">
          {events.map((ev, i) => (
            <div key={ev.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className={`h-3 w-3 rounded-full ${i === 0 ? "bg-teal-500" : "bg-navy-200"}`} />
                {i < events.length - 1 && <div className="w-px flex-1 bg-navy-100" />}
              </div>
              <div className="pb-6">
                <div className="text-sm font-semibold text-navy-800">{ev.status.replace(/_/g, " ")}</div>
                {ev.location && <div className="text-xs text-navy-500">{ev.location}</div>}
                {ev.description && <div className="text-sm text-navy-400">{ev.description}</div>}
                <div className="text-xs text-navy-300">{fmtDateTime(ev.occurredAt)}</div>
              </div>
            </div>
          ))}
          {events.length === 0 && <p className="text-sm text-navy-300">No tracking events yet.</p>}
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <div className="text-xs font-medium text-navy-400">{label}</div>
      <div className="mt-0.5 text-sm font-semibold text-navy-800">{value}</div>
    </div>
  );
}
