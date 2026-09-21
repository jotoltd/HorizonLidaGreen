"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { isOverdue } from "@/lib/ShipmentResult";
import {
  DOC_TYPE_LABELS,
  DOC_TYPE_STYLES,
  CLAIM_STATUS_LABELS,
  CLAIM_STATUS_STYLES,
  CLAIM_DOC_STATUS_LABELS,
  CLAIM_DOC_STATUS_STYLES,
  OUTSTANDING_CLAIM_DOC_STATUSES,
} from "@/lib/docs";

const statusStyles = {
  BOOKED: "bg-navy-100 text-navy-700",
  IN_TRANSIT: "bg-blue-100 text-blue-700",
  OUT_FOR_DELIVERY: "bg-amber-100 text-amber-700",
  DELIVERED: "bg-green-100 text-green-700",
  ON_HOLD: "bg-orange-100 text-orange-700",
  CANCELLED: "bg-red-100 text-red-700",
};

const STEP_ORDER = ["BOOKED", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED"];
const STEP_LABELS = { BOOKED: "Booked", IN_TRANSIT: "In Transit", OUT_FOR_DELIVERY: "Out for Delivery", DELIVERED: "Delivered" };

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—");
const fmtDateTime = (d) => (d ? new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—");
const fmtSize = (n) => (n == null ? "" : n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

const POLL_MS = 15000;

export default function ClientPortal({ shipments: initialShipments }) {
  const [shipments, setShipments] = useState(initialShipments);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [lastRefresh, setLastRefresh] = useState(null);
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
    } catch {
      // Keep the current view on transient network errors.
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(refresh, POLL_MS);
    const onVisible = () => { if (document.visibilityState === "visible") refresh(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => { clearInterval(interval); document.removeEventListener("visibilitychange", onVisible); };
  }, [refresh]);

  const stats = {
    total: shipments.length,
    booked: shipments.filter((s) => s.status === "BOOKED").length,
    inTransit: shipments.filter((s) => s.status === "IN_TRANSIT" || s.status === "OUT_FOR_DELIVERY").length,
    delivered: shipments.filter((s) => s.status === "DELIVERED").length,
  };

  const filtered = shipments.filter((s) => {
    const q = search.toLowerCase();
    return !q || s.trackingNumber.toLowerCase().includes(q) || s.origin.toLowerCase().includes(q) || s.destination.toLowerCase().includes(q);
  });

  if (selected) {
    return (
      <ShipmentDetail
        shipment={selected}
        onBack={() => setSelected(null)}
        onShipmentUpdate={(updated) => {
          setSelected(updated);
          setShipments((l) => l.map((x) => (x.id === updated.id ? updated : x)));
        }}
      />
    );
  }

  return (
    <div>
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Shipments" value={stats.total} />
        <StatCard label="Booked" value={stats.booked} />
        <StatCard label="In Transit" value={stats.inTransit} />
        <StatCard label="Delivered" value={stats.delivered} />
      </div>

      <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-navy-100 px-5 py-4">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by tracking number or route…" className="input w-full sm:max-w-md" />
          <span className="flex items-center gap-1.5 text-xs text-navy-300">
            <span className="h-2 w-2 rounded-full bg-teal-400" />
            Live{lastRefresh ? ` · updated ${lastRefresh.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}` : ""}
          </span>
        </div>

        {/* Mobile card layout */}
        <div className="divide-y divide-navy-50 sm:hidden">
          {filtered.map((s) => (
            <div key={s.id} onClick={() => setSelected(s)} className="cursor-pointer px-4 py-4 hover:bg-teal-50/40">
              <div className="flex items-center justify-between gap-2">
                <div className="font-mono text-xs font-semibold text-teal-700 truncate">{s.trackingNumber}</div>
                <span className={`badge ${statusStyles[s.status]} shrink-0`}>{s.status.replace(/_/g, " ")}</span>
              </div>
              <div className="mt-1 text-sm text-navy-600">{s.origin} → {s.destination}</div>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-xs text-navy-400">Carrier: {s.carrier || "—"}</span>
                <span className="text-xs text-navy-400">ETA: {fmtDate(s.eta)}</span>
                {isOverdue(s) && <span className="badge bg-red-50 text-red-600">Overdue</span>}
                {s.claim && <span className="badge bg-purple-50 text-purple-700">Claim</span>}
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="px-5 py-12 text-center text-sm text-navy-300">No shipments found.</p>
          )}
        </div>

        {/* Desktop table layout */}
        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-navy-100 text-left text-xs uppercase tracking-wide text-navy-400">
                <th className="px-5 py-3 font-semibold">Tracking #</th>
                <th className="px-5 py-3 font-semibold">Route</th>
                <th className="px-5 py-3 font-semibold">Carrier</th>
                <th className="px-5 py-3 font-semibold">ETA</th>
                <th className="px-5 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-50">
              {filtered.map((s) => (
                <tr key={s.id} onClick={() => setSelected(s)} className="cursor-pointer hover:bg-teal-50/40">
                  <td className="px-5 py-3.5 font-mono text-xs font-semibold text-teal-700">{s.trackingNumber}</td>
                  <td className="px-5 py-3.5 text-navy-600">{s.origin} → {s.destination}</td>
                  <td className="px-5 py-3.5 text-navy-500">{s.carrier || "—"}</td>
                  <td className="px-5 py-3.5 text-navy-400">{fmtDate(s.eta)}</td>
                  <td className="px-5 py-3.5">
                    <span className={`badge ${statusStyles[s.status]}`}>{s.status.replace(/_/g, " ")}</span>
                    {isOverdue(s) && <span className="badge ml-1 bg-red-50 text-red-600">Overdue</span>}
                    {s.claim && <span className="badge ml-1 bg-purple-50 text-purple-700">Claim</span>}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-12 text-center text-navy-300">No shipments found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
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

function ShipmentDetail({ shipment, onBack, onShipmentUpdate }) {
  const currentStep = STEP_ORDER.indexOf(shipment.status);
  const cancelled = shipment.status === "ON_HOLD" || shipment.status === "CANCELLED";
  const documents = shipment.documents || [];
  const claim = shipment.claim || null;

  return (
    <div>
      <button onClick={onBack} className="mb-4 text-sm font-medium text-teal-600 hover:text-teal-700">← Back to shipments</button>

      <div className="card mb-6 p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-xs font-medium text-navy-400">Tracking Number</div>
            <div className="font-mono text-xl font-bold text-navy-800 sm:text-2xl">{shipment.trackingNumber}</div>
          </div>
          <span className={`badge px-3 py-1 text-sm ${statusStyles[shipment.status]}`}>{shipment.status.replace(/_/g, " ")}</span>
          {isOverdue(shipment) && <span className="badge ml-2 bg-red-50 text-red-600 px-3 py-1 text-sm">Overdue</span>}
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Detail label="Origin" value={shipment.origin} />
          <Detail label="Destination" value={shipment.destination} />
          <Detail label="Carrier" value={shipment.carrier || "—"} />
          <Detail label="Service" value={shipment.service || "—"} />
          <Detail label="Pieces" value={shipment.pieces || "—"} />
          <Detail label="Weight" value={shipment.weight || "—"} />
          <Detail label="ETA" value={fmtDate(shipment.eta)} />
          <Detail label="Created" value={fmtDate(shipment.createdAt)} />
        </div>
        {shipment.notes && (
          <div className="mt-6 rounded-lg bg-navy-50 px-4 py-3">
            <div className="text-xs font-semibold text-navy-400">Notes</div>
            <p className="mt-1 text-sm text-navy-700">{shipment.notes}</p>
          </div>
        )}
      </div>

      {!cancelled ? (
        <div className="card mb-6 p-4 sm:p-6">
          <h3 className="mb-6 font-semibold text-navy-800">Shipment Progress</h3>
          <div className="flex items-center overflow-x-auto pb-2 sm:pb-0">
            {STEP_ORDER.map((step, i) => {
              const done = i <= currentStep;
              const active = i === currentStep;
              return (
                <div key={step} className="flex flex-1 items-center last:flex-none min-w-[60px]">
                  <div className="flex flex-col items-center">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm transition sm:h-10 sm:w-10 ${
                      done ? "border-teal-500 bg-teal-500 text-white" : "border-navy-200 bg-white text-navy-300"}`}>
                      {done ? "✓" : i + 1}
                    </div>
                    <div className={`mt-2 text-[10px] font-medium sm:text-xs ${active ? "text-teal-600" : done ? "text-navy-700" : "text-navy-300"} text-center`}>
                      {STEP_LABELS[step]}
                    </div>
                  </div>
                  {i < STEP_ORDER.length - 1 && (
                    <div className={`mx-1 h-0.5 flex-1 sm:mx-2 ${i < currentStep ? "bg-teal-500" : "bg-navy-100"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="card mb-6 p-4 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-orange-600">!</div>
            <div>
              <div className="font-semibold text-navy-800">This shipment is {shipment.status.replace(/_/g, " ").toLowerCase()}</div>
              <div className="text-sm text-navy-400">Contact Horizon Lida Green for more information.</div>
            </div>
          </div>
        </div>
      )}

      {claim && <ClaimCard shipment={shipment} claim={claim} onShipmentUpdate={onShipmentUpdate} />}

      <DocumentsCard shipment={shipment} documents={documents} />

      <div className="card p-4 sm:p-6">
        <h3 className="mb-4 font-semibold text-navy-800">Tracking History</h3>
        <div className="space-y-0">
          {(shipment.events || []).map((ev, i) => (
            <div key={ev.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className={`h-3 w-3 rounded-full ${i === 0 ? "bg-teal-500" : "bg-navy-200"}`} />
                {i < (shipment.events?.length || 0) - 1 && <div className="w-px flex-1 bg-navy-100" />}
              </div>
              <div className="pb-6">
                <div className="text-sm font-semibold text-navy-800">{ev.status.replace(/_/g, " ")}</div>
                {ev.location && <div className="text-xs text-navy-500">{ev.location}</div>}
                {ev.description && <div className="text-sm text-navy-400">{ev.description}</div>}
                <div className="text-xs text-navy-300">{fmtDateTime(ev.occurredAt)}</div>
              </div>
            </div>
          ))}
          {(!shipment.events || shipment.events.length === 0) && (
            <p className="text-sm text-navy-300">No tracking events yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function DocumentsCard({ shipment, documents }) {
  return (
    <div className="card mb-6 p-4 sm:p-6">
      <h3 className="mb-1 font-semibold text-navy-800">Documents</h3>
      <p className="mb-4 text-xs text-navy-400">Collection &amp; delivery reports, signed proof of delivery, receipts and other files for this shipment.</p>
      {documents.length === 0 ? (
        <p className="text-sm text-navy-300">No documents have been uploaded yet. New documents appear here automatically.</p>
      ) : (
        <ul className="divide-y divide-navy-50">
          {documents.map((doc) => (
            <li key={doc.id} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="truncate text-sm font-medium text-navy-800">{doc.title || doc.fileName}</span>
                  <span className={`badge ${DOC_TYPE_STYLES[doc.type] || DOC_TYPE_STYLES.OTHER}`}>
                    {DOC_TYPE_LABELS[doc.type] || "Document"}
                  </span>
                </div>
                <div className="mt-0.5 text-xs text-navy-400">
                  {doc.fileName} {doc.size ? `· ${fmtSize(doc.size)}` : ""} · Uploaded {fmtDateTime(doc.createdAt || doc.uploadedAt)}
                </div>
              </div>
              <a
                href={`/api/shipments/${shipment.id}/documents/${doc.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 text-sm font-medium text-teal-600 hover:text-teal-700"
              >
                Download
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ClaimCard({ shipment, claim, onShipmentUpdate }) {
  const docs = claim.documents || [];
  const actionable = docs.filter((d) => d.status !== "NOT_APPLICABLE");
  const done = actionable.filter((d) => ["SUBMITTED", "RECEIVED", "APPROVED"].includes(d.status)).length;
  const outstanding = docs.filter((d) => OUTSTANDING_CLAIM_DOC_STATUSES.includes(d.status));

  return (
    <div className="card mb-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-semibold text-navy-800">Insurance Claim</h3>
        <span className={`badge px-3 py-1 text-sm ${CLAIM_STATUS_STYLES[claim.status] || "bg-navy-100 text-navy-700"}`}>
          {CLAIM_STATUS_LABELS[claim.status] || claim.status}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Detail label="Claim Reference" value={claim.claimNumber || "—"} />
        <Detail label="Insurer" value={claim.insurer || "—"} />
        <Detail label="Incident Date" value={fmtDate(claim.incidentDate)} />
        <Detail label="Last Updated" value={fmtDateTime(claim.updatedAt)} />
      </div>
      {claim.description && (
        <div className="mt-4 rounded-lg bg-navy-50 px-4 py-3">
          <div className="text-xs font-semibold text-navy-400">Incident Details</div>
          <p className="mt-1 text-sm text-navy-700">{claim.description}</p>
        </div>
      )}

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between text-xs text-navy-400">
          <span>Document checklist</span>
          <span>{done} of {actionable.length} submitted{outstanding.length > 0 ? ` · ${outstanding.length} outstanding` : ""}</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-navy-100">
          <div
            className="h-full rounded-full bg-teal-500 transition-all"
            style={{ width: `${actionable.length ? Math.round((done / actionable.length) * 100) : 0}%` }}
          />
        </div>
      </div>

      <ul className="mt-4 divide-y divide-navy-50">
        {docs.map((doc) => (
          <ClaimDocRow key={doc.key} shipment={shipment} doc={doc} onShipmentUpdate={onShipmentUpdate} />
        ))}
      </ul>
    </div>
  );
}

function ClaimDocRow({ shipment, doc, onShipmentUpdate }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  const canUpload = doc.status !== "NOT_APPLICABLE";

  async function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    setError("");
    const form = new FormData();
    form.append("key", doc.key);
    form.append("file", file);
    const res = await fetch(`/api/shipments/${shipment.id}/claim/upload`, { method: "POST", body: form });
    const data = await res.json().catch(() => ({}));
    setUploading(false);
    if (!res.ok) { setError(data.error || "Upload failed"); return; }
    onShipmentUpdate({ ...shipment, claim: data.claim });
  }

  return (
    <li className="py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-medium text-navy-800">{doc.label}</div>
          {doc.notes && <div className="mt-0.5 text-xs text-navy-400">{doc.notes}</div>}
          {(doc.files || []).map((f) => (
            <a
              key={f.id}
              href={`/api/shipments/${shipment.id}/documents/${f.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-0.5 block truncate text-xs text-teal-600 hover:text-teal-700"
            >
              {f.fileName} {f.size ? `(${fmtSize(f.size)})` : ""} · {fmtDateTime(f.uploadedAt)}
            </a>
          ))}
          {error && <div className="mt-0.5 text-xs text-red-500">{error}</div>}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className={`badge ${CLAIM_DOC_STATUS_STYLES[doc.status] || "bg-navy-50 text-navy-500"}`}>
            {CLAIM_DOC_STATUS_LABELS[doc.status] || doc.status}
          </span>
          {canUpload && (
            <>
              <input ref={inputRef} type="file" className="hidden" onChange={handleFile} />
              <button
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
                className="text-xs font-medium text-teal-600 hover:text-teal-700 disabled:opacity-50"
              >
                {uploading ? "Uploading…" : (doc.files || []).length ? "Add file" : "Upload"}
              </button>
            </>
          )}
        </div>
      </div>
    </li>
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <div className="text-xs font-medium text-navy-400">{label}</div>
      <div className="mt-0.5 text-sm font-semibold text-navy-800">{value}</div>
    </div>
  );
}
