import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getTokenFromRequest } from "@/lib/auth";
import { readShipmentData } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const tracking = (searchParams.get("tracking") || "").toString().trim().toUpperCase();

  if (!tracking) {
    return NextResponse.json({ error: "Please enter a tracking number." }, { status: 400 });
  }

  const { data: shipments, error } = await supabase
    .from("Shipment")
    .select("*")
    .eq("trackingNumber", tracking)
    .order("createdAt", { ascending: "desc" })
    .limit(1);

  const shipment = shipments && shipments.length > 0 ? shipments[0] : null;

  if (error || !shipment) {
    return NextResponse.json({ error: "No shipment found with that tracking number." }, { status: 404 });
  }

  const { data: events } = await supabase
    .from("ShipmentEvent")
    .select("*")
    .eq("shipmentId", shipment.id)
    .order("occurredAt", { ascending: false });

  // Return shipment + events, but exclude client personal details.
  // Authenticated users (admin or the owning client) also get the id and
  // document count so the workspace track views can manage the delivery.
  const user = getTokenFromRequest(request);
  const authed = user && (user.role === "ADMIN" || user.id === shipment.clientId);

  const payload = {
    trackingNumber: shipment.trackingNumber,
    origin: shipment.origin,
    destination: shipment.destination,
    carrier: shipment.carrier,
    service: shipment.service,
    pieces: shipment.pieces,
    weight: shipment.weight,
    status: shipment.status,
    eta: shipment.eta,
    createdAt: shipment.createdAt,
  };

  if (authed) {
    payload.id = shipment.id;
    const data = await readShipmentData(shipment.id).catch(() => null);
    payload.documents = (data?.documents || []).length;
  }

  return NextResponse.json({ shipment: payload, events: events || [] });
}
