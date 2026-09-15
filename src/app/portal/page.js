import { requireClient, Shell } from "@/lib/shell";
import prisma from "@/lib/prisma";
import ClientPortal from "./ClientPortal";

export const dynamic = "force-dynamic";

export default async function PortalPage() {
  const user = await requireClient();

  const shipments = await prisma.shipment.findMany({
    where: { clientId: user.id },
    orderBy: { createdAt: "desc" },
    include: { events: { orderBy: { occurredAt: "desc" } } },
  });

  const stats = {
    total: shipments.length,
    inTransit: shipments.filter((s) => s.status === "IN_TRANSIT" || s.status === "OUT_FOR_DELIVERY").length,
    delivered: shipments.filter((s) => s.status === "DELIVERED").length,
    booked: shipments.filter((s) => s.status === "BOOKED").length,
  };

  return (
    <Shell user={user} title="My Shipments">
      <ClientPortal shipments={JSON.parse(JSON.stringify(shipments))} stats={stats} />
    </Shell>
  );
}
