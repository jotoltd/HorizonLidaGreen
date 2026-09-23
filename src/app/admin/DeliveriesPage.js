"use client";

import { useState, useMemo } from "react";
import { VanRouteBar } from "@/lib/ShipmentResult";
import DeliveryDocs from "./DeliveryDocs";
import DeliveryReceipt from "./DeliveryReceipt";

const FILTERS = ["All", "Current", "Past"];
const PAGE_SIZE = 10;

const statusStyles = {
  BOOKED: "bg-navy-100 text-navy-700",
  IN_TRANSIT: "bg-blue-100 text-blue-700",
  OUT_FOR_DELIVERY: "bg-amber-100 text-amber-700",
  DELIVERED: "bg-green-100 text-green-700",
  ON_HOLD: "bg-orange-100 text-orange-700",
  CANCELLED: "bg-red-100 text-red-700",
};

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—");
const fmtShortDate = (d) => (d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) : "—");
const fmtSize = (n) => (n == null ? "" : n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

export default function DeliveriesPage({ clients: initialClients, shipments: initialShipments, stats }) {
  const [shipments, setShipments] = useState(initialShipments);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [docsOpen, setDocsOpen] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [docsShipment, setDocsShipment] = useState(null);
  const [receiptShipment, setReceiptShipment] = useState(null);

  const filtered = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return shipments.filter((s) => {
      const q = search.toLowerCase();
      const matches =
        !q ||
        s.trackingNumber.toLowerCase().includes(q) ||
        s.origin.toLowerCase().includes(q) ||
        s.destination.toLowerCase().includes(q) ||
        s.client?.name.toLowerCase().includes(q) ||
        s.client?.company?.toLowerCase().includes(q);
      if (!matches) return false;
      if (filter === "Current") return s.status !== "DELIVERED" && s.status !== "CANCELLED";
      if (filter === "Past") return s.status === "DELIVERED" || s.status === "CANCELLED";
      return true;
    });
  }, [shipments, filter, search]);

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  async function updateStatus(s, status, location) {
    const res = await fetch(`/api/shipments/${s.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, currentStatus: s.status, location }),
    });
    const data = await res.json();
    if (res.ok) setShipments((l) => l.map((x) => (x.id === data.shipment.id ? data.shipment : x)));
  }

  async function updateMeta(s, patch) {
    const res = await fetch(`/api/shipments/${s.id}/delivery-meta`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const data = await res.json();
    if (res.ok) setShipments((l) => l.map((x) => (x.id === s.id ? { ...x, ...data.shipment } : x)));
  }

  if (selected) {
    return (
      <DeliveryDetail
        shipment={selected}
        clients={initialClients}
        onBack={() => setSelected(null)}
        onUpdate={(updated) => {
          setSelected(updated);
          setShipments((l) => l.map((x) => (x.id === updated.id ? updated : x)));
        }}
        onOpenDocs={() => setDocsOpen(true)}
        onOpenReceipt={() => setReceiptOpen(true)}
        docsOpen={docsOpen}
        setDocsOpen={setDocsOpen}
        receiptOpen={receiptOpen}
        setReceiptOpen={setReceiptOpen}
      />
    );
  }

  return (
    <div>
      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Clients" value={stats.totalClients} />
        <StatCard label="Total deliveries" value={stats.totalShipments} />
        <StatCard label="In transit" value={stats.inTransit} />
        <StatCard label="Receipt confirmed" value={stats.receiptConfirmed} />
      </div>

      {/* Filter and search */}
      <div className="card mb-6">
        <div className="flex flex-col gap-4 border-b border-navy-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search reference, client or location"
            className="input w-full sm:flex-1"
          />
          <div className="flex shrink-0 self-start overflow-hidden rounded-lg border border-stone-300 sm:self-auto">
            {FILTERS.map((f, i) => (
              <button
                key={f}
                onClick={() => { setFilter(f); setPage(1); }}
                className={`px-3 py-2 text-sm font-medium transition ${i > 0 ? "border-l border-stone-300" : ""} ${
                  filter === f ? "bg-navy-800 text-white" : "bg-white text-navy-600 hover:bg-navy-50"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile cards */}
        <div className="divide-y divide-navy-50 sm:hidden">
          {paged.map((s) => (
            <DeliveryCard key={s.id} shipment={s} onClick={() => setSelected(s)} onUpdateStatus={updateStatus}
              onOpenDocs={() => setDocsShipment(s)} onOpenReceipt={() => setReceiptShipment(s)} />
          ))}
          {paged.length === 0 && <p className="px-5 py-10 text-center text-sm text-navy-300">No deliveries found.</p>}
        </div>

        {/* Desktop table */}
        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-navy-100 text-left text-xs uppercase tracking-wide text-navy-400">
                <th className="px-5 py-3 font-semibold">Delivery / Client</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Collection</th>
                <th className="px-5 py-3 font-semibold">Documents</th>
                <th className="px-5 py-3 font-semibold">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-50">
              {paged.map((s) => (
                <DeliveryRow key={s.id} shipment={s} onClick={() => setSelected(s)} onUpdateStatus={updateStatus}
                  onOpenDocs={() => setDocsShipment(s)} onOpenReceipt={() => setReceiptShipment(s)} />
              ))}
              {paged.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-navy-300">No deliveries found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex flex-col gap-2 border-t border-navy-100 px-5 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
            <span className="text-navy-400">
              {filtered.length} delivery{filtered.length !== 1 ? "ies" : "y"} · Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary !px-3 !py-2 disabled:opacity-40">← Prev</button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-secondary !px-3 !py-2 disabled:opacity-40">Next →</button>
            </div>
          </div>
        )}
      </div>

      {docsShipment && (
        <DeliveryDocs
          shipment={docsShipment}
          admin
          onClose={() => setDocsShipment(null)}
          onUpdate={(updated) => setShipments((l) => l.map((x) => (x.id === updated.id ? { ...x, ...updated } : x)))}
        />
      )}
      {receiptShipment && (
        <DeliveryReceipt
          shipment={receiptShipment}
          admin
          onClose={() => setReceiptShipment(null)}
          onUpdate={(updated) => {
            setShipments((l) => l.map((x) => (x.id === updated.id ? { ...x, ...updated } : x)));
            setReceiptShipment(null);
          }}
        />
      )}
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="card p-5">
      <div className="text-3xl font-bold text-navy-800">{value}</div>
      <div className="mt-1 text-sm text-navy-400">{label}</div>
    </div>
  );
}

