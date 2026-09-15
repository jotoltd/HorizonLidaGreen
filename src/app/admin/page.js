import { requireAdmin, Shell } from "@/lib/shell";
import prisma from "@/lib/prisma";
import AdminDashboard from "./AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await requireAdmin();

  const [clients, shipments, stats] = await Promise.all([
    prisma.user.findMany({
      where: { role: "CLIENT" },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, email: true, company: true, phone: true, createdAt: true,
        _count: { select: { shipments: true } } },
    }),
    prisma.shipment.findMany({
      orderBy: { createdAt: "desc" },
      include: { client: { select: { id: true, name: true, email: true, company: true } } },
    }),
    {
      totalClients: await prisma.user.count({ where: { role: "CLIENT" } }),
      totalShipments: await prisma.shipment.count(),
      inTransit: await prisma.shipment.count({ where: { status: "IN_TRANSIT" } }),
      delivered: await prisma.shipment.count({ where: { status: "DELIVERED" } }),
    },
  ]);

  return (
    <Shell user={user} title="Admin Dashboard">
      <AdminDashboard clients={JSON.parse(JSON.stringify(clients))} shipments={JSON.parse(JSON.stringify(shipments))} stats={stats} />
    </Shell>
  );
}
