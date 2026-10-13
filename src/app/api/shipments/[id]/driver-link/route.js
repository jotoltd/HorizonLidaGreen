import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getTokenFromRequest } from "@/lib/auth";
import { readShipmentData, writeShipmentData, getDeliveryMeta, genId, logEvent } from "@/lib/storage";
import { notifyDriverTrackingLink } from "@/lib/email";

export const dynamic = "force-dynamic";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// POST — generate (or reuse) the driver's live-tracking link and email it.
export async function POST(request, { params }) {
  const user = getTokenFromRequest(request);
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = Number(params.id);
  const { data: shipment, error } = await supabase
    .from("Shipment")
    .select("id, trackingNumber, origin, destination")
    .eq("id", id)
    .single();
  if (error || !shipment) return NextResponse.json({ error: "Shipment not found." }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const email = (body.email || "").toString().trim().toLowerCase();

  const data = await readShipmentData(id);
  const delivery = getDeliveryMeta(data);
  if (email) delivery.driverEmail = email;
  if (body.driverName !== undefined) delivery.driverName = (body.driverName || "").toString().trim();
  if (!delivery.trackingToken) delivery.trackingToken = genId() + genId();
  delivery.trackingEnabled = true;
  data.delivery = delivery;
  await writeShipmentData(id, data);

  const link = `${APP_URL}/driver/${id}/${delivery.trackingToken}`;

  let emailed = false;
  let emailError = null;
  const to = email || delivery.driverEmail;
  if (to) {
    const result = await notifyDriverTrackingLink({ shipment, driverName: delivery.driverName, email: to, link });
    emailed = !result.skipped && !result.error;
    emailError = result.error || (result.skipped ? "Email delivery is not configured (RESEND_API_KEY missing)." : null);
    if (emailed) await logEvent(id, `Driver tracking link sent to ${to}`, "UPDATE");
  }

  return NextResponse.json({ ok: true, link, emailed, emailError, driverEmail: delivery.driverEmail });
}
