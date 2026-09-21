import { NextResponse } from "next/server";
import { getTokenFromRequest } from "@/lib/auth";
import { CLAIM_STATUSES, CLAIM_DOC_STATUSES, CLAIM_STATUS_LABELS } from "@/lib/docs";
import {
  authorizeShipment,
  readShipmentData,
  writeShipmentData,
  removeStorageFiles,
  newClaim,
  newClaimDocument,
  logEvent,
} from "@/lib/storage";

export const dynamic = "force-dynamic";

// Get the insurance claim for a shipment (owner client or admin).
export async function GET(request, { params }) {
  const user = getTokenFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { shipment, error, status } = await authorizeShipment(user, Number(params.id));
  if (error) return NextResponse.json({ error }, { status });

  const data = await readShipmentData(shipment.id);
  return NextResponse.json({ claim: data.claim });
}

// Create an insurance claim (admin only).
export async function POST(request, { params }) {
  const user = getTokenFromRequest(request);
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { shipment, error, status } = await authorizeShipment(user, Number(params.id));
  if (error) return NextResponse.json({ error }, { status });

  const body = await request.json().catch(() => ({}));
  const data = await readShipmentData(shipment.id);
  if (data.claim) {
    return NextResponse.json({ error: "A claim already exists for this shipment." }, { status: 400 });
  }

  const claim = newClaim({
    claimNumber: (body.claimNumber || "").toString().trim() || null,
    insurer: (body.insurer || "").toString().trim() || null,
    status: CLAIM_STATUSES.includes(body.status) ? body.status : "REPORTED",
    incidentDate: body.incidentDate ? new Date(body.incidentDate).toISOString() : null,
    description: (body.description || "").toString().trim() || null,
  });

  data.claim = claim;
  await writeShipmentData(shipment.id, data);
  await logEvent(shipment.id, "Insurance claim opened", "UPDATE");
  return NextResponse.json({ claim });
}

// Update claim fields and/or a single checklist document (admin only).
// Body: { claimNumber?, insurer?, status?, incidentDate?, description?,
//         doc?: { key, status?, notes?, removeFileId? } }
export async function PATCH(request, { params }) {
  const user = getTokenFromRequest(request);
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { shipment, error, status } = await authorizeShipment(user, Number(params.id));
  if (error) return NextResponse.json({ error }, { status });

  const body = await request.json().catch(() => ({}));
  const data = await readShipmentData(shipment.id);
  if (!data.claim) return NextResponse.json({ error: "No claim exists for this shipment." }, { status: 404 });

  const claim = data.claim;
  const statusChanged = body.status && body.status !== claim.status;

  if (body.claimNumber !== undefined) claim.claimNumber = (body.claimNumber || "").toString().trim() || null;
  if (body.insurer !== undefined) claim.insurer = (body.insurer || "").toString().trim() || null;
  if (body.description !== undefined) claim.description = (body.description || "").toString().trim() || null;
  if (body.incidentDate !== undefined) claim.incidentDate = body.incidentDate ? new Date(body.incidentDate).toISOString() : null;
  if (body.status !== undefined && CLAIM_STATUSES.includes(body.status)) claim.status = body.status;

  const removedPaths = [];
  if (body.doc && body.doc.key) {
    let doc = claim.documents.find((d) => d.key === body.doc.key);
    if (!doc) {
      // Allow ad-hoc documents requested by the insurer.
      doc = newClaimDocument(body.doc.key, body.doc.label || body.doc.key);
      claim.documents.push(doc);
    }
    if (body.doc.status !== undefined && CLAIM_DOC_STATUSES.includes(body.doc.status)) {
      doc.status = body.doc.status;
      doc.updatedAt = new Date().toISOString();
    }
    if (body.doc.notes !== undefined) doc.notes = (body.doc.notes || "").toString();
    if (body.doc.removeFileId) {
      const f = (doc.files || []).find((x) => x.id === body.doc.removeFileId);
      if (f) {
        removedPaths.push(f.path);
        doc.files = doc.files.filter((x) => x.id !== body.doc.removeFileId);
        doc.updatedAt = new Date().toISOString();
      }
    }
  }

  claim.updatedAt = new Date().toISOString();
  await writeShipmentData(shipment.id, data);
  await removeStorageFiles(removedPaths);

  if (statusChanged) {
    await logEvent(shipment.id, `Insurance claim status: ${CLAIM_STATUS_LABELS[claim.status] || claim.status}`, "UPDATE");
  }

  return NextResponse.json({ claim });
}

// Delete the claim and its files (admin only).
export async function DELETE(request, { params }) {
  const user = getTokenFromRequest(request);
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { shipment, error, status } = await authorizeShipment(user, Number(params.id));
  if (error) return NextResponse.json({ error }, { status });

  const data = await readShipmentData(shipment.id);
  if (!data.claim) return NextResponse.json({ error: "No claim exists for this shipment." }, { status: 404 });

  const paths = (data.claim.documents || []).flatMap((d) => (d.files || []).map((f) => f.path));
  data.claim = null;
  await writeShipmentData(shipment.id, data);
  await removeStorageFiles(paths);

  return NextResponse.json({ ok: true });
}
