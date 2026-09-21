import { supabase } from "@/lib/supabase";
import { CLAIM_DOC_TYPES } from "@/lib/docs";

// Server-only helpers for shipment documents & insurance claims.
// The Supabase project exposes only the REST API (no DDL access), so files
// live in a private Storage bucket and each shipment's document/claim
// metadata lives in a JSON manifest inside that bucket.

export const BUCKET = "shipment-documents";
const DATA_DIR = "_data";

let bucketChecked = false;

export async function ensureBucket() {
  if (bucketChecked) return;
  const { data: buckets } = await supabase.storage.listBuckets();
  if (!(buckets || []).some((b) => b.name === BUCKET)) {
    const { error } = await supabase.storage.createBucket(BUCKET, { public: false });
    // Ignore "already exists" races between concurrent requests.
    if (error && !/already exists/i.test(error.message || "")) throw error;
  }
  bucketChecked = true;
}

const prefix = (shipmentId) => `shipment-${shipmentId}`;
const dataDir = (shipmentId) => `${prefix(shipmentId)}/${DATA_DIR}`;

export function emptyShipmentData() {
  return { documents: [], claim: null };
}

// The manifest is stored as a new, uniquely-named object on every write.
// Storage `list()` reads from the metadata DB (always fresh), while
// `download()` of an already-requested path may serve a cached copy —
// so we list to find the newest manifest, then download that fresh path.
async function listManifests(shipmentId) {
  const { data } = await supabase.storage
    .from(BUCKET)
    .list(dataDir(shipmentId), { limit: 1000, sortBy: { column: "created_at", order: "desc" } });
  return (data || []).filter((e) => e.id); // entries with an id are files
}

export async function readShipmentData(shipmentId) {
  await ensureBucket();
  const manifests = await listManifests(shipmentId);
  if (manifests.length === 0) return emptyShipmentData();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .download(`${dataDir(shipmentId)}/${manifests[0].name}`);
  if (error || !data) return emptyShipmentData();
  try {
    const parsed = JSON.parse(await data.text());
    return { documents: parsed.documents || [], claim: parsed.claim || null };
  } catch {
    return emptyShipmentData();
  }
}

export async function writeShipmentData(shipmentId, data) {
  await ensureBucket();
  const name = `m_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.json`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(`${dataDir(shipmentId)}/${name}`, JSON.stringify(data), { contentType: "application/json" });
  if (error) throw new Error(error.message);

  // Best-effort cleanup of superseded manifests.
  const manifests = await listManifests(shipmentId);
  const stale = manifests.filter((m) => m.name !== name).map((m) => `${dataDir(shipmentId)}/${m.name}`);
  if (stale.length) await supabase.storage.from(BUCKET).remove(stale).catch(() => {});
}

export function sanitizeFilename(name) {
  return (name || "file").replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120);
}

export function genId() {
  return "d" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export async function uploadShipmentFile(shipmentId, file, subdir = "files") {
  await ensureBucket();
  const id = genId();
  const path = `${prefix(shipmentId)}/${subdir}/${id}__${sanitizeFilename(file.name)}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: file.type || "application/octet-stream" });
  if (error) throw new Error(error.message);
  return {
    id,
    path,
    fileName: file.name,
    size: file.size,
    mime: file.type || "application/octet-stream",
    uploadedAt: new Date().toISOString(),
  };
}

export async function removeStorageFiles(paths) {
  const list = (paths || []).filter(Boolean);
  if (list.length === 0) return;
  await ensureBucket();
  await supabase.storage.from(BUCKET).remove(list);
}

export async function removeShipmentFiles(shipmentId) {
  await ensureBucket();
  const folder = prefix(shipmentId);
  const { data: entries } = await supabase.storage.from(BUCKET).list(folder, { limit: 1000 });
  const paths = [];
  for (const e of entries || []) {
    if (e.id) {
      paths.push(`${folder}/${e.name}`);
    } else {
      const { data: nested } = await supabase.storage.from(BUCKET).list(`${folder}/${e.name}`, { limit: 1000 });
      (nested || []).forEach((n) => paths.push(`${folder}/${e.name}/${n.name}`));
    }
  }
  await removeStorageFiles(paths);
}

export async function signedUrl(path, expiresIn = 3600) {
  await ensureBucket();
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, expiresIn);
  if (error) throw new Error(error.message);
  return data.signedUrl;
}

export function newClaimDocument(key, label) {
  return { key, label, status: "REQUIRED", files: [], notes: "", updatedAt: new Date().toISOString() };
}

export function newClaim(fields = {}) {
  const now = new Date().toISOString();
  return {
    claimNumber: fields.claimNumber || null,
    insurer: fields.insurer || null,
    status: fields.status || "REPORTED",
    incidentDate: fields.incidentDate || null,
    description: fields.description || null,
    createdAt: now,
    updatedAt: now,
    documents: CLAIM_DOC_TYPES.map((d) => newClaimDocument(d.key, d.label)),
  };
}

// Find a file (by id) across documents and claim checklist files.
export function findFileById(data, fileId) {
  const doc = (data.documents || []).find((d) => d.id === fileId);
  if (doc) return { path: doc.path, fileName: doc.fileName };
  for (const cd of data.claim?.documents || []) {
    const f = (cd.files || []).find((x) => x.id === fileId);
    if (f) return { path: f.path, fileName: f.fileName };
  }
  return null;
}

// Verify the shipment exists and that a CLIENT user owns it. Admins pass.
export async function authorizeShipment(user, shipmentId) {
  const { data: shipment } = await supabase
    .from("Shipment")
    .select("id, clientId, trackingNumber")
    .eq("id", shipmentId)
    .single();
  if (!shipment) return { error: "Shipment not found.", status: 404 };
  if (user.role !== "ADMIN" && shipment.clientId !== user.id) {
    return { error: "Forbidden", status: 403 };
  }
  return { shipment };
}

// Record a tracking-history event so updates appear on the customer timeline.
export async function logEvent(shipmentId, description, status = "UPDATE") {
  await supabase.from("ShipmentEvent").insert({ shipmentId, status, description });
}
