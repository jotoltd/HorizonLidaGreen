import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { verifyPassword, createToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const form = await request.formData();
  const email = (form.get("email") || "").toString().trim().toLowerCase();
  const password = (form.get("password") || "").toString();

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const { data: user, error } = await supabase
    .from("User")
    .select("id, email, passwordHash, name, role")
    .eq("email", email)
    .single();

  if (error || !user || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  const token = createToken({ id: user.id, email: user.email, role: user.role, name: user.name });
  const res = NextResponse.json({ ok: true, role: user.role });
  res.cookies.set("token", token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