function DeliveryRow({ shipment, onClick, onUpdateStatus, onOpenDocs, onOpenReceipt }) {
  const documentCount = (shipment.documents || []).length;
  const receipt = shipment.deliveryMeta?.receipt;

  return (
    <tr className="cursor-pointer hover:bg-navy-50/50" onClick={onClick}>
      <td className="px-5 py-3.5">
        <div className="font-mono text-sm font-semibold text-navy-800">{shipment.trackingNumber}</div>
        <div className="text-xs text-navy-500">{shipment.client?.name}</div>
      </td>
      <td className="px-5 py-3.5">
        <StatusSelect shipment={shipment} onChange={(status) => onUpdateStatus(shipment, status)} />
      </td>
      <td className="px-5 py-3.5 text-navy-600">
        {fmtShortDate(shipment.createdAt)} · {shipment.pieces || 1} vehicle{shipment.pieces !== 1 ? "s" : ""}
      </td>
      <td className="px-5 py-3.5">
        <button
          onClick={(e) => { e.stopPropagation(); onOpenDocs(); }}
          className="text-navy-600 underline-offset-2 hover:text-teal-700 hover:underline"
        >
          Documents ({documentCount})
        </button>
      </td>
      <td className="px-5 py-3.5">
        {receipt ? (
          <button
            onClick={(e) => { e.stopPropagation(); onOpenReceipt(); }}
            className={`badge ${receipt.status === "DAMAGED" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}
          >
            {receipt.status === "DAMAGED" ? "Damage reported" : "Received without damage"}
          </button>
        ) : (
          <button
            onClick={(e) => { e.stopPropagation(); onOpenReceipt(); }}
            className="badge bg-navy-100 text-navy-600 hover:bg-navy-200"
          >
            Click to Confirm
          </button>
        )}
      </td>
    </tr>
  );
}

function DeliveryCard({ shipment, onClick, onUpdateStatus, onOpenDocs, onOpenReceipt }) {
  const documentCount = (shipment.documents || []).length;
  const receipt = shipment.deliveryMeta?.receipt;
  return (
    <div className="px-4 py-4" onClick={onClick}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-mono text-sm font-semibold text-navy-800">{shipment.trackingNumber}</div>
          <div className="text-xs text-navy-500">{shipment.client?.name}</div>
          <div className="mt-1 text-sm text-navy-600">{fmtShortDate(shipment.createdAt)} · {shipment.pieces || 1} vehicle{shipment.pieces !== 1 ? "s" : ""}</div>
        </div>
        <StatusSelect shipment={shipment} onChange={(status) => onUpdateStatus(shipment, status)} />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
        <button onClick={(e) => { e.stopPropagation(); onOpenDocs(); }} className="text-navy-600 underline-offset-2 hover:underline">
          Documents ({documentCount})
        </button>
        {receipt ? (
          <button
            onClick={(e) => { e.stopPropagation(); onOpenReceipt(); }}
            className={`badge ${receipt.status === "DAMAGED" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}
          >
            {receipt.status === "DAMAGED" ? "Damage reported" : "Received without damage"}
          </button>
        ) : (
          <button onClick={(e) => { e.stopPropagation(); onOpenReceipt(); }} className="badge bg-navy-100 text-navy-600">
            Click to Confirm
          </button>
        )}
      </div>
    </div>
  );
}

function StatusSelect({ shipment, onChange }) {
  return (
    <select
      value={shipment.status}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => onChange(e.target.value)}
      className={`input !w-auto !py-1 !pr-8 text-xs font-semibold ${statusStyles[shipment.status]}`}
    >
      <option value="BOOKED">Collection</option>
      <option value="IN_TRANSIT">In transit</option>
      <option value="OUT_FOR_DELIVERY">Out for delivery</option>
      <option value="DELIVERED">Delivery</option>
      <option value="ON_HOLD">On hold</option>
      <option value="CANCELLED">Cancelled</option>
    </select>
  );
}

