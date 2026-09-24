"use client";

import { useState, useRef } from "react";
import Modal from "@/lib/Modal";

const fmtDateTime = (d) => (d ? new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—");
const fmtSize = (n) => (n == null ? "" : n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

export default function DeliveryReceipt({ shipment, admin, onClose, onUpdate }) {
  const meta = shipment.deliveryMeta || {};
  const receipt = meta.receipt || { status: "RECEIVED", description: "", files: [] };
  const [status, setStatus] = useState(receipt.status || "RECEIVED");
  const [description, setDescription] = useState(receipt.description || "");
  const [files, setFiles] = useState(receipt.files || []);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  async function upload(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    setError("");
    const form = new FormData();
    form.append("file", file);
    form.append("type", "PHOTOS");
    const res = await fetch(`/api/shipments/${shipment.id}/documents`, { method: "POST", body: form });
    const data = await res.json().catch(() => ({}));
    setUploading(false);
    if (!res.ok) { setError(data.error || "Upload failed"); return; }
    const next = [data.document, ...files];
    setFiles(next);
  }

  async function save() {
    setSaving(true);
    setError("");
    const res = await fetch(`/api/shipments/${shipment.id}/delivery-meta`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receipt: { status, description, files } }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) { setError(data.error || "Save failed"); return; }
    onUpdate(data.shipment);
    onClose();
  }

  async function removeFile(doc) {
    if (!confirm(`Remove ${doc.fileName}?`)) return;
    await fetch(`/api/shipments/${shipment.id}/documents/${doc.id}`, { method: "DELETE" });
    setFiles((prev) => prev.filter((f) => f.id !== doc.id));
  }

  return (
    <Modal onClose={onClose} title={admin ? "Review / edit delivery receipt" : "Confirm delivery receipt"}>
      <div className="notice" style={{ marginTop: 0 }}>
        <strong>Selected delivery</strong>
        <div>{shipment.trackingNumber} · {shipment.client?.name || shipment.client?.company} · {shipment.origin} to {shipment.destination}</div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <label className="field">
          <span>Delivery received</span>
          <select value={status} onChange={(e) => setStatus(e.target.value)} disabled={!admin && receipt.status === "RECEIVED"}>
            <option value="RECEIVED">Received without damage</option>
            <option value="DAMAGED">Received with damage</option>
          </select>
        </label>

        <label className="field">
          <span>Damage description</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Describe damage and identify the vehicle / VIN"
            disabled={status === "RECEIVED"}
          />
        </label>

        <div>
          <label className="field" style={{ marginBottom: 8 }}>
            <span>Photos / supporting documents (optional)</span>
          </label>
          <input ref={fileRef} type="file" style={{ display: "none" }} onChange={upload} />
          <button onClick={() => fileRef.current?.click()} disabled={uploading || status === "RECEIVED"} className="btn-pill btn-pill-outline btn-pill-sm">
            {uploading ? "Uploading…" : "Choose files…"}
          </button>
          {status === "RECEIVED" && <p className="muted" style={{ marginTop: 8, fontSize: 12 }}>No supporting documents needed for a clean receipt.</p>}
        </div>

        {files.length > 0 && (
          <div>
            {files.map((f) => (
              <div key={f.id} className="document-row">
                <div>
                  <a href={`/api/shipments/${shipment.id}/documents/${f.id}`} target="_blank" rel="noopener noreferrer" className="subtle-link">
                    <strong>{f.fileName}</strong>
                  </a>
                  <small>{fmtSize(f.size)} · {fmtDateTime(f.createdAt || f.uploadedAt)}</small>
                </div>
                {admin && (
                  <div className="doc-actions">
                    <button onClick={() => removeFile(f)} className="subtle-link danger">Remove</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {error && <p className="login-error">{error}</p>}
      </div>

      <div className="form-footer">
        <p>{admin ? "Receipt updates notify the client." : "Confirm once your vehicle has arrived."}</p>
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={onClose} className="btn-pill btn-pill-outline">Cancel</button>
          <button onClick={save} disabled={saving} className="btn-pill btn-pill-primary">{saving ? "Saving…" : admin ? "Save receipt changes" : "Confirm receipt"}</button>
        </div>
      </div>
    </Modal>
  );
}
