import { requireClient, Shell } from "@/lib/shell";
import { supabase } from "@/lib/supabase";
import { readShipmentData, getSharedAddresses } from "@/lib/storage";
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

  // Show the client's full booking history — unconfirmed requests first,
  // then everything else newest-first (same ordering as the admin view).
  const pending = ["BOOKED", "ON_HOLD"];
  const bookings = (shipments || []).slice().sort((a, b) => {
    const ap = pending.includes(a.status) ? 0 : 1;
    const bp = pending.includes(b.status) ? 0 : 1;
    if (ap !== bp) return ap - bp;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  const addresses = await getSharedAddresses();
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
      <ClientBookingsPage bookings={JSON.parse(JSON.stringify(bookingsWithMeta))} addresses={addresses} startNew={searchParams?.new === "1"} />
    </Shell>
  );
}
