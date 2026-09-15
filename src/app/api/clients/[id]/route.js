import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getTokenFromRequest, hashPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PATCH(request, { params }) {
  const user = getTokenFromRequest(request);
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = Number(params.id);
  const body = await request.json();

  const data = {};
  const allowed = ["name", "email", "company", "phone"];
  for (const k of allowed) {
    if (body[k] !== undefined) {
      if (k === "email") data.email = (body[k] || "").toString().trim().toLowerCase();
      else if (k === "company" || k === "phone") data[k] = (body[k] || "").toString().trim() || null;
      else data[k] = (body[k] || "").toString().trim();
    }
  }

  // Password reset
  if (body.password) {
    data.passwordHash = hashPassword(body.password.toString());
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No fields to update." }, { status: 400 });
  }

  // Check email uniqueness if changing
  if (data.email) {
    const { data: existing } = await supabase
      .from("User")
      .select("id")
      .eq("email", data.email)
      .neq("id", id)
      .single();
    if (existing) return NextResponse.json({ error: "Another client already uses this email." }, { status: 409 });
  }

  const { data: client, error } = await supabase
    .from("User")
    .update(data)
    .eq("id", id)
    .select("id, name, email, company, phone")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ client });
}

export async function DELETE(request, { params }) {
  const user = getTokenFromRequest(request);
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = Number(params.id);
  // Delete shipments and their events first, then the user
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
