"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const SearchIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

export default function ClientsPage({ clients: initial, stats = {}, startNew = "" }) {
  const [clients, setClients] = useState(initial);
  const [formMode, setFormMode] = useState(startNew === "admin" ? "admin" : startNew ? "client" : "");
  const [invite, setInvite] = useState(null);
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  useEffect(() => { setFormMode(startNew === "admin" ? "admin" : startNew ? "client" : ""); }, [startNew]);

  if (formMode) {
    return (
      <CreateClientForm
        role={formMode === "admin" ? "ADMIN" : "CLIENT"}
        onCreated={(c, pwd) => {
          setClients([c, ...clients]);
          setFormMode("");
          router.replace("/admin/clients");
          setInvite({ ...c, password: pwd });
        }}
        onCancel={() => { setFormMode(""); router.replace("/admin/clients"); }}
      />
    );
  }

  async function deleteClient(client) {
    if (!window.confirm(`Delete ${client.company || client.name}? This will also delete all of their deliveries and bookings.`)) return;
    setDeleting(true);
    const res = await fetch(`/api/clients/${client.id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    setDeleting(false);
    if (!res.ok) { alert(data.error || "Failed to delete client"); return; }
    setClients((current) => current.filter((c) => c.id !== client.id));
    setInvite(null);
    router.refresh();
  }

  if (invite) {
    return <InvitationPreview client={invite} deleting={deleting} onDelete={() => deleteClient(invite)} onBack={() => setInvite(null)} />;
  }

  const q = search.toLowerCase();
  const filtered = clients.filter(
    (c) => (c.role || "CLIENT") !== "ADMIN" &&
      (!q || c.name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q) || c.company?.toLowerCase().includes(q))
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
                    <small>{c.company && c.name !== c.company ? `${c.name} · ` : ""}{c.email}</small>
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

export function CreateClientForm({ role = "CLIENT", onCreated, onCancel }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const isAdmin = role === "ADMIN";

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.target);
    const body = { ...Object.fromEntries(fd), role };
    const res = await fetch("/api/clients", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error || "Failed to create account"); return; }
    onCreated(data.client, data.password);
  }

  return (
    <div>
      <button onClick={onCancel} className="back-link">← Back to clients</button>
      <div className="panel">
        <div className="section-heading">
          <h2>{isAdmin ? "Create administrator" : "Create client profile"}</h2>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <label className="field">
              <span>{isAdmin ? "Full name" : "Client name"}</span>
              <input name="name" required placeholder={isAdmin ? "Enter full name" : "Enter contact name"} />
            </label>
            {!isAdmin && (
              <>
                <label className="field"><span>Company name</span><input name="company" required placeholder="Enter company name" /></label>
                <label className="field"><span>Companies House number</span><input name="companyNumber" placeholder="Enter registration number" /></label>
                <label className="field wide"><span>Company address</span><input name="address" placeholder="Street, town / city, postcode" /></label>
              </>
            )}
            <label className="field"><span>{isAdmin ? "Login email" : "Contact email / login email"}</span><input name="email" type="email" required placeholder="name@company.com" /></label>
            <label className="field"><span>Phone number</span><input name="phone" placeholder="Enter phone number" /></label>
            <label className="field">
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

export function InvitationPreview({ client, deleting, onDelete, onBack }) {
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState(null);
  const [profile, setProfile] = useState(client);
  const [password, setPassword] = useState(client.password || null);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    fetch(`/api/clients/${client.id}`)
      .then((r) => r.json())
      .then((d) => { if (d.client) setProfile((p) => ({ ...p, ...d.client })); })
      .catch(() => {});
  }, [client.id]);

  async function sendInvitation() {
    setSending(true);
    setSendResult(null);
    const res = await fetch(`/api/clients/${client.id}/invite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(password ? { password } : {}),
    });
    const data = await res.json().catch(() => ({}));
    setSending(false);
    if (res.ok && data.password) setPassword(data.password);
    setSendResult(res.ok ? { ok: true } : { ok: false, error: data.error || "Failed to send invitation" });
  }

  async function resetPassword() {
    if (!window.confirm(`Reset the password for ${profile.email}? They will need the new password to sign in.`)) return;
    setResetting(true);
    const res = await fetch(`/api/clients/${client.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resetPassword: true }),
    });
    const data = await res.json().catch(() => ({}));
    setResetting(false);
    if (res.ok && data.password) { setPassword(data.password); setSendResult(null); }
    else alert(data.error || "Failed to reset password");
  }

  return (
    <div>
      <button onClick={onBack} className="back-link">← Back to clients</button>
      <div className="panel">
        <div className="section-heading">
          <h2>Account profile</h2>
          <span className="badge">{profile.role === "ADMIN" ? "Administrator" : "Client"}</span>
        </div>
        <div className="invitation-text">
          <p>
            <strong>Client name:</strong> {profile.name}
            <br />
            <strong>Company name:</strong> {profile.company || "—"}
            {(profile.companyNumber) && <><br /><strong>Companies House:</strong> {profile.companyNumber}</>}
            <br />
            <strong>Company address:</strong> {profile.address || "—"}
            <br />
            <strong>Phone:</strong> {profile.phone || "—"}
            <br />
            <strong>Email:</strong> {profile.email}
            <br />
            <strong>Username:</strong> {profile.email}
            <br />
            <strong>Password:</strong>{" "}
            {password ? <code>{password}</code> : <span style={{ color: "#8a9781" }}>Hidden — use Reset password to set a new one</span>}
          </p>
        </div>
        <div className="form-footer">
          <p>Share these credentials with your client securely.</p>
          {sendResult && (
            <p style={{ color: sendResult.ok ? "#375737" : "#b44444", marginBottom: 12 }}>
              {sendResult.ok ? `Invitation emailed to ${profile.email}.` : sendResult.error}
            </p>
          )}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button onClick={onDelete} disabled={deleting} className="btn-pill btn-pill-outline" style={{ color: "#b44444", borderColor: "#e0c4c4" }}>{deleting ? "Deleting…" : "Delete profile"}</button>
            <button onClick={resetPassword} disabled={resetting} className="btn-pill btn-pill-outline">{resetting ? "Resetting…" : "Reset password"}</button>
            <button onClick={onBack} className="btn-pill btn-pill-outline">Back</button>
            <button onClick={sendInvitation} disabled={sending} className="btn-pill btn-pill-primary">{sending ? "Sending…" : "Send login invitation"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
