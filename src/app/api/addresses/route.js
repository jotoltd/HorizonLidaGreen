import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getSharedAddresses, addAddresses } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const addresses = await getSharedAddresses();
  return NextResponse.json({ addresses });
}

export async function POST(request) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  await addAddresses(body.addresses || [body.address]);
  return NextResponse.json({ addresses: await getSharedAddresses() });
}
