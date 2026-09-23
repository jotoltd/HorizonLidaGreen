"use client";

import { useState } from "react";

export const statusStyles = {
  BOOKED: "bg-navy-100 text-navy-700",
  IN_TRANSIT: "bg-blue-100 text-blue-700",
  OUT_FOR_DELIVERY: "bg-amber-100 text-amber-700",
  DELIVERED: "bg-green-100 text-green-700",
  ON_HOLD: "bg-orange-100 text-orange-700",
  CANCELLED: "bg-red-100 text-red-700",
};

export const STEP_ORDER = ["BOOKED", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED"];
export const STEP_LABELS = { BOOKED: "Collection", IN_TRANSIT: "In transit", OUT_FOR_DELIVERY: "Out for delivery", DELIVERED: "Delivery" };

// Labels used in the design brief (Collection / In transit / Delivery language).
export const statusLabel = (s) =>
  ({
    BOOKED: "Collection",
    IN_TRANSIT: "In transit",
    OUT_FOR_DELIVERY: "Out for delivery",
    DELIVERED: "Delivery",
    ON_HOLD: "On hold",
    CANCELLED: "Cancelled",
  }[s] || (s || "").replace(/_/g, " "));

export const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—");
export const fmtShortDate = (d) => (d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) : "—");
export const fmtDateTime = (d) => (d ? new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—");

export function isOverdue(shipment) {
  if (!shipment.eta) return false;
  if (shipment.status === "DELIVERED" || shipment.status === "CANCELLED") return false;
  return new Date(shipment.eta) < new Date();
}

// Van position along the route line, driven by delivery status.
const VAN_POSITION = { BOOKED: 3, IN_TRANSIT: 55, OUT_FOR_DELIVERY: 82, DELIVERED: 97 };
export const vanPosition = (status) => VAN_POSITION[status] ?? 3;

export function VanRouteBar({ status, origin, destination }) {
  const pos = vanPosition(status);
  return (
    <div className="pt-10">
      <div className="relative h-1 rounded-full bg-sage-200">
        <div className="absolute inset-y-0 left-0 rounded-full bg-accent-800" style={{ width: `${pos}%` }} />
        <span className="absolute -left-1 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-green-700" />
        <span className="absolute -right-1 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-green-700" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/van.png"
          alt=""
          className="absolute -top-9 h-9 w-auto -translate-x-1/2 transition-[left] duration-500"
          style={{ left: `${pos}%` }}
        />
      </div>
      <div className="mt-3 flex items-start justify-between gap-4">
        <div>
          <div className="text-lg font-bold text-accent-800">{origin}</div>
          <div className="text-xs text-navy-400">Collection</div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-accent-800">{destination}</div>
          <div className="text-xs text-navy-400">Delivery</div>
        </div>
      </div>
    </div>
  );
}

// Three-segment Collection / In transit / Delivery bar shown under the route card.
export function StatusSegments({ status }) {
  const steps = ["Collection", "In transit", "Delivery"];
  const filled = { BOOKED: 1, IN_TRANSIT: 2, OUT_FOR_DELIVERY: 2, DELIVERED: 3 }[status] ?? 0;
  return (
    <div className="flex gap-3">
      {steps.map((label, i) => (
        <div key={label} className="flex-1">
          <div className={`h-1.5 rounded-full ${i < filled ? "bg-green-700" : "bg-sage-200"}`} />
          <div className={`mt-2 text-sm ${i < filled ? "font-semibold text-navy-800" : "text-navy-400"}`}>{label}</div>
        </div>
      ))}
    </div>
  );
}

// "Selected delivery" card used in the client portal and both track views.
export function SelectedDeliveryCard({ shipment, statusControl, children }) {
  return (
    <div className="card p-5 sm:p-6">
      <div className="mb-1 flex items-start justify-between gap-4">
        <div className="text-xs font-medium uppercase tracking-wide text-navy-400">
          Selected delivery · {shipment.trackingNumber}
        </div>
        {statusControl || (
          <span className="badge bg-sage-200 text-charcoal">{statusLabel(shipment.status)}</span>
        )}
      </div>
      <div className="text-xl font-semibold text-navy-800 sm:text-2xl">
        {shipment.pieces || 1} vehicle{shipment.pieces !== 1 ? "s" : ""} · {statusLabel(shipment.status)}
      </div>
      <VanRouteBar status={shipment.status} origin={shipment.origin} destination={shipment.destination} />
      {children}
    </div>
  );
}

const STATUS_OPTIONS = [
  ["BOOKED", "Collection"],
  ["IN_TRANSIT", "In transit"],
  ["OUT_FOR_DELIVERY", "Out for delivery"],
  ["DELIVERED", "Delivery"],
  ["ON_HOLD", "On hold"],
  ["CANCELLED", "Cancelled"],
];

export function ShipmentResult({ result, admin = false }) {
  const { shipment, events } = result;
  const [status, setStatus] = useState(shipment.status);
  const shown = { ...shipment, status };
  const cancelled = status === "ON_HOLD" || status === "CANCELLED";

  async function changeStatus(next) {
    const prev = status;
    setStatus(next);
    if (!admin || !shipment.id) return;
    const res = await fetch(`/api/shipments/${shipment.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next, currentStatus: prev }),
    });
    if (!res.ok) setStatus(prev);
  }

  return (
    <div className="mt-6 space-y-6">
      <SelectedDeliveryCard
        shipment={shown}
        statusControl={
          admin && shipment.id ? (
            <select
              value={status}
              onChange={(e) => changeStatus(e.target.value)}
              className="input !w-auto !py-1.5 !pr-8 text-xs font-semibold"
            >
              {STATUS_OPTIONS.map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          ) : undefined
        }
      />

      {cancelled ? (
        <div className="card p-4 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-orange-600">!</div>
            <div>
              <div className="font-semibold text-navy-800">This delivery is {statusLabel(status).toLowerCase()}</div>
              <div className="text-sm text-navy-400">Contact Horizon Lida Green for more information.</div>
            </div>
          </div>
        </div>
      ) : (
        <StatusSegments status={status} />
      )}

      {/* Delivery summary table */}
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-navy-100 text-left text-xs uppercase tracking-wide text-navy-400">
              <th className="px-5 py-3 font-semibold">Delivery / Route</th>
              <th className="px-5 py-3 font-semibold">Status</th>
              <th className="px-5 py-3 font-semibold">Collection</th>
              <th className="px-5 py-3 font-semibold">Documents</th>
            </tr>
          </thead>
          <tbody>
            <tr className="bg-navy-100/60">
              <td className="px-5 py-3.5">
                <div className="font-mono text-sm font-semibold text-navy-800">{shipment.trackingNumber}</div>
                <div className="text-xs text-navy-500">{shipment.origin} → {shipment.destination}</div>
              </td>
              <td className="px-5 py-3.5 text-navy-600">{statusLabel(status)}</td>
              <td className="px-5 py-3.5 text-navy-600">
                {fmtShortDate(shipment.createdAt)} · {shipment.pieces || 1} vehicle{shipment.pieces !== 1 ? "s" : ""}
              </td>
              <td className="px-5 py-3.5 text-navy-600">
                {typeof shipment.documents === "number" ? `Documents (${shipment.documents})` : "—"}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Tracking history */}
      <div className="card p-4 sm:p-6">
        <h3 className="mb-4 font-semibold text-navy-800">Tracking History</h3>
        <div className="space-y-0">
          {events.map((ev, i) => (
            <div key={ev.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className={`h-3 w-3 rounded-full ${i === 0 ? "bg-teal-500" : "bg-navy-200"}`} />
                {i < events.length - 1 && <div className="w-px flex-1 bg-navy-100" />}
              </div>
              <div className="pb-6">
                <div className="text-sm font-semibold text-navy-800">{statusLabel(ev.status)}</div>
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

export function Detail({ label, value }) {
  return (
    <div>
      <div className="text-xs font-medium text-navy-400">{label}</div>
      <div className="mt-0.5 text-sm font-semibold text-navy-800">{value}</div>
    </div>
  );
}
