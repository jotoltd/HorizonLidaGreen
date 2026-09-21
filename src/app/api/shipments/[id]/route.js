import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getTokenFromRequest } from "@/lib/auth";
import { removeShipmentFiles } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function PATCH(request, { params }) {
  const user = getTokenFromRequest(request);
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = Number(params.id);
  const body = await request.json();

  // Fetch current shipment to compare status
  const { data: current } = await supabase.from("Shipment").select("status").eq("id", id).single();
  const currentStatus = body.currentStatus || current?.status;

  const data = {};
  const allowed = ["origin", "destination", "carrier", "service", "pieces", "weight", "eta", "notes", "clientId"];
  for (const k of allowed) {
    if (body[k] !== undefined) {
      if (k === "eta") data.eta = body.eta ? new Date(body.eta).toISOString() : null;
      else if (k === "pieces" || k === "clientId") data[k] = Number(body[k]);
      else data[k] = body[k];
    }
  }

  const statusChanged = body.status && body.status !== currentStatus;
  if (body.status) data.status = body.status;
  data.updatedAt = new Date().toISOString();

  const { data: shipment, error } = await supabase
    .from("Shipment")
    .update(data)
    .eq("id", id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (statusChanged) {
    await supabase.from("ShipmentEvent").insert({
      shipmentId: id,
      status: body.status,
      location: body.location || null,
      description: body.description || `Status updated to ${body.status.replace(/_/g, " ")}`,
    });
  }

  // Attach client name
  const { data: client } = await supabase
    .from("User")
    .select("name, company")
    .eq("id", shipment.clientId)
    .single();
  shipment.client = client || null;

  return NextResponse.json({ shipment });
}

export async function DELETE(request, { params }) {
  const user = getTokenFromRequest(request);
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = Number(params.id);
  await supabase.from("ShipmentEvent").delete().eq("shipmentId", id);
  const { error } = await supabase.from("Shipment").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await removeShipmentFiles(id).catch(() => {});

  return NextResponse.json({ ok: true });
}
