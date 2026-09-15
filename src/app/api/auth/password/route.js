import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getTokenFromRequest, verifyPassword, hashPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PATCH(request) {
  const user = getTokenFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const current = (body.currentPassword || "").toString();
  const next = (body.newPassword || "").toString();

  if (!current || !next) {
    return NextResponse.json({ error: "Current and new passwords are required." }, { status: 400 });
  }
  if (next.length < 6) {
    return NextResponse.json({ error: "New password must be at least 6 characters." }, { status: 400 });
  }

  const { data: dbUser, error } = await supabase
    .from("User")
    .select("id, passwordHash")
    .eq("id", user.id)
    .single();

  if (error || !dbUser || !verifyPassword(current, dbUser.passwordHash)) {
    return NextResponse.json({ error: "Current password is incorrect." }, { status: 401 });
  }

  const { error: updateError } = await supabase
    .from("User")
    .update({ passwordHash: hashPassword(next) })
    .eq("id", user.id);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
