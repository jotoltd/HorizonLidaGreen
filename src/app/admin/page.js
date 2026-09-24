import { requireAdmin, Shell } from "@/lib/shell";
import { supabase } from "@/lib/supabase";
import { readShipmentData } from "@/lib/storage";
import Link from "next/link";
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
    totalShipments: allShipments.length,
    atCollection: allShipments.filter((s) => s.status === "BOOKED").length,
    inTransit: allShipments.filter((s) => s.status === "IN_TRANSIT" || s.status === "OUT_FOR_DELIVERY").length,
    delivered: allShipments.filter((s) => s.status === "DELIVERED").length,
  };

  return (
    <Shell
      user={user}
      title="Deliveries"
      eyebrow="OPERATIONS OVERVIEW"
      subtitle="A clear view of every vehicle journey."
      currentHref="/admin"
      actions={<Link href="/admin/bookings" className="btn-pill btn-pill-primary">+ Request booking</Link>}
    >
      <DeliveriesPage
        clients={JSON.parse(JSON.stringify(clients || []))}
        shipments={JSON.parse(JSON.stringify(shipmentsWithClients))}
        stats={stats}
      />
    </Shell>
  );
}
