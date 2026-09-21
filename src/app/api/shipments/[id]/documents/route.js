import { NextResponse } from "next/server";
import { getTokenFromRequest } from "@/lib/auth";
import { DOC_TYPES, MAX_UPLOAD_SIZE } from "@/lib/docs";
import {
  authorizeShipment,
  readShipmentData,
  writeShipmentData,
  uploadShipmentFile,
  logEvent,
} from "@/lib/storage";

export const dynamic = "force-dynamic";

// List documents for a shipment (owner client or admin).
export async function GET(request, { params }) {
  const user = getTokenFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { shipment, error, status } = await authorizeShipment(user, Number(params.id));
  if (error) return NextResponse.json({ error }, { status });

  const data = await readShipmentData(shipment.id);
  return NextResponse.json({ documents: data.documents, claim: data.claim });
}

// Upload a document (admin only). Multipart: file, type, title.
export async function POST(request, { params }) {
  const user = getTokenFromRequest(request);
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { shipment, error, status } = await authorizeShipment(user, Number(params.id));
  if (error) return NextResponse.json({ error }, { status });

  let form;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart form data." }, { status: 400 });
  }

  const file = form.get("file");
  const type = (form.get("type") || "OTHER").toString();
  const title = (form.get("title") || "").toString().trim();

  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "A file is required." }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_SIZE) {
    return NextResponse.json({ error: "File exceeds the 25 MB limit." }, { status: 400 });
  }
  if (!DOC_TYPES.includes(type)) {
    return NextResponse.json({ error: "Invalid document type." }, { status: 400 });
  }

  try {
    const stored = await uploadShipmentFile(shipment.id, file);
    const data = await readShipmentData(shipment.id);
    const doc = {
      ...stored,
      type,
      title: title || file.name,
      uploadedBy: user.role,
      createdAt: stored.uploadedAt,
    };
    data.documents.unshift(doc);
    await writeShipmentData(shipment.id, data);
    await logEvent(shipment.id, `Document uploaded: ${doc.title}`, "UPDATE");
    return NextResponse.json({ document: doc });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
