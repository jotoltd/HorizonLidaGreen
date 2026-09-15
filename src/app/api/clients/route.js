import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getTokenFromRequest, hashPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

function genPassword(len = 8) {
  const chars = "abcdefghijkmnpqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export async function GET(request) {
  const user = getTokenFromRequest(request);
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: clients } = await supabase
    .from("User")
    .select("id, name, email, company, phone, createdAt")
    .eq("role", "CLIENT")
    .order("createdAt", { ascending: false });

  // Count shipments per client
  const { data: counts } = await supabase
    .from("Shipment")
    .select("clientId");

  const countMap = {};
  (counts || []).forEach((s) => { countMap[s.clientId] = (countMap[s.clientId] || 0) + 1; });

  const clientsWithCounts = (clients || []).map((c) => ({ ...c, _count: { shipments: countMap[c.id] || 0 } }));

  return NextResponse.json({ clients: clientsWithCounts });
}

export async function POST(request) {
  const user = getTokenFromRequest(request);
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const name = (body.name || "").toString().trim();
  const email = (body.email || "").toString().trim().toLowerCase();
  const company = (body.company || "").toString().trim() || null;
  const phone = (body.phone || "").toString().trim() || null;
  const password = (body.password || "").toString().trim() || genPassword();

  if (!name || !email) {
    return NextResponse.json({ error: "Name and email are required." }, { status: 400 });
  }

  const { data: existing } = await supabase.from("User").select("id").eq("email", email).single();
  if (existing) return NextResponse.json({ error: "A client with this email already exists." }, { status: 409 });

  const { data: client, error } = await supabase
    .from("User")
    .insert({ name, email, company, phone, role: "CLIENT", passwordHash: hashPassword(password) })
    .select("id, name, email, company, phone")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ client, password });
}
