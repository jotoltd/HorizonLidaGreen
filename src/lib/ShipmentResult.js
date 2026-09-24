"use client";

import { useState } from "react";

export const statusStyles = {
  BOOKED: "badge",
  IN_TRANSIT: "badge",
  OUT_FOR_DELIVERY: "badge",
  DELIVERED: "badge",
  ON_HOLD: "badge badge-warn",
  CANCELLED: "badge badge-declined",
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
    <div style={{ paddingTop: 34 }}>
      <div className="route-line">
        <div className="route-fill" style={{ width: `${pos}%` }} />
        <span className="route-dot start" />
        <span className="route-dot end" />
        <span className="company-van" style={{ left: `${pos}%` }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/company-logo.jpg" alt="" />
        </span>
      </div>
      <div className="route-labels">
        <div>
          <strong>{origin}</strong>
          <small>Collection</small>
        </div>
        <div>
          <strong>{destination}</strong>
          <small>Delivery</small>
        </div>
      </div>
    </div>
  );
}

// Three-segment Collection / In transit / Delivery bar shown under the route card.
export function StatusSegments({ status }) {
  const steps = ["Collection", "In transit", "Delivery"];
  const filled = { BOOKED: 1, IN_TRANSIT: 2, OUT_FOR_DELIVERY: 2, DELIVERED: 3 }[status] ?? 0;
  const declined = status === "ON_HOLD" || status === "CANCELLED";
  return (
    <div className="stages">
      {steps.map((label, i) => (
        <div key={label} className={declined ? "declined" : i < filled ? "done" : ""}>
          <span>{String(i + 1).padStart(2, "0")}</span> {label}
        </div>
      ))}
    </div>
  );
}

// "Selected delivery" card used in the client portal and both track views.
export function SelectedDeliveryCard({ shipment, statusControl, children }) {
  return (
    <div className="journey">
      <div className="journey-title">
        <div>
          <p className="eyebrow">DELIVERY · {shipment.trackingNumber}</p>
          <h2>
            {shipment.pieces || 1} vehicle{shipment.pieces !== 1 ? "s" : ""} · {statusLabel(shipment.status)}
          </h2>
        </div>
        {statusControl || <span className={statusStyles[shipment.status] || "badge"}>{statusLabel(shipment.status)}</span>}
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
    <div style={{ marginTop: 24 }}>
      <SelectedDeliveryCard
        shipment={shown}
        statusControl={
          admin && shipment.id ? (
            <select
              value={status}
              onChange={(e) => changeStatus(e.target.value)}
              style={{ width: "auto", padding: "8px 12px", fontSize: 12 }}
            >
              {STATUS_OPTIONS.map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          ) : undefined
        }
      >
        <StatusSegments status={status} />
      </SelectedDeliveryCard>

      {cancelled && (
        <div className="notice">
          <strong>This delivery is {statusLabel(status).toLowerCase()}.</strong>
          <div>Contact Horizon Lida Green for more information.</div>
        </div>
      )}

      <div className="panel" style={{ marginTop: 25 }}>
        <div className="section-heading">
          <h2>Tracking history</h2>
          <span>{events.length} update{events.length !== 1 ? "s" : ""}</span>
        </div>
        <div className="updates">
          {events.map((ev) => (
            <div key={ev.id}>
              <span className="update-dot" />
              <div>
                <strong>{statusLabel(ev.status)}</strong>
                <small>
                  {[ev.location, ev.description].filter(Boolean).join(" · ")}
                  {(ev.location || ev.description) ? " · " : ""}
                  {fmtDateTime(ev.occurredAt)}
                </small>
              </div>
            </div>
          ))}
          {events.length === 0 && <div><strong>No tracking events yet.</strong></div>}
        </div>
      </div>
    </div>
  );
}

export function Detail({ label, value }) {
  return (
    <div>
      <div className="d-label">{label}</div>
      <div className="d-value">{value}</div>
    </div>
  );
}
