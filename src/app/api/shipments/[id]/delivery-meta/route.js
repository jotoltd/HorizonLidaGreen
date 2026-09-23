import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getTokenFromRequest } from "@/lib/auth";
import { authorizeShipment, readShipmentData, writeShipmentData, logEvent, emptyDeliveryMeta } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function PATCH(request, { params }) {
  const user = getTokenFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { shipment, error, status } = await authorizeShipment(user, Number(params.id));
  if (error) return NextResponse.json({ error }, { status });

  const body = await request.json().catch(() => ({}));
  const data = await readShipmentData(shipment.id);
  const current = { ...emptyDeliveryMeta(), ...(data.delivery || {}) };

  if (body.driverName !== undefined) current.driverName = body.driverName;
  if (body.vehicleReg !== undefined) current.vehicleReg = body.vehicleReg;
  if (body.noteToClient !== undefined) current.noteToClient = body.noteToClient;

  if (body.receipt) {
    const receipt = {
      status: body.receipt.status || "RECEIVED",
      description: body.receipt.description || "",
      files: body.receipt.files || [],
      confirmedBy: user.role,
      confirmedAt: new Date().toISOString(),
    };
    current.receipt = receipt;
  }

  if (body.booking) {
    current.booking = { ...(current.booking || {}), ...body.booking };
  }

  data.delivery = current;
  await writeShipmentData(shipment.id, data);

  if (body.receipt) {
    await logEvent(shipment.id, `Delivery receipt ${body.receipt.status === "DAMAGED" ? "reported with damage" : "confirmed without damage"}`, "UPDATE");
  } else {
    await logEvent(shipment.id, "Delivery details updated", "UPDATE");
  }

  // Return fresh shipment with client details.
  const { data: client } = await supabase
    .from("User")
    .select("name, company")
    .eq("id", shipment.clientId)
    .single();

  return NextResponse.json({
    shipment: {
      ...shipment,
      client: client || null,
      documents: data.documents || [],
      deliveryMeta: current,
    },
  });
}
