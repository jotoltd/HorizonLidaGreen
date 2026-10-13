import { NextResponse } from "next/server";
import { verifyDriverToken, writeLocationPing } from "@/lib/storage";

export const dynamic = "force-dynamic";

// POST { sid, token, lat, lng, accuracy } — record a driver location ping.
export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const sid = Number(body.sid);
  const token = (body.token || "").toString();
  const lat = Number(body.lat);
  const lng = Number(body.lng);
  const accuracy = Number(body.accuracy);

  if (!Number.isFinite(sid) || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return NextResponse.json({ error: "Invalid coordinates." }, { status: 400 });
  }

  const delivery = await verifyDriverToken(sid, token);
  if (!delivery) return NextResponse.json({ error: "Invalid or expired tracking link." }, { status: 403 });

  const ping = {
    lat,
    lng,
    accuracy: Number.isFinite(accuracy) ? Math.round(accuracy) : null,
    at: new Date().toISOString(),
  };
  await writeLocationPing(sid, ping);

  return NextResponse.json({ ok: true });
}
