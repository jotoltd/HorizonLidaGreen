import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getTokenFromRequest, hashPassword } from "@/lib/auth";
import { readClientProfile, writeClientProfile } from "@/lib/storage";

export const dynamic = "force-dynamic";

function genPassword(len = 8) {
  const chars = "abcdefghijkmnpqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export async function GET(request, { params }) {
  const user = getTokenFromRequest(request);
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = Number(params.id);
  const { data: client, error } = await supabase
    .from("User")
    .select("id, name, email, company, phone, role, createdAt")
    .eq("id", id)
    .single();
  if (error || !client) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const profile = await readClientProfile(id).catch(() => null);
  return NextResponse.json({ client: { ...client, address: profile?.address || null, companyNumber: profile?.companyNumber || null } });
}

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

  // Access level change
  if (body.role !== undefined) {
    const role = (body.role || "").toString().toUpperCase();
    if (!["ADMIN", "CLIENT"].includes(role)) {
      return NextResponse.json({ error: "Role must be ADMIN or CLIENT." }, { status: 400 });
    }
    if (id === user.id && role !== "ADMIN") {
      return NextResponse.json({ error: "You cannot change your own access level." }, { status: 400 });
    }
    data.role = role;
  }

  // Password reset — either a given password or a freshly generated one.
  let newPassword = null;
  if (body.resetPassword) {
    newPassword = genPassword();
  } else if (body.password) {
    newPassword = body.password.toString();
  }
  if (newPassword) data.passwordHash = hashPassword(newPassword);

  const hasProfileFields = body.address !== undefined || body.companyNumber !== undefined;
  if (Object.keys(data).length === 0 && !hasProfileFields) {
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

  let client = null;
  if (Object.keys(data).length > 0) {
    const { data: updated, error } = await supabase
      .from("User")
      .update(data)
      .eq("id", id)
      .select("id, name, email, company, phone, role")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    client = updated;
  } else {
    const { data: existing } = await supabase
      .from("User")
      .select("id, name, email, company, phone, role")
      .eq("id", id)
      .single();
    client = existing;
  }

  // Persist address / Companies House number alongside the profile.
  const profileFields = {};
  if (body.address !== undefined) profileFields.address = (body.address || "").toString().trim() || null;
  if (body.companyNumber !== undefined) profileFields.companyNumber = (body.companyNumber || "").toString().trim() || null;
  if (Object.keys(profileFields).length) {
    const profile = await writeClientProfile(id, profileFields).catch(() => null);
    client.address = profile?.address || null;
    client.companyNumber = profile?.companyNumber || null;
  }

  return NextResponse.json({ client, ...(newPassword ? { password: newPassword } : {}) });
}

export async function DELETE(request, { params }) {
  const user = getTokenFromRequest(request);
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = Number(params.id);
  if (id === user.id) return NextResponse.json({ error: "You cannot delete your own account." }, { status: 400 });
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
