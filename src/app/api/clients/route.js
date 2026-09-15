import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTokenFromRequest, hashPassword } from "@/lib/auth";

function genPassword(len = 8) {
  const chars = "abcdefghijkmnpqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export async function GET(request) {
  const user = getTokenFromRequest(request);
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clients = await prisma.user.findMany({
    where: { role: "CLIENT" },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, email: true, company: true, phone: true, createdAt: true,
      _count: { select: { shipments: true } } },
  });
  return NextResponse.json({ clients });
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

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ error: "A client with this email already exists." }, { status: 409 });

  const client = await prisma.user.create({
    data: { name, email, company, phone, role: "CLIENT", passwordHash: hashPassword(password) },
    select: { id: true, name: true, email: true, company: true, phone: true },
  });

  return NextResponse.json({ client, password });
}
