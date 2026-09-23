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
      <div className="space-y-5">
        <div className="rounded-lg border border-navy-100 bg-navy-50/40 p-4 text-sm text-navy-700">
          <span className="font-semibold">Selected delivery</span>
          <div className="mt-1 font-mono">{shipment.trackingNumber} · {shipment.client?.name || shipment.client?.company} · {shipment.origin} to {shipment.destination}</div>
        </div>

        <div>
          <label className="label text-xs">Delivery received</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="input" disabled={!admin && receipt.status === "RECEIVED"}>
            <option value="RECEIVED">Received without damage</option>
            <option value="DAMAGED">Received with damage</option>
          </select>
        </div>

        <div>
          <label className="label text-xs">Damage description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="input"
            placeholder="Describe damage and identify the vehicle / VIN"
            disabled={status === "RECEIVED"}
          />
        </div>

        <div>
          <label className="label text-xs">Photos / supporting documents (optional)</label>
          <input ref={fileRef} type="file" className="hidden" onChange={upload} />
          <button onClick={() => fileRef.current?.click()} disabled={uploading || status === "RECEIVED"} className="btn-secondary !py-2 disabled:opacity-50">
            {uploading ? "Uploading…" : "Choose files…"}
          </button>
          {status === "RECEIVED" && <p className="mt-1 text-xs text-navy-400">No supporting documents needed for a clean receipt.</p>}
        </div>

        {files.length > 0 && (
          <ul className="divide-y divide-navy-50 rounded-lg border border-navy-100">
            {files.map((f) => (
              <li key={f.id} className="flex items-center justify-between gap-3 px-4 py-2 text-sm">
                <div className="min-w-0">
                  <a href={`/api/shipments/${shipment.id}/documents/${f.id}`} target="_blank" rel="noopener noreferrer" className="font-medium text-teal-600 hover:text-teal-700">
                    {f.fileName}
                  </a>
                  <div className="text-xs text-navy-400">{fmtSize(f.size)} · {fmtDateTime(f.createdAt || f.uploadedAt)}</div>
                </div>
                {admin && <button onClick={() => removeFile(f)} className="text-xs font-medium text-red-500 hover:text-red-700">Remove</button>}
              </li>
            ))}
          </ul>
        )}

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={save} disabled={saving} className="btn-primary">{saving ? "Saving…" : admin ? "Save receipt changes" : "Confirm receipt"}</button>
        </div>
      </div>
    </Modal>
  );
}
