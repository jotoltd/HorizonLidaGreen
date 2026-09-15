import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getTokenFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function DELETE(request, { params }) {
  const user = getTokenFromRequest(request);
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = Number(params.id);
  // Delete shipments first (foreign key), then the user
  await supabase.from("ShipmentEvent").delete().eq("shipmentId", id);
  // Actually we need to delete shipments for this client, not shipment id
  // Get shipments for this client
  const { data: clientShipments } = await supabase.from("Shipment").select("id").eq("clientId", id);
  if (clientShipments && clientShipments.length > 0) {
    const shipmentIds = clientShipments.map((s) => s.id);
    await supabase.from("ShipmentEvent").delete().in("shipmentId", shipmentIds);
    await supabase.from("Shipment").delete().eq("clientId", id);
  }

  const { error } = await supabase.from("User").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
