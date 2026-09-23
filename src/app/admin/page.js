import { requireAdmin, Shell } from "@/lib/shell";
import { supabase } from "@/lib/supabase";
import { readShipmentData } from "@/lib/storage";
import DeliveriesPage from "./DeliveriesPage";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await requireAdmin();

  const [{ data: clients }, { data: shipments }] = await Promise.all([
    supabase.from("User").select("id, name, email, company, phone, createdAt").eq("role", "CLIENT").order("createdAt", { ascending: false }),
    supabase.from("Shipment").select("*").order("createdAt", { ascending: false }),
  ]);

  const clientMap = {};
  (clients || []).forEach((c) => { clientMap[c.id] = c; });

  const shipmentIds = (shipments || []).map((s) => s.id);
  const dataByShipment = {};
  await Promise.all(
    shipmentIds.map(async (id) => {
      dataByShipment[id] = await readShipmentData(id);
    })
  );

  const shipmentsWithClients = (shipments || []).map((s) => ({
    ...s,
    client: clientMap[s.clientId] || null,
    documents: dataByShipment[s.id]?.documents || [],
    deliveryMeta: dataByShipment[s.id]?.delivery || null,
  }));

  const allShipments = shipments || [];
  const stats = {
    totalClients: (clients || []).length,
    totalShipments: allShipments.length,
    inTransit: allShipments.filter((s) => s.status === "IN_TRANSIT" || s.status === "OUT_FOR_DELIVERY").length,
    receiptConfirmed: allShipments.filter((s) => dataByShipment[s.id]?.delivery?.receipt).length,
  };

  return (
    <Shell user={user} title="Delivery administration" currentHref="/admin">
      <DeliveriesPage
        clients={JSON.parse(JSON.stringify(clients || []))}
        shipments={JSON.parse(JSON.stringify(shipmentsWithClients))}
        stats={stats}
      />
    </Shell>
  );
}
