import { requireClient, Shell } from "@/lib/shell";
import { supabase } from "@/lib/supabase";
import { readShipmentData } from "@/lib/storage";
import ClientPortal from "./ClientPortal";

export const dynamic = "force-dynamic";

export default async function PortalPage() {
  const user = await requireClient();

  const { data: shipments } = await supabase
    .from("Shipment")
    .select("*")
    .eq("clientId", user.id)
    .order("createdAt", { ascending: false });

  // Fetch events for all shipments
  const shipmentIds = (shipments || []).map((s) => s.id);
  let events = [];
  if (shipmentIds.length > 0) {
    const { data: ev } = await supabase
      .from("ShipmentEvent")
      .select("*")
      .in("shipmentId", shipmentIds)
      .order("occurredAt", { ascending: false });
    events = ev || [];
  }

  const eventsByShipment = {};
  events.forEach((e) => {
    if (!eventsByShipment[e.shipmentId]) eventsByShipment[e.shipmentId] = [];
    eventsByShipment[e.shipmentId].push(e);
  });

  // Attach documents + insurance claim metadata per shipment.
  const dataByShipment = {};
  await Promise.all(
    shipmentIds.map(async (id) => {
      dataByShipment[id] = await readShipmentData(id);
    })
  );

  const shipmentsWithEvents = (shipments || []).map((s) => ({
    ...s,
    events: eventsByShipment[s.id] || [],
    documents: dataByShipment[s.id]?.documents || [],
    claim: dataByShipment[s.id]?.claim || null,
  }));

  const stats = {
    total: shipmentsWithEvents.length,
    inTransit: shipmentsWithEvents.filter((s) => s.status === "IN_TRANSIT" || s.status === "OUT_FOR_DELIVERY").length,
    delivered: shipmentsWithEvents.filter((s) => s.status === "DELIVERED").length,
    booked: shipmentsWithEvents.filter((s) => s.status === "BOOKED").length,
  };

  return (
    <Shell user={user} title="My Shipments">
      <ClientPortal shipments={JSON.parse(JSON.stringify(shipmentsWithEvents))} stats={stats} />
    </Shell>
  );
}
