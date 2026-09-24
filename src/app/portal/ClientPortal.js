"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { isOverdue, statusLabel, SelectedDeliveryCard } from "@/lib/ShipmentResult";
import DeliveryReceipt from "../admin/DeliveryReceipt";
import DeliveryDocs from "../admin/DeliveryDocs";

const POLL_MS = 15000;

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—");

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

export default function ClientPortal({ shipments: initialShipments }) {
  const [shipments, setShipments] = useState(initialShipments);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [lastRefresh, setLastRefresh] = useState(null);
  const [receiptShipment, setReceiptShipment] = useState(null);
  const [docsShipment, setDocsShipment] = useState(null);
  const selectedIdRef = useRef(null);
  selectedIdRef.current = selected?.id ?? null;

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/shipments", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      if (!data.shipments) return;
      setShipments(data.shipments);
      setLastRefresh(new Date());
      if (selectedIdRef.current) {
        const updated = data.shipments.find((s) => s.id === selectedIdRef.current);
        setSelected(updated || null);
      }
    } catch {}
  }, []);

  useEffect(() => {
    const interval = setInterval(refresh, POLL_MS);
    const onVisible = () => { if (document.visibilityState === "visible") refresh(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => { clearInterval(interval); document.removeEventListener("visibilitychange", onVisible); };
  }, [refresh]);

  const filtered = useMemo(() => {
    return shipments.filter((s) => {
      const q = search.toLowerCase();
      const matches =
        !q ||
        s.trackingNumber.toLowerCase().includes(q) ||
        s.origin.toLowerCase().includes(q) ||
        s.destination.toLowerCase().includes(q);
      if (!matches) return false;
      if (filter === "Current") return s.status !== "DELIVERED" && s.status !== "CANCELLED";
      if (filter === "Past") return s.status === "DELIVERED" || s.status === "CANCELLED";
      return true;
    });
  }, [shipments, search, filter]);

  function applyUpdate(updated) {
    setShipments((l) => l.map((x) => (x.id === updated.id ? { ...x, ...updated } : x)));
    if (selected?.id === updated.id) setSelected((s) => (s ? { ...s, ...updated } : s));
  }

  return (
    <div>
      {selected && (
        <SelectedDelivery
          shipment={selected}
          onClose={() => setSelected(null)}
          onOpenReceipt={() => setReceiptShipment(selected)}
          onOpenDocs={() => setDocsShipment(selected)}
        />
      )}

      <div className="panel">
        <div className="section-heading">
          <h2>Delivery register</h2>
          <span>
            {filtered.length} journey{filtered.length !== 1 ? "s" : ""}
            {lastRefresh && ` · updated ${lastRefresh.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`}
          </span>
        </div>

        <div className="list-tools">
          <div className="search">
            {SearchIcon}
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reference or route"
            />
          </div>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option>All</option>
            <option>Current</option>
            <option>Past</option>
          </select>
        </div>

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Delivery / Route</th>
                <th>Status</th>
                <th>Collection</th>
                <th>Documents</th>
                <th>Receipt</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => {
                const receipt = s.deliveryMeta?.receipt;
                return (
                  <tr key={s.id}>
                    <td>
                      <button className="reference" onClick={() => setSelected(s)}>
                        {s.trackingNumber} {ChevronRight}
                      </button>
                      <small>{s.origin} → {s.destination}</small>
                    </td>
                    <td>
                      <span className={STATUS_BADGE[s.status] || "badge"}>{statusLabel(s.status)}</span>
                      {isOverdue(s) && <span className="badge badge-declined" style={{ marginLeft: 6 }}>Overdue</span>}
                    </td>
                    <td>
                      {fmtDate(s.createdAt)}
                      <small>{s.pieces || 1} vehicle{s.pieces !== 1 ? "s" : ""}</small>
                    </td>
                    <td>
                      <button
                        className="btn-pill btn-pill-outline btn-pill-sm"
                        onClick={(e) => { e.stopPropagation(); setDocsShipment(s); }}
                      >
                        {FileIcon} Documents
                      </button>
                    </td>
                    <td>
                      {receipt ? (
                        <>
                          <button className="receipt-link" onClick={(e) => { e.stopPropagation(); setReceiptShipment(s); }}>
                            Review receipt {ArrowRight}
                          </button>
                          <small>{receipt.status === "DAMAGED" ? "Damage reported" : "Received without damage"}</small>
                        </>
                      ) : (
                        <button className="receipt-link" onClick={(e) => { e.stopPropagation(); setReceiptShipment(s); }}>
                          Click to Confirm {ArrowRight}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", color: "#8a9781" }}>No deliveries found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="help-strip">
        {DocIcon}
        Documents, delivery details and receipt confirmations are kept together in each delivery.
      </div>

      {receiptShipment && (
        <DeliveryReceipt
          shipment={receiptShipment}
          onClose={() => setReceiptShipment(null)}
          onUpdate={(updated) => { applyUpdate(updated); setReceiptShipment(null); }}
        />
      )}
      {docsShipment && (
        <DeliveryDocs
          shipment={docsShipment}
          onClose={() => setDocsShipment(null)}
          onUpdate={(updated) => { applyUpdate(updated); }}
        />
      )}
    </div>
  );
}

function SelectedDelivery({ shipment, onClose, onOpenReceipt, onOpenDocs }) {
  const meta = shipment.deliveryMeta || {};

  return (
    <SelectedDeliveryCard shipment={shipment}>
      <div className="divider" />
      <div className="detail-grid">
        <div>
          <div className="d-label">Driver name</div>
          <div className="d-value">{meta.driverName || "—"}</div>
        </div>
        <div>
          <div className="d-label">Transporter registration</div>
          <div className="d-value">{meta.vehicleReg || "—"}</div>
        </div>
        <div>
          <div className="d-label">Client receipt</div>
          <div className="d-value">
            {meta.receipt ? (meta.receipt.status === "DAMAGED" ? "Damage reported" : "Received without damage") : "Awaiting confirmation"}
          </div>
        </div>
      </div>

      {meta.noteToClient && (
        <div className="notice" style={{ marginBottom: 0 }}>
          <strong>Note to client</strong>
          <div>{meta.noteToClient}</div>
        </div>
      )}

      <div className="form-footer">
        <p>{meta.receipt ? "Receipt confirmed — review or open documents." : "Confirm receipt once your vehicle arrives."}</p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button onClick={onOpenReceipt} className="btn-pill btn-pill-primary">
            {meta.receipt ? "Review receipt" : "Confirm receipt"}
          </button>
          <button onClick={onOpenDocs} className="btn-pill btn-pill-outline">Delivery documents</button>
          <button onClick={onClose} className="text-button">Close</button>
        </div>
      </div>
    </SelectedDeliveryCard>
  );
}
