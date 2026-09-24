import { requireAdmin, Shell } from "@/lib/shell";
import { supabase } from "@/lib/supabase";
import { readShipmentData } from "@/lib/storage";
import Link from "next/link";
import BookingsPage from "./BookingsPage";

export const dynamic = "force-dynamic";

export default async function AdminBookingsPage({ searchParams }) {
  const user = await requireAdmin();

  const { data: clients } = await supabase
    .from("User")
    .select("id, name, email, company, phone")
    .eq("role", "CLIENT");

  const { data: shipments } = await supabase
    .from("Shipment")
    .select("*")
    .order("createdAt", { ascending: false });

  const clientMap = {};
  (clients || []).forEach((c) => { clientMap[c.id] = c; });

  const bookings = (shipments || []).filter((s) => s.status === "BOOKED" || s.status === "ON_HOLD");
  const ids = bookings.map((s) => s.id);
  const dataByShipment = {};
  await Promise.all(ids.map(async (id) => { dataByShipment[id] = await readShipmentData(id); }));

  const bookingsWithMeta = bookings.map((s) => ({
    ...s,
    client: clientMap[s.clientId] || null,
    deliveryMeta: dataByShipment[s.id]?.delivery || null,
  }));

  return (
    <Shell
      user={user}
      title="Bookings"
      eyebrow="PLAN YOUR NEXT COLLECTION"
      subtitle="Request, review and confirm vehicle movements."
      currentHref="/admin/bookings"
      actions={<Link href="/admin/bookings?new=1" className="btn-pill btn-pill-primary">+ New booking</Link>}
    >
      <BookingsPage
        bookings={JSON.parse(JSON.stringify(bookingsWithMeta))}
        clients={JSON.parse(JSON.stringify(clients || []))}
        startNew={searchParams?.new === "1"}
      />
    </Shell>
  );
}
