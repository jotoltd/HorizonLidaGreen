import { requireAdmin, Shell } from "@/lib/shell";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import ClientsPage from "./ClientsPage";

export const dynamic = "force-dynamic";

export default async function AdminClientsPage({ searchParams }) {
  const user = await requireAdmin();

  const [{ data: clients }, { data: shipments }] = await Promise.all([
    supabase
      .from("User")
      .select("id, name, email, company, phone, role, createdAt")
      .order("createdAt", { ascending: false }),
    supabase.from("Shipment").select("clientId, status"),
  ]);

  const stats = {};
  (shipments || []).forEach((s) => {
    if (!stats[s.clientId]) stats[s.clientId] = { current: 0, past: 0 };
    if (s.status === "DELIVERED" || s.status === "CANCELLED") stats[s.clientId].past += 1;
    else stats[s.clientId].current += 1;
  });

  return (
    <Shell
      user={user}
      title="Clients"
      eyebrow="ADMINISTRATOR"
      subtitle="Company profiles and delivery activity."
      currentHref="/admin/clients"
      actions={
        <div style={{ display: "flex", gap: 12 }}>
          <Link href="/admin/clients?new=admin" className="btn-pill btn-pill-outline">+ Create administrator</Link>
          <Link href="/admin/clients?new=1" className="btn-pill btn-pill-primary">+ Create client profile</Link>
        </div>
      }
    >
      <ClientsPage
        clients={JSON.parse(JSON.stringify(clients || []))}
        stats={stats}
        startNew={searchParams?.new === "admin" ? "admin" : searchParams?.new === "1" ? "client" : ""}
      />
    </Shell>
  );
}
