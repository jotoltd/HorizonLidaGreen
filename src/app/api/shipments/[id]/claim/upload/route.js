import { NextResponse } from "next/server";
import { getTokenFromRequest } from "@/lib/auth";
import { MAX_UPLOAD_SIZE } from "@/lib/docs";
import {
  authorizeShipment,
  readShipmentData,
  writeShipmentData,
  uploadShipmentFile,
  logEvent,
} from "@/lib/storage";

export const dynamic = "force-dynamic";

// Upload a file against a claim checklist item (owner client or admin).
// Multipart: key (checklist item key), file.
export async function POST(request, { params }) {
  const user = getTokenFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { shipment, error, status } = await authorizeShipment(user, Number(params.id));
  if (error) return NextResponse.json({ error }, { status });

  let form;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart form data." }, { status: 400 });
  }

  const key = (form.get("key") || "").toString();
  const file = form.get("file");
  if (!key) return NextResponse.json({ error: "Document key is required." }, { status: 400 });
  if (!file || typeof file === "string") return NextResponse.json({ error: "A file is required." }, { status: 400 });
  if (file.size > MAX_UPLOAD_SIZE) return NextResponse.json({ error: "File exceeds the 25 MB limit." }, { status: 400 });

  const data = await readShipmentData(shipment.id);
  if (!data.claim) return NextResponse.json({ error: "No claim exists for this shipment." }, { status: 404 });

  const doc = data.claim.documents.find((d) => d.key === key);
  if (!doc) return NextResponse.json({ error: "Unknown document item." }, { status: 400 });

  try {
    const stored = await uploadShipmentFile(shipment.id, file, "claim");
    stored.uploadedBy = user.role;
    doc.files = [...(doc.files || []), stored];
    // A fresh upload means the item has been submitted for review.
    if (doc.status !== "APPROVED") doc.status = "SUBMITTED";
    doc.updatedAt = new Date().toISOString();
    data.claim.updatedAt = doc.updatedAt;
    await writeShipmentData(shipment.id, data);
    await logEvent(shipment.id, `Claim document submitted: ${doc.label}`, "UPDATE");
    return NextResponse.json({ claim: data.claim });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
