import { supabase } from "@/lib/supabase";
import { BUCKET, ensureBucket } from "@/lib/storage";

export function canNotify(client, channel, event) {
  return client?.preferences?.[channel]?.[event] !== false;
}

const PREFS_DIR = "user-preferences";

function prefix(userId) {
  return `${PREFS_DIR}/user-${userId}`;
}

function emptyPreferences() {
  return {
    email: {
      booking: true,
      status: true,
      receipt: true,
      claim: true,
      documents: true,
    },
    sms: {
      booking: true,
      status: true,
      receipt: true,
      claim: true,
      documents: true,
    },
  };
}

async function listManifests(userId) {
  const { data } = await supabase.storage
    .from(BUCKET)
    .list(prefix(userId), { limit: 1000, sortBy: { column: "created_at", order: "desc" } });
  return (data || []).filter((e) => e.id);
}

export async function getUserPreferences(userId) {
  await ensureBucket();
  const manifests = await listManifests(userId);
  if (manifests.length === 0) return emptyPreferences();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .download(`${prefix(userId)}/${manifests[0].name}`);
  if (error || !data) return emptyPreferences();
  try {
    const parsed = JSON.parse(await data.text());
    return { ...emptyPreferences(), ...parsed };
  } catch {
    return emptyPreferences();
  }
}

export async function setUserPreferences(userId, prefs) {
  await ensureBucket();
  const merged = { ...emptyPreferences(), ...prefs };
  const name = `m_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.json`;
  const path = `${prefix(userId)}/${name}`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, JSON.stringify(merged), { contentType: "application/json" });
  if (error) throw new Error(error.message);

  // Best-effort cleanup of stale manifests.
  const manifests = await listManifests(userId);
  const stale = manifests.filter((m) => m.name !== name).map((m) => `${prefix(userId)}/${m.name}`);
  if (stale.length) await supabase.storage.from(BUCKET).remove(stale).catch(() => {});

  return merged;
}
