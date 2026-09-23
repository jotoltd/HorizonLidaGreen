"use client";

import { useState } from "react";

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—");

const statusLabels = {
  BOOKED: "Reviewing",
  ON_HOLD: "On hold",
  IN_TRANSIT: "Confirmed",
};

export default function BookingsPage({ bookings: initial }) {
  const [bookings, setBookings] = useState(initial);
  const [selected, setSelected] = useState(null);

  if (selected) {
    return (
      <BookingDetail
        booking={selected}
        onBack={() => setSelected(null)}
        onUpdate={(updated) => {
          setBookings((l) => l.map((b) => (b.id === updated.id ? updated : b)));
          setSelected(updated);
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      {bookings.length === 0 && <div className="card p-8 text-center text-sm text-navy-400">No pending bookings.</div>}
      {bookings.map((b) => (
        <div key={b.id} className="card p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="rounded-lg bg-navy-100 px-4 py-3">
              <div className="font-semibold text-navy-800">
                {b.client?.name} · {b.origin} → {b.destination} · {b.pieces || 1} vehicle{b.pieces !== 1 ? "s" : ""}
              </div>
            </div>
            <span className="badge bg-navy-100 text-navy-700">{statusLabels[b.status] || b.status.replace(/_/g, " ")}</span>
          </div>
          <div className="mt-4 flex justify-end">
            <button onClick={() => setSelected(b)} className="btn-primary">View / edit booking</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function BookingDetail({ booking, onBack, onUpdate }) {
  const [status, setStatus] = useState(booking.status);
  const [driverName, setDriverName] = useState(booking.deliveryMeta?.driverName || "");
  const [vehicleReg, setVehicleReg] = useState(booking.deliveryMeta?.vehicleReg || "");
  const [collectionPdf, setCollectionPdf] = useState("");
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    const res = await fetch(`/api/shipments/${booking.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, currentStatus: booking.status }),
    });
    const data = await res.json();
    if (!res.ok) { setLoading(false); alert(data.error || "Save failed"); return; }
    const updated = data.shipment;

    if (driverName || vehicleReg || collectionPdf) {
      const metaRes = await fetch(`/api/shipments/${booking.id}/delivery-meta`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driverName, vehicleReg, collectionInstructionPdf: collectionPdf || undefined }),
      });
      const metaData = await metaRes.json();
      if (metaRes.ok) Object.assign(updated, metaData.shipment);
    }

    setLoading(false);
    onUpdate(updated);
  }

  return (
    <div>
      <button onClick={onBack} className="mb-4 text-sm font-medium text-teal-600 hover:text-teal-700">← Back to bookings</button>
      <div className="card p-5 sm:p-6">
        <h2 className="mb-4 text-xl font-bold text-navy-800">Review booking · BKG{booking.trackingNumber.replace(/^HLG/, "")}</h2>
        <div className="mb-6 rounded-lg bg-navy-100 px-4 py-3">
          <div className="font-semibold text-navy-800">
            {booking.client?.name} · {booking.origin} → {booking.destination} · {booking.pieces || 1} vehicle{booking.pieces !== 1 ? "s" : ""}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label text-xs">Driver name</label>
            <input value={driverName} onChange={(e) => setDriverName(e.target.value)} className="input" placeholder="Alex · sample" />
          </div>
          <div>
            <label className="label text-xs">Transporter registration / licence plate</label>
            <input value={vehicleReg} onChange={(e) => setVehicleReg(e.target.value)} className="input" placeholder="SAMPLE 01" />
          </div>
          <div>
            <label className="label text-xs">Booking status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="input">
              <option value="BOOKED">Reviewing</option>
              <option value="ON_HOLD">On hold</option>
              <option value="IN_TRANSIT">Confirmed</option>
            </select>
          </div>
          <div>
            <label className="label text-xs">Collection instruction PDF</label>
            <input value={collectionPdf} onChange={(e) => setCollectionPdf(e.target.value)} className="input" placeholder="Collection instructions.pdf" />
          </div>
        </div>

        <div className="mt-6">
          <h4 className="font-semibold text-navy-800">Booking details remain editable</h4>
          <p className="text-sm text-navy-500">Date · Locations · Vehicle count · Release code · VINs</p>
        </div>

        <button onClick={save} disabled={loading} className="btn-primary mt-5">{loading ? "Saving…" : "Save & notify client"}</button>
      </div>
    </div>
  );
}
