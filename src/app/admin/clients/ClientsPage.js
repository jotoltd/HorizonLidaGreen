"use client";

import { useState } from "react";

export default function ClientsPage({ clients: initial }) {
  const [clients, setClients] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [invite, setInvite] = useState(null);

  if (showForm) {
    return (
      <CreateClientForm
        onCreated={(c, pwd) => {
          setClients([c, ...clients]);
          setShowForm(false);
          setInvite({ ...c, password: pwd });
        }}
        onCancel={() => setShowForm(false)}
      />
    );
  }

  if (invite) {
    return (
      <InvitationPreview client={invite} onBack={() => setInvite(null)} />
    );
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button onClick={() => setShowForm(true)} className="btn-primary">+ Create client</button>
      </div>
      <div className="space-y-4">
        {clients.length === 0 && <div className="card p-8 text-center text-sm text-navy-400">No clients yet.</div>}
        {clients.map((c) => (
          <div key={c.id} className="card p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-xl font-bold text-navy-800">{c.name}</div>
                <div className="mt-1 text-navy-500">{c.email}</div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="badge bg-navy-100 text-navy-700">Active</span>
                <button onClick={() => setInvite({ ...c })} className="btn-primary">Open profile</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CreateClientForm({ onCreated, onCancel }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.target);
    const body = Object.fromEntries(fd);
    const res = await fetch("/api/clients", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error || "Failed to create client"); return; }
    onCreated(data.client, data.password);
  }

  return (
    <div className="card max-w-2xl p-6 sm:p-8">
      <h3 className="mb-6 font-semibold text-navy-800">Create client profile</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Client company name</label>
          <input name="name" required className="input" placeholder="Enter company name" />
        </div>
        <div>
          <label className="label">Companies House number</label>
          <input name="companyNumber" className="input" placeholder="Enter registration number" />
        </div>
        <div>
          <label className="label">Company address</label>
          <input name="address" className="input" placeholder="Street, town / city, postcode" />
        </div>
        <div>
          <label className="label">Contact email / login email</label>
          <input name="email" type="email" required className="input" placeholder="name@company.com" />
        </div>
        <div>
          <label className="label">Phone number</label>
          <input name="phone" className="input" placeholder="Enter phone number" />
        </div>
        <div>
          <label className="label">Password</label>
          <input name="password" className="input" placeholder="Leave blank to auto-generate" />
          <p className="mt-1 text-xs text-navy-400">If left blank, a secure password will be generated and shown to you.</p>
        </div>
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary">{loading ? "Saving…" : "Save profile"}</button>
        </div>
      </form>
    </div>
  );
}

function InvitationPreview({ client, onBack }) {
  return (
    <div className="card max-w-2xl p-6 sm:p-8">
      <h3 className="mb-4 font-semibold text-navy-800">Login invitation preview</h3>
      <div className="rounded-lg border border-navy-100 bg-navy-50/40 p-4 text-sm text-navy-700">
        <div><span className="font-semibold">To:</span> {client.email}</div>
        <div><span className="font-semibold">Company:</span> {client.name}</div>
        <p className="mt-3">Welcome to the Horizon Lida Green delivery portal.</p>
        <div className="mt-3">
          <span className="font-semibold">Login email:</span> {client.email}
        </div>
        {client.password && (
          <div className="mt-2 rounded bg-white p-2 font-mono text-xs text-navy-800">
            Temporary password: {client.password}
          </div>
        )}
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <button onClick={onBack} className="btn-secondary">Back</button>
        <button onClick={() => alert("Invitation sent (demo).")} className="btn-primary">Send login invitation</button>
      </div>
    </div>
  );
}
