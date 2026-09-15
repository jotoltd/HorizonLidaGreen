import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getTokenFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

function genTracking() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "HLG";
  for (let i = 0; i < 9; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export async function GET(request) {
  const user = getTokenFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (user.role === "ADMIN") {
    const { data: shipments } = await supabase
      .from("Shipment")
      .select("*")
      .order("createdAt", { ascending: false });

    // Fetch clients separately
    const { data: clients } = await supabase
      .from("User")
      .select("id, name, email, company")
      .eq("role", "CLIENT");

    const clientMap = {};
    (clients || []).forEach((c) => { clientMap[c.id] = c; });

    const shipmentsWithClients = (shipments || []).map((s) => ({
      ...s,
      client: clientMap[s.clientId] || null,
    }));

    return NextResponse.json({ shipments: shipmentsWithClients });
  } else {
    const { data: shipments } = await supabase
      .from("Shipment")
      .select("*")
      .eq("clientId", user.id)
      .order("createdAt", { ascending: false });

    // Fetch events for each shipment
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

    const shipmentsWithEvents = (shipments || []).map((s) => ({
      ...s,
      events: eventsByShipment[s.id] || [],
    }));

    return NextResponse.json({ shipments: shipmentsWithEvents });
  }
}

export async function POST(request) {
  const user = getTokenFromRequest(request);
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const clientId = Number(body.clientId);
  const origin = (body.origin || "").toString().trim();
  const destination = (body.destination || "").toString().trim();
  const carrier = (body.carrier || "").toString().trim() || null;
  const service = (body.service || "").toString().trim() || null;
  const pieces = Number(body.pieces) || 0;
  const weight = (body.weight || "").toString().trim() || null;
  const status = (body.status || "BOOKED").toString();
  const eta = body.eta ? new Date(body.eta).toISOString() : null;
  const notes = (body.notes || "").toString().trim() || null;

  if (!clientId || !origin || !destination) {
    return NextResponse.json({ error: "Client, origin and destination are required." }, { status: 400 });
  }

  const { data: client } = await supabase.from("User").select("id").eq("id", clientId).single();
  if (!client) return NextResponse.json({ error: "Client not found." }, { status: 404 });

  const trackingNumber = genTracking();
  const now = new Date().toISOString();

  const { data: shipment, error } = await supabase
    .from("Shipment")
    .insert({
      trackingNumber,
      clientId,
      origin,
      destination,
      carrier,
      service,
      pieces,
      weight,
      status,
      eta,
      notes,
      updatedAt: now,
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Create initial event
  await supabase.from("ShipmentEvent").insert({
    shipmentId: shipment.id,
    status,
    description: "Shipment created",
  });

  // Attach client for response
  shipment.client = { name: client.name || null, company: client.company || null };

  return NextResponse.json({ shipment });
}
