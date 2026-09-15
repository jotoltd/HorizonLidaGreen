"use client";

import { useState } from "react";

const STATUSES = ["BOOKED", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED", "ON_HOLD", "CANCELLED"];

const statusStyles = {
  BOOKED: "bg-navy-100 text-navy-700",
  IN_TRANSIT: "bg-blue-100 text-blue-700",
  OUT_FOR_DELIVERY: "bg-amber-100 text-amber-700",
  DELIVERED: "bg-green-100 text-green-700",
  ON_HOLD: "bg-orange-100 text-orange-700",
  CANCELLED: "bg-red-100 text-red-700",
};

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—");

export default function AdminDashboard({ clients, shipments, stats }) {
  const [tab, setTab] = useState("overview");
  const [showClient, setShowClient] = useState(false);
  const [showShipment, setShowShipment] = useState(false);
  const [clientList, setClientList] = useState(clients);
  const [shipmentList, setShipmentList] = useState(shipments);
  const [search, setSearch] = useState("");

  const filteredShipments = shipmentList.filter((s) => {
    const q = search.toLowerCase();
    return !q || s.trackingNumber.toLowerCase().includes(q) || s.origin.toLowerCase().includes(q) ||
      s.destination.toLowerCase().includes(q) || s.client?.name.toLowerCase().includes(q);
  });

  return (
    <div>
      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Clients" value={stats.totalClients} accent="navy" />
        <StatCard label="Total Shipments" value={stats.totalShipments} accent="teal" />
        <StatCard label="In Transit" value={stats.inTransit} accent="blue" />
        <StatCard label="Delivered" value={stats.delivered} accent="green" />
      </div>

      {/* Tabs */}
      <div className="mb-5 flex gap-1 border-b border-navy-100">
        {["overview", "shipments", "clients"].map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-semibold capitalize transition ${
              tab === t ? "border-teal-500 text-teal-600" : "border-transparent text-navy-400 hover:text-navy-600"}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="card lg:col-span-2">
            <div className="flex items-center justify-between border-b border-navy-100 px-5 py-4">
              <h3 className="font-semibold text-navy-800">Recent Shipments</h3>
              <button onClick={() => setTab("shipments")} className="text-sm font-medium text-teal-600 hover:text-teal-700">View all →</button>
            </div>
            <div className="divide-y divide-navy-50">
              {shipmentList.slice(0, 6).map((s) => (
                <div key={s.id} className="flex items-center justify-between px-5 py-3.5">
                  <div>
                    <div className="font-mono text-sm font-semibold text-navy-800">{s.trackingNumber}</div>
                    <div className="text-xs text-navy-400">{s.origin} → {s.destination} · {s.client?.name}</div>
                  </div>
                  <span className={`badge ${statusStyles[s.status]}`}>{s.status.replace(/_/g, " ")}</span>
                </div>
              ))}
              {shipmentList.length === 0 && <p className="px-5 py-8 text-center text-sm text-navy-300">No shipments yet.</p>}
            </div>
          </div>
          <div className="card">
            <div className="border-b border-navy-100 px-5 py-4">
              <h3 className="font-semibold text-navy-800">Quick Actions</h3>
            </div>
            <div className="space-y-3 p-5">
              <button onClick={() => setShowClient(true)} className="btn-primary w-full justify-start">+ Create New Client</button>
              <button onClick={() => setShowShipment(true)} className="btn-secondary w-full justify-start">+ Create New Shipment</button>
            </div>
          </div>
        </div>
      )}

      {tab === "shipments" && (
        <div className="card">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-navy-100 px-5 py-4">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tracking, route, client…" className="input max-w-xs" />
            <button onClick={() => setShowShipment(true)} className="btn-primary">+ New Shipment</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-navy-100 text-left text-xs uppercase tracking-wide text-navy-400">
                  <th className="px-5 py-3 font-semibold">Tracking #</th>
                  <th className="px-5 py-3 font-semibold">Client</th>
                  <th className="px-5 py-3 font-semibold">Route</th>
                  <th className="px-5 py-3 font-semibold">ETA</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-50">
                {filteredShipments.map((s) => (
                  <ShipmentRow key={s.id} shipment={s} onUpdate={(updated) =>
                    setShipmentList((l) => l.map((x) => (x.id === updated.id ? updated : x)))} />
                ))}
                {filteredShipments.length === 0 && (
                  <tr><td colSpan={6} className="px-5 py-10 text-center text-navy-300">No shipments found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "clients" && (
        <div className="card">
          <div className="flex items-center justify-between border-b border-navy-100 px-5 py-4">
            <h3 className="font-semibold text-navy-800">Clients ({clientList.length})</h3>
            <button onClick={() => setShowClient(true)} className="btn-primary">+ New Client</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-navy-100 text-left text-xs uppercase tracking-wide text-navy-400">
                  <th className="px-5 py-3 font-semibold">Name</th>
                  <th className="px-5 py-3 font-semibold">Email</th>
                  <th className="px-5 py-3 font-semibold">Company</th>
                  <th className="px-5 py-3 font-semibold">Shipments</th>
                  <th className="px-5 py-3 font-semibold">Joined</th>
                  <th className="px-5 py-3 font-semibold"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-50">
                {clientList.map((c) => (
                  <tr key={c.id} className="hover:bg-navy-50/50">
                    <td className="px-5 py-3 font-medium text-navy-800">{c.name}</td>
                    <td className="px-5 py-3 text-navy-500">{c.email}</td>
                    <td className="px-5 py-3 text-navy-500">{c.company || "—"}</td>
                    <td className="px-5 py-3"><span className="badge bg-teal-50 text-teal-700">{c._count?.shipments ?? 0}</span></td>
                    <td className="px-5 py-3 text-navy-400">{fmtDate(c.createdAt)}</td>
                    <td className="px-5 py-3 text-right">
                      <button onClick={async () => { if (confirm(`Delete client ${c.name}? This removes their login.`)) {
                        await fetch(`/api/clients/${c.id}`, { method: "DELETE" });
                        setClientList((l) => l.filter((x) => x.id !== c.id));
                      }}} className="text-xs font-medium text-red-500 hover:text-red-700">Delete</button>
                    </td>
                  </tr>
                ))}
                {clientList.length === 0 && (
                  <tr><td colSpan={6} className="px-5 py-10 text-center text-navy-300">No clients yet. Create your first client.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showClient && <ClientModal onClose={() => setShowClient(false)} onCreated={(c, pwd) => {
        setClientList((l) => [{ ...c, _count: { shipments: 0 }, createdAt: new Date().toISOString() }, ...l]);
        setShowClient(false);
        alert(`Client created!\nLogin email: ${c.email}\nPassword: ${pwd}\n\nShare these credentials with your client.`);
      }} />}
      {showShipment && <ShipmentModal clients={clientList} onClose={() => setShowShipment(false)} onCreated={(s) => {
        setShipmentList((l) => [s, ...l]);
        setShowShipment(false);
      }} />}
    </div>
  );
}

function StatCard({ label, value, accent }) {
  const colors = { navy: "from-navy-700 to-navy-900", teal: "from-teal-500 to-teal-700", blue: "from-blue-500 to-blue-700", green: "from-green-500 to-green-700" };
  return (
    <div className={`rounded-xl bg-gradient-to-br ${colors[accent]} p-5 text-white shadow-sm`}>
      <div className="text-3xl font-bold">{value}</div>
      <div className="mt-1 text-sm text-white/80">{label}</div>
    </div>
  );
}

function ShipmentRow({ shipment, onUpdate }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <tr className="hover:bg-navy-50/50">
        <td className="px-5 py-3 font-mono text-xs font-semibold text-navy-800">{shipment.trackingNumber}</td>
        <td className="px-5 py-3 text-navy-600">{shipment.client?.name}</td>
        <td className="px-5 py-3 text-navy-500">{shipment.origin} → {shipment.destination}</td>
        <td className="px-5 py-3 text-navy-400">{fmtDate(shipment.eta)}</td>
        <td className="px-5 py-3"><span className={`badge ${statusStyles[shipment.status]}`}>{shipment.status.replace(/_/g, " ")}</span></td>
        <td className="px-5 py-3 text-right">
          <button onClick={() => setOpen(!open)} className="text-xs font-medium text-teal-600 hover:text-teal-700">{open ? "Close" : "Update"}</button>
        </td>
      </tr>
      {open && (
        <tr className="bg-navy-50/40">
          <td colSpan={6} className="px-5 py-4">
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="label text-xs">Status</label>
                <select id={`st-${shipment.id}`} defaultValue={shipment.status} className="input !py-2">
                  {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
                </select>
              </div>
              <div>
                <label className="label text-xs">Location (optional)</label>
                <input id={`loc-${shipment.id}`} className="input !py-2" placeholder="e.g. Port of Shanghai" />
              </div>
              <button onClick={async () => {
                const status = document.getElementById(`st-${shipment.id}`).value;
                const location = document.getElementById(`loc-${shipment.id}`).value;
                const res = await fetch(`/api/shipments/${shipment.id}`, {
                  method: "PATCH", headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ status, currentStatus: shipment.status, location }),
                });
                const data = await res.json();
                if (res.ok) onUpdate(data.shipment);
              }} className="btn-primary">Save</button>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function ClientModal({ onClose, onCreated }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  return (
    <Modal title="Create New Client" onClose={onClose}>
      <form onSubmit={async (e) => {
        e.preventDefault(); setLoading(true); setError("");
        const fd = new FormData(e.target);
        const body = Object.fromEntries(fd);
        const res = await fetch("/api/clients", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        const data = await res.json();
        setLoading(false);
        if (!res.ok) { setError(data.error || "Failed to create client"); return; }
        onCreated(data.client, data.password);
      }}>
        <div className="space-y-4">
          <div><label className="label">Full Name *</label><input name="name" required className="input" /></div>
          <div><label className="label">Email Address *</label><input name="email" type="email" required className="input" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Company</label><input name="company" className="input" /></div>
            <div><label className="label">Phone</label><input name="phone" className="input" /></div>
          </div>
          <div><label className="label">Password</label><input name="password" className="input" placeholder="Leave blank to auto-generate" />
            <p className="mt-1 text-xs text-navy-400">If left blank, a secure password will be generated and shown to you.</p>
          </div>
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary">{loading ? "Creating…" : "Create Client"}</button>
        </div>
      </form>
    </Modal>
  );
}

function ShipmentModal({ clients, onClose, onCreated }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  return (
    <Modal title="Create New Shipment" onClose={onClose}>
      <form onSubmit={async (e) => {
        e.preventDefault(); setLoading(true); setError("");
        const fd = new FormData(e.target);
        const body = Object.fromEntries(fd);
        const res = await fetch("/api/shipments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        const data = await res.json();
        setLoading(false);
        if (!res.ok) { setError(data.error || "Failed to create shipment"); return; }
        onCreated(data.shipment);
      }}>
        <div className="space-y-4">
          <div>
            <label className="label">Client *</label>
            <select name="clientId" required className="input">
              <option value="">Select a client…</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name} — {c.email}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Origin *</label><input name="origin" required className="input" placeholder="Shanghai, CN" /></div>
            <div><label className="label">Destination *</label><input name="destination" required className="input" placeholder="Rotterdam, NL" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Carrier</label><input name="carrier" className="input" placeholder="Maersk" /></div>
            <div><label className="label">Service</label><input name="service" className="input" placeholder="FCL / LCL / Air" /></div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div><label className="label">Pieces</label><input name="pieces" type="number" min="0" defaultValue="0" className="input" /></div>
            <div><label className="label">Weight</label><input name="weight" className="input" placeholder="1200 kg" /></div>
            <div><label className="label">ETA</label><input name="eta" type="date" className="input" /></div>
          </div>
          <div><label className="label">Notes</label><textarea name="notes" rows={2} className="input" /></div>
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary">{loading ? "Creating…" : "Create Shipment"}</button>
        </div>
      </form>
    </Modal>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-navy-100 px-6 py-4">
          <h3 className="text-lg font-bold text-navy-800">{title}</h3>
          <button onClick={onClose} className="text-navy-400 hover:text-navy-700">✕</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
