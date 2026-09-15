import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
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

  let shipments;
  if (user.role === "ADMIN") {
    shipments = await prisma.shipment.findMany({
      orderBy: { createdAt: "desc" },
      include: { client: { select: { id: true, name: true, email: true, company: true } } },
    });
  } else {
    shipments = await prisma.shipment.findMany({
      where: { clientId: user.id },
      orderBy: { createdAt: "desc" },
      include: { events: { orderBy: { occurredAt: "desc" } } },
    });
  }
  return NextResponse.json({ shipments });
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
  const eta = body.eta ? new Date(body.eta) : null;
  const notes = (body.notes || "").toString().trim() || null;

  if (!clientId || !origin || !destination) {
    return NextResponse.json({ error: "Client, origin and destination are required." }, { status: 400 });
  }

  const client = await prisma.user.findUnique({ where: { id: clientId } });
  if (!client) return NextResponse.json({ error: "Client not found." }, { status: 404 });

  const shipment = await prisma.shipment.create({
    data: {
      trackingNumber: genTracking(),
      clientId, origin, destination, carrier, service, pieces, weight, status, eta, notes,
      events: { create: { status, description: "Shipment created" } },
    },
    include: { client: { select: { name: true, company: true } } },
  });

  return NextResponse.json({ shipment });
}
