"use client";

import { useState } from "react";
import { isOverdue } from "@/lib/ShipmentResult";

const STATUSES = ["BOOKED", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED", "ON_HOLD", "CANCELLED"];
const PAGE_SIZE = 10;

const statusStyles = {
  BOOKED: "bg-navy-100 text-navy-700",
  IN_TRANSIT: "bg-blue-100 text-blue-700",
  OUT_FOR_DELIVERY: "bg-amber-100 text-amber-700",
  DELIVERED: "bg-green-100 text-green-700",
  ON_HOLD: "bg-orange-100 text-orange-700",
  CANCELLED: "bg-red-100 text-red-700",
};

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—");
const toDateInput = (d) => (d ? new Date(d).toISOString().split("T")[0] : "");

export default function AdminDashboard({ clients, shipments, stats }) {
  const [tab, setTab] = useState("overview");
  const [showClient, setShowClient] = useState(false);
  const [showShipment, setShowShipment] = useState(false);
  const [editShipment, setEditShipment] = useState(null);
  const [editClient, setEditClient] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [cloneShipment, setCloneShipment] = useState(null);
  const [clientList, setClientList] = useState(clients);
  const [shipmentList, setShipmentList] = useState(shipments);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkStatus, setBulkStatus] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [shipmentPage, setShipmentPage] = useState(1);
  const [clientPage, setClientPage] = useState(1);

  const filteredShipments = shipmentList.filter((s) => {
    const q = search.toLowerCase();
    return !q || s.trackingNumber.toLowerCase().includes(q) || s.origin.toLowerCase().includes(q) ||
      s.destination.toLowerCase().includes(q) || s.client?.name.toLowerCase().includes(q);
  });

  const pagedShipments = filteredShipments.slice((shipmentPage - 1) * PAGE_SIZE, shipmentPage * PAGE_SIZE);
  const totalShipmentPages = Math.max(1, Math.ceil(filteredShipments.length / PAGE_SIZE));

  const pagedClients = clientList.slice((clientPage - 1) * PAGE_SIZE, clientPage * PAGE_SIZE);
  const totalClientPages = Math.max(1, Math.ceil(clientList.length / PAGE_SIZE));

  function toggleSelect(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAllOnPage() {
    const pageIds = pagedShipments.map((s) => s.id);
    const allSelected = pageIds.every((id) => selectedIds.has(id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) pageIds.forEach((id) => next.delete(id));
      else pageIds.forEach((id) => next.add(id));
      return next;
    });
  }

  async function applyBulkStatus() {
    if (!bulkStatus || selectedIds.size === 0) return;
    setBulkLoading(true);
    const ids = Array.from(selectedIds);
    await Promise.all(ids.map((id) => {
      const shipment = shipmentList.find((s) => s.id === id);
      return fetch(`/api/shipments/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: bulkStatus, currentStatus: shipment?.status }),
      }).then((r) => r.json()).then((data) => {
        if (data.shipment) setShipmentList((l) => l.map((x) => (x.id === data.shipment.id ? data.shipment : x)));
      });
    }));
    setBulkLoading(false);
    setSelectedIds(new Set());
    setBulkStatus("");
  }

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
              <button onClick={() => setShowPassword(true)} className="btn-secondary w-full justify-start">Change My Password</button>
            </div>
          </div>
        </div>
      )}

      {tab === "shipments" && (
        <div className="card">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-navy-100 px-5 py-4">
            <input value={search} onChange={(e) => { setSearch(e.target.value); setShipmentPage(1); }} placeholder="Search tracking, route, client…" className="input max-w-xs" />
            <button onClick={() => setShowShipment(true)} className="btn-primary">+ New Shipment</button>
          </div>

          {selectedIds.size > 0 && (
            <div className="flex flex-wrap items-center gap-3 border-b border-teal-100 bg-teal-50 px-5 py-3">
              <span className="text-sm font-medium text-teal-800">{selectedIds.size} selected</span>
              <select value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value)} className="input !py-2 max-w-[180px]">
                <option value="">Set status…</option>
                {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
              </select>
              <button onClick={applyBulkStatus} disabled={!bulkStatus || bulkLoading} className="btn-primary !py-2">
                {bulkLoading ? "Updating…" : "Apply to selected"}
              </button>
              <button onClick={() => setSelectedIds(new Set())} className="text-sm text-navy-500 hover:text-navy-700">Clear</button>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-navy-100 text-left text-xs uppercase tracking-wide text-navy-400">
                  <th className="px-3 py-3 w-10">
                    <input type="checkbox" checked={pagedShipments.length > 0 && pagedShipments.every((s) => selectedIds.has(s.id))} onChange={toggleSelectAllOnPage} className="h-4 w-4 rounded border-navy-300 text-teal-500 focus:ring-teal-400" />
                  </th>
                  <th className="px-5 py-3 font-semibold">Tracking #</th>
                  <th className="px-5 py-3 font-semibold">Client</th>
                  <th className="px-5 py-3 font-semibold">Route</th>
                  <th className="px-5 py-3 font-semibold">ETA</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-50">
                {pagedShipments.map((s) => (
                  <ShipmentRow key={s.id} shipment={s} selected={selectedIds.has(s.id)} onToggleSelect={() => toggleSelect(s.id)}
                    onEdit={() => setEditShipment(s)} onClone={() => setCloneShipment(s)}
                    onDelete={async () => { if (confirm(`Delete shipment ${s.trackingNumber}? This removes it and all its tracking events.`)) {
                      await fetch(`/api/shipments/${s.id}`, { method: "DELETE" });
                      setShipmentList((l) => l.filter((x) => x.id !== s.id));
                      setSelectedIds((prev) => { const next = new Set(prev); next.delete(s.id); return next; });
                    }}}
                    onUpdate={(updated) => setShipmentList((l) => l.map((x) => (x.id === updated.id ? updated : x)))} />
                ))}
                {filteredShipments.length === 0 && (
                  <tr><td colSpan={7} className="px-5 py-10 text-center text-navy-300">No shipments found.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {totalShipmentPages > 1 && (
            <div className="flex items-center justify-between border-t border-navy-100 px-5 py-3 text-sm">
              <span className="text-navy-400">
                {filteredShipments.length} shipment{filteredShipments.length !== 1 ? "s" : ""} · Page {shipmentPage} of {totalShipmentPages}
              </span>
              <div className="flex gap-2">
                <button onClick={() => setShipmentPage((p) => Math.max(1, p - 1))} disabled={shipmentPage === 1} className="btn-secondary !py-2 !px-3 disabled:opacity-40">← Prev</button>
                <button onClick={() => setShipmentPage((p) => Math.min(totalShipmentPages, p + 1))} disabled={shipmentPage === totalShipmentPages} className="btn-secondary !py-2 !px-3 disabled:opacity-40">Next →</button>
              </div>
            </div>
          )}
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
                  <th className="px-5 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-50">
                {pagedClients.map((c) => (
                  <tr key={c.id} className="hover:bg-navy-50/50">
                    <td className="px-5 py-3 font-medium text-navy-800">{c.name}</td>
                    <td className="px-5 py-3 text-navy-500">{c.email}</td>
                    <td className="px-5 py-3 text-navy-500">{c.company || "—"}</td>
                    <td className="px-5 py-3"><span className="badge bg-teal-50 text-teal-700">{c._count?.shipments ?? 0}</span></td>
                    <td className="px-5 py-3 text-navy-400">{fmtDate(c.createdAt)}</td>
                    <td className="px-5 py-3 text-right whitespace-nowrap">
                      <button onClick={() => setEditClient(c)} className="text-xs font-medium text-teal-600 hover:text-teal-700 mr-3">Edit</button>
                      <button onClick={async () => { if (confirm(`Delete client ${c.name}? This removes their login and all their shipments.`)) {
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

          {totalClientPages > 1 && (
            <div className="flex items-center justify-between border-t border-navy-100 px-5 py-3 text-sm">
              <span className="text-navy-400">
                {clientList.length} client{clientList.length !== 1 ? "s" : ""} · Page {clientPage} of {totalClientPages}
              </span>
              <div className="flex gap-2">
                <button onClick={() => setClientPage((p) => Math.max(1, p - 1))} disabled={clientPage === 1} className="btn-secondary !py-2 !px-3 disabled:opacity-40">← Prev</button>
                <button onClick={() => setClientPage((p) => Math.min(totalClientPages, p + 1))} disabled={clientPage === totalClientPages} className="btn-secondary !py-2 !px-3 disabled:opacity-40">Next →</button>
              </div>
            </div>
          )}
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
      {cloneShipment && <ShipmentModal clients={clientList} defaults={cloneShipment} title="Clone Shipment" onClose={() => setCloneShipment(null)} onCreated={(s) => {
        setShipmentList((l) => [s, ...l]);
        setCloneShipment(null);
      }} />}
      {editShipment && <EditShipmentModal shipment={editShipment} clients={clientList} onClose={() => setEditShipment(null)} onSaved={(updated) => {
        setShipmentList((l) => l.map((x) => (x.id === updated.id ? updated : x)));
        setEditShipment(null);
      }} />}
      {editClient && <EditClientModal client={editClient} onClose={() => setEditClient(null)} onSaved={(updated) => {
        setClientList((l) => l.map((x) => (x.id === updated.id ? { ...x, ...updated } : x)));
        setEditClient(null);
      }} />}
      {showPassword && <ChangePasswordModal onClose={() => setShowPassword(false)} />}
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

function ShipmentRow({ shipment, selected, onToggleSelect, onEdit, onClone, onDelete, onUpdate }) {
  const [open, setOpen] = useState(false);
  const overdue = isOverdue(shipment);
  return (
    <>
      <tr className="hover:bg-navy-50/50">
        <td className="px-3 py-3">
          <input type="checkbox" checked={selected || false} onChange={onToggleSelect} className="h-4 w-4 rounded border-navy-300 text-teal-500 focus:ring-teal-400" />
        </td>
        <td className="px-5 py-3 font-mono text-xs font-semibold text-navy-800">{shipment.trackingNumber}</td>
        <td className="px-5 py-3 text-navy-600">{shipment.client?.name}</td>
        <td className="px-5 py-3 text-navy-500">{shipment.origin} → {shipment.destination}</td>
        <td className="px-5 py-3">
          <div className="text-navy-400">{fmtDate(shipment.eta)}</div>
          {overdue && <span className="badge mt-0.5 bg-red-50 text-red-600">Overdue</span>}
        </td>
        <td className="px-5 py-3"><span className={`badge ${statusStyles[shipment.status]}`}>{shipment.status.replace(/_/g, " ")}</span></td>
        <td className="px-5 py-3 text-right whitespace-nowrap">
          <button onClick={() => setOpen(!open)} className="text-xs font-medium text-navy-500 hover:text-navy-700 mr-3">{open ? "Close" : "Status"}</button>
          <button onClick={onEdit} className="text-xs font-medium text-teal-600 hover:text-teal-700 mr-3">Edit</button>
          <button onClick={onClone} className="text-xs font-medium text-navy-500 hover:text-navy-700 mr-3">Clone</button>
          <button onClick={onDelete} className="text-xs font-medium text-red-500 hover:text-red-700">Delete</button>
        </td>
      </tr>
      {open && (
        <tr className="bg-navy-50/40">
          <td colSpan={7} className="px-5 py-4">
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
              }} className="btn-primary">Save Status</button>
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

function ShipmentModal({ clients, onClose, onCreated, defaults, title }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  return (
    <Modal title={title || "Create New Shipment"} onClose={onClose}>
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
        <ShipmentFields clients={clients} defaults={defaults} />
        {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary">{loading ? "Creating…" : "Create Shipment"}</button>
        </div>
      </form>
    </Modal>
  );
}

function EditShipmentModal({ shipment, clients, onClose, onSaved }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  return (
    <Modal title={`Edit Shipment — ${shipment.trackingNumber}`} onClose={onClose}>
      <form onSubmit={async (e) => {
        e.preventDefault(); setLoading(true); setError("");
        const fd = new FormData(e.target);
        const body = Object.fromEntries(fd);
        const res = await fetch(`/api/shipments/${shipment.id}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        setLoading(false);
        if (!res.ok) { setError(data.error || "Failed to update shipment"); return; }
        onSaved(data.shipment);
      }}>
        <ShipmentFields clients={clients} defaults={shipment} />
        {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary">{loading ? "Saving…" : "Save Changes"}</button>
        </div>
      </form>
    </Modal>
  );
}

function ShipmentFields({ clients, defaults }) {
  const d = defaults || {};
  return (
    <div className="space-y-4">
      <div>
        <label className="label">Client *</label>
        <select name="clientId" required defaultValue={d.clientId || ""} className="input">
          <option value="">Select a client…</option>
          {clients.map((c) => <option key={c.id} value={c.id}>{c.name} — {c.email}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="label">Origin *</label><input name="origin" required defaultValue={d.origin || ""} className="input" placeholder="Shanghai, CN" /></div>
        <div><label className="label">Destination *</label><input name="destination" required defaultValue={d.destination || ""} className="input" placeholder="Rotterdam, NL" /></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="label">Carrier</label><input name="carrier" defaultValue={d.carrier || ""} className="input" placeholder="Maersk" /></div>
        <div><label className="label">Service</label><input name="service" defaultValue={d.service || ""} className="input" placeholder="FCL / LCL / Air" /></div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div><label className="label">Pieces</label><input name="pieces" type="number" min="0" defaultValue={d.pieces ?? 0} className="input" /></div>
        <div><label className="label">Weight</label><input name="weight" defaultValue={d.weight || ""} className="input" placeholder="1200 kg" /></div>
        <div><label className="label">ETA</label><input name="eta" type="date" defaultValue={toDateInput(d.eta)} className="input" /></div>
      </div>
      <div>
        <label className="label">Status</label>
        <select name="status" defaultValue={d.status || "BOOKED"} className="input">
          {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
        </select>
      </div>
      <div><label className="label">Notes</label><textarea name="notes" rows={2} defaultValue={d.notes || ""} className="input" /></div>
    </div>
  );
}

function EditClientModal({ client, onClose, onSaved }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetPwd, setResetPwd] = useState(false);
  const [newPwd, setNewPwd] = useState("");
  return (
    <Modal title={`Edit Client — ${client.name}`} onClose={onClose}>
      <form onSubmit={async (e) => {
        e.preventDefault(); setLoading(true); setError("");
        const fd = new FormData(e.target);
        const body = Object.fromEntries(fd);
        if (resetPwd && newPwd) body.password = newPwd;
        const res = await fetch(`/api/clients/${client.id}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        setLoading(false);
        if (!res.ok) { setError(data.error || "Failed to update client"); return; }
        onSaved(data.client);
      }}>
        <div className="space-y-4">
          <div><label className="label">Full Name *</label><input name="name" required defaultValue={client.name} className="input" /></div>
          <div><label className="label">Email Address *</label><input name="email" type="email" required defaultValue={client.email} className="input" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Company</label><input name="company" defaultValue={client.company || ""} className="input" /></div>
            <div><label className="label">Phone</label><input name="phone" defaultValue={client.phone || ""} className="input" /></div>
          </div>
          <div className="rounded-lg border border-navy-100 p-4">
            <label className="flex items-center gap-2 text-sm font-medium text-navy-700">
              <input type="checkbox" checked={resetPwd} onChange={(e) => setResetPwd(e.target.checked)} className="h-4 w-4 rounded border-navy-300 text-teal-500 focus:ring-teal-400" />
              Reset password
            </label>
            {resetPwd && (
              <div className="mt-3">
                <input value={newPwd} onChange={(e) => setNewPwd(e.target.value)} className="input" placeholder="Enter new password" />
                <p className="mt-1 text-xs text-navy-400">The client will need to use this new password to log in.</p>
              </div>
            )}
          </div>
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary">{loading ? "Saving…" : "Save Changes"}</button>
        </div>
      </form>
    </Modal>
  );
}

function ChangePasswordModal({ onClose }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  return (
    <Modal title="Change My Password" onClose={onClose}>
      {done ? (
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">✓</div>
          <p className="mt-3 font-semibold text-navy-800">Password updated</p>
          <p className="mt-1 text-sm text-navy-400">Use your new password next time you sign in.</p>
          <button onClick={onClose} className="btn-primary mt-6">Done</button>
        </div>
      ) : (
        <form onSubmit={async (e) => {
          e.preventDefault(); setLoading(true); setError("");
          const fd = new FormData(e.target);
          const res = await fetch("/api/auth/password", {
            method: "PATCH", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              currentPassword: fd.get("currentPassword"),
              newPassword: fd.get("newPassword"),
            }),
          });
          const data = await res.json();
          setLoading(false);
          if (!res.ok) { setError(data.error || "Failed to update password."); return; }
          setDone(true);
        }}>
          <div className="space-y-4">
            <div><label className="label">Current Password</label><input name="currentPassword" type="password" required autoComplete="current-password" className="input" placeholder="••••••" /></div>
            <div><label className="label">New Password</label><input name="newPassword" type="password" required minLength={6} autoComplete="new-password" className="input" placeholder="At least 6 characters" /></div>
            <div><label className="label">Confirm New Password</label><input name="confirm" type="password" required minLength={6} autoComplete="new-password" className="input" placeholder="Re-enter new password"
              onChange={(e) => { if (e.target.value && e.target.value !== e.target.form.newPassword.value) e.target.setCustomValidity("Passwords do not match"); else e.target.setCustomValidity(""); }} /></div>
            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary">{loading ? "Saving…" : "Update Password"}</button>
          </div>
        </form>
      )}
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
