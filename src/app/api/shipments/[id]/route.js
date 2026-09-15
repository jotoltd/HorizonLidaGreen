import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTokenFromRequest } from "@/lib/auth";

export async function PATCH(request, { params }) {
  const user = getTokenFromRequest(request);
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = Number(params.id);
  const body = await request.json();

  const data = {};
  const allowed = ["origin", "destination", "carrier", "service", "pieces", "weight", "eta", "notes", "clientId"];
  for (const k of allowed) {
    if (body[k] !== undefined) {
      if (k === "eta") data.eta = body.eta ? new Date(body.eta) : null;
      else if (k === "pieces" || k === "clientId") data[k] = Number(body[k]);
      else data[k] = body[k];
    }
  }

  const statusChanged = body.status && body.status !== body.currentStatus;
  if (body.status) data.status = body.status;

  const shipment = await prisma.shipment.update({
    where: { id },
    data,
    include: { client: { select: { name: true, company: true } } },
  });

  if (statusChanged) {
    await prisma.shipmentEvent.create({
      data: {
        shipmentId: id,
        status: body.status,
        location: body.location || null,
        description: body.description || `Status updated to ${body.status.replace(/_/g, " ")}`,
      },
    });
  }

  return NextResponse.json({ shipment });
}

export async function DELETE(request, { params }) {
  const user = getTokenFromRequest(request);
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = Number(params.id);
  await prisma.shipment.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
