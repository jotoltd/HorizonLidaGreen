"use client";

import { useState, useEffect, useRef } from "react";
import {
  DOC_TYPES,
  DOC_TYPE_LABELS,
  DOC_TYPE_STYLES,
  CLAIM_STATUSES,
  CLAIM_STATUS_LABELS,
  CLAIM_STATUS_STYLES,
  CLAIM_DOC_STATUSES,
  CLAIM_DOC_STATUS_LABELS,
  CLAIM_DOC_STATUS_STYLES,
} from "@/lib/docs";

const fmtDateTime = (d) => (d ? new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—");
const toDateInput = (d) => (d ? new Date(d).toISOString().split("T")[0] : "");

// Admin manager for a shipment's documents and insurance claim.
export default function ShipmentDocs({ shipment, onClose }) {
  const [documents, setDocuments] = useState(null);
  const [claim, setClaim] = useState(null);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    fetch(`/api/shipments/${shipment.id}/documents`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setLoadError(d.error);
        else { setDocuments(d.documents || []); setClaim(d.claim || null); }
      })
      .catch(() => setLoadError("Failed to load documents."));
  }, [shipment.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-navy-100 px-6 py-4">
          <div>
            <h3 className="text-lg font-bold text-navy-800">Documents &amp; Insurance Claim</h3>
            <div className="font-mono text-xs text-navy-400">{shipment.trackingNumber} · {shipment.client?.name}</div>
          </div>
          <button onClick={onClose} className="text-navy-400 hover:text-navy-700">✕</button>
        </div>
        <div className="p-6">
          {loadError && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{loadError}</p>}
          {documents === null && !loadError && <p className="py-8 text-center text-sm text-navy-300">Loading…</p>}
          {documents !== null && (
            <div className="space-y-8">
              <DocumentsSection
                shipment={shipment}
                documents={documents}
                onChange={setDocuments}
              />
              <ClaimSection shipment={shipment} claim={claim} onChange={setClaim} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DocumentsSection({ shipment, documents, onChange }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef(null);
  const [type, setType] = useState("OTHER");
  const [title, setTitle] = useState("");

  async function upload() {
    const file = fileRef.current?.files?.[0];
    if (!file) { setError("Choose a file first."); return; }
    setUploading(true);
    setError("");
    const form = new FormData();
    form.append("file", file);
    form.append("type", type);
    form.append("title", title);
    const res = await fetch(`/api/shipments/${shipment.id}/documents`, { method: "POST", body: form });
    const data = await res.json().catch(() => ({}));
    setUploading(false);
    if (!res.ok) { setError(data.error || "Upload failed"); return; }
    onChange([data.document, ...documents]);
    setTitle("");
    if (fileRef.current) fileRef.current.value = "";
  }

  async function remove(doc) {
    if (!confirm(`Delete "${doc.title || doc.fileName}"?`)) return;
    const res = await fetch(`/api/shipments/${shipment.id}/documents/${doc.id}`, { method: "DELETE" });
    if (res.ok) onChange(documents.filter((d) => d.id !== doc.id));
  }

  return (
    <section>
      <h4 className="mb-3 font-semibold text-navy-800">Shipment Documents</h4>
      <div className="rounded-lg border border-navy-100 p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="label text-xs">Document Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className="input !py-2">
              {DOC_TYPES.map((t) => <option key={t} value={t}>{DOC_TYPE_LABELS[t]}</option>)}
            </select>
          </div>
          <div>
            <label className="label text-xs">Title (optional)</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="input !py-2" placeholder="Defaults to file name" />
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <input ref={fileRef} type="file" className="text-sm text-navy-600 file:mr-3 file:rounded-lg file:border-0 file:bg-navy-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-navy-700 hover:file:bg-navy-100" />
          <button onClick={upload} disabled={uploading} className="btn-primary !py-2">{uploading ? "Uploading…" : "Upload"}</button>
        </div>
        {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
      </div>

      <ul className="mt-3 divide-y divide-navy-50">
        {documents.map((doc) => (
          <li key={doc.id} className="flex items-center justify-between gap-3 py-2.5">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="truncate text-sm font-medium text-navy-800">{doc.title || doc.fileName}</span>
                <span className={`badge ${DOC_TYPE_STYLES[doc.type] || DOC_TYPE_STYLES.OTHER}`}>{DOC_TYPE_LABELS[doc.type] || "Document"}</span>
              </div>
              <div className="mt-0.5 text-xs text-navy-400">{doc.fileName} · {fmtDateTime(doc.createdAt || doc.uploadedAt)}</div>
            </div>
            <div className="flex shrink-0 gap-3">
              <a href={`/api/shipments/${shipment.id}/documents/${doc.id}`} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-teal-600 hover:text-teal-700">Download</a>
              <button onClick={() => remove(doc)} className="text-xs font-medium text-red-500 hover:text-red-700">Delete</button>
            </div>
          </li>
        ))}
        {documents.length === 0 && <li className="py-4 text-center text-sm text-navy-300">No documents uploaded yet.</li>}
      </ul>
    </section>
  );
}

function ClaimSection({ shipment, claim, onChange }) {
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  if (!claim) {
    return (
      <section>
        <h4 className="mb-3 font-semibold text-navy-800">Insurance Claim</h4>
        {!creating ? (
          <div className="rounded-lg border border-dashed border-navy-200 p-5 text-center">
            <p className="text-sm text-navy-400">No insurance claim for this shipment.</p>
            <button onClick={() => setCreating(true)} className="btn-secondary mt-3 !py-2">+ Open Insurance Claim</button>
          </div>
        ) : (
          <ClaimForm
            submitLabel="Open Claim"
            onCancel={() => setCreating(false)}
            onSubmit={async (fields) => {
              const res = await fetch(`/api/shipments/${shipment.id}/claim`, {
                method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(fields),
              });
              const data = await res.json().catch(() => ({}));
              if (!res.ok) { setError(data.error || "Failed to create claim"); return false; }
              onChange(data.claim);
              return true;
            }}
            error={error}
          />
        )}
      </section>
    );
  }

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h4 className="font-semibold text-navy-800">Insurance Claim</h4>
        <span className={`badge ${CLAIM_STATUS_STYLES[claim.status] || "bg-navy-100 text-navy-700"}`}>
          {CLAIM_STATUS_LABELS[claim.status] || claim.status}
        </span>
      </div>
      <ClaimForm
        defaults={claim}
        submitLabel="Save Claim"
        onSubmit={async (fields) => {
          const res = await fetch(`/api/shipments/${shipment.id}/claim`, {
            method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(fields),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) { setError(data.error || "Failed to save claim"); return false; }
          onChange(data.claim);
          return true;
        }}
        error={error}
      />

      <h5 className="mb-2 mt-6 text-sm font-semibold text-navy-700">Required Document Checklist</h5>
      <ul className="divide-y divide-navy-50 rounded-lg border border-navy-100">
        {(claim.documents || []).map((doc) => (
          <ClaimDocRow key={doc.key} shipment={shipment} doc={doc}
            onChange={(updated) => onChange({ ...claim, documents: claim.documents.map((d) => (d.key === updated.key ? updated : d)) })} />
        ))}
      </ul>

      <button
        onClick={async () => {
          if (!confirm("Delete this insurance claim and all its uploaded files?")) return;
          const res = await fetch(`/api/shipments/${shipment.id}/claim`, { method: "DELETE" });
          if (res.ok) onChange(null);
        }}
        className="mt-4 text-xs font-medium text-red-500 hover:text-red-700"
      >
        Delete claim
      </button>
    </section>
  );
}

function ClaimForm({ defaults, submitLabel, onSubmit, onCancel, error }) {
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const d = defaults || {};
  return (
    <form
      className="rounded-lg border border-navy-100 p-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        setSaved(false);
        const fields = Object.fromEntries(new FormData(e.target));
        const ok = await onSubmit(fields);
        setLoading(false);
        if (ok) setSaved(true);
      }}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div><label className="label text-xs">Claim Reference</label><input name="claimNumber" defaultValue={d.claimNumber || ""} className="input !py-2" placeholder="e.g. CLM-2026-001" /></div>
        <div><label className="label text-xs">Insurer</label><input name="insurer" defaultValue={d.insurer || ""} className="input !py-2" placeholder="Insurance company" /></div>
        <div><label className="label text-xs">Incident Date</label><input name="incidentDate" type="date" defaultValue={toDateInput(d.incidentDate)} className="input !py-2" /></div>
        <div>
          <label className="label text-xs">Claim Status</label>
          <select name="status" defaultValue={d.status || "REPORTED"} className="input !py-2">
            {CLAIM_STATUSES.map((s) => <option key={s} value={s}>{CLAIM_STATUS_LABELS[s]}</option>)}
          </select>
        </div>
      </div>
      <div className="mt-3">
        <label className="label text-xs">Incident Details</label>
        <textarea name="description" rows={2} defaultValue={d.description || ""} className="input" placeholder="What happened, where, damage summary…" />
      </div>
      <div className="mt-3 flex items-center justify-end gap-3">
        {saved && <span className="text-xs font-medium text-green-600">Saved</span>}
        {onCancel && <button type="button" onClick={onCancel} className="btn-secondary !py-2">Cancel</button>}
        <button type="submit" disabled={loading} className="btn-primary !py-2">{loading ? "Saving…" : submitLabel}</button>
      </div>
      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
    </form>
  );
}

function ClaimDocRow({ shipment, doc, onChange }) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  async function patch(payload) {
    const res = await fetch(`/api/shipments/${shipment.id}/claim`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ doc: { key: doc.key, ...payload } }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) onChange(data.claim.documents.find((d) => d.key === doc.key));
  }

  async function upload(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    const form = new FormData();
    form.append("key", doc.key);
    form.append("file", file);
    const res = await fetch(`/api/shipments/${shipment.id}/claim/upload`, { method: "POST", body: form });
    const data = await res.json().catch(() => ({}));
    setUploading(false);
    if (res.ok) onChange(data.claim.documents.find((d) => d.key === doc.key));
    else alert(data.error || "Upload failed");
  }

  return (
    <li className="px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-navy-800">{doc.label}</div>
          {(doc.files || []).map((f) => (
            <div key={f.id} className="mt-0.5 flex items-center gap-2 text-xs">
              <a href={`/api/shipments/${shipment.id}/documents/${f.id}`} target="_blank" rel="noopener noreferrer" className="truncate text-teal-600 hover:text-teal-700">
                {f.fileName}
              </a>
              <span className="text-navy-300">{fmtDateTime(f.uploadedAt)}{f.uploadedBy ? ` · by ${f.uploadedBy === "ADMIN" ? "staff" : "customer"}` : ""}</span>
              <button onClick={() => { if (confirm(`Remove ${f.fileName}?`)) patch({ removeFileId: f.id }); }} className="text-red-400 hover:text-red-600">remove</button>
            </div>
          ))}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <select
            value={doc.status}
            onChange={(e) => patch({ status: e.target.value })}
            className={`badge cursor-pointer border-0 ${CLAIM_DOC_STATUS_STYLES[doc.status] || "bg-navy-50 text-navy-500"}`}
          >
            {CLAIM_DOC_STATUSES.map((s) => <option key={s} value={s}>{CLAIM_DOC_STATUS_LABELS[s]}</option>)}
          </select>
          <input ref={fileRef} type="file" className="hidden" onChange={upload} />
          <button onClick={() => fileRef.current?.click()} disabled={uploading} className="text-xs font-medium text-teal-600 hover:text-teal-700 disabled:opacity-50">
            {uploading ? "…" : "Upload"}
          </button>
        </div>
      </div>
      <input
        defaultValue={doc.notes || ""}
        onBlur={(e) => { if (e.target.value !== (doc.notes || "")) patch({ notes: e.target.value }); }}
        placeholder="Notes (e.g. requested by insurer, reference number)…"
        className="mt-2 w-full rounded-lg border border-navy-100 bg-navy-50/50 px-3 py-1.5 text-xs text-navy-700 placeholder:text-navy-300 focus:border-teal-400 focus:outline-none"
      />
    </li>
  );
}
