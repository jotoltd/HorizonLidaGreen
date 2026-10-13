import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getTokenFromRequest, hashPassword } from "@/lib/auth";
import { notifyNewClient } from "@/lib/email";

export const dynamic = "force-dynamic";

function genPassword(len = 8) {
  const chars = "abcdefghijkmnpqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export async function POST(request, { params }) {
  const user = getTokenFromRequest(request);
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = Number(params.id);
  const { data: client, error } = await supabase
    .from("User")
    .select("id, name, email, company, phone")
    .eq("id", id)
    .single();
  if (error || !client) return NextResponse.json({ error: "Client not found." }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const password = (body.password || "").toString() || genPassword();

  // If we generated a new password, update the stored hash so the invite works.
  if (!body.password) {
    const { error: updateError } = await supabase
      .from("User")
      .update({ passwordHash: hashPassword(password) })
      .eq("id", id);
    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  const result = await notifyNewClient({ client, password });
  if (result.error) return NextResponse.json({ error: result.error }, { status: 502 });
  if (result.skipped) {
    return NextResponse.json({ error: "Email delivery is not configured on the server (RESEND_API_KEY missing)." }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
