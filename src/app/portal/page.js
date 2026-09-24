import Link from "next/link";
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
    deliveryMeta: dataByShipment[s.id]?.delivery || null,
  }));

  return (
    <Shell
      user={user}
      title="Deliveries"
      eyebrow="YOUR WORKSPACE"
      subtitle="A clear view of every vehicle journey."
      currentHref="/portal"
      actions={<Link href="/portal/bookings?new=1" className="btn-pill btn-pill-primary">+ Request booking</Link>}
    >
      <ClientPortal shipments={JSON.parse(JSON.stringify(shipmentsWithEvents))} />
    </Shell>
  );
}
