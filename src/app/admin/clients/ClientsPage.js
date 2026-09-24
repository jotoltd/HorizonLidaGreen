"use client";

import { useState } from "react";

const SearchIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

export default function ClientsPage({ clients: initial, stats = {}, startNew = false }) {
  const [clients, setClients] = useState(initial);
  const [showForm, setShowForm] = useState(startNew);
  const [invite, setInvite] = useState(null);
  const [search, setSearch] = useState("");

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
    return <InvitationPreview client={invite} onBack={() => setInvite(null)} />;
  }

  const q = search.toLowerCase();
  const filtered = clients.filter(
    (c) => !q || c.name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q) || c.company?.toLowerCase().includes(q)
  );

  return (
    <div>
      <div className="panel">
        <div className="search client-search">
          {SearchIcon}
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search company or contact email" />
        </div>

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Company / contact</th>
                <th>Current</th>
                <th>Past</th>
                <th>Account</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id}>
                  <td>
                    <strong>{c.company || c.name}</strong>
                    <small>{c.email}</small>
                  </td>
                  <td>{stats[c.id]?.current || 0}</td>
                  <td>{stats[c.id]?.past || 0}</td>
                  <td>
                    <span className="badge">Active</span>
                  </td>
                  <td>
                    <button onClick={() => setInvite({ ...c })} className="btn-pill btn-pill-outline btn-pill-sm">
                      View profile
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", color: "#8a9781" }}>No clients found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="help-strip">
        Clients sign in with their email and the password you set or generate for them.
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
    <div>
      <button onClick={onCancel} className="back-link">← Back to clients</button>
      <div className="panel">
        <div className="section-heading">
          <h2>Create client profile</h2>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <label className="field"><span>Client company name</span><input name="name" required placeholder="Enter company name" /></label>
            <label className="field"><span>Companies House number</span><input name="companyNumber" placeholder="Enter registration number" /></label>
            <label className="field wide"><span>Company address</span><input name="address" placeholder="Street, town / city, postcode" /></label>
            <label className="field"><span>Contact email / login email</span><input name="email" type="email" required placeholder="name@company.com" /></label>
            <label className="field"><span>Phone number</span><input name="phone" placeholder="Enter phone number" /></label>
            <label className="field wide">
              <span>Password</span>
              <input name="password" placeholder="Leave blank to auto-generate" />
            </label>
          </div>
          {error && <p className="login-error" style={{ marginTop: 16 }}>{error}</p>}
          <div className="form-footer">
            <p>If left blank, a secure password is generated and shown once.</p>
            <div style={{ display: "flex", gap: 12 }}>
              <button type="button" onClick={onCancel} className="btn-pill btn-pill-outline">Cancel</button>
              <button type="submit" disabled={loading} className="btn-pill btn-pill-primary">{loading ? "Saving…" : "Save profile"}</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function InvitationPreview({ client, onBack }) {
  return (
    <div>
      <button onClick={onBack} className="back-link">← Back to clients</button>
      <div className="panel">
        <div className="section-heading">
          <h2>Login invitation preview</h2>
        </div>
        <div className="invitation-text">
          <p><strong>To:</strong> {client.email}<br /><strong>Company:</strong> {client.name}</p>
          <p>Welcome to the Horizon Lida Green delivery portal.</p>
          <p>
            <strong>Login email:</strong> {client.email}
            {client.password && (
              <>
                <br />
                <strong>Temporary password:</strong> <code>{client.password}</code>
              </>
            )}
          </p>
        </div>
        <div className="form-footer">
          <p>Share these credentials with your client securely.</p>
          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={onBack} className="btn-pill btn-pill-outline">Back</button>
            <button onClick={() => alert("Invitation sent (demo).")} className="btn-pill btn-pill-primary">Send login invitation</button>
          </div>
        </div>
      </div>
    </div>
  );
}
