import { NextResponse } from "next/server";
import { getTokenFromRequest } from "@/lib/auth";
import {
  authorizeShipment,
  readShipmentData,
  writeShipmentData,
  signedUrl,
  removeStorageFiles,
  findFileById,
} from "@/lib/storage";

export const dynamic = "force-dynamic";

// Download a document or claim file via a short-lived signed URL.
export async function GET(request, { params }) {
  const user = getTokenFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { shipment, error, status } = await authorizeShipment(user, Number(params.id));
  if (error) return NextResponse.json({ error }, { status });

  const data = await readShipmentData(shipment.id);
  const file = findFileById(data, params.docId);
  if (!file) return NextResponse.json({ error: "File not found." }, { status: 404 });

  try {
    const url = await signedUrl(file.path);
    return NextResponse.redirect(url);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// Delete a document (admin only). Claim files are managed via the claim route.
export async function DELETE(request, { params }) {
  const user = getTokenFromRequest(request);
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { shipment, error, status } = await authorizeShipment(user, Number(params.id));
  if (error) return NextResponse.json({ error }, { status });

  const data = await readShipmentData(shipment.id);
  const doc = (data.documents || []).find((d) => d.id === params.docId);
  if (!doc) return NextResponse.json({ error: "Document not found." }, { status: 404 });

  data.documents = data.documents.filter((d) => d.id !== params.docId);
  await writeShipmentData(shipment.id, data);
  await removeStorageFiles([doc.path]);

  return NextResponse.json({ ok: true });
}