function DeliveryDetail({ shipment, onBack, onUpdate, onOpenDocs, onOpenReceipt, docsOpen, setDocsOpen, receiptOpen, setReceiptOpen }) {
  const meta = shipment.deliveryMeta || {};
  const [status, setStatus] = useState(shipment.status);
  const [driverName, setDriverName] = useState(meta.driverName || "");
  const [vehicleReg, setVehicleReg] = useState(meta.vehicleReg || "");
  const [noteToClient, setNoteToClient] = useState(meta.noteToClient || "");
  const [saving, setSaving] = useState(false);
  const receipt = meta.receipt;

  async function save() {
    setSaving(true);
    let updated = shipment;
    if (status !== shipment.status) {
      const res = await fetch(`/api/shipments/${shipment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, currentStatus: shipment.status }),
      });
      const data = await res.json();
      if (res.ok) updated = { ...updated, ...data.shipment };
    }
    const metaRes = await fetch(`/api/shipments/${shipment.id}/delivery-meta`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ driverName, vehicleReg, noteToClient }),
    });
    const metaData = await metaRes.json();
    if (metaRes.ok) updated = { ...updated, ...metaData.shipment };
    setSaving(false);
    onUpdate(updated);
  }

  return (
    <div>
      <button onClick={onBack} className="mb-4 text-sm font-medium text-teal-600 hover:text-teal-700">← Back to deliveries</button>

      <div className="card p-5 sm:p-6">
        <h2 className="mb-5 text-xl font-bold text-navy-800">Update delivery · {shipment.trackingNumber}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label text-xs">Delivery status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="input">
              <option value="BOOKED">Collection</option>
              <option value="IN_TRANSIT">In transit</option>
              <option value="OUT_FOR_DELIVERY">Out for delivery</option>
              <option value="DELIVERED">Delivery</option>
              <option value="ON_HOLD">On hold</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="label text-xs">Driver name</label>
            <input
              value={driverName}
              onChange={(e) => setDriverName(e.target.value)}
              className="input"
              placeholder="e.g. Alex · sample"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label text-xs">Transporter registration / licence plate</label>
            <input
              value={vehicleReg}
              onChange={(e) => setVehicleReg(e.target.value)}
              className="input"
              placeholder="e.g. SAMPLE 01"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label text-xs">Note to client</label>
            <textarea
              value={noteToClient}
              onChange={(e) => setNoteToClient(e.target.value)}
              rows={2}
              className="input"
              placeholder="Add a note..."
            />
          </div>
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm text-navy-500">
            Client receipt: {receipt ? (receipt.status === "DAMAGED" ? "Damage reported" : "Received without damage") : "Awaiting confirmation"}
          </span>
          <button onClick={save} disabled={saving} className="btn-primary">{saving ? "Saving…" : "Save & notify client"}</button>
        </div>
      </div>

      {/* Route preview — the status dropdown above moves the van position. */}
      <div className="card mt-6 p-5">
        <VanRouteBar status={status} origin={shipment.origin} destination={shipment.destination} />
        <div className="mt-5 flex flex-wrap gap-3 border-t border-navy-100 pt-5">
          <button onClick={onOpenDocs} className="btn-secondary">Delivery documents</button>
          <button onClick={onOpenReceipt} className="btn-secondary">Review / edit receipt</button>
        </div>
      </div>

      {docsOpen && (
        <DeliveryDocs
          shipment={shipment}
          admin
          onClose={() => setDocsOpen(false)}
          onUpdate={(updated) => onUpdate(updated)}
        />
      )}
      {receiptOpen && (
        <DeliveryReceipt
          shipment={shipment}
          admin
          onClose={() => setReceiptOpen(false)}
          onUpdate={(updated) => onUpdate(updated)}
        />
      )}
    </div>
  );
}
