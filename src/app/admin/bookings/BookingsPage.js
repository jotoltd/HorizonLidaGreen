"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookingFormFields } from "../../portal/bookings/ClientBookingsPage";

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—");

const steps = ["Submitted", "Reviewing", "Confirmed"];
const stepIndex = { BOOKED: 0, ON_HOLD: 1, IN_TRANSIT: 2, OUT_FOR_DELIVERY: 2, DELIVERED: 2 };

const ArrowRight = (
  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </svg>
);

const bookingLabel = (s) =>
  ({ BOOKED: "Submitted", ON_HOLD: "Reviewing", IN_TRANSIT: "Confirmed", OUT_FOR_DELIVERY: "Confirmed", DELIVERED: "Confirmed" }[s] || s.replace(/_/g, " "));

export default function BookingsPage({ bookings: initial, clients, startNew = false }) {
  const [bookings, setBookings] = useState(initial);
  const [showForm, setShowForm] = useState(startNew);
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const bookingMeta = (b) => b.deliveryMeta?.booking || {};

  async function updateBooking(status) {
    if (!selected) return;
    setSaving(true);
    const res = await fetch(`/api/shipments/${selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) { alert(data.error || "Update failed"); return; }
    setBookings(bookings.map((b) => (b.id === selected.id ? { ...b, status } : b)));
    setSelected(null);
    router.refresh();
  }

  if (showForm) {
    return (
      <NewBookingForm
        clients={clients}
        onCreated={() => { setShowForm(false); router.refresh(); }}
        onCancel={() => setShowForm(false)}
      />
    );
  }

  if (selected) {
    const meta = bookingMeta(selected);
    return (
      <div>
        <button onClick={() => setSelected(null)} className="back-link">← Back to bookings</button>
        <div className="panel">
          <div className="section-heading">
            <h2>Booking · BKG{selected.trackingNumber.replace(/^HLG/, "")}</h2>
            <span>{selected.client?.company || selected.client?.name}</span>
          </div>
          <div className="form-grid">
            <label className="field"><span>Collection location</span><input readOnly value={meta.collectionLocation || selected.origin} /></label>
            <label className="field"><span>Delivery location</span><input readOnly value={meta.deliveryLocation || selected.destination} /></label>
            <label className="field"><span>Collection date</span><input readOnly value={fmtDate(meta.collectionDate || selected.eta)} /></label>
            <label className="field"><span>Vehicles</span><input readOnly value={meta.vehicleCount || selected.pieces || 1} /></label>
          </div>
          {(meta.vins?.length > 0) && (
            <>
              <div className="divider" />
              <label className="field"><span>Vehicle VINs</span></label>
              <ul className="doc-list" style={{ marginTop: 8 }}>
                {meta.vins.map((v, i) => <li key={i} className="doc-row"><span>{v}</span></li>)}
              </ul>
            </>
          )}
          {meta.releaseCode && (
            <label className="field" style={{ marginTop: 14 }}><span>Booking release code</span><input readOnly value={meta.releaseCode} /></label>
          )}
          <div className="form-footer">
            <p>Confirm the booking to convert it into a delivery.</p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button onClick={() => updateBooking("CANCELLED")} disabled={saving} className="btn-pill btn-pill-outline" style={{ color: "#b44444", borderColor: "#e0c4c4" }}>Decline</button>
              <button onClick={() => updateBooking("ON_HOLD")} disabled={saving} className="btn-pill btn-pill-outline">Mark as reviewing</button>
              <button onClick={() => updateBooking("IN_TRANSIT")} disabled={saving} className="btn-pill btn-pill-primary">{saving ? "Saving…" : "Confirm booking"}</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {bookings.length === 0 && (
        <div className="panel">
          <div className="empty">
            <h2>No bookings yet</h2>
            Booking requests from clients will appear here.
          </div>
        </div>
      )}

      <div className="booking-list">
        {bookings.map((b) => {
          const current = stepIndex[b.status] ?? 0;
          const declined = b.status === "CANCELLED";
          return (
            <div key={b.id} className="booking-card">
              <div className="booking-top">
                <span className="reference">BKG{b.trackingNumber.replace(/^HLG/, "")}</span>
                <span className={declined ? "badge badge-declined" : "badge"}>{bookingLabel(b.status)}</span>
              </div>
              <h2>{b.origin} → {b.destination}</h2>
              <p>
                {b.client?.company || b.client?.name} · {b.pieces || 1} vehicle{b.pieces !== 1 ? "s" : ""} · {fmtDate(b.eta || b.createdAt)}
              </p>
              <div className="booking-progress">
                {steps.map((step, i) => (
                  <span key={step} className={declined ? "declined" : i <= current ? "done" : ""}>{step}</span>
                ))}
              </div>
              <button onClick={() => setSelected(b)} className="card-link">Review booking {ArrowRight}</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function NewBookingForm({ clients, onCreated, onCancel }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [vinCount, setVinCount] = useState(2);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.target);
    const body = {
      clientId: fd.get("clientId"),
      origin: fd.get("collectionLocation"),
      destination: fd.get("deliveryLocation") || "To be provided",
      pieces: Number(fd.get("vehicleCount")) || 1,
      eta: fd.get("collectionDate") || null,
      notes: fd.get("notes") || "",
      booking: {
        collectionDate: fd.get("collectionDate"),
        vehicleCount: Number(fd.get("vehicleCount")) || 1,
        collectionLocation: fd.get("collectionLocation"),
        deliveryLocation: fd.get("deliveryLocation") || "To be provided",
        releaseCode: fd.get("releaseCode") || "To be provided",
        vins: Array.from({ length: vinCount }).map((_, i) => fd.get(`vin-${i}`)).filter(Boolean),
        notes: fd.get("notes") || "",
      },
    };

    const res = await fetch("/api/shipments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) { setError(data.error || "Request failed"); return; }
    onCreated(data.shipment);
  }

  return (
    <div>
      <button onClick={onCancel} className="back-link">← Back to bookings</button>
      <div className="panel">
        <div className="section-heading">
          <h2>New booking</h2>
          <span>Create a booking on behalf of a client.</span>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <label className="field wide">
              <span>Client</span>
              <select name="clientId" required defaultValue="">
                <option value="" disabled>Select a client…</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.company || c.name || c.email}</option>
                ))}
              </select>
            </label>
          </div>
          <BookingFormFields vinCount={vinCount} setVinCount={setVinCount} />

          {error && <p className="login-error" style={{ marginTop: 16 }}>{error}</p>}

          <div className="form-footer">
            <p>The booking appears in the client&apos;s portal.</p>
            <div style={{ display: "flex", gap: 12 }}>
              <button type="button" onClick={onCancel} className="btn-pill btn-pill-outline">Cancel</button>
              <button type="submit" disabled={loading} className="btn-pill btn-pill-primary">{loading ? "Creating…" : "Create booking"}</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
