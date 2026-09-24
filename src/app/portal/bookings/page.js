import { requireClient, Shell } from "@/lib/shell";
import { supabase } from "@/lib/supabase";
import { readShipmentData } from "@/lib/storage";
import Link from "next/link";
import ClientBookingsPage from "./ClientBookingsPage";

export const dynamic = "force-dynamic";

export default async function PortalBookingsPage({ searchParams }) {
  const user = await requireClient();

  const { data: shipments } = await supabase
    .from("Shipment")
    .select("*")
    .eq("clientId", user.id)
    .order("createdAt", { ascending: false });

  const bookings = (shipments || []).filter((s) => s.status === "BOOKED" || s.status === "ON_HOLD");
  const ids = bookings.map((s) => s.id);
  const dataByShipment = {};
  await Promise.all(ids.map(async (id) => { dataByShipment[id] = await readShipmentData(id); }));

  const bookingsWithMeta = bookings.map((s) => ({
    ...s,
    deliveryMeta: dataByShipment[s.id]?.delivery || null,
  }));

  return (
    <Shell
      user={user}
      title="Bookings"
      eyebrow="PLAN YOUR NEXT COLLECTION"
      subtitle="Request, review and confirm vehicle movements."
      currentHref="/portal/bookings"
      actions={<Link href="/portal/bookings?new=1" className="btn-pill btn-pill-primary">+ New booking</Link>}
    >
      <ClientBookingsPage bookings={JSON.parse(JSON.stringify(bookingsWithMeta))} startNew={searchParams?.new === "1"} />
    </Shell>
  );
}
