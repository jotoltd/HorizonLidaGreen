"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { isOverdue, statusLabel, SelectedDeliveryCard, Detail } from "@/lib/ShipmentResult";
import DeliveryReceipt from "../admin/DeliveryReceipt";
import DeliveryDocs from "../admin/DeliveryDocs";

const POLL_MS = 15000;
const FILTERS = ["All", "Current", "Past"];

const fmtShortDate = (d) => (d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) : "—");

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

      <div className="card">
        <div className="flex flex-col gap-4 border-b border-navy-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-3">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by reference or route…" className="input w-full" />
            <span className="hidden shrink-0 items-center gap-1.5 text-xs text-navy-400 lg:flex">
              <span className="h-2 w-2 rounded-full bg-teal-400" />
              Live{lastRefresh ? ` · ${lastRefresh.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}` : ""}
            </span>
          </div>
          <div className="flex shrink-0 self-start overflow-hidden rounded-lg border border-stone-300 sm:self-auto">
            {FILTERS.map((f, i) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
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
          {filtered.map((s) => (
            <div
              key={s.id}
              onClick={() => setSelected(s)}
              className={`cursor-pointer px-4 py-4 ${selected?.id === s.id ? "bg-navy-100" : "hover:bg-navy-50/50"}`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="font-mono text-sm font-semibold text-navy-800">{s.trackingNumber}</div>
                <span className="text-sm text-navy-600">{statusLabel(s.status)}</span>
              </div>
              <div className="mt-1 text-sm text-navy-600">{s.origin} → {s.destination}</div>
              <div className="mt-1 text-xs text-navy-400">{fmtShortDate(s.createdAt)} · {s.pieces || 1} vehicle{s.pieces !== 1 ? "s" : ""} · Documents ({(s.documents || []).length})</div>
            </div>
          ))}
          {filtered.length === 0 && <p className="px-5 py-12 text-center text-sm text-navy-300">No deliveries found.</p>}
        </div>

        {/* Desktop table */}
        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-navy-100 text-left text-xs uppercase tracking-wide text-navy-400">
                <th className="px-5 py-3 font-semibold">Delivery / Route</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Collection</th>
                <th className="px-5 py-3 font-semibold">Documents</th>
                <th className="px-5 py-3 font-semibold">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-50">
              {filtered.map((s) => {
                const receipt = s.deliveryMeta?.receipt;
                return (
                  <tr
                    key={s.id}
                    onClick={() => setSelected(s)}
                    className={`cursor-pointer ${selected?.id === s.id ? "bg-navy-100" : "hover:bg-navy-50/50"}`}
                  >
                    <td className="px-5 py-3.5">
                      <div className="font-mono text-sm font-semibold text-navy-800">{s.trackingNumber}</div>
                      <div className="text-xs text-navy-500">{s.origin} → {s.destination}</div>
                    </td>
                    <td className="px-5 py-3.5 text-navy-600">
                      {statusLabel(s.status)}
                      {isOverdue(s) && <span className="badge ml-1 bg-red-50 text-red-600">Overdue</span>}
                    </td>
                    <td className="px-5 py-3.5 text-navy-600">{fmtShortDate(s.createdAt)} · {s.pieces || 1} vehicle{s.pieces !== 1 ? "s" : ""}</td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={(e) => { e.stopPropagation(); setDocsShipment(s); }}
                        className="text-navy-600 underline-offset-2 hover:text-teal-700 hover:underline"
                      >
                        Documents ({(s.documents || []).length})
                      </button>
                    </td>
                    <td className="px-5 py-3.5">
                      {receipt ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); setReceiptShipment(s); }}
                          className="text-navy-600 underline-offset-2 hover:text-teal-700 hover:underline"
                        >
                          {receipt.status === "DAMAGED" ? "Damage reported" : "Received without damage"}
                        </button>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); setReceiptShipment(s); }}
                          className="font-medium text-teal-600 hover:text-teal-700"
                        >
                          Click to Confirm
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-12 text-center text-navy-300">No deliveries found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
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
    <div className="mb-6">
      <SelectedDeliveryCard shipment={shipment}>
        <div className="mt-6 grid gap-4 border-t border-navy-100 pt-5 sm:grid-cols-3">
          <Detail label="Driver name" value={meta.driverName || "—"} />
          <Detail label="Transporter registration" value={meta.vehicleReg || "—"} />
          <Detail
            label="Client receipt"
            value={meta.receipt ? (meta.receipt.status === "DAMAGED" ? "Damage reported" : "Received without damage") : "Awaiting confirmation"}
          />
        </div>

        {meta.noteToClient && (
          <div className="mt-4 rounded-lg bg-navy-50 px-4 py-3">
            <div className="text-xs font-semibold text-navy-400">Note to client</div>
            <p className="mt-1 text-sm text-navy-700">{meta.noteToClient}</p>
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button onClick={onOpenReceipt} className="btn-primary">
            {meta.receipt ? "Review receipt" : "Confirm receipt"}
          </button>
          <button onClick={onOpenDocs} className="btn-secondary">Delivery documents</button>
          <button onClick={onClose} className="text-sm font-medium text-navy-500 hover:text-navy-700">Close</button>
        </div>
      </SelectedDeliveryCard>
    </div>
  );
}
