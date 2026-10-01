import { NextResponse } from "next/server";
import { getTokenFromRequest } from "@/lib/auth";
import { getUserPreferences, setUserPreferences } from "@/lib/preferences";

export const dynamic = "force-dynamic";

function sanitizePreferences(prefs) {
  const result = {};
  for (const channel of ["email", "sms"]) {
    result[channel] = {};
    for (const key of ["booking", "status", "receipt", "claim", "documents"]) {
      result[channel][key] = prefs?.[channel]?.[key] === false ? false : true;
    }
  }
  return result;
}

export async function GET(request) {
  const user = getTokenFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const prefs = await getUserPreferences(user.id);
  return NextResponse.json({ preferences: prefs });
}

export async function PUT(request) {
  const user = getTokenFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const prefs = sanitizePreferences(body.preferences);
  const saved = await setUserPreferences(user.id, prefs);
  return NextResponse.json({ preferences: saved });
}
