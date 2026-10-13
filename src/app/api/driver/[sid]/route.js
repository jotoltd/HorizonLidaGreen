import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { verifyDriverToken } from "@/lib/storage";

export const dynamic = "force-dynamic";

// GET /api/driver/<shipmentId>?token=... — public driver link lookup.
export async function GET(request, { params }) {
  const id = Number(params.sid);
  const token = new URL(request.url).searchParams.get("token") || "";

  const delivery = await verifyDriverToken(id, token);
  if (!delivery) return NextResponse.json({ error: "Invalid or expired tracking link." }, { status: 403 });

  const { data: shipment } = await supabase
    .from("Shipment")
    .select("trackingNumber, origin, destination, status")
    .eq("id", id)
    .single();
  if (!shipment) return NextResponse.json({ error: "Shipment not found." }, { status: 404 });

  return NextResponse.json({
    shipment: {
      trackingNumber: shipment.trackingNumber,
      origin: shipment.origin,
      destination: shipment.destination,
      status: shipment.status,
    },
    driverName: delivery.driverName || null,
  });
}
