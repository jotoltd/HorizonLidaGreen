"use client";

import { useState, useMemo } from "react";
import { VanRouteBar, statusLabel } from "@/lib/ShipmentResult";
import DeliveryDocs from "./DeliveryDocs";
import DeliveryReceipt from "./DeliveryReceipt";

const PAGE_SIZE = 10;

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—");
const fmtShortDate = (d) => (d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) : "—");

const SearchIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

const FileIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
    <path d="M14 2v4a2 2 0 0 0 2 2h4" />
    <path d="M9 13h6" />
    <path d="M9 17h6" />
  </svg>
);

const ArrowRight = (
  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </svg>
);

const ChevronRight = (
  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m9 18 6-6-6-6" />
  </svg>
);

const DocIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
    <path d="M14 2v4a2 2 0 0 0 2 2h4" />
    <path d="M10 9H8" />
    <path d="M16 13H8" />
    <path d="M16 17H8" />
  </svg>
);

const STATUS_BADGE = {
  CANCELLED: "badge badge-declined",
  ON_HOLD: "badge badge-warn",
};

function StatusBadge({ status }) {
  return <span className={STATUS_BADGE[status] || "badge"}>{statusLabel(status)}</span>;
}

export default function DeliveriesPage({ clients: initialClients, shipments: initialShipments, stats }) {
  const [shipments, setShipments] = useState(initialShipments);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [docsShipment, setDocsShipment] = useState(null);
  const [receiptShipment, setReceiptShipment] = useState(null);

  const filtered = useMemo(() => {
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
      />
    );
  }

  return (
    <div>
      <div className="stats">
        <div>
          <span>Total deliveries</span>
          <strong>{stats.totalShipments}</strong>
          <div className="stat-line" />
        </div>
        <div>
          <span>At collection</span>
          <strong>{stats.atCollection}</strong>
          <div className="stat-line" />
        </div>
        <div>
          <span>In transit</span>
          <strong>{stats.inTransit}</strong>
          <div className="stat-line" />
        </div>
        <div>
          <span>Delivered</span>
          <strong>{stats.delivered}</strong>
          <div className="stat-line" />
        </div>
      </div>

      <div className="panel">
        <div className="section-heading">
          <h2>Delivery register</h2>
          <span>{filtered.length} journey{filtered.length !== 1 ? "s" : ""}</span>
        </div>

        <div className="list-tools">
          <div className="search">
            {SearchIcon}
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search reference, route or client"
            />
          </div>
          <select value={filter} onChange={(e) => { setFilter(e.target.value); setPage(1); }}>
            <option>All</option>
            <option>Current</option>
            <option>Past</option>
          </select>
        </div>

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Delivery / Client</th>
                <th>Status</th>
                <th>Collection</th>
                <th>Documents</th>
                <th>Receipt</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((s) => (
                <DeliveryRow
                  key={s.id}
                  shipment={s}
                  onClick={() => setSelected(s)}
                  onOpenDocs={() => setDocsShipment(s)}
                  onOpenReceipt={() => setReceiptShipment(s)}
                />
              ))}
              {paged.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", color: "#8a9781" }}>No deliveries found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="pager">
            <span>Page {page} of {totalPages}</span>
            <div className="pager-buttons">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-pill btn-pill-outline btn-pill-sm">← Prev</button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-pill btn-pill-outline btn-pill-sm">Next →</button>
            </div>
          </div>
        )}
      </div>

      <div className="help-strip">
        {DocIcon}
        Documents, delivery details and receipt confirmations are kept together in each delivery.
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

