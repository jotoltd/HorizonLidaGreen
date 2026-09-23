"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—");

const steps = ["Submitted", "Reviewing", "Confirmed"];
const stepIndex = { BOOKED: 1, ON_HOLD: 1, IN_TRANSIT: 2, OUT_FOR_DELIVERY: 2, DELIVERED: 2 };

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
    return (
      <BookingDetail
        booking={selected}
        onBack={() => setSelected(null)}
      />
    );
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button onClick={() => setShowForm(true)} className="btn-primary">+ Request booking</button>
      </div>

      <div className="space-y-4">
        {bookings.length === 0 && (
          <div className="card p-8 text-center text-sm text-navy-400">No bookings yet.</div>
        )}
        {bookings.map((b) => (
          <div key={b.id} className="card p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="font-mono text-xl font-bold text-navy-800">BKG{b.trackingNumber.replace(/^HLG/, "")}</div>
                <div className="mt-1 text-navy-500">{b.origin} → {b.destination} · {b.pieces || 1} vehicle{b.pieces !== 1 ? "s" : ""}</div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="badge bg-navy-100 text-navy-700">{b.status.replace(/_/g, " ")}</span>
              </div>
            </div>
            <div className="mt-6 flex items-center gap-4">
              {steps.map((step, i) => {
                const current = stepIndex[b.status] ?? 0;
                const active = i === current;
                const done = i < current;
                return (
                  <div key={step} className="flex flex-1 items-center">
                    <div className={`text-sm font-semibold ${active ? "text-navy-800" : done ? "text-navy-700" : "text-navy-400"}`}>
                      {step}
                    </div>
                    {i < steps.length - 1 && (
                      <div className={`mx-3 h-0.5 flex-1 ${done ? "bg-navy-700" : "bg-navy-200"}`} />
                    )}
                  </div>
                );
              })}
            </div>
            {stepIndex[b.status] >= 2 && (
              <div className="mt-5 rounded-lg bg-navy-100 px-4 py-3 text-sm font-semibold text-navy-800">
                After confirmation: Collection instruction PDF
              </div>
            )}
            <div className="mt-4 flex justify-end">
              <button onClick={() => setSelected(b)} className="btn-primary">View / edit booking</button>
            </div>
          </div>
        ))}
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
    <div className="card p-5 sm:p-6">
      <button onClick={onBack} className="mb-4 text-sm font-medium text-teal-600 hover:text-teal-700">← Back to your bookings</button>
      <h3 className="mb-4 font-semibold text-navy-800">View / edit booking · BKG{booking.trackingNumber.replace(/^HLG/, "")}</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className="label">Collection location</label><input value={form.collectionLocation} onChange={(e) => setForm({ ...form, collectionLocation: e.target.value })} className="input" /></div>
        <div><label className="label">Delivery location</label><input value={form.deliveryLocation} onChange={(e) => setForm({ ...form, deliveryLocation: e.target.value })} className="input" /></div>
        <div><label className="label">Number of vehicles</label><input type="number" min="1" value={form.vehicleCount} onChange={(e) => setForm({ ...form, vehicleCount: e.target.value })} className="input" /></div>
        <div><label className="label">Notes</label><textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="input" /></div>
      </div>
      <div className="mt-5 flex justify-end gap-3">
        <button onClick={onBack} className="btn-secondary">Cancel</button>
        <button onClick={save} disabled={saving} className="btn-primary">{saving ? "Saving…" : "Save changes"}</button>
      </div>
    </div>
  );
}

function BookingForm({ onCreated, onCancel }) {
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
    <div className="card p-5 sm:p-6">
      <h3 className="mb-4 font-semibold text-navy-800">Request a booking</h3>
      <p className="mb-4 text-sm text-navy-500">Submit available details now. Complete the rest later.</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="label">Collection date</label><input name="collectionDate" type="date" className="input" /></div>
          <div><label className="label">Number of vehicles</label><input name="vehicleCount" type="number" min="1" defaultValue="2" className="input" /></div>
          <div><label className="label">Collection location</label><input name="collectionLocation" required className="input" placeholder="Newark" /></div>
          <div><label className="label">Delivery location</label><input name="deliveryLocation" className="input" placeholder="To be provided" /></div>
          <div className="sm:col-span-2"><label className="label">Booking release code — one per booking</label><input name="releaseCode" className="input" placeholder="To be provided" /></div>
        </div>

        <div>
          <label className="label">Vehicle VINs</label>
          <div className="space-y-2">
            {Array.from({ length: vinCount }).map((_, i) => (
              <input key={i} name={`vin-${i}`} className="input" placeholder={`${i + 1}  Add VIN now or later`} />
            ))}
          </div>
          <button type="button" onClick={() => setVinCount((n) => n + 1)} className="mt-2 text-xs font-medium text-teal-600 hover:text-teal-700">+ Add another VIN</button>
        </div>

        <div>
          <label className="label">Content description / collection notes</label>
          <textarea name="notes" rows={2} className="input" placeholder="Add notes now or later" />
        </div>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-3">
          <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary">{loading ? "Submitting…" : "Submit request →"}</button>
        </div>
      </form>
    </div>
  );
}
