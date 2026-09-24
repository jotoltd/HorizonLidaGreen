"use client";

import { useState, useRef } from "react";
import Modal from "@/lib/Modal";

const fmtDateTime = (d) => (d ? new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—");

const UploadIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" x2="12" y1="3" y2="15" />
  </svg>
);

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
    <Modal onClose={onClose} title={`Delivery documents · ${shipment.trackingNumber}`}>
      <div className="upload-zone">
        {UploadIcon}
        Add a document to this delivery
        <span>PDF, photo or scan — shared with the client.</span>
        <input ref={fileRef} type="file" />
        <button onClick={upload} disabled={uploading} className="btn-pill btn-pill-primary btn-pill-sm">
          {uploading ? "Uploading…" : "Upload"}
        </button>
        {error && <p className="login-error">{error}</p>}
      </div>

      <div style={{ marginTop: 10 }}>
        {documents.length === 0 && <div className="empty">No documents uploaded yet.</div>}
        {documents.map((doc) => (
          <div key={doc.id} className="document-row">
            <div>
              <strong>{doc.title || doc.fileName}</strong>
              <small>{fmtDateTime(doc.createdAt || doc.uploadedAt)}</small>
            </div>
            <div className="doc-actions">
              <a href={`/api/shipments/${shipment.id}/documents/${doc.id}`} target="_blank" rel="noopener noreferrer" className="subtle-link">Review</a>
              <a href={`/api/shipments/${shipment.id}/documents/${doc.id}?download=1`} target="_blank" rel="noopener noreferrer" className="subtle-link">Download</a>
              {admin && <button onClick={() => remove(doc)} className="subtle-link danger">Delete</button>}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}