function DeliveryRow({ shipment, onClick, onOpenDocs, onOpenReceipt }) {
  const receipt = shipment.deliveryMeta?.receipt;
  return (
    <tr>
      <td>
        <button className="reference" onClick={onClick}>
          {shipment.trackingNumber} {ChevronRight}
        </button>
        <small>
          {shipment.client?.name || "—"} · {shipment.origin} → {shipment.destination}
        </small>
      </td>
      <td>
        <StatusBadge status={shipment.status} />
      </td>
      <td>
        {fmtDate(shipment.createdAt)}
        <small>{shipment.pieces || 1} vehicle{shipment.pieces !== 1 ? "s" : ""}</small>
      </td>
      <td>
        <button
          className="btn-pill btn-pill-outline btn-pill-sm"
          onClick={(e) => { e.stopPropagation(); onOpenDocs(); }}
        >
          {FileIcon} Documents
        </button>
      </td>
      <td>
        {receipt ? (
          <>
            <button className="receipt-link" onClick={(e) => { e.stopPropagation(); onOpenReceipt(); }}>
              Review / edit receipt {ArrowRight}
            </button>
            <small>{receipt.status === "DAMAGED" ? "Damage reported" : "Received without damage"}</small>
          </>
        ) : (
          <button className="receipt-link" onClick={(e) => { e.stopPropagation(); onOpenReceipt(); }}>
            Click to Confirm {ArrowRight}
          </button>
        )}
      </td>
    </tr>
  );
}

function DeliveryDetail({ shipment, onBack, onUpdate }) {
  const meta = shipment.deliveryMeta || {};
  const [status, setStatus] = useState(shipment.status);
  const [driverName, setDriverName] = useState(meta.driverName || "");
  const [vehicleReg, setVehicleReg] = useState(meta.vehicleReg || "");
  const [noteToClient, setNoteToClient] = useState(meta.noteToClient || "");
  const [saving, setSaving] = useState(false);
  const [docsOpen, setDocsOpen] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
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
      <button onClick={onBack} className="back-link">← Back to deliveries</button>

      <div className="journey">
        <div className="journey-title">
          <div>
            <p className="eyebrow">UPDATE DELIVERY · {shipment.trackingNumber}</p>
            <h2>{shipment.origin} → {shipment.destination}</h2>
          </div>
          <StatusBadge status={status} />
        </div>

        <VanRouteBar status={status} origin={shipment.origin} destination={shipment.destination} />

        <div className="divider" />

        <div className="form-grid">
          <label className="field">
            <span>Delivery status</span>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="BOOKED">Collection</option>
              <option value="IN_TRANSIT">In transit</option>
              <option value="OUT_FOR_DELIVERY">Out for delivery</option>
              <option value="DELIVERED">Delivery</option>
              <option value="ON_HOLD">On hold</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </label>
          <label className="field">
            <span>Driver name</span>
            <input value={driverName} onChange={(e) => setDriverName(e.target.value)} placeholder="e.g. Alex" />
          </label>
          <label className="field wide">
            <span>Transporter registration / licence plate</span>
            <input value={vehicleReg} onChange={(e) => setVehicleReg(e.target.value)} placeholder="e.g. AB12 CDE" />
          </label>
          <label className="field wide">
            <span>Note to client</span>
            <textarea value={noteToClient} onChange={(e) => setNoteToClient(e.target.value)} rows={2} placeholder="Add a note..." />
          </label>
        </div>

        <div className="form-footer">
          <p>
            Client receipt: {receipt ? (receipt.status === "DAMAGED" ? "Damage reported" : "Received without damage") : "Awaiting confirmation"}
          </p>
          <button onClick={save} disabled={saving} className="btn-pill btn-pill-primary">
            {saving ? "Saving…" : "Save & notify client"}
          </button>
        </div>
      </div>

      <div className="panel">
        <div className="section-heading">
          <h2>Documents & receipt</h2>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button onClick={() => setDocsOpen(true)} className="btn-pill btn-pill-outline">{FileIcon} Delivery documents</button>
          <button onClick={() => setReceiptOpen(true)} className="btn-pill btn-pill-outline">Review / edit receipt {ArrowRight}</button>
        </div>
      </div>

      {docsOpen && (
        <DeliveryDocs
          shipment={shipment}
          admin
          onClose={() => setDocsOpen(false)}
          onUpdate={(updated) => onUpdate({ ...shipment, ...updated })}
        />
      )}
      {receiptOpen && (
        <DeliveryReceipt
          shipment={shipment}
          admin
          onClose={() => setReceiptOpen(false)}
          onUpdate={(updated) => onUpdate({ ...shipment, ...updated })}
        />
      )}
    </div>
  );
}
