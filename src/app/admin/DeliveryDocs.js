"use client";

import { useState, useRef } from "react";
import Modal from "@/lib/Modal";

const fmtDateTime = (d) => (d ? new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—");

export default function DeliveryDocs({ shipment, admin = false, onClose, onUpdate }) {
  const [documents, setDocuments] = useState(shipment.documents || []);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  async function upload() {
    const file = fileRef.current?.files?.[0];
    if (!file) { setError("Choose a file first."); return; }
    setUploading(true);
    setError("");
    const form = new FormData();
    form.append("file", file);
    form.append("type", "OTHER");
    const res = await fetch(`/api/shipments/${shipment.id}/documents`, { method: "POST", body: form });
    const data = await res.json().catch(() => ({}));
    setUploading(false);
    if (!res.ok) { setError(data.error || "Upload failed"); return; }
    const next = [data.document, ...documents];
    setDocuments(next);
    onUpdate({ ...shipment, documents: next });
    if (fileRef.current) fileRef.current.value = "";
  }

  async function remove(doc) {
    if (!confirm(`Delete "${doc.title || doc.fileName}"?`)) return;
    const res = await fetch(`/api/shipments/${shipment.id}/documents/${doc.id}`, { method: "DELETE" });
    if (res.ok) {
      const next = documents.filter((d) => d.id !== doc.id);
      setDocuments(next);
      onUpdate({ ...shipment, documents: next });
    }
  }

  return (
    <Modal onClose={onClose} title="Delivery documents">
      <div className="space-y-6">
        <div className="rounded-lg border border-navy-100 p-4">
          <label className="label text-xs">Upload to {shipment.trackingNumber}</label>
          <div className="flex flex-wrap items-center gap-3">
            <input ref={fileRef} type="file" className="text-sm text-navy-600 file:mr-3 file:rounded-lg file:border-0 file:bg-navy-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-navy-700 hover:file:bg-navy-100" />
            <button onClick={upload} disabled={uploading} className="btn-primary !py-2">{uploading ? "Uploading…" : "Upload"}</button>
          </div>
          {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
        </div>

        <ul className="divide-y divide-navy-50 rounded-lg border border-navy-100">
          {documents.length === 0 && (
            <li className="px-4 py-6 text-center text-sm text-navy-300">No documents uploaded yet.</li>
          )}
          {documents.map((doc) => (
            <li key={doc.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-navy-800">{doc.title || doc.fileName}</div>
                <div className="text-xs text-navy-400">{fmtDateTime(doc.createdAt || doc.uploadedAt)}</div>
              </div>
              <div className="flex shrink-0 gap-3">
                <a href={`/api/shipments/${shipment.id}/documents/${doc.id}`} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-teal-600 hover:text-teal-700">Review</a>
                <a href={`/api/shipments/${shipment.id}/documents/${doc.id}?download=1`} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-teal-600 hover:text-teal-700">Download</a>
                {admin && <button onClick={() => remove(doc)} className="text-xs font-medium text-red-500 hover:text-red-700">Delete</button>}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Modal>
  );
}
