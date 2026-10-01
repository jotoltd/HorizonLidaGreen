import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getTokenFromRequest } from "@/lib/auth";
import { removeShipmentFiles } from "@/lib/storage";
import { notifyStatusUpdate, notifyBookingConfirmed } from "@/lib/email";
import { smsNotifyStatusUpdate, smsNotifyBookingConfirmed } from "@/lib/sms";
import { getUserPreferences } from "@/lib/preferences";

export const dynamic = "force-dynamic";

export async function PATCH(request, { params }) {
  const user = getTokenFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = Number(params.id);
  const body = await request.json();
  const isAdmin = user.role === "ADMIN";

  // Fetch current shipment to compare status and check ownership
  const { data: current } = await supabase.from("Shipment").select("status, clientId").eq("id", id).single();
  if (!current) return NextResponse.json({ error: "Shipment not found." }, { status: 404 });
  if (!isAdmin && current.clientId !== user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const currentStatus = body.currentStatus || current?.status;

  const data = {};
  // Clients may only edit their booking details; admins can edit everything.
  const allowed = isAdmin
    ? ["origin", "destination", "carrier", "service", "pieces", "weight", "eta", "notes", "clientId"]
    : ["origin", "destination", "pieces", "notes"];
  for (const k of allowed) {
    if (body[k] !== undefined) {
      if (k === "eta") data.eta = body.eta ? new Date(body.eta).toISOString() : null;
      else if (k === "pieces" || k === "clientId") data[k] = Number(body[k]);
      else data[k] = body[k];
    }
  }

  const statusChanged = isAdmin && body.status && body.status !== currentStatus;
  if (isAdmin && body.status) data.status = body.status;
  data.updatedAt = new Date().toISOString();

  const { data: shipment, error } = await supabase
    .from("Shipment")
    .update(data)
    .eq("id", id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let event = null;
  if (statusChanged) {
    event = {
      shipmentId: id,
      status: body.status,
      location: body.location || null,
      description: body.description || `Status updated to ${body.status.replace(/_/g, " ")}`,
    };
    await supabase.from("ShipmentEvent").insert(event);
  } else if (!isAdmin && Object.keys(data).length > 1) {
    // Log client booking edits so both parties see the change in history.
    await supabase.from("ShipmentEvent").insert({
      shipmentId: id,
      status: current.status,
      description: "Booking details updated by client",
    });
  }

  // Attach client name
  const { data: client } = await supabase
    .from("User")
    .select("name, email, company, phone")
    .eq("id", shipment.clientId)
    .single();
  if (client) client.preferences = await getUserPreferences(shipment.clientId);
  shipment.client = client || null;

  // Notify client of status change
  if (isAdmin && statusChanged && client?.email) {
    const confirmedStatuses = ["IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED"];
    const wasBooking = currentStatus === "BOOKED" || currentStatus === "ON_HOLD";
    const isConfirmed = confirmedStatuses.includes(body.status);
    if (wasBooking && isConfirmed) {
      await notifyBookingConfirmed({ shipment, client });
      await smsNotifyBookingConfirmed({ shipment, client });
    } else {
      await notifyStatusUpdate({ shipment, client, previousStatus: currentStatus, event });
      await smsNotifyStatusUpdate({ shipment, client, event });
    }
  }

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
