"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CreateClientForm, InvitationPreview } from "../clients/ClientsPage";

export default function TeamPage({ admins: initial, startNew = false }) {
  const [admins, setAdmins] = useState(initial);
  const [showForm, setShowForm] = useState(startNew);
  const [invite, setInvite] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  useEffect(() => { setShowForm(startNew); }, [startNew]);

  if (showForm) {
    return (
      <CreateClientForm
        role="ADMIN"
        onCreated={(a, pwd) => {
          setAdmins([a, ...admins]);
          setShowForm(false);
          router.replace("/admin/team");
          setInvite({ ...a, password: pwd });
        }}
        onCancel={() => { setShowForm(false); router.replace("/admin/team"); }}
      />
    );
  }

  async function deleteAdmin(admin) {
    if (!window.confirm(`Delete administrator ${admin.name}?`)) return;
    setDeleting(true);
    const res = await fetch(`/api/clients/${admin.id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    setDeleting(false);
    if (!res.ok) { alert(data.error || "Failed to delete administrator"); return; }
    setAdmins((current) => current.filter((a) => a.id !== admin.id));
    setInvite(null);
    router.refresh();
  }

  if (invite) {
    return <InvitationPreview client={invite} deleting={deleting} onDelete={() => deleteAdmin(invite)} onBack={() => setInvite(null)} />;
  }

  return (
    <div>
      <div className="panel">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Joined</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {admins.map((a) => (
                <tr key={a.id}>
                  <td><strong>{a.name}</strong></td>
                  <td><small>{a.email}</small></td>
                  <td>{a.phone || "—"}</td>
                  <td>{a.createdAt ? new Date(a.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"}</td>
                  <td>
                    <button onClick={() => setInvite({ ...a })} className="btn-pill btn-pill-outline btn-pill-sm">
                      View profile
                    </button>
                  </td>
                </tr>
              ))}
              {admins.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", color: "#8a9781" }}>No administrators found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="help-strip">
        Administrators have full access to deliveries, bookings, clients and team management.
      </div>
    </div>
  );
}
