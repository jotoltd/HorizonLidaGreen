import { requireAdmin, Shell } from "@/lib/shell";
import { supabase } from "@/lib/supabase";
import AdminDashboard from "./AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await requireAdmin();

  const [{ data: clients }, { data: shipments }, { data: allClients }, { data: allShipments }] = await Promise.all([
    supabase.from("User").select("id, name, email, company, phone, createdAt").eq("role", "CLIENT").order("createdAt", { ascending: false }),
    supabase.from("Shipment").select("*").order("createdAt", { ascending: false }),
    supabase.from("User").select("id").eq("role", "CLIENT"),
    supabase.from("Shipment").select("id, status"),
  ]);

  // Build client map for shipments
  const clientMap = {};
  (clients || []).forEach((c) => { clientMap[c.id] = c; });

  // Count shipments per client
  const countMap = {};
  (shipments || []).forEach((s) => { countMap[s.clientId] = (countMap[s.clientId] || 0) + 1; });

  const clientsWithCounts = (clients || []).map((c) => ({
    ...c,
    _count: { shipments: countMap[c.id] || 0 },
  }));

  const shipmentsWithClients = (shipments || []).map((s) => ({
    ...s,
    client: clientMap[s.clientId] || null,
  }));

  const stats = {
    totalClients: (allClients || []).length,
    totalShipments: (allShipments || []).length,
    inTransit: (allShipments || []).filter((s) => s.status === "IN_TRANSIT").length,
    delivered: (allShipments || []).filter((s) => s.status === "DELIVERED").length,
  };

  return (
    <Shell user={user} title="Admin Dashboard">
      <AdminDashboard
        clients={JSON.parse(JSON.stringify(clientsWithCounts))}
        shipments={JSON.parse(JSON.stringify(shipmentsWithClients))}
        stats={stats}
      />
    </Shell>
  );
}
