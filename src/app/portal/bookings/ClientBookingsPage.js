"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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

export default function ClientBookingsPage({ bookings: initial, startNew = false }) {
  const [bookings, setBookings] = useState(initial);
  const [showForm, setShowForm] = useState(startNew);
  const [selected, setSelected] = useState(null);

  if (showForm) {
    return (
      <BookingForm
        onCreated={(b) => { setBookings([b, ...bookings]); setShowForm(false); }}
        onCancel={() => setShowForm(false)}
      />
    );
  }

  if (selected) {
    return <BookingDetail booking={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <div>
      {bookings.length === 0 && (
        <div className="panel">
          <div className="empty">
            <h2>No bookings yet</h2>
            Request a booking and we will confirm your vehicle collection.
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
                {b.pieces || 1} vehicle{b.pieces !== 1 ? "s" : ""} · {fmtDate(b.eta || b.createdAt)}
              </p>
              <div className="booking-progress">
                {steps.map((step, i) => (
                  <span key={step} className={declined ? "declined" : i <= current ? "done" : ""}>{step}</span>
                ))}
              </div>
              <button onClick={() => setSelected(b)} className="card-link">View / edit booking {ArrowRight}</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BookingDetail({ booking, onBack }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    collectionLocation: booking.origin || "",
    deliveryLocation: booking.destination || "",
    vehicleCount: booking.pieces || 1,
    notes: booking.notes || "",
  });

  async function save() {
    setSaving(true);
    const res = await fetch(`/api/shipments/${booking.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        origin: form.collectionLocation,
        destination: form.deliveryLocation,
        pieces: Number(form.vehicleCount),
        notes: form.notes,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) { alert(data.error || "Save failed"); return; }
    onBack();
  }

  return (
    <div>
      <button onClick={onBack} className="back-link">← Back to your bookings</button>
      <div className="panel">
        <div className="section-heading">
          <h2>View / edit booking · BKG{booking.trackingNumber.replace(/^HLG/, "")}</h2>
        </div>
        <div className="form-grid">
          <label className="field"><span>Collection location</span><input value={form.collectionLocation} onChange={(e) => setForm({ ...form, collectionLocation: e.target.value })} /></label>
          <label className="field"><span>Delivery location</span><input value={form.deliveryLocation} onChange={(e) => setForm({ ...form, deliveryLocation: e.target.value })} /></label>
          <label className="field"><span>Number of vehicles</span><input type="number" min="1" value={form.vehicleCount} onChange={(e) => setForm({ ...form, vehicleCount: e.target.value })} /></label>
          <label className="field"><span>Notes</span><textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} /></label>
        </div>
        <div className="form-footer">
          <p>Changes are reviewed by Horizon Lida Green before confirmation.</p>
          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={onBack} className="btn-pill btn-pill-outline">Cancel</button>
            <button onClick={save} disabled={saving} className="btn-pill btn-pill-primary">{saving ? "Saving…" : "Save changes"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function BookingFormFields({ vinCount, setVinCount }) {
  return (
    <>
      <div className="form-grid">
        <label className="field"><span>Collection date</span><input name="collectionDate" type="date" /></label>
        <label className="field"><span>Number of vehicles</span><input name="vehicleCount" type="number" min="1" defaultValue="2" /></label>
        <label className="field"><span>Collection location</span><input name="collectionLocation" required placeholder="Newark" /></label>
        <label className="field"><span>Delivery location</span><input name="deliveryLocation" placeholder="To be provided" /></label>
        <label className="field wide"><span>Booking release code — one per booking</span><input name="releaseCode" placeholder="To be provided" /></label>
      </div>

      <div className="divider" />

      <label className="field">
        <span>Vehicle VINs</span>
      </label>
      <div className="vin-grid" style={{ marginTop: 10 }}>
        {Array.from({ length: vinCount }).map((_, i) => (
          <input key={i} name={`vin-${i}`} placeholder={`${i + 1}  Add VIN now or later`} />
        ))}
      </div>
      <button type="button" onClick={() => setVinCount((n) => n + 1)} className="text-button" style={{ marginTop: 10 }}>+ Add another VIN</button>

      <div className="divider" />

      <label className="field">
        <span>Content description / collection notes</span>
        <textarea name="notes" rows={2} placeholder="Add notes now or later" />
      </label>
    </>
  );
}

export function BookingForm({ onCreated, onCancel }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [vinCount, setVinCount] = useState(2);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.target);
    const body = {
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
    router.refresh();
  }

  return (
    <div>
      <button onClick={onCancel} className="back-link">← Back to your bookings</button>
      <div className="panel">
        <div className="section-heading">
          <h2>Request a booking</h2>
          <span>Submit available details now — complete the rest later.</span>
        </div>
        <form onSubmit={handleSubmit}>
          <BookingFormFields vinCount={vinCount} setVinCount={setVinCount} />

          {error && <p className="login-error" style={{ marginTop: 16 }}>{error}</p>}

          <div className="form-footer">
            <p>We confirm every booking request by email.</p>
            <div style={{ display: "flex", gap: 12 }}>
              <button type="button" onClick={onCancel} className="btn-pill btn-pill-outline">Cancel</button>
              <button type="submit" disabled={loading} className="btn-pill btn-pill-primary">{loading ? "Submitting…" : "Submit request"}</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
